import axios, { type AxiosResponse } from "axios";

const defaultBaseUrl: string = 'http://localhost:8000/api/v1';

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
    return response.data;
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
 * Get team members.
 * @returns {Promise<any>} API response with the list of team members.
 */
export async function getTeamMembers(tenantId: string, baseUrl: string = defaultBaseUrl): Promise<any> {
  try {
    const response = await axios.get(`${baseUrl}/${tenantId}/team/members`);
    return response;
  } catch (error) {
    console.error('Something went wrong while fetching team members: ', error);
    throw error;
  }
}