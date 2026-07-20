export const getApiUrl = (endpoint: string): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  if (envUrl && envUrl.trim() !== "") {
    const base = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
    return `${base}${cleanEndpoint}`;
  }
  
  return cleanEndpoint;
};
