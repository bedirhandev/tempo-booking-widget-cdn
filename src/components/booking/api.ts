import axios, { type AxiosResponse } from "axios";
import type { ServicesResponse, TeamMembersResponse } from "@/components/booking/types/index"
import { transformBookingToLocal } from "./utils/datetime";
import { getUserTimeFormatMode } from '@/components/booking/utils/timeFormat'

const defaultBaseUrl: string = 'http://127.0.0.1:8000/api/v1';

export const createAppointment = async (data: any, tenantId: string, baseUrl: string = defaultBaseUrl) => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const payload = {
    ...data,
    date: data.date
      ? `${data.date.getFullYear()}-${pad(data.date.getMonth() + 1)}-${pad(data.date.getDate())}`
      : undefined,
    notificationEnabled: true,
    timezone: userTimezone,
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
  timeFormat: '12hr' | '24hr' = getUserTimeFormatMode(),
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

export type CreatePaymentIntentPayload = {
  email?: string;
  name?: string;
  // Arbitrary JSON to be merged into bookings.widget_metadata on the backend
  metadata?: Record<string, any>;
};

export type PaymentIntentResponse = {
  clientSecret: string;
  publishableKey: string;
  amount: number;
  currency: string;
  bookingId: string;
};

/**
 * Create a payment intent for an appointment (server is the source of truth for pricing).
 * POST /api/v1/{tenantId}/appointments/{bookingId}/payment-intents
 */
export async function createAppointmentPaymentIntent(
  tenantId: string,
  bookingId: string,
  payload: CreatePaymentIntentPayload = {},
  baseUrl: string = defaultBaseUrl
): Promise<PaymentIntentResponse> {
  try {
    const response = await axios.post(
      `${baseUrl}/${tenantId}/appointments/${bookingId}/payment-intents`,
      payload
    );
    return response.data as PaymentIntentResponse;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

/**
 * Lookup booking by Stripe PaymentIntent ID (validated on backend with Stripe secret).
 * GET /api/v1/{tenantId}/appointments/payment-intents/{payment_intent_id}/booking
 */
export async function getBookingByPaymentIntent(
  tenantId: string,
  paymentIntentId: string,
  baseUrl: string = defaultBaseUrl
): Promise<AxiosResponse<any>> {
  const response = await axios.get(
    `${baseUrl}/${tenantId}/appointments/payment-intents/${paymentIntentId}/booking`
  );
  return response;
}

export type FinancialSettingsResponse = {
  financial: {
    currency: string;
    payLaterEnabled: boolean;
    stripeEnabled: boolean;
  };
};

/**
 * Get tenant financial settings.
 * GET /api/v1/{tenantId}/financial-settings
 */
export async function getFinancialSettings(
  tenantId: string,
  baseUrl: string = defaultBaseUrl
): Promise<FinancialSettingsResponse> {
  try {
    const response = await axios.get(
      `${baseUrl}/${tenantId}/financial-settings`,
      { headers: { Accept: 'application/json' } }
    );
    return response.data as FinancialSettingsResponse;
  } catch (error) {
    console.error('Error fetching financial settings:', error);
    throw error;
  }
}