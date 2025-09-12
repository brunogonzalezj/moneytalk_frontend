import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../utils/apiClient';
import { useAuthStore } from './authStore';

export interface AIRecommendation {
  id: number;
  title: string;
  description: string;
  type: 'warning' | 'success' | 'info';
}

interface AIState {
  recommendations: AIRecommendation[];
  lastFetched: number | null;
  isLoading: boolean;
  error: string | null;
  fetchRecommendations: (forceRefresh?: boolean) => Promise<void>;
  clearRecommendations: () => void;
  shouldFetchRecommendations: () => boolean;
}

// Cache duration: 2 hours in milliseconds
const CACHE_DURATION = 2 * 60 * 60 * 1000;

// Mock recommendations as fallback
const mockRecommendations: AIRecommendation[] = [
  {
    id: 1,
    title: "Optimizar Gastos de Entretenimiento",
    description: "Tus gastos en entretenimiento representan el 25% de tus gastos mensuales. Considera establecer un límite del 15% para mejorar tus ahorros.",
    type: "warning"
  },
  {
    id: 2,
    title: "Oportunidad de Inversión",
    description: "Con tu balance positivo actual, podrías considerar invertir el 20% de tus ingresos mensuales en un fondo de inversión de bajo riesgo.",
    type: "success"
  },
  {
    id: 3,
    title: "Presupuesto de Alimentación",
    description: "Tus gastos en alimentación están por debajo del promedio. ¡Buen trabajo! Mantén este patrón de consumo responsable.",
    type: "info"
  }
];

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      recommendations: [],
      lastFetched: null,
      isLoading: false,
      error: null,

      shouldFetchRecommendations: () => {
        const { lastFetched } = get();
        if (!lastFetched) return true;
        
        const now = Date.now();
        const timeSinceLastFetch = now - lastFetched;
        
        return timeSinceLastFetch >= CACHE_DURATION;
      },

      fetchRecommendations: async (forceRefresh = false) => {
        const { shouldFetchRecommendations, recommendations } = get();
        
        // If we have cached data and it's still valid, don't fetch
        if (!forceRefresh && !shouldFetchRecommendations() && recommendations.length > 0) {
          console.log('Using cached AI recommendations');
          return;
        }

        // If already loading, don't start another request
        if (get().isLoading) {
          return;
        }

        try {
          set({ isLoading: true, error: null });
          
          const user = useAuthStore.getState().user;
          if (!user) {
            throw new Error('Usuario no autenticado');
          }

          console.log('Fetching fresh AI recommendations...');
          
          const response = await apiClient.post('/ai/recommendations', {
            userId: parseInt(user.id)
          });

          let fetchedRecommendations: AIRecommendation[] = [];

          if (response.data && response.data.recommendations && Array.isArray(response.data.recommendations)) {
            fetchedRecommendations = response.data.recommendations.map((rec: any, index: number) => ({
              id: rec.id || index + 1,
              title: rec.title || 'Recomendación',
              description: rec.description || 'Sin descripción disponible',
              type: ['warning', 'success', 'info'].includes(rec.type) ? rec.type : 'info'
            }));
          }

          // If no valid recommendations from API, use mock data
          if (fetchedRecommendations.length === 0) {
            fetchedRecommendations = mockRecommendations;
          }

          set({
            recommendations: fetchedRecommendations,
            lastFetched: Date.now(),
            isLoading: false,
            error: null
          });

          console.log('AI recommendations updated successfully');

        } catch (error) {
          console.error('Error fetching AI recommendations:', error);
          
          // Use mock data as fallback
          set({
            recommendations: mockRecommendations,
            lastFetched: Date.now(),
            isLoading: false,
            error: null // Don't show error to user, just use fallback
          });
        }
      },

      clearRecommendations: () => {
        set({
          recommendations: [],
          lastFetched: null,
          error: null
        });
      }
    }),
    {
      name: 'ai-recommendations-storage',
      partialize: (state) => ({
        recommendations: state.recommendations,
        lastFetched: state.lastFetched
      })
    }
  )
);