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
    categoryId: number;
    name: string;
    price: string;
    priceCurrencyCode: string;
    colorCode?: string | null;
    deliveryChannels: string[];
    duration: number;
    durationFormatted: string;
    availableChannels: Array<{ value: string; label: string }>;
    formattedPrice: string;
    priceCurrencySymbol: string;

    // Optional: for platforms hints (expand if needed)
    enabledPlatforms?: string[];

    // Optional: backward-compat flags
    isInPersonEnabled?: boolean;
    isVirtualEnabled?: boolean;
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

// types/booking.ts

export interface DeliveryInfo {
  channel: string;
  channel_label: string;
  phone_number: string;
}

export interface ApiService {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  priceCurrencyCode: string;
  formattedPrice: string;
  priceCurrencySymbol: string;
  colorCode: string | null;
  info: string | null;
  hours: number;
  minutes: number;
  deliveryChannels: string[];
  availableChannels: Array<{ value: string; label: string }>;
  duration: number;
  durationFormatted: string;
  category: any;
  users: any;
  bookings: any;
  timeEntries: any;
}

export interface ApiCustomer {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  notes: string | null;
  isRegistered: boolean;
  bookings: any;
}

export interface ApiUser {
  id: string;
  name: string;
  timezone: string;
  email: string;
  globalId: string;
  permissions: string[];
  services: any;
  absences: any;
  timeEntries: any;
  role: string;
}

export interface ApiBooking {
  id: string;
  reference: string;
  date: string;
  time: string;
  userId: string;
  teamId: string | null;
  serviceId: string;
  customerId: string;
  statusTypeId: string;
  note: string | null;
  notificationEnabled: boolean;
  startDatetime: string;
  endDatetime: string;
  assignedUserName: string;
  serviceName: string;
  serviceDurationInMinutes: number;
  statusName: string;
  displayStatusName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  serviceColorCode: string | null;
  serviceInfo: string | null;
  servicePrice: number;
  categoryName: string;
  widgetMetadata: Record<string, any>;
  paymentStatus: string | null;
  paymentProvider: string | null;
  paymentReference: string | null;
  paymentIntentId: string | null;
  paidAt: string | null;
  currency: string | null;
  priceCurrencyCode: string;
  deliveryChannel: string;
  meetingPlatform: string | null;
  meetingLink: string | null;
  formattedPrice: string;
  priceCurrencySymbol: string;
  deliveryInfo: DeliveryInfo;
  user: ApiUser;
  team: any;
  service: ApiService;
  customer: ApiCustomer;
  statusType: {
    id: string;
    name: string;
    displayName: string;
    bookings: any;
    notifications: any;
  };
  participants: any;
}

export interface CreateAppointmentResponse {
  message: string;
  booking: ApiBooking;
}