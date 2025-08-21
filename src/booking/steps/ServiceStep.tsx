import React, { useEffect, useMemo } from 'react'
import { DatePicker, Form, Select, Row, Col } from 'antd'
import { FormValues } from '@/components/booking/types'
import dayjs, { Dayjs } from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import minMax from 'dayjs/plugin/minMax'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { transformMemberToEmployee } from '@/teamMembers/functions'

dayjs.extend(isoWeek)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(minMax)
dayjs.extend(localizedFormat)

// Configuration constants
const TIME_INCREMENT = 30 // Time increment in minutes
const USE_SERVICE_DURATION_STEPS = false // Set to false to use time increments instead of service duration steps

// Interfaces
interface Service {
  id: string
  name: string
  duration: number
  price: number
}

interface TimeRange {
  start: string
  end: string
}

interface EmployeeSchedule {
  serviceId: string
  dayTimeRanges: { [dayOfWeek: number]: TimeRange[] }
}

export interface DayOff {
  key: string
  name: string
  date: string // Format: e.g., 'February 03, 2025' or 'February 03, 2025 - February 17, 2025'
  repeat: boolean
}

interface Employee {
  id: string
  name: string
  services: string[]
  schedule: EmployeeSchedule[]
  daysOff: DayOff[]
}

interface Company {
  id: number | undefined
  image: string
  name: string
  address: string
  website: string
  phone: string
  email: string
  time_entries: any[]
  days_off: DayOff[]
}

interface ServiceStepProps {
  formRef: React.RefObject<any>
  setFormValues: React.Dispatch<React.SetStateAction<FormValues>>
  bookingValues: Booking
  setBookingValues: React.Dispatch<React.SetStateAction<Booking>>
  rawEmployeeData: any[]
  rawServiceData: any[]
  rawBookingData: any[]
  company: Company
}

interface Booking {
  id: string
  serviceId: string | undefined
  employeeId: string | undefined
  customerId: string | undefined
  note: string | undefined
  notificationEnabled: boolean
  date: Dayjs | null
  time: string | undefined
}

// Data transformation functions
const transformAppointmentsData = (data: any[]): Booking[] => {
  return data.map((appointmentData: any) => {
    return {
      id: appointmentData.id,
      service: appointmentData.service,
      serviceId: String(appointmentData.serviceId),
      employee: appointmentData.user, //appointmentData.employee,
      employeeId: String(appointmentData.userId), //.employee_id),
      customer: appointmentData.customer,
      customerId: String(appointmentData.customerId),
      note: appointmentData.note,
      notificationEnabled: appointmentData.notificationEnabled,
      date: appointmentData.date ? dayjs(appointmentData.date) : null,
      time: appointmentData.time
    } as Booking
  })
}

const transformServicesData = (data: any[]): Service[] => {
  return data.map((serviceData) => {
    const id = String(serviceData.id)
    const name = serviceData.name
    const duration = serviceData.duration
    const price = serviceData.price
    return { id, name, duration, price }
  })
}

