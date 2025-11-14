import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../utils/apiClient';
import toast from 'react-hot-toast';
import { useAuthStore } from './authStore';

export type BudgetType = 'SAVINGS_GOAL' | 'PURCHASE_GOAL' | 'EMERGENCY_FUND' | 'VACATION' | 'OTHER';
export type BudgetStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';

export interface Budget {
  id: string;
  name: string;
  description?: string;
  type: BudgetType;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  status: BudgetStatus;
  createdAt: string;
  updatedAt: string;
}

export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type RecurringStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export interface RecurringPayment {
  id: string;
  name: string;
  description?: string;
  amount: number;
  frequency: RecurringFrequency;
  nextPaymentDate: string;
  lastPaymentDate?: string;
  categoryId: number;
  category: string;
  status: RecurringStatus;
  createdAt: string;
  updatedAt: string;
}

interface BudgetState {
  budgets: Budget[];
  recurringPayments: RecurringPayment[];
  isLoading: boolean;
  
  // Budget methods
  fetchBudgets: () => Promise<void>;
  addBudget: (data: Omit<Budget, 'id' | 'currentAmount' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBudget: (id: string, data: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addToBudget: (id: string, amount: number) => Promise<void>;
  
  // Recurring payment methods
  fetchRecurringPayments: () => Promise<void>;
  addRecurringPayment: (data: Omit<RecurringPayment, 'id' | 'lastPaymentDate' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRecurringPayment: (id: string, data: Partial<RecurringPayment>) => Promise<void>;
  deleteRecurringPayment: (id: string) => Promise<void>;
  
  // Utility methods
  getTotalBudgetAllocations: () => number;
  getTotalRecurringPayments: () => number;
  getAvailableBalance: (totalIncome: number, totalExpenses: number) => number;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      budgets: [],
      recurringPayments: [],
      isLoading: false,

      fetchBudgets: async () => {
        try {
          set({ isLoading: true });
          
          const user = useAuthStore.getState().user;
          if (!user) {
            set({ isLoading: false });
            return;
          }
          
          const response = await apiClient.get('/budgets');
          
          const mappedBudgets = response.data.map((b: any) => ({
            id: String(b.id),
            name: b.name,
            description: b.description,
            type: b.type as BudgetType,
            targetAmount: Number(b.targetAmount),
            currentAmount: Number(b.currentAmount || 0),
            targetDate: b.targetDate,
            status: b.status as BudgetStatus,
            createdAt: b.createdAt,
            updatedAt: b.updatedAt,
          }));
          
          set({ budgets: mappedBudgets, isLoading: false });
        } catch (error) {
          console.error('Error fetching budgets:', error);
          set({ isLoading: false });
          toast.error('Error al cargar presupuestos');
        }
      },

      addBudget: async (data) => {
        try {
          const user = useAuthStore.getState().user;
          if (!user) throw new Error('Usuario no autenticado');
          
          const response = await apiClient.post('/budgets', {
            ...data,
            userId: parseInt(user.id),
            currentAmount: 0,
          });
          
          const newBudget = {
            id: String(response.data.id),
            name: response.data.name,
            description: response.data.description,
            type: response.data.type as BudgetType,
            targetAmount: Number(response.data.targetAmount),
            currentAmount: Number(response.data.currentAmount || 0),
            targetDate: response.data.targetDate,
            status: response.data.status as BudgetStatus,
            createdAt: response.data.createdAt,
            updatedAt: response.data.updatedAt,
          };
          
          set(state => ({
            budgets: [newBudget, ...state.budgets],
          }));
          
          toast.success('Presupuesto creado exitosamente');
        } catch (error) {
          console.error('Error adding budget:', error);
          toast.error('Error al crear presupuesto');
        }
      },

      updateBudget: async (id, data) => {
        try {
          await apiClient.put(`/budgets/${id}`, data);
          
          set(state => ({
            budgets: state.budgets.map(b => 
              b.id === id ? { ...b, ...data } : b
            ),
          }));
          
          toast.success('Presupuesto actualizado');
        } catch (error) {
          console.error('Error updating budget:', error);
          toast.error('Error al actualizar presupuesto');
        }
      },

      deleteBudget: async (id) => {
        try {
          await apiClient.delete(`/budgets/${id}`);
          
          set(state => ({
            budgets: state.budgets.filter(b => b.id !== id),
          }));
          
          toast.success('Presupuesto eliminado');
        } catch (error) {
          console.error('Error deleting budget:', error);
          toast.error('Error al eliminar presupuesto');
        }
      },

      addToBudget: async (id, amount) => {
        try {
          await apiClient.post(`/budgets/${id}/add`, { amount });
          
          set(state => ({
            budgets: state.budgets.map(b => 
              b.id === id ? { ...b, currentAmount: b.currentAmount + amount } : b
            ),
          }));
          
          toast.success('Monto agregado al presupuesto');
        } catch (error) {
          console.error('Error adding to budget:', error);
          toast.error('Error al agregar al presupuesto');
        }
      },

      fetchRecurringPayments: async () => {
        try {
          set({ isLoading: true });

          const user = useAuthStore.getState().user;
          if (!user) {
            set({ isLoading: false });
            return;
          }

          const response = await apiClient.get('/recurring-payments');
          console.log('🔍 Raw API Response:', response.data);

          const data = Array.isArray(response.data) ? response.data : [];

          const mappedPayments = data.map((p: any) => {
            console.log('🔍 Processing payment:', p);

            const statusMap: Record<string, RecurringStatus> = {
              'true': 'ACTIVE',
              'false': 'PAUSED',
              'ACTIVE': 'ACTIVE',
              'PAUSED': 'PAUSED',
              'CANCELLED': 'CANCELLED'
            };

            const mappedStatus = p.isActive !== undefined
              ? (p.isActive ? 'ACTIVE' : 'PAUSED')
              : statusMap[String(p.status)] || 'ACTIVE';

            const mapped = {
              id: String(p.id),
              name: p.name || '',
              description: p.description || '',
              amount: Number(p.amount),
              frequency: p.frequency as RecurringFrequency,
              nextPaymentDate: p.nextDate || p.nextPaymentDate || p.startDate || new Date().toISOString(),
              lastPaymentDate: p.lastPaymentDate || null,
              categoryId: p.categoryId,
              category: p.category?.name || 'Sin categoría',
              status: mappedStatus as RecurringStatus,
              createdAt: p.createdAt || new Date().toISOString(),
              updatedAt: p.updatedAt || new Date().toISOString(),
            };

            console.log('✅ Mapped payment:', mapped);
            return mapped;
          });

          console.log('✅ Final mapped payments:', mappedPayments);
          set({ recurringPayments: mappedPayments, isLoading: false });
        } catch (error) {
          console.error('Error fetching recurring payments:', error);
          set({ isLoading: false });
          toast.error('Error al cargar pagos recurrentes');
        }
      },

      addRecurringPayment: async (data) => {
        try {
          const user = useAuthStore.getState().user;
          if (!user) throw new Error('Usuario no autenticado');

          const response = await apiClient.post('/recurring-payments', {
            ...data,
            userId: parseInt(user.id),
          });

          const p = response.data;
          const newPayment = {
            id: String(p.id),
            name: p.name || data.name,
            description: p.description || data.description || '',
            amount: Number(p.amount),
            frequency: p.frequency as RecurringFrequency,
            nextPaymentDate: p.nextDate || p.nextPaymentDate || p.startDate || data.startDate,
            lastPaymentDate: p.lastPaymentDate,
            categoryId: p.categoryId || data.categoryId,
            category: p.category?.name || data.category || 'Sin categoría',
            status: (p.isActive !== undefined
              ? (p.isActive ? 'ACTIVE' : 'PAUSED')
              : p.status || data.status || 'ACTIVE') as RecurringStatus,
            createdAt: p.createdAt || new Date().toISOString(),
            updatedAt: p.updatedAt || new Date().toISOString(),
          };

          set(state => ({
            recurringPayments: [newPayment, ...state.recurringPayments],
          }));

          toast.success('Pago recurrente creado exitosamente');
        } catch (error) {
          console.error('Error adding recurring payment:', error);
          toast.error('Error al crear pago recurrente');
        }
      },

      updateRecurringPayment: async (id, data) => {
        try {
          await apiClient.put(`/recurring-payments/${id}`, data);
          
          set(state => ({
            recurringPayments: state.recurringPayments.map(p => 
              p.id === id ? { ...p, ...data } : p
            ),
          }));
          
          toast.success('Pago recurrente actualizado');
        } catch (error) {
          console.error('Error updating recurring payment:', error);
          toast.error('Error al actualizar pago recurrente');
        }
      },

      deleteRecurringPayment: async (id) => {
        try {
          await apiClient.delete(`/recurring-payments/${id}`);
          
          set(state => ({
            recurringPayments: state.recurringPayments.filter(p => p.id !== id),
          }));
          
          toast.success('Pago recurrente eliminado');
        } catch (error) {
          console.error('Error deleting recurring payment:', error);
          toast.error('Error al eliminar pago recurrente');
        }
      },

      getTotalBudgetAllocations: () => {
        return get().budgets
          .filter(b => b.status === 'ACTIVE')
          .reduce((total, budget) => {
            // Calculate monthly allocation based on target date
            if (budget.targetDate) {
              const now = new Date();
              const target = new Date(budget.targetDate);
              const monthsLeft = Math.max(1, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
              const remaining = budget.targetAmount - budget.currentAmount;
              return total + (remaining / monthsLeft);
            }
            return total;
          }, 0);
      },

      getTotalRecurringPayments: () => {
        return get().recurringPayments
          .filter(p => p.status === 'ACTIVE')
          .reduce((total, payment) => {
            // Convert to monthly amount
            switch (payment.frequency) {
              case 'DAILY':
                return total + (payment.amount * 30);
              case 'WEEKLY':
                return total + (payment.amount * 4.33);
              case 'MONTHLY':
                return total + payment.amount;
              case 'YEARLY':
                return total + (payment.amount / 12);
              default:
                return total;
            }
          }, 0);
      },

      getAvailableBalance: (totalIncome, totalExpenses) => {
        const budgetAllocations = get().getTotalBudgetAllocations();
        const recurringPayments = get().getTotalRecurringPayments();
        return totalIncome - totalExpenses - budgetAllocations - recurringPayments;
      },
    }),
    {
      name: 'budget-storage',
      partialize: (state) => ({
        budgets: state.budgets,
        recurringPayments: state.recurringPayments,
      }),
    }
  )
);