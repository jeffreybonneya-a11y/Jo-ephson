import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, X, Palette, Moon, Sun, Monitor, 
  Type, Move, Accessibility, Box, RefreshCcw,
  Check, Maximize, Minus, Plus, AlignLeft,
  Square, Circle, Play, Eye, Crown, Layout,
  Volume2, VolumeX, Music, Waves
} from 'lucide-react';
import { useTheme, ThemeSettings, ThemeMode, Radius, Density, ContentWidth } from '../hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const THEME_PRESETS = [
  { name: 'Royal Gold', primary: '#eab308' },
  { name: 'Sunset', primary: '#f97316' },
  { name: 'Ocean', primary: '#0ea5e9' },
  { name: 'Forest', primary: '#10b981' },
  { name: 'Amethyst', primary: '#a855f7' },
  { name: 'Midnight', primary: '#6366f1' },
  { name: 'Ruby', primary: '#ef4444' },
  { name: 'Candy', primary: '#f43f5e' },
  { name: 'Lime', primary: '#84cc16' },
  { name: 'Cyan', primary: '#06b6d4' },
  { name: 'Amber', primary: '#f59e0b' },
  { name: 'Indigo', primary: '#4f46e5' },
];

const FONTS = [
  { label: 'Royal', value: "'Geist Variable', sans-serif" },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Serif', value: 'serif' },
  { label: 'Mono', value: 'monospace' },
];

