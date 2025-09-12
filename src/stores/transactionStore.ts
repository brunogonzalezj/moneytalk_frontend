import { create } from 'zustand';
import { format } from 'date-fns';
import apiClient from '../utils/apiClient';
import toast from 'react-hot-toast';
import { useAuthStore } from './authStore';

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  categoryId?: number;
  type: TransactionType;
  date: string;
  createdAt: string;
}

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  totalPages: number;
  currentPage: number;
  outboxTransactions: Transaction[];
  fetchTransactions: (page?: number, filters?: Record<string, void>) => Promise<void>;
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  syncOutboxTransactions: () => Promise<void>;
  getTodaysSummary: () => { income: number; expense: number; net: number };
  getWeeklyData: () => { labels: string[]; income: number[]; expense: number[] };
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,
  totalPages: 1,
  currentPage: 1,
  outboxTransactions: [],

  fetchTransactions: async (page = 1, filters: Record<string, any> = {}) => {
    try {
      set({ isLoading: true });
      
      // Obtener userId del store de auth
      const user = useAuthStore.getState().user;
      const token = useAuthStore.getState().token;
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }
      
      if (!token) {
        throw new Error('Token no disponible');
      }
      
      console.log('Fetching transactions for user:', user.id);
      
      const response = await apiClient.get('/transactions', {
        params: {
          page,
          limit: 10,
          userId: user.id,
          ...filters,
        },
      });
      
      console.log('Transactions response:', response.data);
      
      // Mapear la respuesta del backend al formato esperado por el frontend
      const mappedTransactions = response.data.transactions.map((t: any) => ({
        id: String(t.id),
        amount: Number(t.amount),
        description: t.description,
        category: t.category,
        categoryId: t.categoryId,
        type: t.type as TransactionType,
        date: t.date,
        createdAt: t.createdAt,
      }));
      
      set({
        transactions: mappedTransactions,
        totalPages: response.data.pagination.totalPages,
        currentPage: page,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      
      // Si es error 401, hacer logout
      if ((error as any)?.response?.status === 401) {
        console.log('Token inválido, haciendo logout...');
        useAuthStore.getState().logout();
        return;
      }
      
      const errorMessage = (error as any)?.response?.data?.error || 'Error al cargar transacciones';
      toast.error(errorMessage);
      set({ isLoading: false });
    }
  },

  addTransaction: async (data) => {
    try {
      // Obtener userId del store de auth
      const user = useAuthStore.getState().user;
      if (!user) {
        throw new Error('Usuario no autenticado');
      }
      
      // Crear transacción temporal para UI optimista
      const tempId = `temp-${Date.now()}`;
      const tempTransaction = {
        ...data,
        id: tempId,
        createdAt: new Date().toISOString(),
      };
      
      // Actualización optimista
      set(state => ({
        transactions: [tempTransaction, ...state.transactions],
      }));
      
      // Llamada real al backend
      const response = await apiClient.post('/transactions', {
        ...data,
        userId: parseInt(user.id), // Asegurar que sea number
        categoryId: typeof data.category === 'string' ? parseInt(data.category) : data.category,
      });
      
      // Actualizar con datos reales del API
      set(state => ({
        transactions: state.transactions.map(t => 
          t.id === tempId ? {
            id: String(response.data.id),
            amount: Number(response.data.amount),
            description: response.data.description,
            category: response.data.category?.name || data.category,
            categoryId: response.data.categoryId,
            type: response.data.category?.type || data.type,
            date: response.data.date,
            createdAt: response.data.createdAt,
          } : t
        ),
      }));
      
      toast.success('Transaction added successfully');
    } catch (error) {
      console.error('Error adding transaction:', error);
      
      // If offline, store in outbox
      if (!navigator.onLine) {
        const offlineTransaction = {
          ...data,
          id: `offline-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        
        set(state => ({
          // Remover transacción temporal
          transactions: state.transactions.filter(t => !t.id.startsWith('temp-')),
          outboxTransactions: [...state.outboxTransactions, offlineTransaction],
        }));
        
        toast.success('Transaction saved offline');
      } else {
        // Remove optimistic update
        set(state => ({
          transactions: state.transactions.filter(t => !t.id.startsWith('temp-')),
        }));
        
        toast.error('Failed to add transaction');
      }
    }
  },

  updateTransaction: async (id, data) => {
    try {
      // Optimistic update
      set(state => ({
        transactions: state.transactions.map(t => 
          t.id === id ? { ...t, ...data } : t
        ),
      }));
      
      // Llamada real al backend
      await apiClient.put(`/transactions/${id}`, data);
      
      toast.success('Transaction updated successfully');
    } catch (error) {
      console.error('Error updating transaction:', error);
      
      // Revert optimistic update
      get().fetchTransactions(get().currentPage);
      
      toast.error('Failed to update transaction');
    }
  },

  deleteTransaction: async (id) => {
    try {
      // Optimistic delete
      set(state => ({
        transactions: state.transactions.filter(t => t.id !== id),
      }));
      
      // Llamada real al backend
      await apiClient.delete(`/transactions/${id}`);
      
      toast.success('Transaction deleted successfully');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      
      // Revert optimistic delete
      get().fetchTransactions(get().currentPage);
      
      toast.error('Failed to delete transaction');
    }
  },

  syncOutboxTransactions: async () => {
    const { outboxTransactions } = get();
    if (outboxTransactions.length === 0) return;
    
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    const failedTransactions: Transaction[] = [];
    
    for (const transaction of outboxTransactions) {
      try {
        const { id, createdAt, ...data } = transaction;
        await apiClient.post('/transactions', {
          ...data,
          userId: parseInt(user.id),
        });
      } catch (error) {
        console.error('Error syncing transaction:', error);
        failedTransactions.push(transaction);
      }
    }
    
    set({ outboxTransactions: failedTransactions });
    
    if (failedTransactions.length === 0) {
      toast.success('All offline transactions synced');
      get().fetchTransactions(1);
    } else {
      toast.error(`Failed to sync ${failedTransactions.length} transactions`);
    }
  },

  getTodaysSummary: () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todaysTransactions = get().transactions.filter(
      t => t.date.startsWith(today)
    );
    
    const income = todaysTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expense = todaysTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
      
    return {
      income,
      expense,
      net: income - expense,
    };
  },

  getWeeklyData: () => {
    // Generate last 7 days dates
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return format(date, 'yyyy-MM-dd');
    });
    
    // Initialize data arrays
    const income = Array(7).fill(0);
    const expense = Array(7).fill(0);
    
    // Fill with transaction data
    get().transactions.forEach(transaction => {
      const dateIndex = dates.findIndex(d => transaction.date.startsWith(d));
      if (dateIndex !== -1) {
        if (transaction.type === 'INCOME') {
          income[dateIndex] += transaction.amount;
        } else {
          expense[dateIndex] += transaction.amount;
        }
      }
    });
    
    return {
      labels: dates.map(d => format(new Date(d), 'MMM d')),
      income,
      expense,
    };
  },
}));