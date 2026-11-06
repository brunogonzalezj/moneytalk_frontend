import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import { getErrorCode, getErrorMessage } from './errors';

const responseError = (status: number, data: unknown) =>
  new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });

describe('getErrorMessage', () => {
  it('reads the backend error shape', () => {
    const error = responseError(401, { error: { code: 'INVALID_CREDENTIALS', message: 'Correo o contraseña incorrectos' } });
    expect(getErrorMessage(error)).toBe('Correo o contraseña incorrectos');
    expect(getErrorCode(error)).toBe('INVALID_CREDENTIALS');
  });

  it('prefers the first field message of a validation error', () => {
    const error = responseError(400, {
      error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: [{ field: 'amount', message: 'El monto debe ser mayor a 0' }] },
    });
    expect(getErrorMessage(error)).toBe('El monto debe ser mayor a 0');
  });

  it('still understands older string errors', () => {
    expect(getErrorMessage(responseError(400, { error: 'Algo salió mal' }))).toBe('Algo salió mal');
  });

  it('explains network failures', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK');
    expect(getErrorMessage(error)).toMatch(/conexión/);
  });

  it('falls back to the given message', () => {
    expect(getErrorMessage(responseError(500, '<html>'), 'Fallo')).toBe('Fallo');
  });
});
