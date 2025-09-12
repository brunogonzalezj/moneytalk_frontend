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
    // Agregar token JWT si existe
    const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    const token = authState.state?.token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API Request with token:', {
        url: config.url,
        method: config.method,
        hasToken: !!token,
        tokenPreview: token.substring(0, 20) + '...'
      });
    } else {
      console.log('API Request without token:', {
        url: config.url,
        method: config.method,
        hasToken: false
      });
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }
    
    // Handle API errors
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        // Unauthorized - clear auth
        toast.error('Session expired. Please log in again.');
        useAuthStore.getState().logout();
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