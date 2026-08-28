import { create } from 'zustand';
import type { Transaction } from '../types';

interface AlertState {
  pendingCount: number;
  latestAlert: Transaction | null;
  setPendingCount: (count: number | ((prev: number) => number)) => void;
  setLatestAlert: (tx: Transaction | null) => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  pendingCount: 0,
  latestAlert: null,
  setPendingCount: (count) => set((state) => ({
    pendingCount: typeof count === 'function' ? count(state.pendingCount) : count,
  })),
  setLatestAlert: (tx) => set({ latestAlert: tx }),
}));
