import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log('=== API REQUEST DEBUG ===');
    console.log('URL:', config.url);
    console.log('Method:', config.method);
    
    // Obtener token del localStorage
    let token = null;
    try {
      const authStorage = localStorage.getItem('auth-storage');
      console.log('Raw auth storage:', authStorage);
      
      if (authStorage) {
        const authState = JSON.parse(authStorage);
        console.log('Parsed auth state:', authState);
        token = authState.state?.token;
        console.log('Extracted token:', token ? token.substring(0, 50) + '...' : 'NO TOKEN');
      }
    } catch (error) {
      console.error('Error reading auth token:', error);
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token added to request');
      console.log('Authorization header:', config.headers.Authorization.substring(0, 50) + '...');
    } else {
      console.log('❌ NO TOKEN FOUND');
      console.log('Auth storage exists:', !!localStorage.getItem('auth-storage'));
    }
    
    console.log('=== END DEBUG ===');
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling and automatic token refresh
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response Success:', response.config.url, response.status);
    return response;
  },
  async (error: AxiosError) => {
    console.log('❌ API Response Error:', error.config?.url, error.response?.status);
    console.log('Error details:', error.response?.data);

    const originalRequest = error.config;

    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    // Handle 401 - Try to refresh token automatically
    if (error.response.status === 401 && !originalRequest?._retry) {
      console.log('🔄 Attempting to refresh token...');

      try {
        // Mark request to prevent infinite retry loop
        originalRequest._retry = true;

        // Get refresh token from localStorage
        const authStorage = localStorage.getItem('auth-storage');
        if (!authStorage) {
          throw new Error('No refresh token available');
        }

        const authState = JSON.parse(authStorage);
        // Note: We'll need to store refresh token separately or modify the store
        // For now, let's add a simple refresh token storage
        let refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          // Fallback: try to get it from the auth state structure
          refreshToken = authState.state?.refreshToken;
        }

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        console.log('🔄 Sending refresh token request...');

        // Attempt to refresh the token
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken, user } = refreshResponse.data;

        // Update the auth store with new tokens
        const authStore = useAuthStore.getState();
        authStore.token = accessToken;

        // Save new refresh token
        localStorage.setItem('refreshToken', newRefreshToken);

        // Update localStorage for persistence
        const updatedStorage = {
          ...authState,
          state: {
            ...authState.state,
            token: accessToken,
            isAuthenticated: true
          }
        };
        localStorage.setItem('auth-storage', JSON.stringify(updatedStorage));

        console.log('✅ Token refreshed successfully');

        // Retry the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return apiClient(originalRequest);

      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);

        // Clear auth on refresh failure
        localStorage.removeItem('refreshToken');
        useAuthStore.getState().logout();
        toast.error('Session expired. Please log in again.');

        return Promise.reject(refreshError);
      }
    }

    // Handle API errors (non-401 or already retried)
    const { status, data } = error.response;

    switch (status) {
      case 401:
        // Already tried refresh or refresh failed - clear auth
        if (originalRequest?._retry) {
          toast.error('Session expired. Please log in again.');
          useAuthStore.getState().logout();
        }
        break;

      case 403:
        toast.error('You do not have permission to perform this action.');
        break;

      case 404:
        toast.error('Resource not found.');
        break;

      case 422:
        // Validation errors
        if ((data as any).errors) {
          // Show first validation error
          const firstError = Object.values((data as any).errors)[0];
          toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
        } else {
          toast.error('Validation failed. Please check your input.');
        }
        break;

      case 500:
        toast.error('Server error. Please try again later.');
        break;

      default:
        toast.error((data as any).message || 'Something went wrong. Please try again.');
    }

    return Promise.reject(error);
  }
);





export default apiClient;