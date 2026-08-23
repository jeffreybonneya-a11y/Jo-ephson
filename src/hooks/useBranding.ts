import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { BrandingSettings } from '@/src/types';
import { toast } from 'sonner';

const BRANDING_CACHE_KEY = 'kjd_site_branding_cache';

const DEFAULT_BRANDING: BrandingSettings = {
  logoUrl: '',
  brandName: 'KING J DEALS',
  tagline: "Ghana's Premier Data & Digital Hub",
  showCrown: true,
  logoShape: 'rounded',
  logoHeight: 48,
  logoBgStyle: 'dark',
  showTextInNavbar: false,
};

export function useBranding() {
  const [branding, setBranding] = useState<BrandingSettings>(() => {
    try {
      const cached = localStorage.getItem(BRANDING_CACHE_KEY);
      if (cached) {
        return { ...DEFAULT_BRANDING, ...JSON.parse(cached) };
      }
    } catch (e) {
      console.warn('Failed to parse cached branding:', e);
    }
    return DEFAULT_BRANDING;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'branding'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as BrandingSettings;
          const merged: BrandingSettings = {
            ...DEFAULT_BRANDING,
            ...data,
          };
          setBranding(merged);
          try {
            localStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(merged));
          } catch (e) {
            // LocalStorage quota safety
          }
        } else {
          setBranding(DEFAULT_BRANDING);
          try {
            localStorage.removeItem(BRANDING_CACHE_KEY);
          } catch (e) {}
        }
        setLoading(false);
      },
      (err) => {
        console.warn('[Branding Listener] Failed to load branding:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const updateBranding = useCallback(async (newSettings: Partial<BrandingSettings>) => {
    try {
      const payload = {
        ...branding,
        ...newSettings,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'settings', 'branding'), payload, { merge: true });
      setBranding(payload);
      try {
        localStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(payload));
      } catch (e) {}
      toast.success('Site logo & branding updated successfully! 🎨');
      return true;
    } catch (err: any) {
      console.error('Error saving branding settings:', err);
      toast.error('Failed to save branding: ' + (err.message || 'Unknown error'));
      return false;
    }
  }, [branding]);

  const resetBranding = useCallback(async () => {
    try {
      await deleteDoc(doc(db, 'settings', 'branding'));
      setBranding(DEFAULT_BRANDING);
      try {
        localStorage.removeItem(BRANDING_CACHE_KEY);
      } catch (e) {}
      toast.success('Reset to default King J Deals branding!');
      return true;
    } catch (err: any) {
      console.error('Error resetting branding:', err);
      toast.error('Failed to reset branding.');
      return false;
    }
  }, []);

  return {
    branding,
    loading,
    updateBranding,
    resetBranding,
    defaultBranding: DEFAULT_BRANDING,
  };
}
