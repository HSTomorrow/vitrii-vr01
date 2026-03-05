import { useEffect, useState } from 'react';
import { shouldRegisterServiceWorker } from '@/utils/safariCompat';

interface PWAInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface UsePWAReturn {
  isOnline: boolean;
  isInstallable: boolean;
  installPrompt: PWAInstallPrompt | null;
  install: () => Promise<void>;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
}

const detectOS = () => {
  if (typeof navigator === 'undefined') {
    return { isIOS: false, isAndroid: false, isSafari: false };
  }

  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /android/.test(ua);
  const isSafari = /safari/.test(ua) && !/chrome/.test(ua);

  return { isIOS, isAndroid, isSafari };
};

export const usePWA = (): UsePWAReturn => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isInstallable, setIsInstallable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [osInfo, setOsInfo] = useState(() => detectOS());

  useEffect(() => {
    // Register service worker only if browser supports it and is not Safari iOS
    if ('serviceWorker' in navigator && shouldRegisterServiceWorker()) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration);

          // Check for updates periodically
          const updateInterval = setInterval(() => {
            registration.update();
          }, 60000); // Check every minute

          return () => clearInterval(updateInterval);
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
          // Service Worker is optional - app still works without it
        });
    } else if (!shouldRegisterServiceWorker()) {
      console.log('[PWA] Service Worker registration skipped (Safari iOS or unsupported)');
    }

    // Listen for online/offline changes
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Check if app is installed
    if ('getInstalledRelatedApps' in navigator) {
      try {
        (navigator as any).getInstalledRelatedApps?.().then((apps: any[]) => {
          setIsInstalled(apps.length > 0);
        }).catch((error: any) => {
          // This API only works in top-level browsing contexts, not in iframes
          console.debug('[PWA] getInstalledRelatedApps not available:', error.message);
          setIsInstalled(false);
        });
      } catch (error) {
        // Handle sync errors
        console.debug('[PWA] Error checking installed apps:', error);
        setIsInstalled(false);
      }
    }

    // Check for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as PWAInstallPrompt);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) {
      console.warn('[PWA] Install prompt not available');
      return;
    }

    try {
      await installPrompt.prompt();
      const userChoice = await installPrompt.userChoice;
      
      if (userChoice.outcome === 'accepted') {
        console.log('[PWA] User accepted install prompt');
        setIsInstalled(true);
      } else {
        console.log('[PWA] User dismissed install prompt');
      }

      setInstallPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('[PWA] Install failed:', error);
    }
  };

  return {
    isOnline,
    isInstallable,
    installPrompt,
    install,
    isInstalled,
    isIOS: osInfo.isIOS,
    isAndroid: osInfo.isAndroid,
    isSafari: osInfo.isSafari,
  };
};
