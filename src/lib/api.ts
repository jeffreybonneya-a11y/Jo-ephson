export const getApiUrl = (endpoint: string): string => {
  const envUrl = import.meta.env.VITE_API_URL || "";
  // Ignore kingj-backend.onrender.com or any onrender URL and default to the current host (same domain)
  const baseUrl = (envUrl && !envUrl.includes("kingj-backend") && !envUrl.includes("onrender.com")) ? envUrl : "";
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${cleanBase}${cleanEndpoint}`;
};
