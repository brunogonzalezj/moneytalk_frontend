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
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initializeTheme();
        }
      },
    }
  )
);

function updateEffectiveTheme(theme: 'light' | 'dark' | 'auto'): void {
  let effectiveTheme: 'light' | 'dark';

  if (theme === 'auto') {
    // Detectar preferencia del sistema
    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    effectiveTheme = theme;
  }

  // Actualizar el estado efectivo
  const store = useUIStore.getState();
  store.effectiveTheme = effectiveTheme;

  // Aplicar el tema al documento
  const html = document.documentElement;
  if (effectiveTheme === 'dark') {
    html.setAttribute('data-theme', 'dark');
    html.classList.add('dark');
  } else {
    html.setAttribute('data-theme', 'moneytalk');
    html.classList.remove('dark');
  }
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