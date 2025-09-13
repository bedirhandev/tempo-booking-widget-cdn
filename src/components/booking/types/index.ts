import { Dayjs } from 'dayjs'

export interface FormValues {
    service?: string
    employee?: string
    date?: string
    time?: string
    fullName: string
    price?: string
    email?: string
    phoneNumber?: string
    additionalNotes?: string
}

export interface Absence {
    name: string;
    start_date: string; // YYYY-MM-DD format
    end_date: string;   // YYYY-MM-DD format
}

// Updated TeamMember interface with new schedule structure
export interface TimeSlot {
    start: string; // "09:00"
    end: string;   // "17:00"
}

export interface DaySchedule {
    dayOfWeek: number; // 1-7 (Monday-Sunday)
    timeSlots: TimeSlot[];
}

export interface TeamMember {
    id: number;
    name: string;
    absences: Absence[];
    schedule: Record<string, DaySchedule[]>; // serviceId -> array of day schedules
}

export interface TeamMembersResponse {
    success: boolean;
    message: string;
    data: TeamMember[];
}

export interface Service {
    id: number;
    name: string;
    price: string;
}

export interface ServicesResponse {
    success: boolean;
    message: string;
    data: Service[];
}

export interface TimeRange {
    start: string // Local time format HH:mm
    end: string   // Local time format HH:mm
}

export interface DayOff {
    key: string
    name: string
    date: string
    repeat: boolean
}

export interface EmployeeSchedule {
    serviceId: string
    dayTimeRanges: { [dayOfWeek: number]: TimeRange[] }
}

export interface Employee {
    id: string
    name: string
    services: string[]
    schedule: EmployeeSchedule[]
    daysOff: DayOff[]
}

/*export interface Booking {
    id: string
    serviceId: string
    employeeId: string
    customerId?: string
    note?: string
    date: Dayjs
    time: string // Local time format HH:mm
    duration: number
}*/

export interface Booking {
    id: string
    serviceId: string | undefined
    employeeId: string | undefined
    customerId: string | undefined
    note: string | undefined
    notificationEnabled: boolean
    date: Dayjs | null
    time: string | undefined
}

export interface AvailableTime {
    time: string;
    disabled: boolean;
    injected?: boolean;
}
export interface AvailableEmployee {
    employee: TeamMember
    disabled: boolean
}

export interface Customer {
    id: string
    FullName: string
    Email: string
    Phone?: string
    Notes?: string
    isRegistered?: boolean
}