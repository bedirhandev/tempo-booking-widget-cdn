import React, { useMemo, useCallback } from 'react'
import { Form, Row, Col } from 'antd'
import type { Booking, TeamMember, FormValues, Service, AvailableEmployee } from '@/components/booking/types/index'
import dayjs, { Dayjs } from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import ServiceSelector from '@/components/booking/components/ServiceSelector'
import DateSelector from '@/components/booking/components/DateSelector'
import TimeSelector from '@/components/booking/components/TimeSelector'
import EmployeeSelector from '@/components/booking/components/EmployeeSelector'
import { useAvailableTimes } from '@/components/booking/hooks/useAvailableTimes' // Custom hook

dayjs.extend(isoWeek)

interface ServiceStepProps {
  formRef: React.RefObject<any>
  setFormValues: React.Dispatch<React.SetStateAction<FormValues>>
  bookingValues: Booking
  setBookingValues: React.Dispatch<React.SetStateAction<Booking>>
  employeesData: TeamMember[]
  servicesData: Service[]
  tenantId: string
}

const ServiceStep: React.FC<ServiceStepProps> = ({
  formRef,
  setFormValues,
  bookingValues,
  setBookingValues,
  employeesData,
  servicesData,
  tenantId
}) => {
  const [form] = Form.useForm()

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

  // Form watchers
  const selectedServiceId = Form.useWatch('service', form)
  const selectedDate: Dayjs | undefined = Form.useWatch('date', form)
  const selectedTime = Form.useWatch('time', form)

  // Custom hook for available times
  const { availableTimes, isLoadingTimes } = useAvailableTimes({
    tenantId,
    serviceId: selectedServiceId,
    date: selectedDate?.format('YYYY-MM-DD')
  })

  // Assign form ref
  formRef.current = form

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

      const selectedTimeMinutes = convertTimeToMinutes(selectedTime)
      const isAvailable = daySchedule.timeSlots.some(slot => {
        const startMinutes = convertTimeToMinutes(slot.start)
        const endMinutes = convertTimeToMinutes(slot.end)
        return selectedTimeMinutes >= startMinutes && selectedTimeMinutes < endMinutes
      })

      return { employee, disabled: !isAvailable }
    })
  }, [selectedServiceId, selectedDate, selectedTime, employees, isEmployeeAbsent, convertTimeToMinutes])

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

    setFormValues(prev => ({
      ...prev,
      service: selectedService?.name,
      employee: employees.find(employee => employee.id == allValues.employee)?.name,
      date: allValues.date,
      time: allValues.time,
      price: selectedService ? String(selectedService.price) : undefined
    }))

    setBookingValues(prev => ({
      ...prev,
      serviceId: allValues.service ? String(allValues.service) : undefined,
      employeeId: allValues.employee ? String(allValues.employee) : undefined,
      date: allValues.date,
      time: allValues.time,
      note: allValues.notes,
      notificationEnabled: allValues.notifications
    }))
  }, [form, services, employees, setFormValues, setBookingValues])

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
      <ServiceSelector services={services} formatPrice={formatPrice} />

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <DateSelector
            name="date"
            label="Date"
            placeholder="Select a date"
            disabledDate={disabledDate}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12}>
          <TimeSelector
            name="time"
            label="Time"
            placeholder={
              isLoadingTimes
                ? "Loading available times..."
                : !selectedServiceId || !selectedDate
                  ? "Select a time"
                  : "Select a time"
            }
            availableTimes={availableTimes}
            allowClear
          />
        </Col>
      </Row>

      <EmployeeSelector
        availableEmployees={availableEmployees}
        placeholder="Select an employee"
        allowClear
      />
    </Form>
  )
}

export default ServiceStep