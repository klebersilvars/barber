import admin from 'firebase-admin';

const initializeFirebase = () => {
  if (!admin.apps.length) {
    const serviceAccount = {
      type: process.env.FIREBASE_TYPE,
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
    };

    // Configuração mais robusta para resolver problemas gRPC
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
      // Configurações de rede mais robustas
      httpAgent: {
        keepAlive: true,
        keepAliveMsecs: 30000,
        maxSockets: 50,
        maxFreeSockets: 10,
        timeout: 120000,
        freeSocketTimeout: 60000,
        // Configurações específicas para gRPC
        family: 4, // Forçar IPv4
        rejectUnauthorized: false // Para desenvolvimento
      }
    });
  }

  const db = admin.firestore();
  
  // Configurações mais robustas para Firestore
  db.settings({
    ignoreUndefinedProperties: true,
    timeoutSeconds: 180, // Aumentado para 3 minutos
    maxRetries: 10, // Aumentado para 10 tentativas
    cacheSizeBytes: admin.firestore.CACHE_SIZE_UNLIMITED,
    // Configurações experimentais para estabilidade
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: true,
    // Configurações de retry mais agressivas
    retryOptions: {
      initialRetryDelayMillis: 500, // Começar com 500ms
      maxRetryDelayMillis: 30000, // Máximo de 30 segundos
      retryDelayMultiplier: 1.5, // Multiplicador mais conservador
      maxRetries: 10 // Máximo de 10 tentativas
    },
    // Configurações de conexão
    preferRest: false, // Usar gRPC por padrão
    // Configurações de timeout
    requestTimeout: 120000, // 2 minutos
    // Configurações de pool de conexões
    poolSize: 10,
    // Configurações de keep-alive
    keepAlive: true,
    keepAliveMsecs: 30000
  });

  return db;
};

export default initializeFirebase; 