import { apiClient } from './client';
import { RequestOtpResponse, VerifyOtpResponse, User, ApiResponse } from '../types/index';

export const authApi = {
  requestOtp: async (phone: string): Promise<RequestOtpResponse> => {
    return apiClient<RequestOtpResponse>('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  verifyOtp: async (params: {
    phone: string;
    otp: string;
    username?: string;
    displayName?: string;
  }): Promise<VerifyOtpResponse> => {
    return apiClient<VerifyOtpResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    return apiClient<ApiResponse<User>>('/users/me', {
      method: 'GET',
    });
  },
};
