import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  enableVoiceHints: boolean;
  setEnableVoiceHints: (enabled: boolean) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarOpen: window.innerWidth >= 768, // Default open on desktop, closed on mobile
      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      
      enableVoiceHints: true,
      setEnableVoiceHints: (enabled) => set({ enableVoiceHints: enabled }),
      
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-storage',
    }
  )
);