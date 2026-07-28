export const getApiUrl = (endpoint: string): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  if (envUrl && envUrl.trim() !== "") {
    const base = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
    return `${base}${cleanEndpoint}`;
  }

  // If running in container preview or local dev, use relative endpoint
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('run.app'))) {
    return cleanEndpoint;
  }
  
  // Default backend URL
  return `https://kingj-backend.onrender.com${cleanEndpoint}`;
};
