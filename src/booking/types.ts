export interface FormValues {
  service?: string
  employee?: string
  date?: string
  time?: string
  fullName: string
  price?: string
  /*firstName?: string;
	lastName?: string;*/
  email?: string
  phoneNumber?: string
  additionalNotes?: string
}

export interface Duration {
  id: number
  hours: number
  minutes: number
}

export interface Category {
  id: number
  name: string
}

export interface Service {
  id: number
  name: string
  category: Category
  duration: Duration
}

interface DayOff {
  key: string
  name: string
  date: string // Format: e.g., 'February 03, 2025' or 'February 03, 2025 - February 17, 2025'
  repeat: boolean
}

interface DayEntry {
  // Define this interface based on your data structure
}

export interface Company {
  id: number | undefined
  image: string
  name: string
  address: string
  website: string
  phone: string
  email: string
  time_entries: DayEntry[]
  days_off: DayOff[]
}

/**
 * Interface for work schedule day
 */
export interface WorkScheduleDay {
  day: string;
  entries: TimeEntry[];
}

/**
 * Interface for time entry
 */
export interface TimeEntry {
  id?: number;
  timePeriod: string;
  type: string;
  services?: number[];
}

/**
 * Interface for team member data
 */
export interface TeamMember {
  id?: number;
  fullName: string;
  email: string;
  phone: string;
  notes?: string;
  colorCode: string;
  visibility: boolean;
  workSchedule?: WorkScheduleDay[];
  daysOff?: DayOff[];
}