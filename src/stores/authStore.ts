import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../utils/apiClient';
import toast from 'react-hot-toast';

export interface User {
  id: string;
  email: string;
  displayName?: string;
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
          
          // Verificar credenciales de demostración
          if (email === 'demo@example.com' && password === 'password') {
            const mockUser = {
              id: '1',
              email: 'demo@example.com',
              displayName: 'Usuario Demo',
            };
            
            set({
              user: mockUser,
              token: 'mock-jwt-token',
              isAuthenticated: true,
              isLoading: false,
            });
            
            toast.success('Sesión iniciada correctamente');
            return;
          }
          
          // Si no son las credenciales de demo, mostrar error
          throw new Error('Por favor, usa las credenciales de demostración mostradas abajo para iniciar sesión.');
        } catch (error) {
          console.error('Error de inicio de sesión:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (email, password, displayName) => {
        try {
          set({ isLoading: true });
          const response = await apiClient.post('/auth/signup', { 
            email, password, displayName 
          });
          
          set({
            user: response.data.user,
            token: response.data.token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          toast.success('Cuenta creada exitosamente');
        } catch (error) {
          console.error('Error de registro:', error);
          toast.error('No se pudo crear la cuenta');
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
          const response = await apiClient.get('/auth/me');
          
          set({
            user: response.data.user,
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
          const response = await apiClient.put('/auth/profile', data);
          
          set({
            user: {
              ...get().user!,
              ...response.data.user,
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
      partialize: (state) => ({ token: state.token }),
    }
  )
);