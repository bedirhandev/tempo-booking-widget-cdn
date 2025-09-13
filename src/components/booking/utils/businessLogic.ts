// utils/businessLogic.ts
import dayjs, { Dayjs } from 'dayjs'
import type { Employee, Booking, TimeRange, DayOff } from '@/components/booking/types/booking'
import { createLocalDateTime, timeRangesOverlap } from './timezoneUtils'

const DAY_OFF_DATE_FORMAT = 'MMMM DD, YYYY'

export function isDateInDayOff(date: Dayjs, dayOff: DayOff): boolean {
  if (dayOff.date.includes(' - ')) {
    const [startDateStr, endDateStr] = dayOff.date.split(' - ')
    const startDate = dayjs(startDateStr.trim(), DAY_OFF_DATE_FORMAT)
    const endDate = dayjs(endDateStr.trim(), DAY_OFF_DATE_FORMAT)

    if (dayOff.repeat) {
      const dateMonthDay = date.format('MM-DD')
      const startMonthDay = startDate.format('MM-DD')
      const endMonthDay = endDate.format('MM-DD')

      if (startMonthDay <= endMonthDay) {
        return dateMonthDay >= startMonthDay && dateMonthDay <= endMonthDay
      } else {
        return dateMonthDay >= startMonthDay || dateMonthDay <= endMonthDay
      }
    } else {
      return date.isSameOrAfter(startDate, 'day') && date.isSameOrBefore(endDate, 'day')
    }
  } else {
    const singleDate = dayjs(dayOff.date.trim(), DAY_OFF_DATE_FORMAT)
    if (dayOff.repeat) {
      return date.month() === singleDate.month() && date.date() === singleDate.date()
    } else {
      return date.isSame(singleDate, 'day')
    }
  }
}

export function isEmployeeDayOff(employee: Employee, date: Dayjs): boolean {
  return employee.daysOff?.some(dayOff => isDateInDayOff(date, dayOff)) ?? false
}

export function isCompanyDayOff(company: any, date: Dayjs): boolean {
  return company?.days_off?.some((dayOff: DayOff) => isDateInDayOff(date, dayOff)) ?? false
}

export function mergeTimeRanges(ranges: TimeRange[]): TimeRange[] {
  if (!ranges.length) return []

  const sortedRanges = ranges
    .map(range => ({
      start: dayjs(range.start, 'HH:mm'),
      end: dayjs(range.end, 'HH:mm')
    }))
    .sort((a, b) => (a.start.isBefore(b.start) ? -1 : 1))

  const merged = [sortedRanges[0]]
  
  for (let i = 1; i < sortedRanges.length; i++) {
    const current = sortedRanges[i]
    const last = merged[merged.length - 1]
    
    if (current.start.isSameOrBefore(last.end)) {
      last.end = dayjs.max(last.end, current.end) as Dayjs
    } else {
      merged.push(current)
    }
  }

  return merged.map(range => ({
    start: range.start.format('HH:mm'),
    end: range.end.format('HH:mm')
  }))
}

export function isTimeSlotAvailable(
  employee: Employee,
  date: Dayjs,
  timeSlot: string,
  serviceDuration: number,
  bookings: Booking[],
  serviceId: string
): boolean {
  // Check if employee is off
  if (isEmployeeDayOff(employee, date)) return false

  // Check if employee works at this time for this service
  const dayOfWeek = date.isoWeekday()
  const schedule = employee.schedule.find(s => s.serviceId === serviceId)
  if (!schedule) return false

  const timeRanges = schedule.dayTimeRanges[dayOfWeek]
  if (!timeRanges?.length) return false

  const slotStart = createLocalDateTime(date, timeSlot)
  const slotEnd = slotStart.add(serviceDuration, 'minute')

  // Check if slot fits in any work period
  const fitsInWorkPeriod = mergeTimeRanges(timeRanges).some(range => {
    const workStart = createLocalDateTime(date, range.start)
    const workEnd = createLocalDateTime(date, range.end)
    return slotStart.isSameOrAfter(workStart) && slotEnd.isSameOrBefore(workEnd)
  })

  if (!fitsInWorkPeriod) return false

  // Check for booking conflicts
  const hasConflict = bookings.some(booking => {
    if (booking.employeeId !== employee.id || !booking.date.isSame(date, 'day')) {
      return false
    }

    const bookingStart = createLocalDateTime(booking.date, booking.time)
    const bookingEnd = bookingStart.add(booking.duration, 'minute')
    
    return timeRangesOverlap(slotStart, slotEnd, bookingStart, bookingEnd)
  })

  return !hasConflict
}