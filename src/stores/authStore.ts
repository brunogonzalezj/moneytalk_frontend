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
          
          const response = await apiClient.post('/auth/login', { 
            email, 
            password 
          });
          
          const { user, accessToken, refreshToken } = response.data;
          
          console.log('Login response:', response.data);
          console.log('Access token received:', accessToken ? accessToken.substring(0, 50) + '...' : 'NO TOKEN');
          
          set({
            user: {
              id: String(user.id),
              email: user.email,
              displayName: user.name || user.displayName,
              name: user.name,
            },
            token: accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
          
          // Verificar que se guardó correctamente
          setTimeout(() => {
            const stored = localStorage.getItem('auth-storage');
            console.log('Token stored in localStorage:', stored ? 'YES' : 'NO');
            if (stored) {
              const parsed = JSON.parse(stored);
              console.log('Stored token preview:', parsed.state?.token ? parsed.state.token.substring(0, 50) + '...' : 'NO TOKEN IN STORAGE');
            }
          }, 100);
          
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
          
          const { user, accessToken, refreshToken } = response.data;
          
          set({
            user: {
              id: String(user.id),
              email: user.email,
              displayName: user.name,
              name: user.name,
            },
            token: accessToken,
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
        // Llamar al endpoint de logout para limpiar la sesión
        apiClient.post('/auth/logout').catch(console.error);
        
        set({
          user: null,
          isAuthenticated: false,
        });
        
        toast.success('Sesión cerrada correctamente');
      },

      checkAuth: async () => {
        try {
          set({ isLoading: true });
          
          // Si no hay token, no hacer la verificación
          const currentState = get();
          if (!currentState.token) {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return;
          }
          
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
        user: state.user,
        token: state.token
      }),
    }
  )
);