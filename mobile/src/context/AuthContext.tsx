import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/index';
import { authApi } from '../api/auth';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requestOtp: (phone: string) => Promise<{ isExistingUser: boolean }>;
  verifyOtp: (phone: string, otp: string, username?: string, displayName?: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore stored token and user profile on app launch
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Silently verify and refresh latest user details from server
          try {
            const res = await authApi.getMe();
            if (res.data) {
              setUser(res.data);
              await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.data));
            }
          } catch {
            // If token invalid, remove stale credentials
            await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
            setToken(null);
            setUser(null);
          }
        }
      } catch (e) {
        console.error('Failed to restore auth session:', e);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const requestOtp = async (phone: string) => {
    const res = await authApi.requestOtp(phone);
    return { isExistingUser: res.data.isExistingUser };
  };

  const verifyOtp = async (
    phone: string,
    otp: string,
    username?: string,
    displayName?: string
  ): Promise<User> => {
    const res = await authApi.verifyOtp({ phone, otp, username, displayName });
    const { token: receivedToken, user: receivedUser } = res.data;

    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, receivedToken);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);

    return receivedUser;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      if (res.data) {
        setUser(res.data);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.data));
      }
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        requestOtp,
        verifyOtp,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
