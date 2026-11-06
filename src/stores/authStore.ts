import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { authApi, SessionResponse } from '../api/auth.api';
import { registerAuthBridge } from '../api/client';
import { notifyError } from '../api/errors';
import { User } from '../types/domain';
import { resetAllStores } from './reset';

export type { User };

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  // Initial session check on app start (the app waits for it)
  isInitializing: boolean;
  // A login/signup form is being submitted (only that form waits for it)
  isSubmitting: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (confirmation: { password?: string; email?: string }) => Promise<void>;
}

const toUser = (user: SessionResponse['user'], provider: User['provider']): User => ({
  id: String(user.id),
  email: user.email,
  displayName: user.name,
  name: user.name,
  avatar: user.avatar,
  provider,
});

const signedOut = { user: null, token: null, refreshToken: null, isAuthenticated: false };

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      const startSession = (session: SessionResponse, provider: User['provider']) => {
        // A different account on this device must not see the previous one's data
        if (get().user && get().user!.id !== String(session.user.id)) resetAllStores();
        set({
          user: toUser(session.user, provider),
          token: session.accessToken,
          refreshToken: session.refreshToken,
          isAuthenticated: true,
        });
      };

      const submit = async (action: () => Promise<void>, fallback: string) => {
        set({ isSubmitting: true });
        try {
          await action();
        } catch (error) {
          notifyError(error, fallback);
          throw error;
        } finally {
          set({ isSubmitting: false });
        }
      };

      return {
        ...signedOut,
        isInitializing: true,
        isSubmitting: false,

        login: (email, password) =>
          submit(async () => {
            startSession(await authApi.login(email, password), 'email');
            toast.success('Sesión iniciada correctamente');
          }, 'No se pudo iniciar sesión'),

        signup: (email, password, displayName) =>
          submit(async () => {
            startSession(await authApi.signup(displayName, email, password), 'email');
            toast.success('Cuenta creada exitosamente');
          }, 'No se pudo crear la cuenta'),

        loginWithGoogle: (token) =>
          submit(async () => {
            const session = await authApi.google(token);
            startSession(session, 'google');
            toast.success(session.isNewUser ? 'Cuenta creada con Google' : 'Sesión iniciada con Google');
          }, 'No se pudo iniciar sesión con Google'),

        logout: async () => {
          const { refreshToken } = get();
          set(signedOut);
          resetAllStores();
          toast.success('Sesión cerrada correctamente');
          // Best effort: the server forgets the refresh token
          if (refreshToken) await authApi.logout(refreshToken).catch(() => undefined);
        },

        // Confirms the stored session with the server once, when the app starts
        checkAuth: async () => {
          if (!get().token) {
            set({ ...signedOut, isInitializing: false });
            return;
          }
          try {
            const user = await authApi.me();
            set({ user: { ...get().user, ...toUser(user, get().user?.provider ?? 'email') }, isAuthenticated: true });
          } catch {
            // Expired sessions are signed out by the API client after a failed refresh
          } finally {
            set({ isInitializing: false });
          }
        },

        updateProfile: async (data) => {
          try {
            const user = await authApi.updateProfile({ name: data.displayName || data.name, email: data.email });
            set({ user: { ...get().user!, ...toUser(user, get().user?.provider) } });
            toast.success('Perfil actualizado correctamente');
          } catch (error) {
            notifyError(error, 'No se pudo actualizar el perfil');
            throw error;
          }
        },

        changePassword: async (currentPassword, newPassword) => {
          try {
            await authApi.changePassword(currentPassword, newPassword);
            toast.success('Contraseña cambiada. Se cerraron tus otras sesiones.');
          } catch (error) {
            notifyError(error, 'No se pudo cambiar la contraseña');
            throw error;
          }
        },

        deleteAccount: async (confirmation) => {
          try {
            await authApi.deleteAccount(confirmation);
          } catch (error) {
            notifyError(error, 'No se pudo eliminar la cuenta');
            throw error;
          }
          set(signedOut);
          resetAllStores();
          toast.success('Tu cuenta y todos tus datos fueron eliminados');
        },
      };
    },
    {
      name: 'auth-storage',
      version: 1,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      // v0 kept the refresh token in its own localStorage key
      migrate: (persisted, version) => {
        const state = persisted as AuthState;
        if (version === 0) {
          try {
            return { ...state, refreshToken: localStorage.getItem('refreshToken') };
          } catch {
            return state;
          }
        }
        return state;
      },
    }
  )
);

registerAuthBridge({
  getAccessToken: () => useAuthStore.getState().token,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  onRefreshed: ({ accessToken, refreshToken }) => useAuthStore.setState({ token: accessToken, refreshToken }),
  onSessionExpired: () => {
    useAuthStore.setState(signedOut);
    resetAllStores();
  },
});
