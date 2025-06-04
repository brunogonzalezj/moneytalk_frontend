import { useState, useEffect } from 'react';

interface OfflineDetectionResult {
  isOnline: boolean;
  wasOffline: boolean;
  setWasOffline: (value: boolean) => void;
}

export const useOfflineDetection = (): OfflineDetectionResult => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Keep wasOffline true until it's explicitly reset
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline, setWasOffline };
};

export default useOfflineDetection;