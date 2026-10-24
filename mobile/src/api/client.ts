import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    return 'http://localhost:4000/api';
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000/api';
  }
  return 'http://localhost:4000/api';
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
  const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;

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
      `Unable to connect to server at ${API_BASE_URL}. Ensure backend is running.`
    );
  }
};
