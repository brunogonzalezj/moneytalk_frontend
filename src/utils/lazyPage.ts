import { ComponentType, lazy } from 'react';

const RELOAD_KEY = 'moneytalk:chunk-reload';

/**
 * After a deploy, an app that stayed open still asks for the previous version's page files, which no longer
 * exist on the server. The first time a page file fails to load, the app reloads to pick up the new version;
 * if it fails again soon after, the error reaches the error screen instead of looping.
 */
export const reloadForNewVersion = (): boolean => {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Without session storage there is no loop guard, so don't reload
    return false;
  }
  window.location.reload();
  return true;
};

export const lazyPage = <T extends ComponentType<object>>(load: () => Promise<{ default: T }>) =>
  lazy(() =>
    load().catch((error: unknown) => {
      // While the page reloads, keep showing the loading spinner
      if (reloadForNewVersion()) return new Promise<{ default: T }>(() => {});
      throw error;
    })
  );