const transformEmployeeData = (data: any[]): Employee[] => {
  const dayOfWeekMap: { [key: string]: number } = {
    Sunday: 7,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6
  }

  data = data.map(transformMemberToEmployee);

  return data
    .filter((empData) => empData.Visibility !== 0 && empData.Visibility !== false)
    .map((empData) => {
      const id = String(empData.id)
      const name = empData.FullName

      // Extract daysOff from empData
      const daysOff: DayOff[] = empData.DaysOff
        ? empData.DaysOff.map((dayOffData: any) => ({
            key: dayOffData.key,
            name: dayOffData.name,
            date: dayOffData.date,
            repeat: dayOffData.repeat
          }))
        : []

      const servicesOfferedSet = new Set<string>()
      const serviceSchedules: {
        [serviceId: string]: {
          dayTimeRanges: { [dayOfWeek: number]: TimeRange[] }
        }
      } = {}

      if (empData.Schedule && Object.keys(empData.Schedule).length > 0) {
        for (const dayName of empData.Schedule) {
          const dayOfWeek = dayOfWeekMap[dayName?.day]
          const daySchedule = dayName;//empData.Schedule[dayOfWeek]
          if (daySchedule.entries) {
            daySchedule.entries.forEach((entry: any) => {
              if (entry.type === 'work' && entry.services && entry.services.length > 0) {
                const [start, end] = entry.timePeriod.split(' - ')
                const timeRange = { start, end }
                entry.services.forEach((service: any) => {
                  const serviceId = String(service.id)
                  servicesOfferedSet.add(serviceId)
                  if (!serviceSchedules[serviceId]) {
                    serviceSchedules[serviceId] = { dayTimeRanges: {} }
                  }
                  if (!serviceSchedules[serviceId].dayTimeRanges[dayOfWeek]) {
                    serviceSchedules[serviceId].dayTimeRanges[dayOfWeek] = []
                  }
                  serviceSchedules[serviceId].dayTimeRanges[dayOfWeek].push(timeRange)
                })
              }
            })
          }
        }
      }

      const servicesOffered = Array.from(servicesOfferedSet)
      const schedule: EmployeeSchedule[] = Object.keys(serviceSchedules).map((serviceId) => {
        return {
          serviceId,
          dayTimeRanges: serviceSchedules[serviceId].dayTimeRanges
        }
      })

      return { id, name, services: servicesOffered, schedule, daysOff }
    })
}

// Merge overlapping and adjacent time ranges
const mergeTimeRanges = (ranges: TimeRange[]): TimeRange[] => {
  if (!ranges.length) return []

  const sortedRanges = ranges
    .map((range) => ({
      start: dayjs(range.start, 'HH:mm'),
      end: dayjs(range.end, 'HH:mm')
    }))
    .sort((a, b) => (a.start.isBefore(b.start) ? -1 : 1))

  const mergedRanges = [sortedRanges[0]]
  for (let i = 1; i < sortedRanges.length; i++) {
    const lastRange = mergedRanges[mergedRanges.length - 1]
    const currentRange = sortedRanges[i]
    if (currentRange.start.isSameOrBefore(lastRange.end)) {
      lastRange.end = dayjs.max(dayjs(), lastRange.end, currentRange.end)
    } else {
      mergedRanges.push(currentRange)
    }
  }

  return mergedRanges.map((range) => ({
    start: range.start.format('HH:mm'),
    end: range.end.format('HH:mm')
  }))
}

// Utility functions to check days off
function isDateInDayOff(date: Dayjs, dayOff: DayOff): boolean {
  const DAY_OFF_DATE_FORMAT = 'MMMM DD, YYYY'

  if (dayOff.date.includes(' - ')) {
    // Date range
    const [startDateStr, endDateStr] = dayOff.date.split(' - ')
    const startDate = dayjs(startDateStr.trim(), DAY_OFF_DATE_FORMAT)
    const endDate = dayjs(endDateStr.trim(), DAY_OFF_DATE_FORMAT)

    if (dayOff.repeat) {
      // Repeat every year, ignore year
      const dateMonthDay = date.format('MM-DD')
      const startMonthDay = startDate.format('MM-DD')
      const endMonthDay = endDate.format('MM-DD')

      if (startMonthDay <= endMonthDay) {
        return dateMonthDay >= startMonthDay && dateMonthDay <= endMonthDay
      } else {
        // Range crosses year boundary
        return dateMonthDay >= startMonthDay || dateMonthDay <= endMonthDay
      }
    } else {
      // Not repeating, compare full dates
      return date.isSameOrAfter(startDate, 'day') && date.isSameOrBefore(endDate, 'day')
    }
  } else {
    // Single date
    const singleDate = dayjs(dayOff.date.trim(), DAY_OFF_DATE_FORMAT)
    if (dayOff.repeat) {
      // Repeat every year, ignore year
      return date.month() === singleDate.month() && date.date() === singleDate.date()
    } else {
      // Not repeating
      return date.isSame(singleDate, 'day')
    }
  }
}

function isEmployeeDayOff(employee: Employee, date: Dayjs): boolean {
  return employee?.daysOff?.some((dayOff) => isDateInDayOff(date, dayOff)) ?? false
}

