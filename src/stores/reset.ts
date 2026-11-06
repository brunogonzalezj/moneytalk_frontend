/**
 * Every store with per-user data registers how to clear itself, so signing out
 * (or an expired session) leaves nothing behind for the next user.
 */
const resetters = new Set<() => void>();

// Persisted user data from this and earlier versions of the app
const PERSISTED_KEYS = ['budget-storage', 'ai-recommendations-storage', 'refreshToken', 'token'];

export const registerReset = (reset: () => void) => {
  resetters.add(reset);
};

export const resetAllStores = () => {
  resetters.forEach((reset) => reset());
  try {
    PERSISTED_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage can be unavailable (private mode); the in-memory reset already happened
  }
};
