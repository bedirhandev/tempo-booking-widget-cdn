import type { ServiceData, TimeEntryData } from "../types/generated";
import type { DayOff } from "./steps/ServiceStep";
import type { DayEntry, Employee, TeamMember, TimeEntry } from "./types";
import { format, parseISO } from 'date-fns';

export function transformAbsencesToDaysOff(absences: any[]): DayOff[] {
  if (!absences || !Array.isArray(absences)) return [];
  const daysOff: DayOff[] = [];
  absences.forEach((absence) => {
    const startDate = parseISO(absence.startDate);
    const endDate = parseISO(absence.endDate);
    daysOff.push({
      key: `${absence.id}`,
      name: absence.name || '',
      date: `${format(startDate, 'MMMM d, yyyy')} - ${format(endDate, 'MMMM d, yyyy')}`,
      repeat: absence.repeat || false
    });
  });
  return daysOff;
}

export function transformTimeEntriesToSchedule(timeEntries: TimeEntryData[]): DayEntry[] {
  const groupedMap: Record<string, TimeEntry[]> = {};
  timeEntries.forEach(entry => {
    const day = entry.dayName || '';
    if (!groupedMap[day]) groupedMap[day] = [];
    groupedMap[day].push({
      id: parseInt(entry.id, 10),
      timePeriod: entry.timePeriod,
      type: entry.entryType as string,
      services: (entry.services || []).map(service => parseInt(service.id, 10))
    });
  });
  return Object.entries(groupedMap).map(([day, entries]) => ({ day, entries }));
}

/**
 * Transforms a TeamMember object into an Employee object.
 * @param {TeamMember} member - The team member to be transformed.
 * @returns {Employee} The transformed employee.
 */
export function transformMemberToEmployee(member: TeamMember): Employee {
  return {
    id: member.id || 0, // Assuming that if id is undefined, it defaults to 0
    fullName: member.fullName,
    email: member.email,
    phone: member.phone,
    notes: member.notes || '',
    visibility: member.visibility ? 1 : 0, // Convert boolean to numeric visibility
    colorCode: member.colorCode,
    services: (member as any).user?.services?.map((service: ServiceData) => ({
      id: parseInt(service.id, 10),
      name: service.name,
      category: service.category ? {
        id: parseInt(service.category.id || '0', 10),
        name: service.category.name
      } : { id: 0, name: '' },
      duration: {
        id: 0,
        hours: service.hours || 0,
        minutes: service.minutes || 0
      }
    })) || [],
    schedule: transformTimeEntriesToSchedule((member as any).user?.timeEntries || []),
    daysOff: transformAbsencesToDaysOff((member as any).user?.absences || [])
  };
}