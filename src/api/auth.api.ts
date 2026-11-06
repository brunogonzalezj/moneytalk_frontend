import apiClient from './client';

interface ApiUser {
  id: number;
  email: string;
  name: string;
  avatar?: string;
}

export interface SessionResponse {
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
  isNewUser?: boolean;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<SessionResponse>('/auth/login', { email, password }).then((r) => r.data),

  signup: (name: string, email: string, password: string) =>
    apiClient.post<SessionResponse>('/auth/signup', { name, email, password }).then((r) => r.data),

  google: (token: string) => apiClient.post<SessionResponse>('/auth/google', { token }).then((r) => r.data),

  logout: (refreshToken: string) => apiClient.post('/auth/logout', { refreshToken }),

  me: () => apiClient.get<{ user: ApiUser }>('/auth/me').then((r) => r.data.user),

  updateProfile: (changes: { name?: string; email?: string }) =>
    apiClient.put<{ user: ApiUser }>('/auth/profile', changes).then((r) => r.data.user),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.put('/auth/change-password', { currentPassword, newPassword }),

  deleteAccount: (confirmation: { password?: string; email?: string }) =>
    apiClient.delete('/auth/account', { data: confirmation }),
};
