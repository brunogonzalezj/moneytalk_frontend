import { create } from 'zustand';
import toast from 'react-hot-toast';
import { BudgetInput, recurringApi, RecurringPaymentInput, savingsApi } from '../api/budgets.api';
import { notifyError } from '../api/errors';
import { Budget, BudgetStatus, BudgetType, RecurringFrequency, RecurringPayment, RecurringStatus } from '../types/domain';
import { registerReset } from './reset';
import { useTransactionStore } from './transactionStore';

export type { Budget, BudgetStatus, BudgetType, RecurringFrequency, RecurringPayment, RecurringStatus };

interface BudgetState {
  budgets: Budget[];
  recurringPayments: RecurringPayment[];
  isLoadingBudgets: boolean;
  isLoadingRecurring: boolean;

  fetchBudgets: () => Promise<void>;
  addBudget: (input: BudgetInput) => Promise<void>;
  updateBudget: (id: string, changes: Partial<BudgetInput>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addToBudget: (id: string, amount: number) => Promise<void>;

  fetchRecurringPayments: () => Promise<void>;
  addRecurringPayment: (input: RecurringPaymentInput) => Promise<void>;
  updateRecurringPayment: (id: string, changes: Partial<RecurringPaymentInput>) => Promise<void>;
  deleteRecurringPayment: (id: string) => Promise<void>;

  getTotalBudgetAllocations: () => number;
  getTotalRecurringPayments: () => number;
}

const MONTHLY_FACTOR: Record<RecurringFrequency, number> = { DAILY: 30, WEEKLY: 52 / 12, MONTHLY: 1, YEARLY: 1 / 12 };

// What a recurring payment costs per month, whatever its frequency
export const toMonthlyAmount = (payment: Pick<RecurringPayment, 'amount' | 'frequency'>) =>
  payment.amount * MONTHLY_FACTOR[payment.frequency];
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

const initialState = {
  budgets: [] as Budget[],
  recurringPayments: [] as RecurringPayment[],
  isLoadingBudgets: false,
  isLoadingRecurring: false,
};

/**
 * Wraps a mutation: shows the success toast or the error, and rethrows so
 * forms can stay open on failure.
 */
const mutate = async (action: () => Promise<void>, success: string, failure: string) => {
  try {
    await action();
    toast.success(success);
  } catch (error) {
    notifyError(error, failure);
    throw error;
  }
};

export const useBudgetStore = create<BudgetState>()((set, get) => ({
  ...initialState,

  fetchBudgets: async () => {
    set({ isLoadingBudgets: true });
    try {
      set({ budgets: await savingsApi.list() });
    } catch (error) {
      notifyError(error, 'No se pudieron cargar las metas de ahorro');
    } finally {
      set({ isLoadingBudgets: false });
    }
  },

  addBudget: (input) =>
    mutate(
      async () => {
        const budget = await savingsApi.create(input);
        set((state) => ({ budgets: [budget, ...state.budgets] }));
      },
      'Meta de ahorro creada',
      'No se pudo crear la meta de ahorro'
    ),

  updateBudget: (id, changes) =>
    mutate(
      async () => {
        const budget = await savingsApi.update(id, changes);
        set((state) => ({ budgets: state.budgets.map((b) => (b.id === id ? budget : b)) }));
      },
      'Meta de ahorro actualizada',
      'No se pudo actualizar la meta de ahorro'
    ),

  deleteBudget: (id) =>
    mutate(
      async () => {
        await savingsApi.remove(id);
        set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) }));
      },
      'Meta de ahorro eliminada',
      'No se pudo eliminar la meta de ahorro'
    ),

  addToBudget: (id, amount) =>
    mutate(
      async () => {
        const budget = await savingsApi.contribute(id, amount);
        set((state) => ({ budgets: state.budgets.map((b) => (b.id === id ? budget : b)) }));
        // The contribution is recorded as an expense, so totals changed
        useTransactionStore.setState({ summaries: {} });
      },
      'Aporte registrado',
      'No se pudo registrar el aporte'
    ),

  fetchRecurringPayments: async () => {
    set({ isLoadingRecurring: true });
    try {
      set({ recurringPayments: await recurringApi.list() });
    } catch (error) {
      notifyError(error, 'No se pudieron cargar los pagos recurrentes');
    } finally {
      set({ isLoadingRecurring: false });
    }
  },

  addRecurringPayment: (input) =>
    mutate(
      async () => {
        const payment = await recurringApi.create(input);
        set((state) => ({ recurringPayments: [payment, ...state.recurringPayments] }));
      },
      'Pago recurrente creado',
      'No se pudo crear el pago recurrente'
    ),

  updateRecurringPayment: (id, changes) =>
    mutate(
      async () => {
        const payment = await recurringApi.update(id, changes);
        set((state) => ({ recurringPayments: state.recurringPayments.map((p) => (p.id === id ? payment : p)) }));
      },
      'Pago recurrente actualizado',
      'No se pudo actualizar el pago recurrente'
    ),

  deleteRecurringPayment: (id) =>
    mutate(
      async () => {
        await recurringApi.remove(id);
        set((state) => ({ recurringPayments: state.recurringPayments.filter((p) => p.id !== id) }));
      },
      'Pago recurrente eliminado',
      'No se pudo eliminar el pago recurrente'
    ),

  // Monthly amount still needed to reach every active goal by its target date
  getTotalBudgetAllocations: () =>
    get()
      .budgets.filter((b) => b.status === 'ACTIVE' && b.targetDate)
      .reduce((total, b) => {
        const monthsLeft = Math.max(1, Math.ceil((new Date(b.targetDate!).getTime() - Date.now()) / MONTH_MS));
        return total + Math.max(0, b.targetAmount - b.currentAmount) / monthsLeft;
      }, 0),

  // Active recurring payments expressed as a monthly amount
  getTotalRecurringPayments: () =>
    get()
      .recurringPayments.filter((p) => p.status === 'ACTIVE')
      .reduce((total, p) => total + toMonthlyAmount(p), 0),
}));

registerReset(() => useBudgetStore.setState(initialState));
