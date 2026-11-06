import { Category, TransactionType } from '../types/domain';
import apiClient from './client';

export const categoriesApi = {
  list: () => apiClient.get<Category[]>('/categories').then((r) => r.data),

  // Returns the existing category when one with the same name and type exists
  create: (name: string, type: TransactionType) =>
    apiClient.post<Category>('/categories', { name, type }).then((r) => r.data),
};
