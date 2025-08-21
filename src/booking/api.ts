import axios, { type AxiosResponse } from "axios";


export const createAppointment = async (data: any, tenantId: string) => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const payload = {
    ...data,
    date: data.date
      ? `${data.date.getFullYear()}-${pad(data.date.getMonth() + 1)}-${pad(data.date.getDate())}`
      : undefined,
  };
  try {
    const response = await axios.post(`http://localhost:8000/${tenantId}/api/v1/appointments/store`, payload);
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
export async function getAppointments(tenantId: string): Promise<any> {
  try {
    const response = await axios.get(`http://localhost:8000/${tenantId}/api/v1/appointments`);
    return response.data;
  } catch (error) {
    console.error('Something went wrong while fetching appointments: ', error);
    throw error;
  }
}

export async function getServices(tenantId: string): Promise<AxiosResponse> {
  const response = await axios.get(`http://localhost:8000/${tenantId}/api/v1/services`);
  return response;
}

/**
 * Get team members.
 * @returns {Promise<any>} API response with the list of team members.
 */
export async function getTeamMembers(tenantId: string): Promise<any> {
  try {
    const response = await axios.get(`http://localhost:8000/${tenantId}/api/v1/team/members`);
    return response;
  } catch (error) {
    console.error('Something went wrong while fetching team members: ', error);
    throw error;
  }
}