// Configuração do Backend
export const BACKEND_URL = 'https://barber-backend-qlt6.onrender.com';

// Endpoints
export const ENDPOINTS = {
  UPLOAD_LOGO: `${BACKEND_URL}/api/upload-logo`,
  TEST_CORS: `${BACKEND_URL}/api/test-cors`,
  TEST_CORS_POST: `${BACKEND_URL}/api/test-cors-post`,
  TEST_CONFIG: `${BACKEND_URL}/api/test-config`,
  CREATE_PREFERENCE: `${BACKEND_URL}/api/create-preference`,
  MERCADOPAGO_WEBHOOK: `${BACKEND_URL}/api/mercadopago-webhook`,
  DECREMENT_PREMIUM: `${BACKEND_URL}/api/decrement-premium-days`,
  CRON_DECREMENT: `${BACKEND_URL}/api/cron/decrementar-dias`,
  TEST_DECREMENT: `${BACKEND_URL}/api/test-decrement`
} as const; 