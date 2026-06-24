import React, { useState, useRef } from 'react';
import { Upload, Loader2, Image as ImageIcon, Trash2, RefreshCw } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { toast } from 'sonner';

interface ImageUploaderProps {
  value: string; // The current image URL (can be empty string)
  onChange: (url: string) => void; // Called when image is successfully uploaded or deleted
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ value, onChange }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress image helper using HTML5 Canvas API
  const compressAndResizeImage = (file: File, maxWidth = 800, maxHeight = 800): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize calculations keeping aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context could not be established'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Blob conversion failed'));
              }
            },
            'image/jpeg',
            0.85 // quality compression
          );
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type! Please upload a JPG, JPEG, PNG, or WEBP image.');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Uploading and processing image...');

    try {
      // Compress and resize
      const compressedBlob = await compressAndResizeImage(file);
      
      // Upload to Firebase Storage under the bundles/ directory
      const storageRef = ref(storage, `bundles/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`);
      const uploadResult = await uploadBytes(storageRef, compressedBlob, {
        contentType: 'image/jpeg'
      });
      
      const downloadUrl = await getDownloadURL(uploadResult.ref);
      
      onChange(downloadUrl);
      toast.success('Image uploaded successfully! 👑', { id: toastId });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(`Upload failed: ${error.message || 'Please check your internet or Firebase Storage rules.'}`, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = async () => {
    if (!value) return;
    
    // We can just clear the field
    onChange('');
    toast.success('Image removed from form! Save the product to commit.');
  };

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative group rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden h-[160px] flex items-center justify-center">
          <img 
            src={value} 
            alt="Product Preview" 
            className="w-full h-full object-cover object-center"
          />
          {/* Overlay actions */}
          <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`h-[160px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all ${
            dragActive 
              ? 'border-amber-500 bg-amber-500/5' 
              : 'border-slate-800 bg-slate-950/50 hover:bg-slate-900/50 hover:border-amber-500/30'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Uploading Image...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-500">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-300">Upload Product Image</p>
              <p className="text-[10px] font-medium text-slate-500 max-w-[200px]">
                Drag and drop or click to upload (JPG, PNG, WEBP)
              </p>
            </div>
          )}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
      />
    </div>
  );
};
