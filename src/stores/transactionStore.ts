import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { notifyError } from '../api/errors';
import { ExportFormat, TransactionInput, transactionsApi } from '../api/transactions.api';
import {
  Pagination,
  Summary,
  SummaryGroupBy,
  Transaction,
  TransactionFilters,
  TransactionType,
} from '../types/domain';
import { registerReset } from './reset';

export type { Transaction, TransactionType };

export const PAGE_SIZE = 10;

// A transaction created offline, waiting to be sent
export interface PendingTransaction extends TransactionInput {
  localId: string;
  categoryName: string;
  type: TransactionType;
}

interface ExportParams {
  fromDate: string;
  toDate: string;
  format: ExportFormat;
}

interface TransactionState {
  // Paginated list for the Transactions page
  transactions: Transaction[];
  pagination: Pagination;
  filters: TransactionFilters;
  isLoading: boolean;
  // Latest transactions for the Dashboard
  recent: Transaction[];
  // Aggregates keyed by "from|to|groupBy"; cleared whenever data changes
  summaries: Record<string, Summary>;
  outboxTransactions: PendingTransaction[];

  fetchTransactions: (page?: number, filters?: TransactionFilters) => Promise<void>;
  fetchRecent: (limit?: number) => Promise<void>;
  fetchSummary: (from: string | undefined, to: string, groupBy?: SummaryGroupBy) => Promise<Summary | null>;
  addTransaction: (input: TransactionInput & { categoryName: string; type: TransactionType }) => Promise<'saved' | 'queued'>;
  updateTransaction: (id: string, changes: Partial<TransactionInput>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  syncOutboxTransactions: () => Promise<void>;
  exportTransactions: (params: ExportParams) => Promise<void>;
}

export const summaryKey = (from: string | undefined, to: string, groupBy: SummaryGroupBy) =>
  `${from ?? 'inicio'}|${to}|${groupBy}`;

const emptyPagination: Pagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

const initialState = {
  transactions: [] as Transaction[],
  pagination: emptyPagination,
  filters: {} as TransactionFilters,
  isLoading: false,
  recent: [] as Transaction[],
  summaries: {} as Record<string, Summary>,
  outboxTransactions: [] as PendingTransaction[],
};

const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => {
      // After any change, totals and the latest list are stale
      const refreshAfterChange = () => {
        set({ summaries: {} });
        void get().fetchRecent();
      };

      return {
        ...initialState,

        fetchTransactions: async (page = 1, filters = get().filters) => {
          set({ isLoading: true, filters });
          try {
            const { transactions, pagination } = await transactionsApi.list(page, PAGE_SIZE, filters);
            set({ transactions, pagination });
          } catch (error) {
            notifyError(error, 'No se pudieron cargar las transacciones');
          } finally {
            set({ isLoading: false });
          }
        },

        fetchRecent: async (limit = 5) => {
          try {
            const { transactions } = await transactionsApi.list(1, limit);
            set({ recent: transactions });
          } catch (error) {
            notifyError(error, 'No se pudieron cargar las transacciones recientes');
          }
        },

        fetchSummary: async (from, to, groupBy = 'day') => {
          const key = summaryKey(from, to, groupBy);
          const cached = get().summaries[key];
          if (cached) return cached;
          try {
            const summary = await transactionsApi.summary(from, to, groupBy);
            set((state) => ({ summaries: { ...state.summaries, [key]: summary } }));
            return summary;
          } catch (error) {
            notifyError(error, 'No se pudo calcular el resumen');
            return null;
          }
        },

        addTransaction: async ({ categoryName, ...input }) => {
          // Without connection the transaction waits in the outbox and is sent when back online
          if (isOffline()) {
            const pending: PendingTransaction = { ...input, categoryName, localId: crypto.randomUUID() };
            set((state) => ({ outboxTransactions: [...state.outboxTransactions, pending] }));
            toast.success('Sin conexión: la transacción se enviará al reconectar');
            return 'queued';
          }

          try {
            await transactionsApi.create(input);
            refreshAfterChange();
            toast.success('Transacción guardada');
            return 'saved';
          } catch (error) {
            notifyError(error, 'No se pudo guardar la transacción');
            throw error;
          }
        },

        updateTransaction: async (id, changes) => {
          try {
            const updated = await transactionsApi.update(id, changes);
            set((state) => ({ transactions: state.transactions.map((t) => (t.id === id ? updated : t)) }));
            refreshAfterChange();
            toast.success('Transacción actualizada');
          } catch (error) {
            notifyError(error, 'No se pudo actualizar la transacción');
            throw error;
          }
        },

        deleteTransaction: async (id) => {
          try {
            await transactionsApi.remove(id);
            const { pagination, transactions } = get();
            // Reload the page so it stays full; step back if it was its last row
            const page =
              transactions.length === 1 && pagination.currentPage > 1 ? pagination.currentPage - 1 : pagination.currentPage;
            await get().fetchTransactions(page);
            refreshAfterChange();
            toast.success('Transacción eliminada');
          } catch (error) {
            notifyError(error, 'No se pudo eliminar la transacción');
            throw error;
          }
        },

        syncOutboxTransactions: async () => {
          const pending = get().outboxTransactions;
          if (pending.length === 0 || isOffline()) return;

          let synced = 0;
          for (const { localId, categoryName: _name, ...input } of pending) {
            try {
              await transactionsApi.create(input);
              synced++;
              set((state) => ({ outboxTransactions: state.outboxTransactions.filter((t) => t.localId !== localId) }));
            } catch {
              // Stays in the outbox for the next attempt
            }
          }
          if (synced > 0) {
            refreshAfterChange();
            toast.success(synced === 1 ? '1 transacción sincronizada' : `${synced} transacciones sincronizadas`);
          }
          const failed = get().outboxTransactions.length;
          if (failed > 0) {
            toast.error(failed === 1 ? '1 transacción no se pudo sincronizar' : `${failed} transacciones no se pudieron sincronizar`);
          }
        },

        exportTransactions: async ({ fromDate, toDate, format }) => {
          try {
            const response = await transactionsApi.export(format, fromDate, toDate);
            const disposition: string | undefined = response.headers['content-disposition'];
            const filename =
              disposition?.match(/filename="?([^";]+)"?/)?.[1] ??
              `transacciones_${fromDate || 'inicio'}_${toDate || 'hoy'}.${format}`;

            const url = URL.createObjectURL(new Blob([response.data], { type: String(response.headers['content-type'] ?? '') }));
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            toast.success('Exportación descargada');
          } catch (error) {
            notifyError(error, 'No se pudo exportar');
            throw error;
          }
        },
      };
    },
    {
      name: 'transaction-outbox',
      // Only the offline queue survives a reload; everything else is refetched
      partialize: (state) => ({ outboxTransactions: state.outboxTransactions }),
    }
  )
);

registerReset(() => useTransactionStore.setState(initialState));

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void useTransactionStore.getState().syncOutboxTransactions());
}
