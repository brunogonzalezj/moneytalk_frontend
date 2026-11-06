import axios, { AxiosAdapter, AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient, { registerAuthBridge } from './client';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

let accessToken = 'expired';
let refreshToken = 'refresh-1';
const onSessionExpired = vi.fn();

// Answers 401 to any request that does not carry the fresh token
const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  const authorization = String(config.headers.Authorization ?? '');
  if (authorization !== 'Bearer fresh') {
    throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: { error: { code: 'TOKEN_INVALID', message: 'Sesión inválida o expirada' } },
    });
  }
  return { data: { ok: config.url }, status: 200, statusText: 'OK', headers: {}, config };
};

beforeEach(() => {
  accessToken = 'expired';
  refreshToken = 'refresh-1';
  onSessionExpired.mockReset();
  apiClient.defaults.adapter = adapter;
  registerAuthBridge({
    getAccessToken: () => accessToken,
    getRefreshToken: () => refreshToken,
    onRefreshed: (session) => {
      accessToken = session.accessToken;
      refreshToken = session.refreshToken;
    },
    onSessionExpired,
  });
});

describe('apiClient', () => {
  it('refreshes once for many requests that fail at the same time, then retries them', async () => {
    const refresh = vi
      .spyOn(axios, 'post')
      .mockResolvedValue({ data: { accessToken: 'fresh', refreshToken: 'refresh-2' } });

    const results = await Promise.all([apiClient.get('/a'), apiClient.get('/b'), apiClient.get('/c')]);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(refresh.mock.calls[0][1]).toEqual({ refreshToken: 'refresh-1' });
    expect(results.map((r) => r.data.ok)).toEqual(['/a', '/b', '/c']);
    expect(refreshToken).toBe('refresh-2');
  });

  it('ends the session when the refresh fails', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('refresh rejected'));
    await expect(apiClient.get('/a')).rejects.toBeInstanceOf(AxiosError);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('does not try to refresh a failed login', async () => {
    const refresh = vi.spyOn(axios, 'post');
    await expect(apiClient.post('/auth/login', {})).rejects.toBeInstanceOf(AxiosError);
    expect(refresh).not.toHaveBeenCalled();
  });
});
