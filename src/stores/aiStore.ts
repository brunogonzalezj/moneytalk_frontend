import { create } from 'zustand';
import { aiApi } from '../api/ai.api';
import { getErrorMessage } from '../api/errors';
import { AIRecommendation } from '../types/domain';
import { registerReset } from './reset';

export type { AIRecommendation };

// The server caches for 24 h; this only avoids refetching while navigating
const CACHE_MS = 30 * 60 * 1000;

interface AIState {
  recommendations: AIRecommendation[];
  lastFetched: number | null;
  isLoading: boolean;
  error: string | null;
  fetchRecommendations: (forceRefresh?: boolean) => Promise<void>;
}

const initialState = { recommendations: [] as AIRecommendation[], lastFetched: null, isLoading: false, error: null };

export const useAIStore = create<AIState>()((set, get) => ({
  ...initialState,

  fetchRecommendations: async (forceRefresh = false) => {
    const { lastFetched, isLoading } = get();
    if (isLoading) return;
    if (!forceRefresh && lastFetched && Date.now() - lastFetched < CACHE_MS) return;

    set({ isLoading: true, error: null });
    try {
      const { recommendations } = await aiApi.recommendations(forceRefresh);
      set({ recommendations, lastFetched: Date.now() });
    } catch (error) {
      // Shown as an error state with a retry button, never as made-up advice
      set({ error: getErrorMessage(error, 'No se pudieron generar las recomendaciones') });
    } finally {
      set({ isLoading: false });
    }
  },
}));

registerReset(() => useAIStore.setState(initialState));
