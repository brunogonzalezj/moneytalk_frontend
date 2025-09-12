import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../utils/apiClient';
import toast from 'react-hot-toast';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email, password) => {
        try {
          set({ isLoading: true });
          
          // Llamada real al backend
          const response = await apiClient.post('/auth/login', { 
            email, 
            password 
          });
          
          const { user, tokens } = response.data;
          
          set({
            user: {
              id: String(user.id),
              email: user.email,
              displayName: user.name || user.displayName,
              name: user.name,
            },
            token: tokens.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
          
          toast.success('Sesión iniciada correctamente');
        } catch (error) {
          console.error('Error de inicio de sesión:', error);
          const errorMessage = (error as any)?.response?.data?.error || 'Credenciales incorrectas';
          toast.error(errorMessage);
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (email, password, displayName) => {
        try {
          set({ isLoading: true });
          const response = await apiClient.post('/auth/register', { 
            email, 
            password, 
            name: displayName 
          });
          
          const { user, tokens } = response.data;
          
          set({
            user: {
              id: String(user.id),
              email: user.email,
              displayName: user.name,
              name: user.name,
            },
            token: tokens.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
          
          toast.success('Cuenta creada exitosamente');
        } catch (error) {
          console.error('Error de registro:', error);
          const errorMessage = (error as any)?.response?.data?.error || 'No se pudo crear la cuenta';
          toast.error(errorMessage);
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        
        toast.success('Sesión cerrada correctamente');
      },

      checkAuth: async () => {
        const { token } = get();
        
        if (!token) {
          set({ isLoading: false });
          return;
        }
        
        try {
          set({ isLoading: true });
          const response = await apiClient.get('/auth/me');
          
          const user = response.data.user || response.data;
          
          set({
            user: {
              id: String(user.id),
              email: user.email,
              displayName: user.name || user.displayName,
              name: user.name,
            },
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error de verificación de token:', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateProfile: async (data) => {
        try {
          const response = await apiClient.put('/auth/profile', {
            name: data.displayName || data.name,
            email: data.email,
          });
          
          const updatedUser = response.data.user || response.data;
          
          set({
            user: {
              ...get().user!,
              id: String(updatedUser.id),
              email: updatedUser.email,
              displayName: updatedUser.name,
              name: updatedUser.name,
            },
          });
          
          toast.success('Perfil actualizado correctamente');
        } catch (error) {
          console.error('Error de actualización de perfil:', error);
          toast.error('No se pudo actualizar el perfil');
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user 
      }),
    }
  )
);