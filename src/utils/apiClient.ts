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

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response Success:', response.config.url, response.status);
    return response;
  },
  (error: AxiosError) => {
    console.log('❌ API Response Error:', error.config?.url, error.response?.status);
    console.log('Error details:', error.response?.data);
    
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