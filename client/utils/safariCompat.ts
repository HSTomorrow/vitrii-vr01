/**
 * Safari iOS compatibility utilities
 * Helps prevent white screen of death on Safari iOS
 */

const isSafariIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isSafari = /safari/.test(ua) && !/chrome/.test(ua);
  return isIOS && isSafari;
};

/**
 * Safe localStorage access for Safari iOS
 * Safari in private mode throws errors on localStorage access
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`[SafariCompat] localStorage.getItem failed:`, error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`[SafariCompat] localStorage.setItem failed:`, error);
      // Silently fail - app still works without localStorage
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`[SafariCompat] localStorage.removeItem failed:`, error);
    }
  },
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.warn(`[SafariCompat] localStorage.clear failed:`, error);
    }
  },
};

/**
 * Safe sessionStorage access for Safari iOS
 */
export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.warn(`[SafariCompat] sessionStorage.getItem failed:`, error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.warn(`[SafariCompat] sessionStorage.setItem failed:`, error);
    }
  },
  removeItem: (key: string): void => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn(`[SafariCompat] sessionStorage.removeItem failed:`, error);
    }
  },
  clear: (): void => {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn(`[SafariCompat] sessionStorage.clear failed:`, error);
    }
  },
};

/**
 * Disable Service Worker for Safari iOS due to limited support
 */
export const shouldRegisterServiceWorker = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  // Service Workers on iOS Safari have limited functionality
  // Skip registration to prevent issues
  return !isSafariIOS();
};

/**
 * Unregister all existing Service Workers
 * Useful for clearing stale SW registrations
 */
export const unregisterAllServiceWorkers = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('[SafariCompat] Unregistered Service Worker:', registration.scope);
    }
  } catch (error) {
    console.warn('[SafariCompat] Failed to unregister Service Workers:', error);
  }
};

export default {
  isSafariIOS,
  safeLocalStorage,
  safeSessionStorage,
  shouldRegisterServiceWorker,
  unregisterAllServiceWorkers,
};
