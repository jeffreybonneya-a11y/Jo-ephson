import { Capacitor } from '@capacitor/core';

/**
 * Platform detection utilities for King J Deals.
 * Determines whether the app is executing inside a native Capacitor shell
 * or in a standard browser environment.
 */
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const isAndroidNative = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

export const getPlatformName = (): 'web' | 'android' | 'ios' => {
  const platform = Capacitor.getPlatform();
  if (platform === 'android') return 'android';
  if (platform === 'ios') return 'ios';
  return 'web';
};
