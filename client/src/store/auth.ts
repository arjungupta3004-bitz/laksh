import { create } from 'zustand';
import { authApi } from '../services/api';

interface Student {
  id: string;
  name: string;
  email: string;
  board: string;
  grade: number;
  examDate?: string;
  onboarded: boolean;
}

interface AuthState {
  student: Student | null;
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  setStudent: (student: Student) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  student: null,
  loading: true,
  error: null,

  login: async (email, password) => {
    set({ error: null });
    try {
      const { data } = await authApi.login({ email, password });
      localStorage.setItem('laksh_token', data.accessToken);
      localStorage.setItem('laksh_refresh', data.refreshToken);
      set({ student: data.student, loading: false });
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Login failed';
      set({ error: msg });
      throw new Error(msg);
    }
  },

  signup: async (name, email, password) => {
    set({ error: null });
    try {
      const { data } = await authApi.signup({ name, email, password });
      localStorage.setItem('laksh_token', data.accessToken);
      localStorage.setItem('laksh_refresh', data.refreshToken);
      set({ student: data.student, loading: false });
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Signup failed';
      set({ error: msg });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('laksh_token');
    localStorage.removeItem('laksh_refresh');
    set({ student: null, loading: false });
  },

  fetchMe: async () => {
    const token = localStorage.getItem('laksh_token');
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const { data } = await authApi.me();
      set({ student: data.student, loading: false });
    } catch {
      localStorage.removeItem('laksh_token');
      localStorage.removeItem('laksh_refresh');
      set({ student: null, loading: false });
    }
  },

  setStudent: (student) => set({ student }),
  clearError: () => set({ error: null }),
}));
