import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ButtonStyle = 'flat' | 'outlined' | 'filled' | 'glassmorphic';
export type CardStyle = 'flat' | 'elevated' | 'bordered' | 'glassmorphic';
export type Density = 'compact' | 'comfortable' | 'spacious';
export type Radius = 'sharp' | 'rounded' | 'pill';
export type ContentWidth = 'narrow' | 'standard' | 'wide' | 'full';

export interface ThemeSettings {
  primaryColor: string;
  mode: ThemeMode;
  brightness: number;
  contrast: number;
  fontFamily: string;
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  lineHeight: 'compact' | 'normal' | 'relaxed';
  letterSpacing: 'tight' | 'normal' | 'wide';
  contentWidth: ContentWidth;
  borderRadius: Radius;
  density: Density;
  highContrast: boolean;
  reducedMotion: boolean;
  dyslexicFont: boolean;
  largeCursor: boolean;
  animations: boolean;
  texture: 'none' | 'grain' | 'dots' | 'grid';
  buttonStyle: ButtonStyle;
  cardStyle: CardStyle;
  audioEnabled: boolean;
  audioVolume: number;
  audioPreset: 'royal' | 'ambient' | 'nature' | 'minimal';
  audioInstrument: 'piano' | 'guitar';
}

const DEFAULT_SETTINGS: ThemeSettings = {
  primaryColor: '#eab308', // Royal Gold
  mode: 'system',
  brightness: 100,
  contrast: 100,
  fontFamily: 'Inter',
  fontSize: 'md',
  lineHeight: 'normal',
  letterSpacing: 'normal',
  contentWidth: 'standard',
  borderRadius: 'rounded',
  density: 'comfortable',
  highContrast: false,
  reducedMotion: false,
  dyslexicFont: false,
  largeCursor: false,
  animations: true,
  texture: 'none',
  buttonStyle: 'filled',
  cardStyle: 'bordered',
  audioEnabled: false,
  audioVolume: 50,
  audioPreset: 'royal',
  audioInstrument: 'piano',
};

export function useTheme() {
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    const saved = localStorage.getItem('king-j-theme-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration & Type Safety
        const { backgroundColor, textColor, musicEnabled, musicVolume, ...rest } = parsed;
        const validated = { ...DEFAULT_SETTINGS, ...rest };
        
        // Force types for numeric values
        if (typeof validated.brightness !== 'number') validated.brightness = 100;
        if (typeof validated.contrast !== 'number') validated.contrast = 100;
        
        return validated;
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const updateSetting = useCallback(<K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem('king-j-theme-settings', JSON.stringify(next));
      console.log(`[Theme] ${String(key)} updated to:`, value);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('king-j-theme-settings');
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    // Mode handling
    if (settings.mode === 'dark' || (settings.mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Accessibility classes
    root.classList.toggle('high-contrast', settings.highContrast);
    root.classList.toggle('reduced-motion', settings.reducedMotion);
    root.classList.toggle('dyslexic-font', settings.dyslexicFont);
    root.classList.toggle('large-cursor', settings.largeCursor);

    // Texture
    document.body.classList.remove('texture-grain', 'texture-dots', 'texture-grid');
    if (settings.texture !== 'none') {
      document.body.classList.add(`texture-${settings.texture}`);
    }

    // Apply colors
    if (settings.primaryColor) {
      root.style.setProperty('--primary', settings.primaryColor);
      root.style.setProperty('--ring', settings.primaryColor);
    }
    
    // Filters - Use CSS variables instead of style.filter on root/body
    const b = Number(settings.brightness);
    const c = Number(settings.contrast);
    let filterString = `brightness(${b}%) contrast(${c}%)`;
    
    if (settings.highContrast) {
      filterString += ` contrast(1.1) saturate(1.1)`;
    }
    
    // Instead of style.filter which breaks stacking contexts for portals,
    // we use a CSS variable that our main app wrapper can consume.
    root.style.setProperty('--royal-filter', filterString);
    // Ensure root has a stacking context that doesn't swallow fixed portals
    root.style.filter = 'none';
    document.body.style.filter = 'none';

    // Typography
    if (settings.fontFamily) {
      root.style.setProperty('--font-sans', settings.fontFamily);
      root.style.setProperty('--royal-font', settings.fontFamily);
    }
    
    const fontSizes = { sm: '14px', md: '16px', lg: '18px', xl: '20px' };
    root.style.setProperty('--base-font-size', fontSizes[settings.fontSize]);

    const lineHeights = { compact: '1.2', normal: '1.5', relaxed: '1.8' };
    root.style.setProperty('--base-line-height', lineHeights[settings.lineHeight]);

    const letterSpacings = { tight: '-0.05em', normal: '0', wide: '0.1em' };
    root.style.setProperty('--base-letter-spacing', letterSpacings[settings.letterSpacing]);

    // Layout
    const contentWidths = { narrow: '800px', standard: '1200px', wide: '1600px', full: '100vw' };
    root.style.setProperty('--content-width', contentWidths[settings.contentWidth]);

    const radii = { sharp: '0px', rounded: '12px', pill: '99px' };
    root.style.setProperty('--radius', radii[settings.borderRadius]);

    const densities = { 
      compact: { padding: '12px', gap: '8px' },
      comfortable: { padding: '24px', gap: '16px' },
      spacious: { padding: '48px', gap: '32px' }
    };
    root.style.setProperty('--base-padding', densities[settings.density].padding);
    root.style.setProperty('--base-gap', densities[settings.density].gap);

    // Global Animations Toggle
    if (!settings.animations) {
      root.classList.add('reduced-motion');
    } else if (!settings.reducedMotion) {
      root.classList.remove('reduced-motion');
    }
  }, [settings, updateSetting]);

  return { settings, updateSetting, resetSettings };
}
