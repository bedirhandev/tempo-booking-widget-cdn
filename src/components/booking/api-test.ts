import axios, { type AxiosResponse } from "axios";
import type { ServicesResponse, TeamMembersResponse } from "@/components/booking/types/index"
import { getUserTimeFormatMode } from '@/components/booking/utils/timeFormat'

const defaultBaseUrl: string = 'http://127.0.0.1:8000/api/v1';

// Available Time Slots function
export async function getAvailableTimeSlots(
  tenantId: string,
  serviceId: number,
  date: string,
  timeFormat: '12hr' | '24hr' = getUserTimeFormatMode(),
  baseUrl: string = defaultBaseUrl
): Promise<AxiosResponse> {
  const response = await axios.get(`${baseUrl}/${tenantId}/available-time-slots`, {
    params: {
      serviceId,
      date,
      timeFormat
    }
  });
  return response;
}

// Usage examples:
// const slots = await getAvailableTimeSlots('tenant123', 1, '2025-01-15');
// const slots12hr = await getAvailableTimeSlots('tenant123', 1, '2025-01-15', '12hr');

// Service interface for type safety

// Services function
export async function getServices(
  tenantId: string,
  baseUrl: string = defaultBaseUrl
): Promise<AxiosResponse<ServicesResponse>> {
  const response = await axios.get(`${baseUrl}/${tenantId}/services`);
  return response;
}

// Usage examples:
// const services = await getServices('tenant123');
// console.log(services.data.data); // Array of services with id, name, price
//
// Example response:
// {
//   "success": true,
//   "message": "Services retrieved successfully",
//   "data": [
//     {
//       "id": 1,
//       "name": "Haircut",
//       "price": "25.00"
//     },
//     {
//       "id": 2,
//       "name": "Hair Coloring", 
//       "price": "65.50"
//     }
//   ]
// }

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