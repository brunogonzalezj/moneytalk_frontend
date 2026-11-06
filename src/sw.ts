/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope;

// App shell: built assets are precached so the app opens without connection.
// API responses are never cached, so one user's data can't reach another.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Client-side routes (/dashboard, /reports...) load the cached index.html
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')));

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});
clientsClaim();

interface PushPayload {
  title?: string;
  body?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  requireInteraction?: boolean;
  actions?: { action: string; title: string }[];
  data?: { url?: string };
}

const readPayload = (event: PushEvent): PushPayload => {
  if (!event.data) return {};
  try {
    return event.data.json() as PushPayload;
  } catch {
    // Plain-text pushes (e.g. from DevTools) become the body
    return { body: event.data.text() };
  }
};

self.addEventListener('push', (event) => {
  const payload = readPayload(event);
  const options: NotificationOptions & { actions?: PushPayload['actions'] } = {
    body: payload.body ?? 'Tienes una novedad en MoneyTalk',
    icon: payload.icon ?? '/icon.svg',
    badge: payload.badge ?? '/icon.svg',
    tag: payload.tag ?? 'moneytalk',
    requireInteraction: payload.requireInteraction ?? false,
    actions: payload.actions ?? [],
    data: { url: payload.data?.url ?? '/dashboard' },
  };
  event.waitUntil(self.registration.showNotification(payload.title ?? 'MoneyTalk', options));
});

// Action buttons open a specific screen; tapping the notification opens its url
const ACTION_URLS: Record<string, string> = {
  'add-transaction': '/transactions/new',
  'view-reports': '/reports',
};

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = ACTION_URLS[event.action] ?? (event.notification.data as { url?: string })?.url ?? '/dashboard';

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (existing) {
        await existing.focus();
        await existing.navigate(target);
      } else {
        await self.clients.openWindow(target);
      }
    })()
  );
});
