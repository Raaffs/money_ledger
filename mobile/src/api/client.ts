import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Determine API Base URL:
// 1. Custom explicit URL from EXPO_PUBLIC_API_URL
// 2. Custom ngrok tunnel from EXPO_PUBLIC_NGROK_URL (or default to live ngrok)
// 3. Fallback to Localhost: 10.0.2.2 for Android emulator, localhost for Web/iOS
export const getBaseUrl = (): string => {
  const customUrl = process.env.EXPO_PUBLIC_API_URL;
  if (customUrl) {
    return customUrl.replace(/\/$/, '');
  }

  const ngrokUrl =
    process.env.EXPO_PUBLIC_NGROK_URL ||
    'https://untouched-conform-botany.ngrok-free.dev';
  if (ngrokUrl) {
    return `${ngrokUrl.replace(/\/$/, '')}/api`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getBaseUrl();

export const TOKEN_STORAGE_KEY = '@miniledger_auth_token';
export const USER_STORAGE_KEY = '@miniledger_auth_user';

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const baseUrl = getBaseUrl();
  const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(baseUrl.includes('ngrok') ? { 'ngrok-skip-browser-warning': 'true' } : {}),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        data.message || (data.errors && data.errors[0]?.message) || 'Request failed';
      throw new ApiError(response.status, errorMessage, data.errors);
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      0,
      `Unable to connect to server at ${baseUrl}. Ensure backend is running.`
    );
  }
};
