// API Configuration - HARDCODED FOR PRODUCTION
// Since environment variables are not working reliably on Render, we'll hardcode the correct URL
const getApiBaseUrl = () => {
  // Always use the correct API URL in production
  if (typeof window !== 'undefined') {
    // Check if we're on Render
    if (window.location.hostname.includes('onrender.com')) {
      return 'https://tms-api-zcib.onrender.com';
    }
    // For localhost development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:4000';
    }
  }
  
  // Server-side rendering fallback
  return process.env.NEXT_PUBLIC_API_URL || 'https://tms-api-zcib.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();

// Debug logging (remove in production)
if (typeof window !== 'undefined') {
  console.log('🔧 API Configuration Debug:');
  console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('Window location:', window.location.hostname);
  console.log('All env vars:', Object.keys(process.env).filter(key => key.includes('API')));
}

// Helper function to build API URLs
export const getApiUrl = (endpoint: string) => {
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${baseUrl}${cleanEndpoint}`;
  
  // Debug logging
  if (typeof window !== 'undefined') {
    console.log(`🔗 Building API URL: ${endpoint} -> ${fullUrl}`);
  }
  
  return fullUrl;
};
