import React, { useMemo, useCallback } from 'react'
import { Form, Row, Col } from 'antd'
import type {
  Booking,
  TeamMember,
  FormValues,
  Service,
  AvailableEmployee
} from '@/components/booking/types/index'
import dayjs, { Dayjs } from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import ServiceSelectorMobile from '@/components/booking/components/ServiceSelectorMobile'
import DateSelectorMobile from '@/components/booking/components/DateSelectorMobile'
import TimeSelectorMobile from '@/components/booking/components/TimeSelectorMobile'
import EmployeeSelectorMobile from '@/components/booking/components/EmployeeSelectorMobile'
import { useAvailableTimes } from '@/components/booking/hooks/useAvailableTimes'
import { useFinancialSettings } from '@/components/booking/financial/FinancialSettingsProvider'

dayjs.extend(isoWeek)

interface ServiceStepMobileProps {
  formRef: React.RefObject<any>
  setFormValues: React.Dispatch<React.SetStateAction<FormValues>>
  bookingValues: Booking
  setBookingValues: React.Dispatch<React.SetStateAction<Booking>>
  employeesData: TeamMember[]
  servicesData: Service[]
  tenantId: string
}

const ServiceStepMobile: React.FC<ServiceStepMobileProps> = ({
  formRef,
  setFormValues,
  bookingValues,
  setBookingValues,
  employeesData,
  servicesData,
  tenantId
}) => {
  const [form] = Form.useForm()

  // Form watchers
  const selectedServiceId = Form.useWatch('service', form)
  const selectedDate: Dayjs | undefined = Form.useWatch('date', form)
  const selectedTime = Form.useWatch('time', form)

  // Gate: only when service + date + time are selected we compute employees
  const canPickEmployee = !!(selectedServiceId && selectedDate && selectedTime)

  // Custom hook for available times (backend already returns converted slots)
  const { availableTimes, isLoadingTimes } = useAvailableTimes({
    tenantId,
    serviceId: selectedServiceId,
    date: selectedDate?.format('YYYY-MM-DD'),
    timeFormat: '12hr',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  })

  // Format services and employees data
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

  formRef.current = form

  // Utility to convert time string (12hr or 24hr) → minutes since midnight
  const convertTimeToMinutes = useCallback((timeString: string): number => {
    if (!timeString) return NaN
    const s = timeString.trim().toUpperCase()
    // Match h:mm, hh:mm, optional seconds, optional AM/PM (with or without space)
    const m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/)
    if (m) {
      let hours = parseInt(m[1], 10)
      const minutes = parseInt(m[2], 10)
      const meridiem = m[3]
      if (meridiem) {
        if (meridiem === 'AM') {
          if (hours === 12) hours = 0
        } else if (meridiem === 'PM') {
          if (hours !== 12) hours += 12
        }
      }
      return hours * 60 + minutes
    }
    // Fallback: plain "HH:mm" without AM/PM or minor variations
    const [h, min] = timeString.split(':').map(Number)
    if (!Number.isNaN(h) && !Number.isNaN(min)) {
      return h * 60 + min
    }
    return NaN
  }, [])

  const isEmployeeAbsent = useCallback((employee: TeamMember, date: Dayjs): boolean => {
    const dateString = date.format('YYYY-MM-DD')
    return employee.absences.some(absence =>
      dateString >= absence.start_date && dateString <= absence.end_date
    )
  }, [])

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

  // Find the selected slot once (by its business_datetime_start value stored in the form)
  const selectedSlot = useMemo(() => {
    if (!selectedTime) return undefined
    return availableTimes.find(s => s.business_datetime_start === selectedTime)
  }, [selectedTime, availableTimes])

  const availableEmployees = useMemo((): AvailableEmployee[] => {
    // Show no employees until prerequisites are met
    if (!canPickEmployee || !selectedSlot) return []

    // Use the slot's BUSINESS date for weekday and absence checks
    const businessDateStr = selectedSlot.business_date // 'YYYY-MM-DD'
    const businessIsoDow = dayjs(businessDateStr).isoWeekday() // 1=Mon..7=Sun

    return employees.map(employee => {
      // Absence on BUSINESS date
      const isAbsent = employee.absences.some(a =>
        businessDateStr >= a.start_date && businessDateStr <= a.end_date
      )
      if (isAbsent) return { employee, disabled: true }

      // Service schedule for this employee
      const serviceSchedule = employee.schedule[String(selectedServiceId)]
      if (!serviceSchedule) return { employee, disabled: true }

      // Day schedule must match BUSINESS weekday
      const daySchedule = serviceSchedule.find(s => s.dayOfWeek === businessIsoDow)
      if (!daySchedule) return { employee, disabled: true }

      // Check if slot start (BUSINESS local time) falls within any of the employee's ranges
      const slotMinutes = convertTimeToMinutes(selectedSlot.business_start_time)

      const isAvailable = daySchedule.timeSlots.some(ts => {
        const startMinutes = convertTimeToMinutes(ts.start)
        const endMinutes = convertTimeToMinutes(ts.end)
        return slotMinutes >= startMinutes && slotMinutes < endMinutes
      })

      return { employee, disabled: !isAvailable }
    })
  }, [
    canPickEmployee,
    selectedSlot,
    employees,
    selectedServiceId,
    convertTimeToMinutes
  ])

  const handleValuesChange = useCallback((changedValues: any) => {
    if ('service' in changedValues) {
      form.setFieldsValue({ date: undefined, time: undefined, employee: undefined })
    } else if ('date' in changedValues) {
      form.setFieldsValue({ time: undefined, employee: undefined })
    } else if ('time' in changedValues) {
      form.setFieldsValue({ employee: undefined })
    }

    const allValues = form.getFieldsValue()
    const selectedService = services.find(service => service.id == allValues.service)

    setFormValues(prev => ({
      ...prev,
      service: selectedService?.name,
      employee: employees.find(e => e.id == allValues.employee)?.name,
      date: allValues.date ? allValues.date.format('MMMM DD, YYYY') : undefined,
      time: availableTimes.find(s => s.business_datetime_start === allValues.time)?.time,
      price: selectedService ? String(selectedService.price) : undefined
    }))

    setBookingValues(prev => ({
      ...prev,
      serviceId: allValues.service ? String(allValues.service) : undefined,
      employeeId: allValues.employee ? String(allValues.employee) : undefined,
      date: allValues.date,
      time: allValues.time, // already the ISO string from TimeSelectorMobile selection
      note: allValues.notes,
      notificationEnabled: allValues.notifications
    }))
  }, [form, services, employees, availableTimes, setFormValues, setBookingValues])

  const { currencySymbol } = useFinancialSettings()
  const formatPrice = useCallback((price: number): string => {
    return `${currencySymbol}${price.toFixed(2)}`
  }, [currencySymbol])

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
            availableTimes={availableTimes} // already localized from API
            allowClear
          />
        </Col>
      </Row>

      <EmployeeSelectorMobile
        availableEmployees={availableEmployees} // [] until service, date and time are set
        placeholder={
          !selectedServiceId
            ? 'Select a service first'
            : !selectedDate
              ? 'Select a date first'
              : !selectedTime
                ? 'Select a time first'
                : 'Select an employee'
        }
        allowClear
      />
    </Form>
  )
}

export default ServiceStepMobile