export default function ThemeCustomizer() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('appearance');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { settings, updateSetting, resetSettings } = useTheme();

  // Reset scroll when panel opens or tab changes with timeouts to bypass animation layout delays
  useEffect(() => {
    const handleScrollReset = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    };
    handleScrollReset();
    const t1 = setTimeout(handleScrollReset, 50);
    const t2 = setTimeout(handleScrollReset, 150);
    const t3 = setTimeout(handleScrollReset, 350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen, activeTab]);

  const ControlLabel = ({ label, desc }: { label: string, desc?: string }) => (
    <div className="flex flex-col">
      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{label}</span>
      {desc && <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{desc}</span>}
    </div>
  );

  return (
    <>
      {/* Floating Trigger Button - FIXED Position for better mobile reliability */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 10 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 md:bottom-10 right-6 w-12 h-12 bg-slate-900 dark:bg-primary text-primary dark:text-secondary rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.5)] flex items-center justify-center z-[5000] border-2 border-white dark:border-slate-900 cursor-pointer"
        aria-label="Theme Customizer"
      >
        <Crown className="w-6 h-6 fill-current" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[6000]"
            />

            {/* Side Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full h-[100dvh] w-full sm:max-w-sm bg-white dark:bg-slate-950 shadow-[-20px_0_60px_rgba(0,0,0,0.5)] z-[6001] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 shrink-0">
                <div className="flex flex-col">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Crown className="w-5 h-5 text-primary" />
                    ROYAL TAB 👑
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Theme Engine</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 h-10 w-10">
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {/* Tabs System */}
              <Tabs 
                value={activeTab} 
                onValueChange={setActiveTab} 
                className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950"
              >
                <div className="overflow-x-auto scrollbar-hide border-b dark:border-slate-800 bg-slate-100 dark:bg-slate-900/80 shrink-0">
                  <TabsList className="inline-flex h-auto p-1 rounded-none bg-transparent min-w-max w-full">
                    <TabsTrigger value="appearance" className="flex-1 min-w-[70px] text-[10px] font-black uppercase tracking-tight py-3 px-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-primary data-[state=active]:shadow-sm">
                      Theme
                    </TabsTrigger>
                    <TabsTrigger value="filters" className="flex-1 min-w-[70px] text-[10px] font-black uppercase tracking-tight py-3 px-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-primary data-[state=active]:shadow-sm">
                      Visual
                    </TabsTrigger>
                    <TabsTrigger value="typo" className="flex-1 min-w-[70px] text-[10px] font-black uppercase tracking-tight py-3 px-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-primary data-[state=active]:shadow-sm">
                      Fonts
                    </TabsTrigger>
                    <TabsTrigger value="layout" className="flex-1 min-w-[70px] text-[10px] font-black uppercase tracking-tight py-3 px-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-primary data-[state=active]:shadow-sm">
                      Space
                    </TabsTrigger>
                    <TabsTrigger value="access" className="flex-1 min-w-[70px] text-[10px] font-black uppercase tracking-tight py-3 px-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-primary data-[state=active]:shadow-sm">
                      Access
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div 
                  ref={scrollContainerRef}
                  className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar"
                >
                  
                  {/* Appearance Tab */}
                  <TabsContent value="appearance" className="space-y-8 mt-0 focus-visible:outline-none">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-primary">
                        <Monitor className="w-4 h-4" />
                        Color Mode
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['light', 'dark', 'system'] as ThemeMode[]).map((m) => (
                          <button
                            key={m}
                            onClick={() => updateSetting('mode', m)}
                            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                              settings.mode === m ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200'
                            }`}
                          >
                            {m === 'light' && <Sun className="w-4 h-4" />}
                            {m === 'dark' && <Moon className="w-4 h-4" />}
                            {m === 'system' && <Monitor className="w-4 h-4" />}
                            <span className="text-[10px] font-black uppercase text-inherit">{m}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-primary">
                        <Palette className="w-4 h-4" />
                        Kingdom Colors
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {THEME_PRESETS.map((p) => (
                          <button
                            key={p.name}
                            onClick={() => updateSetting('primaryColor', p.primary)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all group ${
                              settings.primaryColor === p.primary ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-slate-800'
                            }`}
                          >
                            <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: p.primary }} />
                            <span className="text-[8px] font-bold text-slate-400 group-hover:text-primary uppercase truncate w-full text-center">{p.name.split(' ')[0]}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-primary">
                        <Check className="w-4 h-4" />
                        Textures
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {(['none', 'grain', 'dots', 'grid'] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => updateSetting('texture', t)}
                            className={`px-3 py-2 rounded-lg border-2 text-[10px] font-black uppercase transition-all ${
                              settings.texture === t ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Filters Tab */}
                  <TabsContent value="filters" className="space-y-8 mt-0 focus-visible:outline-none">
                    <div className="space-y-8">
                       <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-primary">
                        <Box className="w-4 h-4" />
                        Visual Adjustments
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <ControlLabel label="Brightness" />
                            <span className="text-[10px] font-bold text-primary">{settings.brightness}%</span>
                          </div>
                          <Slider
                            value={[settings.brightness]}
                            min={50}
                            max={150}
                            step={1}
                            onValueChange={(vals) => updateSetting('brightness', vals[0])}
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <ControlLabel label="Contrast" />
                            <span className="text-[10px] font-bold text-primary">{settings.contrast}%</span>
                          </div>
                          <Slider
                            value={[settings.contrast]}
                            min={50}
                            max={200}
                            step={1}
                            onValueChange={(vals) => updateSetting('contrast', vals[0])}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Typography Tab */}
                  <TabsContent value="typo" className="space-y-8 mt-0 focus-visible:outline-none">
                    <div className="space-y-8">
                      <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-primary">
                        <Type className="w-4 h-4" />
                        Typography
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {FONTS.map((f) => (
                          <button
                            key={f.value}
                            onClick={() => updateSetting('fontFamily', f.value)}
                            className={`px-3 py-2 rounded-lg border-2 transition-all text-xs font-bold ${
                              settings.fontFamily === f.value ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-200'
                            }`}
                            style={{ fontFamily: f.value }}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <ControlLabel label="Font Size" />
                        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                          {(['sm', 'md', 'lg', 'xl'] as const).map((s) => (
                            <button
                              key={s}
                              onClick={() => updateSetting('fontSize', s)}
                              className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${
                                settings.fontSize === s ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              {s.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Layout Tab */}
                  <TabsContent value="layout" className="space-y-8 mt-0 focus-visible:outline-none">
                    <div className="space-y-8">
                       <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-primary">
                        <Move className="w-4 h-4" />
                        Layout Control
                      </div>
                      <div className="flex items-center justify-between">
                        <ControlLabel label="Border Radius" />
                        <div className="flex gap-1">
                          {(['sharp', 'rounded', 'pill'] as Radius[]).map((r) => (
                            <button
                              key={r}
                              onClick={() => updateSetting('borderRadius', r)}
                              className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                                settings.borderRadius === r ? 'border-primary text-primary bg-primary/5' : 'border-slate-100 dark:border-slate-900 text-slate-400'
                              }`}
                            >
                              {r === 'sharp' && <Square className="w-5 h-5" />}
                              {r === 'rounded' && <Box className="w-5 h-5" />}
                              {r === 'pill' && <Circle className="w-5 h-5" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <ControlLabel label="UI Density" />
                        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                          {(['compact', 'comfortable', 'spacious'] as Density[]).map((d) => (
                            <button
                              key={d}
                              onClick={() => updateSetting('density', d)}
                              className={`px-3 py-1 rounded-md text-[9px] font-black transition-all ${
                                settings.density === d ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-400'
                              }`}
                            >
                              {d.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Access Tab */}
                  <TabsContent value="access" className="space-y-8 mt-0 focus-visible:outline-none">
                    <div className="space-y-8">
                      <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-primary">
                        <Accessibility className="w-4 h-4" />
                        Accessibility
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <ControlLabel label="High Contrast" desc="Enhance visual clarity" />
                          <Switch checked={settings.highContrast} onCheckedChange={(val) => updateSetting('highContrast', val)} />
                        </div>
                        <div className="flex items-center justify-between">
                          <ControlLabel label="Reduced Motion" desc="Minimize animations" />
                          <Switch checked={settings.reducedMotion} onCheckedChange={(val) => updateSetting('reducedMotion', val)} />
                        </div>
                        <div className="flex items-center justify-between">
                          <ControlLabel label="Dyslexia Font" desc="Readable character style" />
                          <Switch checked={settings.dyslexicFont} onCheckedChange={(val) => updateSetting('dyslexicFont', val)} />
                        </div>
                        <div className="flex items-center justify-between">
                          <ControlLabel label="Large Cursor" desc="Easier navigation" />
                          <Switch checked={settings.largeCursor} onCheckedChange={(val) => updateSetting('largeCursor', val)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <ControlLabel label="Global Animations" />
                            <Switch checked={settings.animations} onCheckedChange={(val) => updateSetting('animations', val)} />
                         </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Disable entire Audio tab content */}
                  <TabsContent value="audio" className="hidden"></TabsContent>
                  <div className="hidden">
                       <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-primary">
                        <Volume2 className="w-4 h-4" />
                        Royal Soundscape
                      </div>
                      
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <ControlLabel label="Ambient Sound" desc="Enable background audio" />
                          <Switch 
                            checked={settings.audioEnabled} 
                            onCheckedChange={(val) => updateSetting('audioEnabled', val)} 
                          />
                        </div>

                        <div className={`space-y-4 transition-all duration-300 ${settings.audioEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <ControlLabel label="Royal Volume" />
                              <span className="text-[10px] font-bold text-primary">{settings.audioVolume}%</span>
                            </div>
                            <Slider
                              value={[settings.audioVolume]}
                              min={0}
                              max={100}
                              step={1}
                              onValueChange={(vals) => updateSetting('audioVolume', vals[0])}
                            />
                          </div>

                          <div className="space-y-3">
                            <ControlLabel label="Royal Instrument" desc="Switch between piano and guitar" />
                            <div className="grid grid-cols-2 gap-2">
                              {(['piano', 'guitar'] as const).map((instr) => (
                                <button
                                  key={instr}
                                  onClick={() => updateSetting('audioInstrument', instr)}
                                  className={`px-3 py-2 rounded-lg border-2 text-[10px] font-black uppercase transition-all ${
                                    settings.audioInstrument === instr ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-400'
                                  }`}
                                >
                                  {instr}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <ControlLabel label="Sound Preset" desc="Choose your vibe" />
                            <div className="grid grid-cols-2 gap-2">
                              {(['royal', 'ambient', 'nature', 'minimal'] as const).map((p) => (
                                <button
                                  key={p}
                                  onClick={() => updateSetting('audioPreset', p)}
                                  className={`px-3 py-2 rounded-lg border-2 text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${
                                    settings.audioPreset === p ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-400'
                                  }`}
                                >
                                  {p === 'royal' && <Crown className="w-3 h-3" />}
                                  {p === 'ambient' && <Music className="w-3 h-3" />}
                                  {p === 'nature' && <Waves className="w-3 h-3" />}
                                  {p === 'minimal' && <AlignLeft className="w-3 h-3" />}
                                  {p}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                </div>
              </Tabs>

              {/* Footer */}
              <div className="p-6 pb-safe border-t bg-slate-50 dark:bg-slate-950 flex items-center gap-3 shrink-0">
                <Button variant="outline" className="flex-1 font-black text-xs h-12 rounded-xl group border-slate-200 dark:border-slate-800" onClick={resetSettings}>
                  <RefreshCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform" />
                  RESTART
                </Button>
                <Button className="flex-1 font-black text-xs h-12 rounded-xl bg-slate-900 text-primary hover:bg-black" onClick={() => setIsOpen(false)}>
                  DONE 👑
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
