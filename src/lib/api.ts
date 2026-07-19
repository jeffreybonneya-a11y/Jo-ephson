export const getApiUrl = (endpoint: string): string => {
  const envUrl = import.meta.env.VITE_API_URL || "";
  // If the backend URL points to the Render host, ignore it to use the local full-stack server
  let baseUrl = envUrl || "";
  if (baseUrl.includes("kingj-backend") || baseUrl.includes("onrender.com")) {
    baseUrl = "";
  }
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${cleanBase}${cleanEndpoint}`;
};
