import { create } from 'zustand';
import { categoriesApi } from '../api/categories.api';
import { notifyError } from '../api/errors';
import { Category, TransactionType } from '../types/domain';
import { registerReset } from './reset';

const CACHE_MS = 10 * 60 * 1000;

interface CategoryState {
  categories: Category[];
  loadedAt: number | null;
  isLoading: boolean;
  /** Loads once and reuses the result for a few minutes; `force` skips the cache. */
  fetchCategories: (force?: boolean) => Promise<Category[]>;
  createCategory: (name: string, type: TransactionType) => Promise<Category>;
}

let inFlight: Promise<Category[]> | null = null;

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loadedAt: null,
  isLoading: false,

  fetchCategories: async (force = false) => {
    const { loadedAt, categories } = get();
    if (!force && loadedAt && Date.now() - loadedAt < CACHE_MS) return categories;

    // Several screens may ask at once; they share one request
    inFlight ??= (async () => {
      set({ isLoading: true });
      try {
        const list = await categoriesApi.list();
        set({ categories: list, loadedAt: Date.now() });
        return list;
      } catch (error) {
        notifyError(error, 'No se pudieron cargar las categorías');
        return get().categories;
      } finally {
        set({ isLoading: false });
        inFlight = null;
      }
    })();
    return inFlight;
  },

  createCategory: async (name, type) => {
    const category = await categoriesApi.create(name, type);
    set((state) => ({
      categories: state.categories.some((c) => c.id === category.id)
        ? state.categories
        : [...state.categories, category].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    }));
    return category;
  },
}));

registerReset(() => useCategoryStore.setState({ categories: [], loadedAt: null }));
