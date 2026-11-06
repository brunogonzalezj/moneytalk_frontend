import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  enableVoiceHints: boolean;
  setEnableVoiceHints: (enabled: boolean) => void;
  theme: 'light' | 'dark' | 'auto';
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  effectiveTheme: 'light' | 'dark';
  initializeTheme: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      isSidebarOpen: window.innerWidth >= 768, // Default open on desktop, closed on mobile
      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

      enableVoiceHints: true,
      setEnableVoiceHints: (enabled) => set({ enableVoiceHints: enabled }),

      theme: 'auto',
      setTheme: (theme) => {
        set({ theme });
        updateEffectiveTheme(theme);
      },

      effectiveTheme: 'light',
      initializeTheme: () => {
        const { theme } = get();
        updateEffectiveTheme(theme);
      },
    }),
    {
      name: 'ui-storage',
      // effectiveTheme is derived from theme, so it is not persisted
      partialize: ({ isSidebarOpen, enableVoiceHints, theme }) => ({ isSidebarOpen, enableVoiceHints, theme }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initializeTheme();
        }
      },
    }
  )
);

const resolveTheme = (theme: 'light' | 'dark' | 'auto'): 'light' | 'dark' =>
  theme === 'auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;

// Applies the theme to the document and stores the result through set() so subscribers re-render
function updateEffectiveTheme(theme: 'light' | 'dark' | 'auto'): void {
  const effectiveTheme = resolveTheme(theme);
  useUIStore.setState({ effectiveTheme });

  const html = document.documentElement;
  html.setAttribute('data-theme', effectiveTheme === 'dark' ? 'dark' : 'moneytalk');
  html.classList.toggle('dark', effectiveTheme === 'dark');
}

// Escuchar cambios en la preferencia del sistema
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    const { theme } = useUIStore.getState();
    if (theme === 'auto') {
      updateEffectiveTheme('auto');
    }
  });
}