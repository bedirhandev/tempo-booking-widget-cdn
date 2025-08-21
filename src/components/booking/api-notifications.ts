import { useNotifications } from '@/components/booking/use-notifications';

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export const useApiNotifications = () => {
  const notifications = useNotifications();

  const handleApiResponse = <T>(
    response: ApiResponse<T>,
    successMessage?: string
  ) => {
    if (response.message) {
      notifications.success(successMessage || response.message);
    }
    return response.data;
  };

  const handleApiError = (error: any, defaultMessage = 'An error occurred') => {
    let errorMessage = defaultMessage;
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.errors) {
      const errors = error.response.data.errors;
      const firstError = Object.values(errors)[0];
      if (Array.isArray(firstError) && firstError.length > 0) {
        errorMessage = firstError[0];
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    notifications.error(errorMessage);
    throw error;
  };

  return {
    handleApiResponse,
    handleApiError,
    notifications,
  };
};