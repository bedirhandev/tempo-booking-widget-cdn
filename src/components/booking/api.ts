import axios, { type AxiosResponse } from "axios";
import type { ServicesResponse, TeamMembersResponse } from "@/components/booking/types/index"
import { transformBookingToLocal, transformUserTimeEntriesToLocal } from "./utils/datetime";

const defaultBaseUrl: string = 'http://127.0.0.1:8000/api/v1';

export const createAppointment = async (data: any, tenantId: string, baseUrl: string = defaultBaseUrl) => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const payload = {
    ...data,
    date: data.date
      ? `${data.date.getFullYear()}-${pad(data.date.getMonth() + 1)}-${pad(data.date.getDate())}`
      : undefined,
  };
  try {
    const response = await axios.post(`${baseUrl}/${tenantId}/appointments`, payload);
    return response.data;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};

/**
 * Get appointments.
 * @returns {Promise<any>} API response with the list of appointments.
 */
export async function getAppointments(tenantId: string, baseUrl: string = defaultBaseUrl): Promise<any> {
  try {
    const response = await axios.get(`${baseUrl}/${tenantId}/appointments`);
    return response.data.map(transformBookingToLocal);
  } catch (error) {
    console.error('Something went wrong while fetching appointments: ', error);
    throw error;
  }
}

export async function getAvailableTimeSlots(
  tenantId: string,
  serviceId: number,
  date: string,
  timeFormat: '12hr' | '24hr' = '24hr',
  timezone?: string,
  baseUrl: string = defaultBaseUrl
): Promise<AxiosResponse> {
  const userTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const response = await axios.get(`${baseUrl}/${tenantId}/available-time-slots`, {
    params: {
      serviceId,
      date, // User's local date
      timeFormat,
      timezone: userTimezone
    }
  });
  return response;
}

export async function getServices(
  tenantId: string,
  baseUrl: string = defaultBaseUrl
): Promise<AxiosResponse<ServicesResponse>> {
  const response = await axios.get(`${baseUrl}/${tenantId}/services`);
  return response;
}


export async function getTeamMembers(
  tenantId: string,
  baseUrl: string = defaultBaseUrl
): Promise<AxiosResponse<TeamMembersResponse>> {
  try {
    const response = await axios.get(`${baseUrl}/${tenantId}/team-members`);
    return response;
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }
};