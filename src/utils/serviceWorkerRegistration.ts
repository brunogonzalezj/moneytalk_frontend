import { registerSW as registerVitePWA } from 'virtual:pwa-register';

export const registerSW = () => {
  if ('serviceWorker' in navigator) {
    const updateSW = registerVitePWA({
      onNeedRefresh() {
        if (confirm('New content available. Reload?')) {
          updateSW(true);
        }
      },
      onOfflineReady() {
        console.log('App ready to work offline');
      },
    });
  }
};