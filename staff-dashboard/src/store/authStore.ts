import { create } from 'zustand';
import type { StaffUser } from '../types';

interface AuthState {
  user: StaffUser | null;
  session: unknown | null;
  setUser: (user: StaffUser | null) => void;
  setSession: (session: unknown) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  logout: () => set({ user: null, session: null }),
}));
