import { Pagination, Summary, SummaryGroupBy, Transaction, TransactionFilters, TransactionType } from '../types/domain';
import apiClient from './client';

export interface TransactionInput {
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  categoryId: number;
  type?: TransactionType;
}

export type ExportFormat = 'csv' | 'xlsx';

export const transactionsApi = {
  list: (page: number, limit: number, filters: TransactionFilters = {}) =>
    apiClient
      .get<{ transactions: Transaction[]; pagination: Pagination }>('/transactions', {
        params: { page, limit, ...filters },
      })
      .then((r) => r.data),

  // Without `from` the totals cover the user's whole history
  summary: (from: string | undefined, to: string, groupBy: SummaryGroupBy) =>
    apiClient.get<Summary>('/transactions/summary', { params: { from, to, groupBy } }).then((r) => r.data),

  create: (input: TransactionInput) => apiClient.post<Transaction>('/transactions', input).then((r) => r.data),

  update: (id: string, changes: Partial<TransactionInput>) =>
    apiClient.put<Transaction>(`/transactions/${id}`, changes).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/transactions/${id}`),

  export: (format: ExportFormat, dateFrom?: string, dateTo?: string) =>
    apiClient.get<Blob>('/transactions/export', {
      params: { format: format.toUpperCase(), dateFrom: dateFrom || undefined, dateTo: dateTo || undefined },
      responseType: 'blob',
    }),
};
