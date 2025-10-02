import React, { useMemo, useCallback, useEffect, useState } from 'react'
import { Form, Row, Col, Radio, Select, Typography } from 'antd'
import type {
  Booking,
  TeamMember,
  FormValues,
  Service,
  AvailableEmployee
} from '@/components/booking/types/index'
import dayjs, { Dayjs } from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import ServiceSelector from '@/components/booking/components/ServiceSelector'
import DateSelector from '@/components/booking/components/DateSelector'
import TimeSelector from '@/components/booking/components/TimeSelector'
import EmployeeSelector from '@/components/booking/components/EmployeeSelector'
import { useAvailableTimes } from '@/components/booking/hooks/useAvailableTimes'
import { useFinancialSettings } from '@/components/booking/financial/FinancialSettingsProvider'
import { getUserTimeFormatMode } from '@/components/booking/utils/timeFormat'
import { getProviderPlatforms } from '@/components/booking/api'

dayjs.extend(isoWeek)

interface ServiceStepProps {
  formRef: React.RefObject<any>
  setFormValues: React.Dispatch<React.SetStateAction<FormValues>>
  bookingValues: Booking
  setBookingValues: React.Dispatch<React.SetStateAction<Booking>>
  employeesData: TeamMember[]
  servicesData: Service[]
  tenantId: string
  apiUrl?: string
}

