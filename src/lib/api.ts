export const getApiUrl = (endpoint: string): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  if (envUrl && envUrl.trim() !== "") {
    const base = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
    return `${base}${cleanEndpoint}`;
  }

  // In fullstack app, express server runs on same host/origin, so relative endpoints work everywhere (web & mobile)
  if (typeof window !== 'undefined') {
    return cleanEndpoint;
  }
  
  return cleanEndpoint;
};
