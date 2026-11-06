import { AIRecommendation, CategorizeResult } from '../types/domain';
import apiClient from './client';

export const aiApi = {
  categorize: (text: string) =>
    apiClient.post<CategorizeResult>('/gpt/categorize', { text }, { timeout: 45_000 }).then((r) => r.data),

  recommendations: (forceRefresh = false) =>
    apiClient
      .post<{ recommendations: AIRecommendation[]; generatedAt: string; cached?: boolean }>(
        '/ai/recommendations',
        { forceRefresh },
        { timeout: 60_000 }
      )
      .then((r) => r.data),
};
