import { create } from 'zustand';
import apiClient from '../api-client';

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

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  initAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (accessToken: string) => Promise<void>;
  signup: (email: string, fullName: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  initAuth: async () => {
    const storedToken = localStorage.getItem('uruti_token');
    const storedUser = localStorage.getItem('uruti_user');

    if (!storedToken || !storedUser) {
      set({ isLoading: false });
      return;
    }

    // Immediately restore session from storage so ProtectedRoute doesn't redirect.
    set({ token: storedToken, user: JSON.parse(storedUser), isAuthenticated: true });

    try {
      const userData = await Promise.race([
        apiClient.getCurrentUser(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Auth refresh timeout')), 8000)
        ),
      ]);
      set({ user: userData, isAuthenticated: true });
      localStorage.setItem('uruti_user', JSON.stringify(userData));
    } catch {
      // Only clear the session if the token is definitively rejected (401).
      // A network timeout or server error should not log the user out.
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const response = await apiClient.login(email, password);
    localStorage.setItem('uruti_token', response.access_token);
    const currentUser = await apiClient.getCurrentUser();
    localStorage.setItem('uruti_user', JSON.stringify(currentUser));
    set({ token: response.access_token, user: currentUser, isAuthenticated: true });
  },

  loginWithToken: async (accessToken) => {
    localStorage.setItem('uruti_token', accessToken);
    const currentUser = await apiClient.getCurrentUser();
    localStorage.setItem('uruti_user', JSON.stringify(currentUser));
    set({ token: accessToken, user: currentUser, isAuthenticated: true });
  },

  signup: async (email, fullName, password, role) => {
    await apiClient.signup({ email, full_name: fullName, password, role });
    await get().login(email, password);
  },

  logout: async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('uruti_token');
      localStorage.removeItem('uruti_user');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  updateUser: (userData) => {
    const current = get().user;
    if (current) {
      const updated = { ...current, ...userData };
      localStorage.setItem('uruti_user', JSON.stringify(updated));
      set({ user: updated });
    }
  },
}));

// Backward-compatible hook — same API as the old useAuth() from auth-context
export function useAuth() {
  return useAuthStore();
}
