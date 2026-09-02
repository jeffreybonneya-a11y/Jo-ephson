/**
 * Cloudinary Integration for King J Deals
 * Cloud Name: hanx6mkn
 * Upload Preset: kingjdeals_uploads (unsigned)
 */

export const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'hanx6mkn';

export const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'kingjdeals_uploads';

export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export interface CloudinaryUploadOptions {
  folder?: string;
  onProgress?: (percent: number) => void;
  maxSizeBytes?: number; // default 15MB
}

export interface CloudinaryUploadResult {
  success: boolean;
  url: string;
  publicId?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  error?: string;
}

/**
 * Validates whether a file is an acceptable image type
 */
export function validateImageFile(
  file: File | Blob,
  maxSizeBytes = 15 * 1024 * 1024
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided for upload.' };
  }

  // Type check (File or Blob)
  const type = file.type || '';
  if (type && !type.startsWith('image/')) {
    return {
      valid: false,
      error: 'Invalid file type. Please select an image file (PNG, JPG, JPEG, WEBP, SVG, or GIF).',
    };
  }

  // Size check
  if (file.size > maxSizeBytes) {
    const sizeInMB = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is ${sizeInMB}MB.`,
    };
  }

  return { valid: true };
}

/**
 * Direct unsigned upload to Cloudinary with real-time upload progress tracking.
 * Secure HTTPS URL is returned upon successful upload.
 */
export async function uploadToCloudinary(
  file: File | Blob | string,
  options?: CloudinaryUploadOptions
): Promise<CloudinaryUploadResult> {
  const { onProgress, maxSizeBytes = 15 * 1024 * 1024 } = options || {};

  // Check config
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    return {
      success: false,
      url: '',
      error: 'Missing Cloudinary configuration. Cloud Name and Upload Preset are required.',
    };
  }

  // Validate if File/Blob
  if (typeof file !== 'string') {
    const validation = validateImageFile(file, maxSizeBytes);
    if (!validation.valid) {
      return {
        success: false,
        url: '',
        error: validation.error || 'Invalid image file.',
      };
    }
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  if (options?.folder) {
    formData.append('folder', options.folder);
  }

  return new Promise<CloudinaryUploadResult>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', CLOUDINARY_UPLOAD_URL, true);

    // Track real-time progress
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          onProgress(percentComplete);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data && data.secure_url) {
            resolve({
              success: true,
              url: data.secure_url,
              publicId: data.public_id,
              format: data.format,
              width: data.width,
              height: data.height,
              bytes: data.bytes,
            });
          } else {
            resolve({
              success: false,
              url: '',
              error: 'Cloudinary responded without a valid secure image URL.',
            });
          }
        } catch (e: any) {
          resolve({
            success: false,
            url: '',
            error: `Failed to parse Cloudinary response: ${e.message}`,
          });
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          const errorMsg =
            errData?.error?.message ||
            `Cloudinary upload failed with HTTP status ${xhr.status}`;
          resolve({
            success: false,
            url: '',
            error: errorMsg,
          });
        } catch {
          resolve({
            success: false,
            url: '',
            error: `Upload to Cloudinary failed (${xhr.status}: ${xhr.statusText || 'Server error'})`,
          });
        }
      }
    };

    xhr.onerror = () => {
      resolve({
        success: false,
        url: '',
        error: 'Network error occurred while connecting to Cloudinary. Please check your internet connection.',
      });
    };

    xhr.ontimeout = () => {
      resolve({
        success: false,
        url: '',
        error: 'Cloudinary upload request timed out. Please try again.',
      });
    };

    xhr.send(formData);
  });
}

/**
 * Checks if a given URL is hosted on Cloudinary
 */
export function isCloudinaryUrl(url?: string): boolean {
  if (!url) return false;
  return url.includes('cloudinary.com') || url.startsWith('https://res.cloudinary.com/');
}

/**
 * Helper to get optimized Cloudinary image transformations (responsive sizing, auto format, webp)
 */
export function getOptimizedCloudinaryUrl(
  url?: string,
  transformations: { width?: number; height?: number; crop?: string; quality?: string | number } = {}
): string {
  if (!url) return '';
  if (!isCloudinaryUrl(url)) return url; // Pass through non-Cloudinary (Firebase Storage, Unsplash, etc.)

  const { width, height, crop = 'limit', quality = 'auto' } = transformations;
  const transforms: string[] = ['f_auto', `q_${quality}`];

  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (width || height) transforms.push(`c_${crop}`);

  const transformString = transforms.join(',');

  // URL format: https://res.cloudinary.com/<cloud_name>/image/upload/<transformations>/<version_or_path>
  const uploadIndex = url.indexOf('/image/upload/');
  if (uploadIndex === -1) return url;

  const prefix = url.substring(0, uploadIndex + '/image/upload/'.length);
  const suffix = url.substring(uploadIndex + '/image/upload/'.length);

  // If already contains transformation string, don't duplicate
  if (suffix.startsWith('f_auto') || suffix.startsWith('w_') || suffix.startsWith('q_')) {
    return url;
  }

  return `${prefix}${transformString}/${suffix}`;
}
