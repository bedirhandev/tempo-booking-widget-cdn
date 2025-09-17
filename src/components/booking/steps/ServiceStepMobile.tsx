import React, { useMemo, useCallback } from 'react'
import { Form, Row, Col } from 'antd'
import type { Booking, TeamMember, FormValues, Service, AvailableEmployee, AvailableTime } from '@/components/booking/types/index'
import dayjs, { Dayjs } from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import ServiceSelectorMobile from '@/components/booking/components/ServiceSelectorMobile'
import DateSelectorMobile from '@/components/booking/components/DateSelectorMobile'
import TimeSelectorMobile from '@/components/booking/components/TimeSelectorMobile'
import EmployeeSelectorMobile from '@/components/booking/components/EmployeeSelectorMobile'
import { useAvailableTimes } from '@/components/booking/hooks/useAvailableTimes'

dayjs.extend(isoWeek)

// Extended type for local time slots
interface LocalAvailableTime extends AvailableTime {
    utcTime?: string
}

interface ServiceStepProps {
    formRef: React.RefObject<any>
    setFormValues: React.Dispatch<React.SetStateAction<FormValues>>
    bookingValues: Booking
    setBookingValues: React.Dispatch<React.SetStateAction<Booking>>
    employeesData: TeamMember[]
    servicesData: Service[]
    tenantId: string
}