const ServiceStep: React.FC<ServiceStepProps> = ({
  formRef,
  setFormValues,
  bookingValues,
  setBookingValues,
  employeesData,
  servicesData,
  tenantId,
  apiUrl
}) => {
  const [form] = Form.useForm()

  // Form watchers
  const selectedServiceId = Form.useWatch('service', form)
  const selectedDate: Dayjs | undefined = Form.useWatch('date', form)
  const selectedTime = Form.useWatch('time', form)
  const selectedEmployeeId = Form.useWatch('employee', form)
  const selectedChannel = Form.useWatch('deliveryChannel', form)

  // Provider platforms state (for virtual meetings)
  const [platforms, setPlatforms] = useState<{ value: string; label: string; connected?: boolean }[] | null>(null)
  const [loadingPlatforms, setLoadingPlatforms] = useState(false)

  // Gate: only when service + date + time are selected we compute employees
  const canPickEmployee = !!(selectedServiceId && selectedDate && selectedTime)

  const timeFormatMode = useMemo(() => getUserTimeFormatMode(), [])

  // Custom hook for available times (backend already returns converted slots)
  const { availableTimes, isLoadingTimes } = useAvailableTimes({
    tenantId,
    serviceId: selectedServiceId,
    date: selectedDate?.format('YYYY-MM-DD'),
    timeFormat: timeFormatMode,
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

  const selectedServiceObj = useMemo(() => {
    if (!selectedServiceId) return undefined
    return services.find(service => service.id == selectedServiceId)
  }, [services, selectedServiceId])

  // Channel options derived from backend response (support camelCase and snake_case), with legacy fallback
  const channelOptions = useMemo(() => {
    if (!selectedServiceObj) return [] as string[]

    // 1) Prefer camelCase deliveryChannels (DTO style)
    const camel = (selectedServiceObj as any).deliveryChannels
    if (Array.isArray(camel) && camel.length) {
      return camel as string[]
    }

    // 2) Prefer available_channels (array of { value, label }) from model accessor in public API
    const availableSnake = (selectedServiceObj as any).available_channels
    if (Array.isArray(availableSnake) && availableSnake.length) {
      const values = availableSnake
        .map((c: any) => c?.value)
        .filter((v: any) => typeof v === 'string' && v.length > 0)
      if (values.length) return values
    }

    // 3) Fallback to raw delivery_channels snake_case (JSON array)
    const rawSnake = (selectedServiceObj as any).delivery_channels
    if (Array.isArray(rawSnake) && rawSnake.length) {
      return rawSnake
    }

    // 4) Legacy flags as last resort
    const derived: string[] = []
    if ((selectedServiceObj as any).is_in_person_enabled) derived.push('in_person')
    if ((selectedServiceObj as any).is_virtual_enabled) derived.push('virtual_meeting')
    return derived
  }, [selectedServiceObj])

  const channelLabel = useCallback((channel: string) => {
    switch (channel) {
      case 'virtual_meeting': return 'Virtual Meeting'
      case 'phone_call': return 'Phone Call'
      case 'in_person': return 'In-Person'
      default: return channel
    }
  }, [])

  // Fetch provider-enabled platforms when channel is virtual and employee chosen
  useEffect(() => {
    if (selectedChannel !== 'virtual_meeting') { setPlatforms(null); return }
    const empId = selectedEmployeeId ? String(selectedEmployeeId) : undefined
    if (!empId) { setPlatforms(null); return }
    let cancelled = false
    ;(async () => {
      try {
        setLoadingPlatforms(true)
        const resp = await getProviderPlatforms(tenantId, empId, apiUrl)
        if (cancelled) return
        const items = resp.data?.platforms ?? []
        setPlatforms(items)
      } catch {
        if (!cancelled) setPlatforms(null)
      } finally {
        if (!cancelled) setLoadingPlatforms(false)
      }
    })()
    return () => { cancelled = true }
  }, [selectedChannel, selectedEmployeeId, tenantId, apiUrl])

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
      form.setFieldsValue({ date: undefined, time: undefined, employee: undefined, deliveryChannel: undefined, meetingPlatform: undefined })
    } else if ('date' in changedValues) {
      form.setFieldsValue({ time: undefined, employee: undefined, meetingPlatform: undefined })
    } else if ('time' in changedValues) {
      form.setFieldsValue({ employee: undefined, meetingPlatform: undefined })
    } else if ('deliveryChannel' in changedValues) {
      // Reset platform when channel changes
      form.setFieldsValue({ meetingPlatform: undefined })
    } else if ('employee' in changedValues) {
      // Reset platform when employee changes
      form.setFieldsValue({ meetingPlatform: undefined })
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
      time: allValues.time, // already the ISO string from TimeSelector selection
      note: allValues.notes,
      notificationEnabled: allValues.notifications,
      deliveryChannel: allValues.deliveryChannel,
      meetingPlatform: allValues.meetingPlatform,
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
    notifications: bookingValues.notificationEnabled,
    deliveryChannel: bookingValues.deliveryChannel,
    meetingPlatform: bookingValues.meetingPlatform
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
                  ? "Select service and date first"
                  : "Select a time"
            }
            availableTimes={availableTimes} // already localized from API
            allowClear
          />
        </Col>
      </Row>

      <EmployeeSelector
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

      {/* Ask channel only AFTER an employee is selected (positioned after Employee) */}
      {selectedServiceObj && !!selectedEmployeeId && channelOptions.length > 0 && (
        <>
          <Form.Item
            name="deliveryChannel"
            label="How would you like to meet?"
            rules={[{ required: true, message: 'Please select a meeting channel' }]}
          >
            <Radio.Group optionType="button" buttonStyle="solid">
              {channelOptions.includes('in_person') && (
                <Radio.Button value="in_person">In-Person</Radio.Button>
              )}
              {channelOptions.includes('phone_call') && (
                <Radio.Button value="phone_call">Phone Call</Radio.Button>
              )}
              {channelOptions.includes('virtual_meeting') && (
                <Radio.Button value="virtual_meeting">Virtual Meeting</Radio.Button>
              )}
            </Radio.Group>
          </Form.Item>

          {selectedChannel === 'virtual_meeting' && (
            <Form.Item
              name="meetingPlatform"
              label="Choose Platform"
              rules={[{ required: true, message: 'Please select a platform' }]}
              extra={
                !selectedEmployeeId
                  ? 'Pick an employee to see available platforms'
                  : (!loadingPlatforms && (!platforms || platforms.length === 0)
                      ? 'No connected platforms for the selected provider. Connect Zoom/Google/Teams in Meeting Integrations.'
                      : undefined)
              }
            >
              <Select
                placeholder={
                  !selectedEmployeeId
                    ? 'Select employee first'
                    : loadingPlatforms
                      ? 'Loading...'
                      : (platforms && platforms.length) ? 'Select a platform' : 'No platforms available'
                }
                disabled={!selectedEmployeeId || loadingPlatforms || !(platforms && platforms.length)}
                options={(platforms || []).map(p => ({
                  value: p.value,
                  label: p.label || p.value
                }))}
                allowClear
              />
            </Form.Item>
          )}
        </>
      )}
    </Form>
  )
}

export default ServiceStep