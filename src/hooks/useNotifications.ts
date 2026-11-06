import { useState, useEffect, useCallback } from 'react';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface UseNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
  subscribe: () => Promise<PushSubscription | null>;
  unsubscribe: () => Promise<void>;
  sendLocalNotification: (options: NotificationOptions) => void;
  isSubscribed: boolean;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check if notifications are supported
  const isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

  // Initialize service worker and check subscription
  useEffect(() => {
    if (!isSupported) return;

    const initServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        setSwRegistration(registration);

        // Check current permission without requesting
        const currentPermission = Notification.permission;
        setPermission(currentPermission);

        // Check if already subscribed
        const subscription = await registration.pushManager.getSubscription();

        // Also check if user has active subscription in backend
        const hasBackendSubscription = await checkBackendSubscription();

        // Set isSubscribed based on both service worker and backend state
        setIsSubscribed(!!subscription && hasBackendSubscription);

        // Load saved notification settings from localStorage
        const savedSettings = localStorage.getItem('notificationSettings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          // Apply saved settings or use defaults
          console.log('Loaded notification settings from localStorage:', settings);
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        // Fallback: still allow app to work without notifications
      }
    };

    initServiceWorker();
  }, [isSupported]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) return 'denied';

    try {
      const newPermission = await Notification.requestPermission();
      setPermission(newPermission);

      // Save permission status to localStorage for tracking
      localStorage.setItem('notificationPermission', newPermission);

      // Show feedback based on permission
      if (newPermission === 'granted') {
        console.log('Notification permission granted');
      } else if (newPermission === 'denied') {
        console.warn('Notification permission denied. You may need to enable it in browser settings.');
      }

      return newPermission;
    } catch (error) {
      console.error('Permission request failed:', error);
      return 'denied';
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!isSupported || !swRegistration || permission !== 'granted') {
      return null;
    }

    try {
      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlB64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
      );

      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      setIsSubscribed(true);

      // Send subscription to server
      await saveSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error('Subscription failed:', error);
      return null;
    }
  }, [isSupported, swRegistration, permission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!swRegistration) return;

    try {
      const subscription = await swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await deleteSubscriptionFromServer(subscription);
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Unsubscribe failed:', error);
    }
  }, [swRegistration]);

  // Send local notification
  const sendLocalNotification = useCallback((options: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') return;

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      requireInteraction: options.requireInteraction || false,
      actions: options.actions || [],
      vibrate: [100, 50, 100],
      tag: 'moneytalk-notification',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }, [isSupported, permission]);

  return {
    isSupported,
    permission,
    requestPermission,
    subscribe,
    unsubscribe,
    sendLocalNotification,
    isSubscribed,
  };
};

// Check if user has active subscription in backend
async function checkBackendSubscription(): Promise<boolean> {
  try {
    // Get token from Zustand persist storage
    let token = null;
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsedState = JSON.parse(authStorage);
        token = parsedState.state?.token;
      }
    } catch (error) {
      console.warn('Error parsing auth storage:', error);
    }

    // Fallback to direct token check
    if (!token) {
      token = localStorage.getItem('token');
    }

    if (!token) {
      console.log('No auth token found, assuming no subscription');
      return false;
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.hasSubscription || false;
    }

    return false;
  } catch (error) {
    console.warn('Failed to check backend subscription status:', error);
    return false;
  }
}

// Helper function to convert URL base64 to Uint8Array
function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Save subscription to server with better error handling
async function saveSubscriptionToServer(subscription: PushSubscription, settings?: any): Promise<void> {
  try {
    // Get token from Zustand persist storage
    let token = null;
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsedState = JSON.parse(authStorage);
        token = parsedState.state?.token;
      }
    } catch (error) {
      console.warn('Error parsing auth storage:', error);
    }

    // Fallback to direct token check
    if (!token) {
      token = localStorage.getItem('token');
    }

    if (!token) {
      console.warn('No auth token found, cannot save subscription to server');
      console.log('Available localStorage keys:', Object.keys(localStorage));
      return;
    }

    // Validate subscription object
    if (!subscription || !subscription.endpoint) {
      throw new Error('Invalid subscription object');
    }

    console.log('Saving subscription to server...');
    console.log('Subscription endpoint:', subscription.endpoint);

    const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.getKey ? Array.from(new Uint8Array(subscription.getKey('p256dh')!)) : undefined,
            auth: subscription.getKey ? Array.from(new Uint8Array(subscription.getKey('auth')!)) : undefined,
          }
        },
        settings: settings || {
          dailyReminder: false,
          dailyTime: '20:00',
          weeklyReminder: false,
          weeklyDay: 1,
          transactionReminder: true,
          monthlyReport: true,
        }
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to save subscription';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Subscription saved successfully:', data);
  } catch (error) {
    console.error('Failed to save subscription to server:', error);
    // Don't throw immediately - the app can still work with local subscription
    if (error instanceof Error && error.message.includes('401')) {
      // Unauthorized error - clear invalid token
      localStorage.removeItem('token');
    }
    throw error;
  }
}

// Delete subscription from server with better error handling
async function deleteSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
  try {
    // Get token from Zustand persist storage
    let token = null;
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsedState = JSON.parse(authStorage);
        token = parsedState.state?.token;
      }
    } catch (error) {
      console.warn('Error parsing auth storage:', error);
    }

    // Fallback to direct token check
    if (!token) {
      token = localStorage.getItem('token');
    }

    if (!token) {
      console.warn('No auth token found, cannot delete subscription from server');
      return;
    }

    console.log('Deleting subscription from server...');
    console.log('Subscription endpoint:', subscription.endpoint);

    const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.getKey ? Array.from(new Uint8Array(subscription.getKey('p256dh')!)) : undefined,
            auth: subscription.getKey ? Array.from(new Uint8Array(subscription.getKey('auth')!)) : undefined,
          }
        }
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to delete subscription';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    console.log('Subscription deleted successfully');
  } catch (error) {
    console.error('Failed to delete subscription from server:', error);
    // Don't throw immediately - local cleanup is still important
    if (error instanceof Error && error.message.includes('401')) {
      // Unauthorized error - clear invalid token
      localStorage.removeItem('token');
    }
    throw error;
  }
}