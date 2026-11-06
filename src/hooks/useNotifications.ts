import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../api/errors';
import { notificationsApi } from '../api/notifications.api';
import { NotificationSettingsData } from '../types/domain';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
const SW_READY_TIMEOUT_MS = 5000;

interface UseNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  /** Asks for permission if needed, subscribes this device and stores it on the server. */
  subscribe: (settings?: Partial<NotificationSettingsData>) => Promise<void>;
  unsubscribe: () => Promise<void>;
}

// VAPID public key (base64url) as the bytes PushManager expects
const toApplicationServerKey = (base64Url: string): Uint8Array => {
  const base64 = (base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(window.atob(base64), (char) => char.charCodeAt(0));
};

/**
 * The service worker is registered by vite-plugin-pwa. Outside a production
 * build there may be none, so waiting for it times out instead of hanging.
 */
const getRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), SW_READY_TIMEOUT_MS));
  return Promise.race([navigator.serviceWorker.ready, timeout]);
};

export const useNotifications = (): UseNotificationsReturn => {
  const isSupported =
    typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  const [permission, setPermission] = useState<NotificationPermission>(isSupported ? Notification.permission : 'denied');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!isSupported) return;
    let cancelled = false;

    (async () => {
      const registration = await getRegistration();
      const [subscription, status] = await Promise.all([
        registration?.pushManager.getSubscription() ?? null,
        notificationsApi.status().catch(() => null),
      ]);
      // Subscribed only when this device and the server agree
      if (!cancelled) setIsSubscribed(Boolean(subscription && status?.hasSubscription));
    })();

    return () => {
      cancelled = true;
    };
  }, [isSupported]);

  const subscribe = useCallback(async (settings?: Partial<NotificationSettingsData>) => {
    if (!isSupported) throw new Error('Tu navegador no soporta notificaciones push');
    if (!VAPID_PUBLIC_KEY) throw new Error('Las notificaciones push no están configuradas (falta VITE_VAPID_PUBLIC_KEY)');

    const result = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    setPermission(result);
    if (result !== 'granted') {
      throw new Error('Las notificaciones están bloqueadas. Habilítalas en la configuración del navegador.');
    }

    const registration = await getRegistration();
    if (!registration) {
      throw new Error('El service worker no está activo. Las notificaciones funcionan en la versión instalada o compilada de la app.');
    }

    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: toApplicationServerKey(VAPID_PUBLIC_KEY),
      }));

    try {
      // toJSON() gives the endpoint and the keys as base64url strings
      await notificationsApi.subscribe(subscription.toJSON(), settings);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'No se pudo guardar la suscripción'));
    }
    setIsSubscribed(true);
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    const registration = await getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    await subscription?.unsubscribe();
    await notificationsApi.unsubscribe().catch(() => undefined);
    setIsSubscribed(false);
  }, []);

  return { isSupported, permission, isSubscribed, subscribe, unsubscribe };
};
