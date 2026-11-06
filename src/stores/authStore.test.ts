import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from './authStore';
import { useBudgetStore } from './budgetStore';
import { useTransactionStore } from './transactionStore';
import { authApi } from '../api/auth.api';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

describe('logout', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: '1', email: 'ana@test.com', name: 'Ana' },
      token: 'access',
      refreshToken: 'refresh',
      isAuthenticated: true,
    });
  });

  it("clears every store so the next user never sees the previous user's data", async () => {
    const logoutCall = vi.spyOn(authApi, 'logout').mockResolvedValue({} as never);
    useBudgetStore.setState({
      budgets: [{ id: '9', name: 'Viaje', type: 'VACATION', targetAmount: 100, currentAmount: 10, status: 'ACTIVE', createdAt: '', updatedAt: '' }],
    });
    useTransactionStore.setState({
      recent: [{ id: '5', amount: 10, description: 'Pan', category: 'Comida', type: 'EXPENSE', date: '2026-01-01', createdAt: '' }],
    });
    localStorage.setItem('budget-storage', '{"state":{}}');

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState()).toMatchObject({ user: null, token: null, refreshToken: null, isAuthenticated: false });
    expect(useBudgetStore.getState().budgets).toEqual([]);
    expect(useTransactionStore.getState().recent).toEqual([]);
    expect(localStorage.getItem('budget-storage')).toBeNull();
    // The server is told to forget the refresh token
    expect(logoutCall).toHaveBeenCalledWith('refresh');
  });
});
