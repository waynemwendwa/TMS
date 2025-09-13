// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tms-api-zcib.onrender.com';

// Debug logging (remove in production)
if (typeof window !== 'undefined') {
  console.log('🔧 API Configuration Debug:');
  console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  console.log('API_BASE_URL:', API_BASE_URL);
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
