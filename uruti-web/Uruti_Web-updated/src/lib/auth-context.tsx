import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from './api-client';

export type UserRole = 'founder' | 'investor' | 'admin';

export interface User {
  id: number;
  email: string;
  full_name: string;
  display_name?: string;
  role: UserRole;
  avatar_url?: string;
  bio?: string;
  is_active: boolean;
  is_verified: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (accessToken: string) => Promise<void>;
  signup: (email: string, fullName: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored auth on mount
  useEffect(() => {
    // Use sessionStorage ONLY for per-tab token isolation
    // This prevents cross-tab auth conflicts when logged in as different users in different tabs
    const sessionToken = sessionStorage.getItem('uruti_token');
    const storedUser = sessionStorage.getItem('uruti_user');
    
    if (sessionToken && storedUser) {
      setToken(sessionToken);
      setUser(JSON.parse(storedUser));

      const timeoutMs = 8000;
      const withTimeout = <T,>(promise: Promise<T>, ms: number) =>
        new Promise<T>((resolve, reject) => {
          const timer = window.setTimeout(() => {
            reject(new Error('Auth refresh timeout'));
          }, ms);
          promise
            .then((result) => {
              window.clearTimeout(timer);
              resolve(result);
            })
            .catch((error) => {
              window.clearTimeout(timer);
              reject(error);
            });
        });

      withTimeout(apiClient.getCurrentUser(), timeoutMs)
        .then((userData) => {
          setUser(userData);
          sessionStorage.setItem('uruti_user', JSON.stringify(userData));
        })
        .catch(() => {
          sessionStorage.removeItem('uruti_token');
          sessionStorage.removeItem('uruti_user');
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.login(email, password);
    // Store token ONLY in sessionStorage for per-tab isolation
    // sessionStorage is cleared when the tab is closed
    // This prevents any cross-tab token conflicts
    sessionStorage.setItem('uruti_token', response.access_token);

    const currentUser = await apiClient.getCurrentUser();

    setToken(response.access_token);
    setUser(currentUser);

    // Store user data in sessionStorage only (per-tab)
    sessionStorage.setItem('uruti_user', JSON.stringify(currentUser));
  };

  const loginWithToken = async (accessToken: string) => {
    sessionStorage.setItem('uruti_token', accessToken);
    const currentUser = await apiClient.getCurrentUser();
    setToken(accessToken);
    setUser(currentUser);
    sessionStorage.setItem('uruti_user', JSON.stringify(currentUser));
  };

  const signup = async (
    email: string,
    fullName: string,
    password: string,
    role: UserRole
  ) => {
    await apiClient.signup({
      email,
      full_name: fullName,
      password,
      role,
    });

    // Backend register returns user; then login for token/session using email credentials
    await login(email, password);
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      // Clear sessionStorage only (tab-specific)
      // Never clear localStorage as it would affect other tabs
      sessionStorage.removeItem('uruti_token');
      sessionStorage.removeItem('uruti_user');
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      // Update sessionStorage only (per-tab)
      sessionStorage.setItem('uruti_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        login,
        loginWithToken,
        signup,
        logout,
        updateUser,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}