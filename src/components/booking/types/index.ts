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
    duration?: number;
    duration_formatted?: string;

    // Multi-channel delivery (from backend)
    deliveryChannels?: string[]; // ['virtual_meeting','phone_call','in_person']
    availableChannels?: Array<{ value: string; label: string }>;
    // Optional platform hints when virtual is enabled (if exposed)
    enabledPlatforms?: string[]; // ['zoom','google_meet','microsoft_teams']

    // Backward-compat flags (derive in UI when not provided)
    is_in_person_enabled?: boolean;
    is_virtual_enabled?: boolean;
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

    // Channel + platform selection (widget -> API)
    deliveryChannel?: 'virtual_meeting' | 'phone_call' | 'in_person'
    meetingPlatform?: 'zoom' | 'google_meet' | 'microsoft_teams'
}

export interface AvailableTime {
    id: number;

    // Human-friendly label strings
    time: string;
    disabled: boolean;
    injected?: boolean;

    // Business/localized info
    business_datetime_start: string; // ISO (UTC)
    business_datetime_end: string;   // ISO (UTC)
    business_start_time: string;     // "08:00"
    business_end_time: string;       // "08:30"
    business_date: string;           // "YYYY-MM-DD"

    // User-facing info (already in user tz)
    user_start_time: string;         // "08:00"
    user_end_time: string;           // "08:30"
    user_date: string;               // "YYYY-MM-DD"
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