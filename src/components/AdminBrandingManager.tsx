import React, { useState, useRef, useEffect } from 'react';
import { useBranding } from '@/src/hooks/useBranding';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  Trash2, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  Eye, 
  Image as ImageIcon, 
  Layers, 
  Crown,
  FileImage,
  Sliders,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Utility to process local image file to a compressed Base64 Data URL, with optional background removal
 */
function processLocalImageFile(
  file: File, 
  maxDimension = 768, 
  options: { removeBlackBg?: boolean; removeWhiteBg?: boolean; threshold?: number } = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image.'));
      return;
    }

    // For SVGs when no pixel manipulation is needed
    if (file.type === 'image/svg+xml' && !options.removeBlackBg && !options.removeWhiteBg) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Draw image cleanly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Background transparency filtering if requested
        if (options.removeBlackBg || options.removeWhiteBg) {
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;
          const thresh = options.threshold ?? 45;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a === 0) continue;

            if (options.removeBlackBg) {
              // Measure brightness distance from black
              const maxVal = Math.max(r, g, b);
              if (maxVal < thresh) {
                // Completely transparent for very dark/black pixels
                data[i + 3] = 0;
              } else if (maxVal < thresh * 1.5) {
                // Smooth feathering
                const alphaFactor = (maxVal - thresh) / (thresh * 0.5);
                data[i + 3] = Math.round(a * Math.max(0, Math.min(1, alphaFactor)));
              }
            } else if (options.removeWhiteBg) {
              const minVal = Math.min(r, g, b);
              if (minVal > 255 - thresh) {
                data[i + 3] = 0;
              }
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }

        // Export as PNG for transparency support
        const compressedDataUrl = canvas.toDataURL('image/png', 0.95);
        resolve(compressedDataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for processing.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Filter an existing image data URL to remove black or white background
 */
function filterExistingImageDataUrl(
  dataUrl: string,
  options: { removeBlackBg?: boolean; removeWhiteBg?: boolean; threshold?: number }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imgData.data;
      const thresh = options.threshold ?? 50;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a === 0) continue;

        if (options.removeBlackBg) {
          const maxVal = Math.max(r, g, b);
          if (maxVal < thresh) {
            data[i + 3] = 0;
          } else if (maxVal < thresh * 1.5) {
            const alphaFactor = (maxVal - thresh) / (thresh * 0.5);
            data[i + 3] = Math.round(a * Math.max(0, Math.min(1, alphaFactor)));
          }
        } else if (options.removeWhiteBg) {
          const minVal = Math.min(r, g, b);
          if (minVal > 255 - thresh) {
            data[i + 3] = 0;
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/png', 0.95));
    };
    img.onerror = () => reject(new Error('Failed to process image transparency.'));
    img.src = dataUrl;
  });
}