function isCompanyDayOff(company: Company, date: Dayjs): boolean {
  return company?.days_off?.some((dayOff) => isDateInDayOff(date, dayOff)) ?? false
}

const ServiceStep: React.FC<ServiceStepProps> = ({
  formRef,
  setFormValues,
  bookingValues,
  setBookingValues,
  rawEmployeeData,
  rawServiceData,
  rawBookingData,
  company
}) => {
  const [form] = Form.useForm()
  const employees = useMemo(() => transformEmployeeData(rawEmployeeData), [rawEmployeeData])
  const services = useMemo(() => transformServicesData(rawServiceData), [rawServiceData])
  const bookings: Booking[] = useMemo(() => transformAppointmentsData(rawBookingData), [rawBookingData])
  const selectedServiceId = Form.useWatch('service', form)
  const selectedDate: Dayjs | undefined = Form.useWatch('date', form)
  const selectedTime = Form.useWatch('time', form)

  useEffect(() => {
    formRef.current = form
  }, [form, formRef])

  interface AvailableTime {
    time: string
    disabled: boolean
  }
  interface AvailableEmployee {
    employee: Employee
    disabled: boolean
  }

  // Available Days of Week
  const availableDaysOfWeek = useMemo(() => {
    if (!selectedServiceId) {
      return new Set<number>()
    }
    const daysOfWeekSet = new Set<number>()

    employees.forEach((employee) => {
      // Exclude employees on days off
      const availableDates = new Set<number>()
      for (let i = 1; i <= 7; i++) {
        const dummyDate = dayjs().isoWeekday(i)
        if (!isEmployeeDayOff(employee, dummyDate) && !isCompanyDayOff(company, dummyDate)) {
          availableDates.add(i)
        }
      }
      employee.schedule.forEach((schedule) => {
        if (schedule.serviceId === selectedServiceId) {
          const dayTimeRanges = schedule.dayTimeRanges
          Object.keys(dayTimeRanges).forEach((dayOfWeekStr) => {
            const dayOfWeek = parseInt(dayOfWeekStr)
            if (availableDates.has(dayOfWeek)) {
              daysOfWeekSet.add(dayOfWeek)
            }
          })
        }
      })
    })
    return daysOfWeekSet
  }, [selectedServiceId, employees, company])

  // Available Times
  // Enhanced: Inject original booking time if not present in available slots
  const availableTimes: AvailableTime[] = useMemo(() => {
    if (!selectedServiceId || !selectedDate) {
      return []
    }
    const dayOfWeek = selectedDate.isoWeekday() // 1 (Monday) to 7 (Sunday)

    // Check if company is off on the selected date
    if (isCompanyDayOff(company, selectedDate)) {
      return [] // No times available as company is off
    }

    // Collect all time ranges for the selected serviceId and dayOfWeek
    const timeRangesByEmployee: { [employeeId: string]: TimeRange[] } = {}

    employees.forEach((employee) => {
      // Exclude employees on days off
      if (isEmployeeDayOff(employee, selectedDate)) {
        return
      }

      employee.schedule.forEach((schedule) => {
        if (schedule.serviceId === selectedServiceId) {
          let dayTimeRanges = schedule.dayTimeRanges[dayOfWeek]
          if (dayTimeRanges && dayTimeRanges.length > 0) {
            // Merge overlapping and adjacent time ranges
            dayTimeRanges = mergeTimeRanges(dayTimeRanges)
            if (!timeRangesByEmployee[employee.id]) {
              timeRangesByEmployee[employee.id] = []
            }
            timeRangesByEmployee[employee.id].push(...dayTimeRanges)
          }
        }
      })
    })

    const service = services.find((s) => s.id === selectedServiceId)
    const serviceDuration = service ? service.duration : 0

    // Generate all possible time slots
    const timesSet = new Set<string>()
    Object.values(timeRangesByEmployee).forEach((timeRanges) => {
      timeRanges.forEach((range) => {
        let startTime = dayjs(range.start, 'HH:mm')
        const endTime = dayjs(range.end, 'HH:mm')
        if (USE_SERVICE_DURATION_STEPS) {
          // Use service duration steps
          while (startTime.isSameOrBefore(endTime.subtract(serviceDuration, 'minute'), 'minute')) {
            const timeStr = startTime.format('HH:mm')
            timesSet.add(timeStr)
            startTime = startTime.add(serviceDuration, 'minute')
          }
        } else {
          // Use TIME_INCREMENT steps
          while (startTime.isBefore(endTime)) {
            const timeStr = startTime.format('HH:mm')
            timesSet.add(timeStr)
            startTime = startTime.add(TIME_INCREMENT, 'minute')
          }
        }
      })
    })

    // Convert timesSet to sorted array
    const timesArray = Array.from(timesSet).sort((a, b) => {
      const timeA = dayjs(a, 'HH:mm')
      const timeB = dayjs(b, 'HH:mm')
      return timeA.isBefore(timeB) ? -1 : 1
    })

    // Check availability for each time slot
    let availableTimes = timesArray.map((time) => {
      // Check if there's at least one employee available at this time
      const availableEmployeesAtTime = employees.some((employee) => {
        // Exclude employees on days off
        if (isEmployeeDayOff(employee, selectedDate)) {
          return false
        }

        // Check if employee works at this time
        const timeRanges = timeRangesByEmployee[employee.id]
        if (!timeRanges) return false

        const selectedTimeMoment = dayjs(time, 'HH:mm')
        const serviceEndTime = selectedTimeMoment.add(serviceDuration, 'minute')

        let worksAtTime = false
        timeRanges.forEach((range) => {
          const start = dayjs(range.start, 'HH:mm')
          const end = dayjs(range.end, 'HH:mm')
          if (selectedTimeMoment.isSameOrAfter(start) && serviceEndTime.isSameOrBefore(end)) {
            worksAtTime = true
          }
        })

        if (!worksAtTime) return false

        // Check if not booked at this time
        const isBooked = bookings.some((b) => {
          if (b.employeeId === employee.id && b.date && b.date.isSame(selectedDate, 'day')) {
            const bookingStart = dayjs(b.time, 'HH:mm')
            const bookingService = services.find((s) => s.id === b.serviceId)
            const bookingEnd = bookingStart.add(bookingService ? bookingService.duration : 0, 'minute')
            return selectedTimeMoment.isBefore(bookingEnd) && serviceEndTime.isAfter(bookingStart)
          }
          return false
        })

        return !isBooked
      })

      return { time, disabled: !availableEmployeesAtTime }
    })

    // Inject original booking time if not present and valid
    if (
      bookingValues &&
      bookingValues.time &&
      !availableTimes.some((t) => t.time === bookingValues.time)
    ) {
      // Only inject if the date matches the booking date
      if (
        bookingValues.date &&
        selectedDate.isSame(bookingValues.date, 'day')
      ) {
        availableTimes = [
          ...availableTimes,
          {
            time: bookingValues.time,
            disabled: false, // allow selection
            injected: true, // custom property for rendering
          } as any,
        ]
      }
    }

    return availableTimes
  }, [selectedServiceId, selectedDate, employees, bookings, services, company, bookingValues])

  // Available Employees
  const availableEmployees: AvailableEmployee[] = useMemo(() => {
    if (!selectedServiceId || !selectedDate || !selectedTime) {
      return []
    }

    // Check if company is off on the selected date
    if (isCompanyDayOff(company, selectedDate)) {
      return [] // No employees available as company is off
    }

    const dayOfWeek = selectedDate.isoWeekday() // 1 (Monday) to 7 (Sunday)
    const selectedTimeMoment = dayjs(selectedTime, 'HH:mm')

    const service = services.find((s) => s.id === selectedServiceId)
    const serviceDuration = service ? service.duration : 0
    const serviceEndTime = selectedTimeMoment.add(serviceDuration, 'minute')

    const availableEmps = employees.map((employee) => {
      // Check if the employee has a day off on the selected date
      if (isEmployeeDayOff(employee, selectedDate)) {
        return { employee, disabled: true }
      }

      // Check if employee works at the selected time
      let isAvailable = false
      employee.schedule.forEach((schedule) => {
        if (schedule.serviceId === selectedServiceId) {
          let dayTimeRanges = schedule.dayTimeRanges[dayOfWeek]
          if (dayTimeRanges && dayTimeRanges.length > 0) {
            dayTimeRanges = mergeTimeRanges(dayTimeRanges)
            dayTimeRanges.forEach((range) => {
              const start = dayjs(range.start, 'HH:mm')
              const end = dayjs(range.end, 'HH:mm')
              if (selectedTimeMoment.isSameOrAfter(start) && serviceEndTime.isSameOrBefore(end)) {
                isAvailable = true
              }
            })
          }
        }
      })

      if (!isAvailable) {
        return { employee, disabled: true }
      }

      // Check if employee is booked at this time
      const isBooked = bookings.some((b) => {
        if (b.employeeId === employee.id && b.date && b.date.isSame(selectedDate, 'day')) {
          const bookingStart = dayjs(b.time, 'HH:mm')
          const bookingService = services.find((s) => s.id === b.serviceId)
          const bookingEnd = bookingStart.add(bookingService ? bookingService.duration : 0, 'minute')
          return selectedTimeMoment.isBefore(bookingEnd) && serviceEndTime.isAfter(bookingStart)
        }
        return false
      })

      return { employee, disabled: isBooked }
    })

    return availableEmps
  }, [selectedServiceId, selectedDate, selectedTime, employees, bookings, services, company])

  // Disabled Dates function
  const disabledDate = (currentDate: Dayjs) => {
    const today = dayjs().startOf('day')
    if (!selectedServiceId || !currentDate) {
      return true
    }
    if (currentDate.isBefore(today)) {
      return true
    }

    const dayOfWeek = currentDate.isoWeekday()

    // Check if company is off on the date
    if (isCompanyDayOff(company, currentDate)) {
      return true
    }

    const isDateAvailable = employees.some((employee) => {
      if (isEmployeeDayOff(employee, currentDate)) {
        return false
      }

      return employee.schedule.some((schedule) => {
        if (schedule.serviceId === selectedServiceId) {
          const dayTimeRanges = schedule.dayTimeRanges[dayOfWeek]
          return dayTimeRanges && dayTimeRanges.length > 0
        }
        return false
      })
    })

    return !isDateAvailable
  }

  const initialFormValues = {
    service: bookingValues.serviceId,
    employee: bookingValues.employeeId,
    date: bookingValues.date,
    time: bookingValues.time,
    notes: bookingValues.note,
    notifications: bookingValues.notificationEnabled
  }

  const onValuesChange = (changedValues: any) => {
    if ('service' in changedValues) {
      form.setFieldsValue({
        date: undefined,
        time: undefined,
        employee: undefined
      })
    } else if ('date' in changedValues) {
      form.setFieldsValue({ time: undefined, employee: undefined })
    } else if ('time' in changedValues) {
      form.setFieldsValue({ employee: undefined })
    }

    // Fetch the updated form values after resetting the time field
    const allValues = form.getFieldsValue()
    updateBookingValues(allValues)
    updateFormValues(allValues)
  }

  function formatLocalTime(timeStr, locale = 'en-US') {
    if (timeStr == undefined) return
    const [hour, minute] = timeStr.split(':').map(Number)
    const date = new Date()
    date.setHours(hour, minute, 0, 0)
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }
    return date.toLocaleTimeString(locale, options)
  }

  function formatLocalDate(dateIn: any, locale = 'en-US') {
    if (dateIn == undefined) return
    const date = new Date(dateIn)
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }
    return new Intl.DateTimeFormat(locale, options).format(date)
  }

  const updateFormValues = (allValues: any) => {
    const selectedService = services.find((service) => service.id == allValues.service);
    const startTime = formatLocalTime(allValues.time, navigator.language);
    
    // Calculate time range if we have a service with duration
    let timeRange = startTime;
    if (selectedService && selectedService.duration && allValues.time) {
      const startTimeMoment = dayjs(allValues.time, 'HH:mm');
      const endTimeMoment = startTimeMoment.add(selectedService.duration, 'minute');
      const endTime = formatLocalTime(endTimeMoment.format('HH:mm'), navigator.language);
      timeRange = `${startTime} - ${endTime}`;
    }

    setFormValues((prevValues) => ({
      ...prevValues,
      service: services.find((service) => service.id == allValues.service)?.name,
      employee: employees.find((employee) => employee.id == allValues.employee)?.name,
      date: formatLocalDate(allValues.date, navigator.language),
      time: timeRange,
      price: selectedService ? formatPrice(selectedService.price) : undefined
    }))
  }

  const updateBookingValues = (allValues: any) => {
    setBookingValues((prevValues) => ({
      ...prevValues,
      serviceId: String(allValues.service),
      employeeId: String(allValues.employee),
      date: allValues.date,
      time: allValues.time,
      note: allValues.note
    }))
  }

  /**
   * Converts a total number of minutes into a formatted string of hours and minutes.
   *
   * @param totalMinutes - The total number of minutes to convert.
   * @returns A string formatted as "Xh Ym", "Xh", or "Ym".
   */
  const getDuration = (totalMinutes: number): string => {
    if (totalMinutes < 0) {
      throw new Error('Total minutes cannot be negative.')
    }
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h`
    } else {
      return `${minutes}m`
    }
  }

  const formatPrice = (price: number, currency: string = '$'): string => {
    return `${currency}${price.toFixed(2)}`
  }

  return (
    <Form form={form} layout='vertical' initialValues={initialFormValues} onValuesChange={onValuesChange}>
      {/* Service Field */}
      <Form.Item label='Service' name='service' required rules={[{ required: true, message: 'Please select a service' }]}>
        <Select placeholder='Select a service' allowClear>
          {services.map((service) => (
            <Select.Option key={service.id} value={service.id}>
              {service.name} ({formatPrice(service.price)})
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      {/* Date and Time Fields */}
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label='Date' name='date' required rules={[{ required: true, message: 'Please select a date' }]}>
            <DatePicker allowClear style={{ width: '100%' }} disabledDate={disabledDate} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label='Time' name='time' required rules={[{ required: true, message: 'Please select a time' }]}>
            {/* Show warning if original booking time is injected */}
            {availableTimes.some((t: any) => t.injected) && (
              <div style={{ color: '#d46b08', marginBottom: 8 }}>
                <span role="img" aria-label="warning" style={{ marginRight: 4 }}>⚠️</span>
                This booking was created with a time that does not match the current slot settings. You can keep this time or select a new valid slot.
              </div>
            )}
            <Select placeholder='Select a time' allowClear>
              {availableTimes.map(({ time, disabled, injected }) => {
                // Calculate the end time based on service duration
                const selectedService = services.find(s => s.id === selectedServiceId);
                const serviceDuration = selectedService ? selectedService.duration : 0;
                
                const startTimeMoment = dayjs(time, 'HH:mm');
                const endTimeMoment = startTimeMoment.add(serviceDuration, 'minute');
                const timeDisplay = `${time} - ${endTimeMoment.format('HH:mm')}`;
                
                return (
                  <Select.Option
                    key={time}
                    value={time}
                    disabled={disabled}
                    style={injected ? { color: '#d46b08', fontWeight: 600 } : {}}
                  >
                    {injected ? (
                      <>
                        {timeDisplay} <span style={{ color: '#d46b08' }}>(original time)</span>
                      </>
                    ) : (
                      timeDisplay
                    )}
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      {/* Employee Field */}
      <Form.Item label='Employee' name='employee' required rules={[{ required: true, message: 'Please select an employee' }]}>
        <Select placeholder='Select an employee' allowClear>
          {availableEmployees.map(({ employee, disabled }) => (
            <Select.Option key={employee.id} value={employee.id} disabled={disabled}>
              {employee.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </Form>
  )
}

export default ServiceStep
