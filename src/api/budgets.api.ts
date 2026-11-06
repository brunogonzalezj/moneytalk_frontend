import { Budget, BudgetStatus, BudgetType, RecurringFrequency, RecurringPayment } from '../types/domain';
import apiClient from './client';

export interface BudgetInput {
  name: string;
  description?: string;
  type: BudgetType;
  targetAmount: number;
  targetDate?: string;
  status?: BudgetStatus;
}

export interface RecurringPaymentInput {
  name: string;
  description?: string;
  amount: number;
  frequency: RecurringFrequency;
  startDate: string; // YYYY-MM-DD
  categoryId: number;
  isActive?: boolean;
}

interface ApiRecurringPayment {
  id: number;
  name: string;
  description: string;
  amount: number;
  frequency: RecurringFrequency;
  startDate: string;
  nextDate: string;
  endDate: string | null;
  isActive: boolean;
  categoryId: number;
  category: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
}

const toRecurringPayment = (p: ApiRecurringPayment): RecurringPayment => ({
  id: String(p.id),
  name: p.name,
  description: p.description,
  amount: p.amount,
  frequency: p.frequency,
  startDate: p.startDate,
  nextPaymentDate: p.nextDate,
  endDate: p.endDate,
  categoryId: p.categoryId,
  category: p.category.name,
  status: p.isActive ? 'ACTIVE' : 'PAUSED',
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

export const savingsApi = {
  list: () => apiClient.get<{ savingsGoals: Budget[] }>('/savings-goals').then((r) => r.data.savingsGoals),
  create: (input: BudgetInput) => apiClient.post<Budget>('/savings-goals', input).then((r) => r.data),
  update: (id: string, changes: Partial<BudgetInput>) =>
    apiClient.put<Budget>(`/savings-goals/${id}`, changes).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/savings-goals/${id}`),
  contribute: (id: string, amount: number) =>
    apiClient.post<{ goal: Budget }>(`/savings-goals/${id}/add`, { amount }).then((r) => r.data.goal),
};

export const recurringApi = {
  list: () =>
    apiClient
      .get<{ recurringPayments: ApiRecurringPayment[] }>('/recurring-payments')
      .then((r) => r.data.recurringPayments.map(toRecurringPayment)),
  create: (input: RecurringPaymentInput) =>
    apiClient.post<ApiRecurringPayment>('/recurring-payments', input).then((r) => toRecurringPayment(r.data)),
  update: (id: string, changes: Partial<RecurringPaymentInput>) =>
    apiClient.put<ApiRecurringPayment>(`/recurring-payments/${id}`, changes).then((r) => toRecurringPayment(r.data)),
  remove: (id: string) => apiClient.delete(`/recurring-payments/${id}`),
};
