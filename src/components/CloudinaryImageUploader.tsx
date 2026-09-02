import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  uploadToCloudinary,
  validateImageFile,
  isCloudinaryUrl,
  CLOUDINARY_CLOUD_NAME,
} from '@/src/lib/cloudinary';
import { toast } from 'sonner';

interface CloudinaryImageUploaderProps {
  label?: string;
  description?: string;
  currentImageUrl?: string;
  onImageUploaded: (secureUrl: string) => void;
  onImageRemoved?: () => void;
  folder?: string;
  maxSizeBytes?: number; // default 15MB
  previewAspectRatio?: 'square' | 'video' | 'auto' | 'banner';
  className?: string;
  disabled?: boolean;
}

export const CloudinaryImageUploader: React.FC<CloudinaryImageUploaderProps> = ({
  label = 'Upload Image to Cloudinary',
  description = 'Select an image from your computer. Uploads directly to Cloudinary via secure HTTPS.',
  currentImageUrl = '',
  onImageUploaded,
  onImageRemoved,
  folder,
  maxSizeBytes = 15 * 1024 * 1024,
  previewAspectRatio = 'auto',
  className = '',
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeDisplayUrl = localPreviewUrl || currentImageUrl;

  const handleFile = async (file: File) => {
    if (!file || disabled) return;

    setErrorMessage(null);

    // Validate
    const validation = validateImageFile(file, maxSizeBytes);
    if (!validation.valid) {
      const err = validation.error || 'Invalid image file.';
      setErrorMessage(err);
      toast.error(err);
      return;
    }

    // Temporary local preview while uploading
    const objectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objectUrl);
    setIsUploading(true);
    setUploadProgress(0);

    const toastId = toast.loading(`Uploading "${file.name}" to Cloudinary...`);

    try {
      const result = await uploadToCloudinary(file, {
        folder,
        maxSizeBytes,
        onProgress: (percent) => {
          setUploadProgress(percent);
        },
      });

      if (result.success && result.url) {
        toast.success('Image successfully uploaded to Cloudinary! ☁️✨', {
          id: toastId,
          description: 'Secure HTTPS link obtained and ready to save.',
        });
        setLocalPreviewUrl(null);
        onImageUploaded(result.url);
      } else {
        const errorText = result.error || 'Failed to upload image to Cloudinary.';
        setErrorMessage(errorText);
        setLocalPreviewUrl(null);
        toast.error(`Upload Failed: ${errorText}`, { id: toastId });
      }
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      const msg = err.message || 'An unexpected network error occurred.';
      setErrorMessage(msg);
      setLocalPreviewUrl(null);
      toast.error(`Upload Failed: ${msg}`, { id: toastId });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    setLocalPreviewUrl(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onImageRemoved) {
      onImageRemoved();
    }
    toast.info('Image removed.');
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    onImageUploaded(customUrl.trim());
    setShowUrlInput(false);
    setCustomUrl('');
    toast.success('Custom image URL applied.');
  };

  const getAspectClass = () => {
    switch (previewAspectRatio) {
      case 'square':
        return 'aspect-square max-h-48 object-contain';
      case 'video':
        return 'aspect-video max-h-48 object-cover';
      case 'banner':
        return 'aspect-[21/9] max-h-44 object-cover';
      case 'auto':
      default:
        return 'max-h-52 object-contain';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex justify-between items-center">
        <div>
          {label && (
            <Label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
              {label}
            </Label>
          )}
          {description && (
            <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[10px] text-amber-400 hover:text-amber-300 underline font-semibold transition"
          >
            {showUrlInput ? 'Use file uploader' : 'Paste direct URL'}
          </button>
        </div>
      </div>

      {showUrlInput ? (
        <form onSubmit={handleApplyCustomUrl} className="flex gap-2">
          <Input
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://res.cloudinary.com/... or https://..."
            className="h-9 text-xs bg-slate-900 border-slate-700 text-white rounded-xl"
          />
          <Button
            type="submit"
            size="sm"
            className="h-9 px-3 text-xs bg-amber-400 text-slate-950 font-bold rounded-xl hover:bg-amber-300"
          >
            Apply
          </Button>
        </form>
      ) : (
        <>
          {/* Main Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (!disabled && !isUploading && fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
            className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-4 transition-all flex flex-col items-center justify-center text-center ${
              isDragging
                ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                : activeDisplayUrl
                ? 'border-slate-700 bg-slate-900/60 hover:border-amber-500/50'
                : 'border-slate-700 bg-slate-950/80 hover:border-amber-400/80 hover:bg-slate-900/40'
            } ${disabled || isUploading ? 'opacity-70 pointer-events-none' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFile(e.target.files[0]);
                }
              }}
              disabled={disabled || isUploading}
            />

            {/* PREVIEW OF CURRENT OR UPLOADED IMAGE */}
            {activeDisplayUrl ? (
              <div className="w-full space-y-3">
                <div className="relative mx-auto rounded-xl overflow-hidden bg-slate-950/80 border border-slate-800 flex items-center justify-center p-2">
                  <img
                    src={activeDisplayUrl}
                    alt="Uploaded preview"
                    className={`w-full rounded-lg ${getAspectClass()}`}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />

                  {/* Cloudinary Badge */}
                  {isCloudinaryUrl(activeDisplayUrl) && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-500/90 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Cloudinary Verified
                    </div>
                  )}

                  {/* Action Overlay */}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" /> Replace Image
                    </Button>
                    {onImageRemoved && (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="rounded-xl text-xs font-bold"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove();
                        }}
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Remove
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
                  <span className="truncate max-w-[280px] font-mono text-[10px]">
                    {activeDisplayUrl}
                  </span>
                  <a
                    href={activeDisplayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-0.5"
                  >
                    Open <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="py-6 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto shadow-inner group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    Click to choose image or drag & drop here
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    PNG, JPG, WEBP, SVG or GIF (Max 15MB) • Stored on Cloudinary ({CLOUDINARY_CLOUD_NAME})
                  </p>
                </div>
              </div>
            )}

            {/* UPLOAD PROGRESS SPINNER */}
            {isUploading && (
              <div className="absolute inset-0 bg-slate-950/90 rounded-2xl flex flex-col items-center justify-center p-4 z-20">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-2" />
                <p className="text-xs font-black text-white uppercase tracking-wider">
                  Uploading to Cloudinary... {uploadProgress}%
                </p>
                <div className="w-48 h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Acquiring secure HTTPS URL...
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ERROR NOTICE */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-300 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