const ServiceStepMobile: React.FC<ServiceStepProps> = ({
    formRef,
    setFormValues,
    bookingValues,
    setBookingValues,
    employeesData,
    servicesData,
    tenantId
}) => {
    const [form] = Form.useForm()

    // Form watchers (moved up to fix scoping issues)
    const selectedServiceId = Form.useWatch('service', form)
    const selectedDate: Dayjs | undefined = Form.useWatch('date', form)
    const selectedTime = Form.useWatch('time', form)

    // Custom hook for available times (moved up after form watchers)
    const { availableTimes, isLoadingTimes } = useAvailableTimes({
        tenantId,
        serviceId: selectedServiceId,
        date: selectedDate?.format('YYYY-MM-DD')
    })

    // Helper function to convert UTC time slots to local timezone
    const convertTimeSlotToLocal = useCallback((timeSlot: AvailableTime, selectedDate: Dayjs): LocalAvailableTime => {
        // Parse the UTC time and combine with selected date
        const [startTime, endTime] = timeSlot.time.split(' - ')

        // Create full UTC datetime
        const startDateTime = dayjs.utc(`${selectedDate.format('YYYY-MM-DD')} ${startTime}`)
        const endDateTime = dayjs.utc(`${selectedDate.format('YYYY-MM-DD')} ${endTime}`)

        // Convert to local timezone
        const localStart = startDateTime.local()
        const localEnd = endDateTime.local()

        // Format back to time string
        const localTimeSlot = `${localStart.format('HH:mm')} - ${localEnd.format('HH:mm')}`

        return {
            ...timeSlot,
            time: localTimeSlot,
            // Store original UTC time for API submission
            utcTime: timeSlot.time
        }
    }, [])

    // Convert all available times to local timezone
    const localAvailableTimes = useMemo(() => {
        if (!selectedDate || !availableTimes.length) {
            return availableTimes
        }

        return availableTimes.map(timeSlot => convertTimeSlotToLocal(timeSlot, selectedDate))
    }, [availableTimes, selectedDate, convertTimeSlotToLocal])

    // Memoized data transformations
    const { services, employees } = useMemo(() => ({
        services: servicesData.map(service => ({
            ...service,
            price: Number(service.price)
        })),
        employees: employeesData?.map(employee => ({
            ...employee,
            schedule: Object.fromEntries(
                Object.entries(employee.schedule).map(([serviceId, daySchedules]) => [
                    serviceId,
                    daySchedules.map(daySchedule => ({
                        ...daySchedule,
                        dayOfWeek: Number(daySchedule.dayOfWeek)
                    }))
                ])
            )
        })) || []
    }), [servicesData, employeesData])

    // Assign form ref
    formRef.current = form

    // Helper function to convert local time back to UTC for API
    const convertLocalTimeToUtc = useCallback((localTime: string, selectedDate: Dayjs): string => {
        const [startTime] = localTime.split(' - ')
        const localDateTime = dayjs(`${selectedDate.format('YYYY-MM-DD')} ${startTime}`)
        const utcDateTime = localDateTime.utc()
        return utcDateTime.format('HH:mm')
    }, [])

    // Helper function to get UTC time from selected local time
    const getUtcTimeFromLocal = useCallback((localTime: string): string => {
        if (!selectedDate) return localTime

        // Find the original UTC time from the local available times
        const localTimeSlot = localAvailableTimes.find(slot => slot.time === localTime) as LocalAvailableTime
        return localTimeSlot?.utcTime || localTime
    }, [localAvailableTimes, selectedDate])

    // Helper functions
    const convertTimeToMinutes = useCallback((timeString: string): number => {
        const time = timeString.includes(' - ') ? timeString.split(' - ')[0] : timeString
        const [hours, minutes] = time.split(':').map(Number)
        return hours * 60 + minutes
    }, [])

    const isEmployeeAbsent = useCallback((employee: TeamMember, date: Dayjs): boolean => {
        const dateString = date.format('YYYY-MM-DD')
        return employee.absences.some(absence =>
            dateString >= absence.start_date && dateString <= absence.end_date
        )
    }, [])

    // Memoized calculations
    const disabledDate = useCallback((currentDate: Dayjs): boolean => {
        const today = dayjs().startOf('day')

        if (!selectedServiceId || !currentDate || currentDate.isBefore(today)) {
            return true
        }

        const dayOfWeek = currentDate.isoWeekday()

        return !employees.some(employee => {
            if (isEmployeeAbsent(employee, currentDate)) return false

            const serviceSchedule = employee.schedule[selectedServiceId.toString()]
            if (!serviceSchedule) return false

            return serviceSchedule.some(schedule => schedule.dayOfWeek === dayOfWeek)
        })
    }, [selectedServiceId, employees, isEmployeeAbsent])

    const availableEmployees = useMemo((): AvailableEmployee[] => {
        if (!selectedServiceId) {
            return employees.map(employee => ({ employee, disabled: true }))
        }

        return employees.map(employee => {
            if (!selectedDate || !selectedTime) {
                const hasServiceSchedule = employee.schedule[selectedServiceId.toString()]
                return { employee, disabled: !hasServiceSchedule }
            }

            const dayOfWeek = selectedDate.isoWeekday()

            if (isEmployeeAbsent(employee, selectedDate)) {
                return { employee, disabled: true }
            }

            const serviceSchedule = employee.schedule[selectedServiceId.toString()]
            if (!serviceSchedule) {
                return { employee, disabled: true }
            }

            const daySchedule = serviceSchedule.find(schedule => schedule.dayOfWeek === dayOfWeek)
            if (!daySchedule) {
                return { employee, disabled: true }
            }

            // Get the UTC time for comparison with employee schedules
            const utcTime = getUtcTimeFromLocal(selectedTime)
            const selectedTimeMinutes = convertTimeToMinutes(utcTime)

            const isAvailable = daySchedule.timeSlots.some(slot => {
                const startMinutes = convertTimeToMinutes(slot.start)
                const endMinutes = convertTimeToMinutes(slot.end)
                return selectedTimeMinutes >= startMinutes && selectedTimeMinutes < endMinutes
            })

            return { employee, disabled: !isAvailable }
        })
    }, [selectedServiceId, selectedDate, selectedTime, employees, isEmployeeAbsent, convertTimeToMinutes, getUtcTimeFromLocal])

    // Event handlers
    const handleValuesChange = useCallback((changedValues: any) => {
        // Reset dependent fields
        if ('service' in changedValues) {
            form.setFieldsValue({ date: undefined, time: undefined, employee: undefined })
        } else if ('date' in changedValues) {
            form.setFieldsValue({ time: undefined, employee: undefined })
        } else if ('time' in changedValues) {
            form.setFieldsValue({ employee: undefined })
        }

        const allValues = form.getFieldsValue()

        // Update states
        const selectedService = services.find(service => service.id == allValues.service)

        // Get UTC time for storage
        let utcTime = allValues.time
        if (allValues.time && selectedDate) {
            utcTime = getUtcTimeFromLocal(allValues.time)
        }

        setFormValues(prev => ({
            ...prev,
            service: selectedService?.name,
            employee: employees.find(employee => employee.id == allValues.employee)?.name,
            date: allValues.date ? allValues.date.format('MMMM DD, YYYY') : undefined,
            time: allValues.time, // Display local time
            price: selectedService ? String(selectedService.price) : undefined
        }))

        setBookingValues(prev => ({
            ...prev,
            serviceId: allValues.service ? String(allValues.service) : undefined,
            employeeId: allValues.employee ? String(allValues.employee) : undefined,
            date: allValues.date,
            time: utcTime, // Store UTC time for API
            note: allValues.notes,
            notificationEnabled: allValues.notifications
        }))
    }, [form, services, employees, setFormValues, setBookingValues, selectedDate, getUtcTimeFromLocal])

    const formatPrice = useCallback((price: number, currency: string = '$'): string => {
        return `${currency}${price.toFixed(2)}`
    }, [])

    const initialValues = useMemo(() => ({
        service: bookingValues.serviceId ? Number(bookingValues.serviceId) : undefined,
        employee: bookingValues.employeeId ? Number(bookingValues.employeeId) : undefined,
        date: bookingValues.date,
        time: bookingValues.time,
        notes: bookingValues.note,
        notifications: bookingValues.notificationEnabled
    }), [bookingValues])

    return (
        <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            onValuesChange={handleValuesChange}
            preserve={false}
        >
            <ServiceSelectorMobile services={services} formatPrice={formatPrice} />

            <Row gutter={16}>
                <Col xs={24} sm={12}>
                    <DateSelectorMobile
                        name="date"
                        label="Date"
                        placeholder="Select a date"
                        disabledDate={disabledDate}
                        allowClear
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <TimeSelectorMobile
                        name="time"
                        label="Time"
                        placeholder={
                            isLoadingTimes
                                ? "Loading available times..."
                                : !selectedServiceId || !selectedDate
                                    ? "Select service and date first"
                                    : "Select a time"
                        }
                        availableTimes={localAvailableTimes}
                        allowClear
                    />
                </Col>
            </Row>

            <EmployeeSelectorMobile
                availableEmployees={availableEmployees}
                placeholder="Select an employee"
                allowClear
            />
        </Form>
    )
}

export default ServiceStepMobile