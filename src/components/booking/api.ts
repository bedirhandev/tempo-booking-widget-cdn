import axios, { type AxiosResponse } from "axios";
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

export async function getServices(tenantId: string, baseUrl: string = defaultBaseUrl): Promise<AxiosResponse> {
  const response = await axios.get(`${baseUrl}/${tenantId}/services`);
  return response;
}

/**
 * Get team members and transform their time entries from UTC to local time.
 */
export async function getTeamMembers(
  tenantId: string,
  baseUrl: string = defaultBaseUrl
): Promise<any> {
  try {
    const response = await axios.get(`${baseUrl}/${tenantId}/team/members`)

    // Extract the actual dataset from response
    const members = response.data?.data || []

    // Transform users' timeEntries into local time
    const transformedMembers = members.map((member: any) => {
      if (member.user) {
        return {
          ...member,
          user: transformUserTimeEntriesToLocal(member.user),
        }
      }
      return member
    })

    // Return same structure but with transformed members
    const result = {
      ...response,
      data: {
        ...response.data,
        data: transformedMembers,
      },
    }
    return result
  } catch (error) {
    console.error("Something went wrong while fetching team members: ", error)
    throw error
  }
}