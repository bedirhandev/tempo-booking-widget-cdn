// utils/dataTransformers.ts
import dayjs from 'dayjs'
import { convertUtcTimeToLocal } from './timezoneUtils'
import type { Service, Employee, Booking, DayOff } from '@/components/booking/types/booking'
import type { TimeRange } from '@/components/booking/types/booking'

const DAY_OF_WEEK_MAP: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7
}

export function transformServicesData(data: any[]): Service[] {
  return data.map(serviceData => ({
    id: String(serviceData.id),
    name: serviceData.name,
    duration: serviceData.duration,
    price: serviceData.price
  }))
}

export function transformBookingsData(data: any[]): Booking[] {
  return data.map(bookingData => ({
    id: bookingData.id,
    serviceId: String(bookingData.serviceId),
    employeeId: String(bookingData.userId),
    customerId: bookingData.customerId ? String(bookingData.customerId) : undefined,
    note: bookingData.note,
    date: dayjs(bookingData.date),
    time: convertUtcTimeToLocal(bookingData.time),
    duration: bookingData.duration || 0
  }))
}

export function transformEmployeeData(data: any[]): Employee[] {
  return data
    .filter(empData => empData.visibility !== 0 && empData.visibility !== false)
    .map(empData => {
      const employee: Employee = {
        id: String(empData.id),
        name: empData.fullName,
        services: [],
        schedule: [],
        daysOff: transformDaysOff(empData.daysOff)
      }

      if (empData.schedule?.length > 0) {
        const { services, schedule } = processEmployeeSchedule(empData.schedule)
        employee.services = services
        employee.schedule = schedule
      }

      return employee
    })
}

function transformDaysOff(daysOffData: any[]): DayOff[] {
  if (!daysOffData) return []
  
  return daysOffData.map(dayOff => ({
    key: dayOff.key,
    name: dayOff.name,
    date: dayOff.date,
    repeat: dayOff.repeat
  }))
}

function processEmployeeSchedule(scheduleData: any[]) {
  const servicesSet = new Set<string>()
  const serviceSchedules: Record<string, { dayTimeRanges: Record<number, TimeRange[]> }> = {}

  scheduleData.forEach(dayEntry => {
    const dayOfWeek = DAY_OF_WEEK_MAP[dayEntry.day]
    if (!dayOfWeek || !dayEntry.entries) return

    dayEntry.entries.forEach((entry: any) => {
      if (entry.type !== 'work' || !entry.services?.length || !entry.timePeriod) return

      const [startUtc, endUtc] = entry.timePeriod.split(' - ')
      const timeRange: TimeRange = {
        start: convertUtcTimeToLocal(startUtc),
        end: convertUtcTimeToLocal(endUtc)
      }

      entry.services.forEach((serviceId: number) => {
        const serviceIdStr = String(serviceId)
        servicesSet.add(serviceIdStr)

        if (!serviceSchedules[serviceIdStr]) {
          serviceSchedules[serviceIdStr] = { dayTimeRanges: {} }
        }
        if (!serviceSchedules[serviceIdStr].dayTimeRanges[dayOfWeek]) {
          serviceSchedules[serviceIdStr].dayTimeRanges[dayOfWeek] = []
        }
        
        serviceSchedules[serviceIdStr].dayTimeRanges[dayOfWeek].push(timeRange)
      })
    })
  })

  const services = Array.from(servicesSet)
  const schedule = Object.entries(serviceSchedules).map(([serviceId, scheduleData]) => ({
    serviceId,
    dayTimeRanges: scheduleData.dayTimeRanges
  }))

  return { services, schedule }
}