// utils/timezoneUtils.ts
import dayjs, { Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { getDefaultTimeFormatPattern } from '@/components/booking/utils/timeFormat'

dayjs.extend(utc)
dayjs.extend(timezone)

const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD'
const DEFAULT_TIME_FORMAT = getDefaultTimeFormatPattern()
const DEFAULT_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm'

/**
 * Convert UTC datetime string to local timezone
 */
export function convertUtcToLocal(
  utcDateTime: string,
  format: string = DEFAULT_DATETIME_FORMAT
): string {
  return dayjs.utc(utcDateTime).local().format(format)
}

/**
 * Convert UTC time string to local time
 */
export function convertUtcTimeToLocal(
  timeString: string,
  baseDate?: Dayjs,
  format: string = DEFAULT_TIME_FORMAT
): string {
  const date = (baseDate || dayjs()).format(DEFAULT_DATE_FORMAT)
  return dayjs.utc(`${date} ${timeString}`).local().format(format)
}

/**
 * Convert local time string to UTC time
 */
export function convertLocalTimeToUtc(
  timeString: string,
  baseDate?: Dayjs,
  format: string = DEFAULT_TIME_FORMAT
): string {
  const date = (baseDate || dayjs()).format(DEFAULT_DATE_FORMAT)
  return dayjs(`${date} ${timeString}`).utc().format(format)
}

/**
 * Create a datetime from date and time in local timezone
 */
export function createLocalDateTime(date: Dayjs, timeString: string): Dayjs {
  const dateStr = date.format(DEFAULT_DATE_FORMAT)
  return dayjs(`${dateStr} ${timeString}`)
}

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(
  start1: Dayjs,
  end1: Dayjs,
  start2: Dayjs,
  end2: Dayjs
): boolean {
  return start1.isBefore(end2) && start2.isBefore(end1)
}

// Added helpers to convert UTC datetimes into arbitrary IANA timezones

export const DISPLAY_DATE_FORMAT = 'MMMM DD, YYYY'

/**
 * Convert a UTC ISO datetime string to a specific IANA timezone and format it.
 */
export function convertUtcToZone(
  utcDateTime: string,
  zone: string,
  format: string = DEFAULT_DATETIME_FORMAT
): string {
  return dayjs.utc(utcDateTime).tz(zone).format(format)
}

/**
 * Format a UTC start/end datetime range in a specific timezone, returning "HH:mm - HH:mm".
 */
export function formatUtcRangeInZone(
  startUtc: string,
  endUtc: string,
  zone: string,
  timeFormat: string = DEFAULT_TIME_FORMAT
): string {
  const start = dayjs.utc(startUtc).tz(zone)
  const end = dayjs.utc(endUtc).tz(zone)
  return `${start.format(timeFormat)} - ${end.format(timeFormat)}`
}

/**
 * Get a human-friendly date string for a UTC datetime in a given timezone.
 */
export function formatUtcDateInZone(
  utcDateTime: string,
  zone: string,
  format: string = DISPLAY_DATE_FORMAT
): string {
  return dayjs.utc(utcDateTime).tz(zone).format(format)
}