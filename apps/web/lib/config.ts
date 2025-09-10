// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://164.90.197.188:4000';

// Helper function to build API URLs
export const getApiUrl = (endpoint: string) => {
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};
