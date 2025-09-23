import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { getDefaultTimeFormatPattern } from '@/components/booking/utils/timeFormat';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Convert a UTC date-time string to browser's local time zone.
 */
export function convertUtcToLocal(
    utcDateTime: string,
    format: string = 'YYYY-MM-DD HH:mm'): string {
    return dayjs(utcDateTime).local().format(format);
}

/**
 * Convert a UTC time (HH:mm:ss) string to browser's local time time zone.
 */
export function convertUtcTimeToLocal(
    timeString: string,
    format: string = getDefaultTimeFormatPattern()
): string {
    const today = dayjs().format('YYYY-MM-DD');
    return dayjs.utc(`${today} ${timeString}`).local().format(format);
}

/**
 * Convert a local dayjs object to a UTC string.
export function convertLocalDayjsToUtc(
    localDate: dayjs.Dayjs,
    format: string = "YYYY-MM-DD HH:mm"
): string {
    return localDate.utc().format(format);
} */

/**
 * Convert a local time (HH:mm:ss) string to UTC time string.
 * Example: "14:00" (local) -> "12:00" (UTC)
 */
export function convertLocalTimeToUtc(
    timeString: string,
    format: string = "HH:mm"
): string {
    const today = dayjs().format("YYYY-MM-DD");
    return dayjs(`${today} ${timeString}`).utc().format(format);
}

/**
 * Transforms a booking object from UTC to local time zone.
 */
export function transformBookingToLocal<T extends {
    startDatetime: string;
    endDatetime: string;
    time: string;
}>(booking: T): any {
    return {
        ...booking,
        start_time: convertUtcToLocal(booking.startDatetime),
        end_time: convertUtcToLocal(booking.endDatetime),
        time: convertUtcTimeToLocal(booking.time)
    };
}

/**
 * Transform a user object’s timeEntries from UTC to local time zone.
 */
export function transformUserTimeEntriesToLocal<T extends { timeEntries?: any[] }>(
    user: T
): T {
    if (!user.timeEntries) return user

    const today = dayjs().format("YYYY-MM-DD")
    const TF = getDefaultTimeFormatPattern()
    
    const transformed = user.timeEntries.map((entry) => {
        if (!entry.timePeriod) return entry
    
        const [startUtc, endUtc] = entry.timePeriod.split(" - ")
    
        // Convert each part from UTC → Local
        const localStart = dayjs.utc(`${today} ${startUtc}`, "YYYY-MM-DD HH:mm")
            .local()
            .format(TF)
    
        const localEnd = dayjs.utc(`${today} ${endUtc}`, "YYYY-MM-DD HH:mm")
            .local()
            .format(TF)
    
        return {
            ...entry,
            timePeriod: `${localStart} - ${localEnd}`,
            startTime: localStart,
            endTime: localEnd,
        }
    })

    return {
        ...user,
        timeEntries: transformed,
    }
}