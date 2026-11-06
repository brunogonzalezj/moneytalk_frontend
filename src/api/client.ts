import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface Session {
  accessToken: string;
  refreshToken: string;
}

/**
 * The auth store registers these so the client never reads localStorage
 * directly and there is no import cycle between the two modules.
 */
interface AuthBridge {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onRefreshed: (session: Session) => void;
  onSessionExpired: () => void;
}

let auth: AuthBridge | null = null;
export const registerAuthBridge = (bridge: AuthBridge) => {
  auth = bridge;
};

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = auth?.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth endpoints answer 401 for bad credentials; those must not trigger a refresh
const NO_REFRESH = ['/auth/login', '/auth/signup', '/auth/google', '/auth/refresh', '/auth/logout'];

let refreshing: Promise<string> | null = null;

/**
 * Exchanges the refresh token once, however many requests failed at the same
 * time; every caller waits for the same promise.
 */
const refreshAccessToken = (): Promise<string> => {
  refreshing ??= (async () => {
    const refreshToken = auth?.getRefreshToken();
    if (!refreshToken) throw new Error('Sin refresh token');
    // Plain axios: this call must not go through these interceptors
    const { data } = await axios.post<Session>(`${API_URL}/auth/refresh`, { refreshToken }, { timeout: 15_000 });
    auth?.onRefreshed(data);
    return data.accessToken;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as InternalAxiosRequestConfig | undefined;

    if (!error.response) {
      // One toast for any number of failed requests
      toast.error('No hay conexión con el servidor. Revisa tu internet.', { id: 'network-error' });
      return Promise.reject(error);
    }

    const { status } = error.response;
    const url = request?.url ?? '';

    if (status === 401 && request && !request._retry && !NO_REFRESH.some((path) => url.includes(path))) {
      request._retry = true;
      try {
        const accessToken = await refreshAccessToken();
        request.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(request);
      } catch {
        auth?.onSessionExpired();
        toast.error('Tu sesión expiró. Inicia sesión de nuevo.', { id: 'session-expired' });
        return Promise.reject(error);
      }
    }

    // 4xx errors are handled (and shown) by whoever made the request
    if (status === 429) {
      toast.error('Demasiadas solicitudes. Espera un momento e intenta de nuevo.', { id: 'rate-limit' });
    } else if (status >= 500) {
      toast.error('El servidor tuvo un problema. Intenta nuevamente en unos segundos.', { id: 'server-error' });
    }
    return Promise.reject(error);
  }
);

export default apiClient;
