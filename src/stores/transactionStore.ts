import { create } from 'zustand';
import { format } from 'date-fns';
import apiClient from '../utils/apiClient';
import toast from 'react-hot-toast';

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
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
  fetchTransactions: (page?: number, filters?: Record<string, any>) => Promise<void>;
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

  fetchTransactions: async (page = 1, filters = {}) => {
    try {
      set({ isLoading: true });
      
      // In a real app, this would fetch from your API with pagination
      const response = await apiClient.get('/transactions', {
        params: {
          page,
          ...filters,
        },
      });
      
      set({
        transactions: response.data.transactions,
        totalPages: response.data.pagination.totalPages,
        currentPage: page,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
      set({ isLoading: false });
    }
  },

  addTransaction: async (data) => {
    try {
      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const newTransaction = {
        ...data,
        id: tempId,
        createdAt: new Date().toISOString(),
      };
      
      set(state => ({
        transactions: [newTransaction, ...state.transactions],
      }));
      
      // In a real app, this would add to your API
      const response = await apiClient.post('/transactions', data);
      
      // Update with real data from API
      set(state => ({
        transactions: state.transactions.map(t => 
          t.id === tempId ? response.data : t
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
      
      // In a real app, this would update in your API
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
      
      // In a real app, this would delete from your API
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
    
    const failedTransactions: Transaction[] = [];
    
    for (const transaction of outboxTransactions) {
      try {
        const { id, createdAt, ...data } = transaction;
        await apiClient.post('/transactions', data);
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
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expense = todaysTransactions
      .filter(t => t.type === 'expense')
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
        if (transaction.type === 'income') {
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