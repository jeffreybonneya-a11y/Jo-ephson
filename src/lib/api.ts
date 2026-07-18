export const getApiUrl = (endpoint: string): string => {
  const envUrl = import.meta.env.VITE_API_URL || "";
  // Respect VITE_API_URL directly so it points to the user's actual backend (e.g., https://kingj-backend.onrender.com)
  const baseUrl = envUrl || "";
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${cleanBase}${cleanEndpoint}`;
};
