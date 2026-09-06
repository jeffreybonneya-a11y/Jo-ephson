import { Capacitor } from '@capacitor/core';

/**
 * Platform detection utilities for King J Deals.
 * Determines whether the app is executing inside a native Capacitor shell (Android / iOS)
 * or in a standard browser environment.
 */
export const isAndroidNative = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    if (Capacitor.getPlatform() === 'android') return true;
    if ((window as any).Capacitor?.getPlatform?.() === 'android') return true;
    
    // User-agent heuristic for Capacitor Android WebView
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
      const ua = navigator.userAgent;
      if (ua.includes('Capacitor') || (ua.includes('Android') && (ua.includes('wv') || (window as any).Capacitor))) {
        return true;
      }
    }
    return false;
  } catch (e) {
    return false;
  }
};

export const isNativeApp = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    if (Capacitor.isNativePlatform()) return true;
    const platform = Capacitor.getPlatform();
    if (platform === 'android' || platform === 'ios') return true;
    if ((window as any).Capacitor?.isNativePlatform?.()) return true;
    return isAndroidNative();
  } catch (e) {
    return false;
  }
};

export const getPlatformName = (): 'web' | 'android' | 'ios' => {
  try {
    const platform = Capacitor.getPlatform();
    if (platform === 'android') return 'android';
    if (platform === 'ios') return 'ios';
    if (isAndroidNative()) return 'android';
    return 'web';
  } catch (e) {
    return 'web';
  }
};

