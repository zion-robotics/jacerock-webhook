import { create } from 'zustand';
import { Transaction } from '../types';

interface AlertState {
  pendingCount: number;
  latestAlert: Transaction | null;
  setPendingCount: (count: number) => void;
  setLatestAlert: (tx: Transaction | null) => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  pendingCount: 0,
  latestAlert: null,
  setPendingCount: (count) => set({ pendingCount: count }),
  setLatestAlert: (tx) => set({ latestAlert: tx }),
}));