export default function AdminBrandingManager() {
  const { branding, updateBranding, resetBranding, defaultBranding } = useBranding();

  // Local draft state
  const [logoUrl, setLogoUrl] = useState<string>(branding.logoUrl || '');
  const [brandName, setBrandName] = useState<string>(branding.brandName || 'KING J DEALS');
  const [tagline, setTagline] = useState<string>(branding.tagline || "Ghana's Premier Data & Digital Hub");
  const [showCrown, setShowCrown] = useState<boolean>(branding.showCrown !== false);
  const [logoShape, setLogoShape] = useState<'rounded' | 'circle' | 'square' | 'original'>(
    branding.logoShape || 'rounded'
  );
  const [logoHeight, setLogoHeight] = useState<number>(branding.logoHeight || 52);
  const [showTextInNavbar, setShowTextInNavbar] = useState<boolean>(branding.showTextInNavbar || false);
  const [logoBgStyle, setLogoBgStyle] = useState<'dark' | 'light' | 'glass' | 'transparent'>(
    branding.logoBgStyle || 'dark'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize when remote branding changes
  useEffect(() => {
    setLogoUrl(branding.logoUrl || '');
    setBrandName(branding.brandName || 'KING J DEALS');
    setTagline(branding.tagline || "Ghana's Premier Data & Digital Hub");
    setShowCrown(branding.showCrown !== false);
    setLogoShape(branding.logoShape || 'rounded');
    setLogoHeight(branding.logoHeight || 52);
    setShowTextInNavbar(branding.showTextInNavbar || false);
    setLogoBgStyle(branding.logoBgStyle || 'dark');
  }, [branding]);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large. Please select an image under 10MB.');
      return;
    }

    try {
      toast.loading('Processing image from disk...', { id: 'img-load' });
      const dataUrl = await processLocalImageFile(file);
      setLogoUrl(dataUrl);
      setFileName(file.name);
      toast.success(`Loaded "${file.name}"! Click "Save to Site" to apply.`, { id: 'img-load' });
    } catch (err: any) {
      console.error('Failed to read image:', err);
      toast.error('Failed to load image: ' + (err.message || 'Unknown error'), { id: 'img-load' });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await updateBranding({
      logoUrl,
      brandName: brandName.trim() || 'KING J DEALS',
      tagline: tagline.trim(),
      showCrown,
      logoShape,
      logoHeight,
      logoBgStyle,
      showTextInNavbar,
    });
    setIsSaving(false);
    if (success) {
      setFileName('');
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset the site logo and branding back to default King J Deals?')) {
      setIsSaving(true);
      await resetBranding();
      setLogoUrl('');
      setBrandName('KING J DEALS');
      setTagline("Ghana's Premier Data & Digital Hub");
      setShowCrown(true);
      setLogoShape('rounded');
      setLogoHeight(52);
      setShowTextInNavbar(false);
      setLogoBgStyle('dark');
      setFileName('');
      setIsSaving(false);
    }
  };

  const handleRemoveUploadedLogo = () => {
    setLogoUrl('');
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info('Logo removed from preview. Click "Save to Site" to update.');
  };

  const getShapeClass = () => {
    switch (logoShape) {
      case 'circle':
        return 'rounded-full object-cover aspect-square';
      case 'square':
        return 'rounded-lg object-contain aspect-square';
      case 'original':
        return 'rounded-none object-contain';
      case 'rounded':
      default:
        return 'rounded-xl object-contain';
    }
  };

  const hasChanges =
    logoUrl !== (branding.logoUrl || '') ||
    brandName !== (branding.brandName || 'KING J DEALS') ||
    tagline !== (branding.tagline || "Ghana's Premier Data & Digital Hub") ||
    showCrown !== (branding.showCrown !== false) ||
    logoShape !== (branding.logoShape || 'rounded') ||
    logoHeight !== (branding.logoHeight || 52) ||
    showTextInNavbar !== (branding.showTextInNavbar || false) ||
    logoBgStyle !== (branding.logoBgStyle || 'dark');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-amber-500/10 via-[#0B132B] to-amber-500/10 border border-amber-400/30 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider mb-2 border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Live Site Customization
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            Branding & Site Logo Manager 🎨
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Upload your custom logo directly from your local disk. It updates instantly in the header navigation, footer, and across the entire website.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {branding.logoUrl && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isSaving}
              className="h-11 px-4 text-xs font-black uppercase rounded-xl border-red-500/40 text-red-400 hover:bg-red-500/10 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Reset Default
            </Button>
          )}

          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || (!hasChanges && !!branding.logoUrl)}
            className="h-11 px-6 text-xs font-black uppercase rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 shadow-[0_4px_15px_rgba(245,158,11,0.3)] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              'Saving...'
            ) : hasChanges ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Save to Site 🚀
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-1.5" />
                Live on Site
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Local Disk Upload & Controls */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/60 border-b dark:border-slate-800 p-5">
              <CardTitle className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-500" />
                1. Upload Logo from Local Disk
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-5">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                className="hidden"
                id="admin-logo-disk-input"
              />

              {/* Drag and drop upload zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                    : logoUrl
                    ? 'border-amber-400/50 bg-amber-500/5 hover:border-amber-400 hover:bg-amber-500/10'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 hover:border-amber-400/60 hover:bg-slate-100 dark:hover:bg-slate-900/80'
                }`}
              >
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
                    <FileImage className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      Click to Browse or Drag & Drop Image Here
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Supports PNG, JPG, JPEG, SVG, WebP (Transparent PNG recommended)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-xl font-black text-xs uppercase px-4 h-9 bg-amber-400 text-slate-950 hover:bg-amber-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Choose File from Disk
                  </Button>
                </div>
              </div>

              {/* Uploaded image details card */}
              {logoUrl && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-amber-400/30 text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 border border-amber-400/40 p-1 flex items-center justify-center overflow-hidden">
                        <img
                          src={logoUrl}
                          alt="Uploaded logo"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-black uppercase text-amber-300">
                            Image Loaded Successfully
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                          {fileName || 'Custom Logo Ready for Deployment'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="h-8 px-2.5 text-xs text-slate-300 hover:text-white"
                        title="Replace file"
                      >
                        Replace
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveUploadedLogo}
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                        title="Remove logo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* One-Click Background Remover Tool */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border border-amber-400/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 uppercase tracking-wide">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Background Transparency Tool
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Does your logo have a black background? Click below to make it transparent instantly.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        type="button"
                        size="sm"
                        onClick={async () => {
                          try {
                            toast.loading('Removing black background...', { id: 'bg-remove' });
                            const transparentUrl = await filterExistingImageDataUrl(logoUrl, { removeBlackBg: true, threshold: 48 });
                            setLogoUrl(transparentUrl);
                            toast.success('Black background removed! Click "Save to Site" to apply.', { id: 'bg-remove' });
                          } catch (err: any) {
                            toast.error('Failed to remove background: ' + err.message, { id: 'bg-remove' });
                          }
                        }}
                        className="h-8 px-3 text-[11px] font-black uppercase rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-300 cursor-pointer shadow-sm"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        Remove Black BG
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            toast.loading('Removing white background...', { id: 'bg-remove' });
                            const transparentUrl = await filterExistingImageDataUrl(logoUrl, { removeWhiteBg: true, threshold: 30 });
                            setLogoUrl(transparentUrl);
                            toast.success('White background removed! Click "Save to Site" to apply.', { id: 'bg-remove' });
                          } catch (err: any) {
                            toast.error('Failed to remove background: ' + err.message, { id: 'bg-remove' });
                          }
                        }}
                        className="h-8 px-2.5 text-[11px] font-bold uppercase rounded-lg border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                      >
                        Remove White BG
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Shape and Size Options */}
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Shape */}
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-500" />
                      Logo Crop Shape
                    </Label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'original', label: 'Original' },
                        { id: 'rounded', label: 'Rounded' },
                        { id: 'circle', label: 'Circle' },
                        { id: 'square', label: 'Square' },
                      ].map((shape) => (
                        <button
                          key={shape.id}
                          type="button"
                          onClick={() => setLogoShape(shape.id as any)}
                          className={`h-9 px-1 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer border ${
                            logoShape === shape.id
                              ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm font-black'
                              : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-400/50'
                          }`}
                        >
                          {shape.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Height / Scale */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-amber-500" />
                        Logo Size (Top Bar)
                      </Label>
                      <span className="text-xs font-mono font-bold text-amber-500">{logoHeight}px</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { val: 44, label: '44px (Compact)' },
                        { val: 52, label: '52px (Standard)' },
                        { val: 60, label: '60px (Large)' },
                        { val: 68, label: '68px (Max)' },
                      ].map((sz) => (
                        <button
                          key={sz.val}
                          type="button"
                          onClick={() => setLogoHeight(sz.val)}
                          className={`h-9 px-1 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer border ${
                            logoHeight === sz.val
                              ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm font-black'
                              : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-400/50'
                          }`}
                        >
                          {sz.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Brand Text & Options Card */}
          <Card className="rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/60 border-b dark:border-slate-800 p-5">
              <CardTitle className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-500" />
                2. Store Display Name & Footer Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-400/30 rounded-xl text-xs text-amber-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Notice: The top bar of the screen will show <strong>ONLY your custom logo</strong> for clean prominence. The store name is used on page titles and footer.</span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Store Display Name (Used in Footer & Browser Tab)
                </Label>
                <Input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="KING J DEALS"
                  className="h-11 rounded-xl font-bold uppercase"
                />
              </div>

              {/* Show Text Next to Logo Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="space-y-0.5">
                  <div className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">
                    Display Brand Text Beside Logo in Header
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Shows large gold text "{brandName || 'KING J DEALS'}" directly next to your logo in the top bar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTextInNavbar(!showTextInNavbar)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    showTextInNavbar ? 'bg-amber-400' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform transform shadow-sm ${
                      showTextInNavbar ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Tagline / Slogan
                </Label>
                <Input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Ghana's Premier Data & Digital Hub"
                  className="h-11 rounded-xl"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Previews */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden sticky top-24">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/60 border-b dark:border-slate-800 p-5">
              <CardTitle className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-500" />
                Live Website Previews
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-6">
              {/* Preview 1: Top Navigation Bar (Logo) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                  <span>Top Navigation Bar</span>
                  <span className="text-[10px] text-amber-500 font-bold">Live Header</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0B132B] border border-amber-500/30 shadow-lg flex items-center justify-between min-h-[80px]">
                  <div className="flex items-center gap-3">
                    {logoUrl ? (
                      <>
                        <img
                          src={logoUrl}
                          alt={brandName}
                          style={{ height: `${logoHeight}px`, maxHeight: '72px', maxWidth: '260px' }}
                          className={`${getShapeClass()} transition-all filter drop-shadow-sm`}
                        />
                        {showTextInNavbar && (
                          <span className="font-serif font-black text-xl tracking-wide bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent select-none drop-shadow-sm">
                            {brandName || 'KING J DEALS'}
                          </span>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2.5 px-1">
                        <span className="font-serif font-black text-xl tracking-wide bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                          {brandName || 'KING J DEALS'}
                        </span>
                        {showCrown && <span className="text-amber-400 text-xl">👑</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700" />
                    <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black">
                      KJ
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview 2: Contrast Check (Dark vs Light) */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                  Contrast Previews
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {/* Dark Mode */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center space-y-2 min-h-[110px]">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Dark Background</span>
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Dark preview"
                        style={{ height: `${Math.min(logoHeight, 40)}px` }}
                        className={`${getShapeClass()}`}
                      />
                    ) : (
                      <div className="text-2xl">👑</div>
                    )}
                    <span className="text-xs font-bold text-slate-200">{brandName}</span>
                  </div>

                  {/* Light Mode */}
                  <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-center space-y-2 min-h-[110px]">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Light Background</span>
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Light preview"
                        style={{ height: `${Math.min(logoHeight, 40)}px` }}
                        className={`${getShapeClass()}`}
                      />
                    ) : (
                      <div className="text-2xl">👑</div>
                    )}
                    <span className="text-xs font-bold text-slate-900">{brandName}</span>
                  </div>
                </div>
              </div>

              {/* Preview 3: Footer Preview */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                  Footer Brand Appearance
                </span>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-900 text-white space-y-2">
                  <div className="flex items-center gap-2">
                    {logoUrl && (
                      <img
                        src={logoUrl}
                        alt={brandName}
                        style={{ height: '28px' }}
                        className={getShapeClass()}
                      />
                    )}
                    <div className="flex items-center gap-1.5 font-black text-sm tracking-tight text-white">
                      <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md text-xs">
                        {brandName.split(' ')[0] || 'KING'}
                      </span>
                      <span className="text-amber-400">
                        {brandName.split(' ').slice(1).join(' ') || 'DEALS'} {showCrown && '👑'}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {tagline || "Ghana's Premier Data & Digital Hub"}
                  </p>
                </div>
              </div>

              {/* Quick Save Callout Button */}
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || (!hasChanges && !!branding.logoUrl)}
                  className="w-full h-12 text-xs font-black uppercase rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 shadow-lg cursor-pointer"
                >
                  {isSaving ? 'Deploying to Site...' : 'Apply & Save Branding to Site 🚀'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
