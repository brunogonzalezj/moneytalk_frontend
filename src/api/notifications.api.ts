import { NotificationSettingsData } from '../types/domain';
import apiClient from './client';

export const notificationsApi = {
  status: () =>
    apiClient
      .get<{ hasSubscription: boolean; settings: NotificationSettingsData; pushEnabled: boolean }>('/notifications/status')
      .then((r) => r.data),

  getSettings: () =>
    apiClient.get<{ settings: NotificationSettingsData }>('/notifications/settings').then((r) => r.data.settings),

  saveSettings: (settings: Partial<NotificationSettingsData>) =>
    apiClient.post<{ settings: NotificationSettingsData }>('/notifications/settings', settings).then((r) => r.data.settings),

  // subscription.toJSON() gives the base64url keys the server expects
  subscribe: (subscription: PushSubscriptionJSON, settings?: Partial<NotificationSettingsData>) =>
    apiClient.post('/notifications/subscribe', { subscription, settings }),

  unsubscribe: () => apiClient.post('/notifications/unsubscribe'),

  sendTest: () => apiClient.post('/notifications/test'),
};
