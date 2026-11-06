import { isAxiosError } from 'axios';
import toast from 'react-hot-toast';

interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: { field?: string; message: string }[] } | string;
  message?: string;
}

/** Error code sent by the backend, e.g. "VALIDATION_ERROR" or "INVALID_CREDENTIALS". */
export const getErrorCode = (error: unknown): string | undefined => {
  if (!isAxiosError<ApiErrorBody>(error)) return undefined;
  const body = error.response?.data?.error;
  return typeof body === 'object' ? body?.code : undefined;
};

/**
 * Human-readable message for any error thrown by an API call. For validation
 * errors it returns the first field message, which is the most specific one.
 */
export const getErrorMessage = (error: unknown, fallback = 'Ocurrió un error. Intenta nuevamente.'): string => {
  if (!isAxiosError<ApiErrorBody>(error)) return error instanceof Error && error.message ? error.message : fallback;

  if (!error.response) return 'No hay conexión con el servidor. Revisa tu internet.';

  const data = error.response.data;
  if (data && typeof data === 'object') {
    if (typeof data.error === 'object' && data.error) {
      return data.error.details?.[0]?.message ?? data.error.message ?? fallback;
    }
    if (typeof data.error === 'string') return data.error;
    if (typeof data.message === 'string') return data.message;
  }
  return fallback;
};

/** True for errors the API client already announced (no connection, 5xx, rate limit). */
const alreadyNotified = (error: unknown) =>
  isAxiosError(error) && (!error.response || error.response.status >= 500 || error.response.status === 429);

/** Shows a toast for an API error unless the client already showed one for it. */
export const notifyError = (error: unknown, fallback?: string) => {
  if (!alreadyNotified(error)) toast.error(getErrorMessage(error, fallback));
};
