import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

// Create axios instance with default config
const apiClient = axios.create({
  // Use relative path in development, external URL in production
  baseURL: import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || 'https://api.moneytalk.com/api'),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to inject auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from Zustand store
    const token = useAuthStore.getState().token;
    
    // If token exists, add it to request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
  (error) => {
    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }
    
    // Handle API errors
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        // Unauthorized - clear auth and redirect to login
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
        if (data.errors) {
          // Show first validation error
          const firstError = Object.values(data.errors)[0];
          toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
        } else {
          toast.error('Validation failed. Please check your input.');
        }
        break;
        
      case 500:
        toast.error('Server error. Please try again later.');
        break;
        
      default:
        toast.error(data.message || 'Something went wrong. Please try again.');
    }
    
    return Promise.reject(error);
  }
);

// Mock API for development (remove in production)
if (import.meta.env.DEV) {
  // Setup mock data and handlers
  setupMockAPI(apiClient);
}

function setupMockAPI(client: typeof axios) {
  // Mock authentication
  const mockUsers = [
    {
      id: '1',
      email: 'demo@example.com',
      password: 'password',
      displayName: 'Demo User',
    },
  ];
  
  // Mock transactions
  const mockTransactions = [
    {
      id: '1',
      amount: 1200,
      description: 'Salary payment',
      category: 'Salary',
      type: 'income',
      date: '2023-12-05',
      createdAt: '2023-12-05T09:30:00Z',
    },
    {
      id: '2',
      amount: 45,
      description: 'Grocery shopping',
      category: 'Food',
      type: 'expense',
      date: '2023-12-05',
      createdAt: '2023-12-05T14:20:00Z',
    },
    {
      id: '3',
      amount: 30,
      description: 'Netflix subscription',
      category: 'Entertainment',
      type: 'expense',
      date: '2023-12-04',
      createdAt: '2023-12-04T18:00:00Z',
    },
    {
      id: '4',
      amount: 200,
      description: 'Freelance work',
      category: 'Side Income',
      type: 'income',
      date: '2023-12-03',
      createdAt: '2023-12-03T15:30:00Z',
    },
    {
      id: '5',
      amount: 60,
      description: 'Electric bill',
      category: 'Utilities',
      type: 'expense',
      date: '2023-12-02',
      createdAt: '2023-12-02T10:15:00Z',
    },
  ];

  // Mock API endpoints by intercepting requests
  client.interceptors.request.use(async (config) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const { url, method, data: requestData } = config;
    let responseData;
    
    try {
      // Auth endpoints
      if (url?.includes('/auth/login') && method?.toLowerCase() === 'post') {
        const { email, password } = JSON.parse(requestData || '{}');
        const user = mockUsers.find(u => u.email === email && u.password === password);
        
        if (user) {
          const { password: _, ...userData } = user;
          responseData = {
            user: userData,
            token: 'mock-jwt-token',
          };
        } else {
          // Create a proper AxiosError for invalid credentials
          const error = new AxiosError(
            'Invalid credentials',
            'ERR_INVALID_CREDENTIALS',
            config,
            undefined,
            {
              status: 401,
              data: { message: 'Invalid email or password' }
            }
          );
          throw error;
        }
      }
      else if (url?.includes('/auth/signup') && method?.toLowerCase() === 'post') {
        const { email, password, displayName } = JSON.parse(requestData || '{}');
        const newUser = {
          id: String(mockUsers.length + 1),
          email,
          displayName,
        };
        
        responseData = {
          user: newUser,
          token: 'mock-jwt-token',
        };
      }
      else if (url?.includes('/auth/me') && method?.toLowerCase() === 'get') {
        const { password: _, ...userData } = mockUsers[0];
        responseData = { user: userData };
      }
      else if (url?.includes('/auth/profile') && method?.toLowerCase() === 'put') {
        const updateData = JSON.parse(requestData || '{}');
        const updatedUser = { ...mockUsers[0], ...updateData };
        
        responseData = {
          user: updatedUser,
        };
      }
      // Transaction endpoints
      else if (url?.includes('/transactions') && method?.toLowerCase() === 'get') {
        // Ensure pagination object is always included in the response
        responseData = {
          data: {
            transactions: mockTransactions,
            pagination: {
              totalPages: 1,
              currentPage: 1,
              totalItems: mockTransactions.length,
            }
          }
        };
      }
      else if (url?.includes('/transactions') && method?.toLowerCase() === 'post') {
        const newTransaction = {
          id: String(mockTransactions.length + 1),
          ...JSON.parse(requestData || '{}'),
          createdAt: new Date().toISOString(),
        };
        
        responseData = newTransaction;
      }
      else if (url?.match(/\/transactions\/\d+/) && method?.toLowerCase() === 'put') {
        const id = url.split('/').pop();
        const updateData = JSON.parse(requestData || '{}');
        
        responseData = {
          id,
          ...updateData,
        };
      }
      else if (url?.match(/\/transactions\/\d+/) && method?.toLowerCase() === 'delete') {
        responseData = { success: true };
      }

      // Return mock response
      return Promise.resolve({
        ...config,
        data: responseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: config,
      });
    } catch (err) {
      if (err instanceof AxiosError) {
        throw err;
      }
      // Convert any other errors to AxiosError
      throw new AxiosError(
        err instanceof Error ? err.message : 'An error occurred',
        'ERR_MOCK_API',
        config,
        undefined,
        {
          status: 500,
          data: { message: err instanceof Error ? err.message : 'Internal server error' }
        }
      );
    }
  });
}

export default apiClient;