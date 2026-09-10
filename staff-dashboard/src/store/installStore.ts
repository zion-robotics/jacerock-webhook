import { create } from 'zustand';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallState {
  prompt: BeforeInstallPromptEvent | null;
  installed: boolean;
  setPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  setInstalled: (installed: boolean) => void;
}

export const useInstallStore = create<InstallState>((set) => ({
  prompt: null,
  installed: false,
  setPrompt: (prompt) => set({ prompt }),
  setInstalled: (installed) => set({ installed }),
}));

// Register once, at module load — survives page navigations and dismissals
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    useInstallStore.getState().setPrompt(e as BeforeInstallPromptEvent);
  });
  window.addEventListener('appinstalled', () => {
    useInstallStore.getState().setInstalled(true);
    useInstallStore.getState().setPrompt(null);
  });
}
