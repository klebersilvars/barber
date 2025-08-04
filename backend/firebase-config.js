import admin from 'firebase-admin';

// Configurações robustas para o Firebase Admin SDK
const initializeFirebase = () => {
  if (!admin.apps.length) {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
      // Configurações para resolver problemas de gRPC
      httpAgent: {
        keepAlive: true,
        keepAliveMsecs: 30000,
        maxSockets: 10,
        maxFreeSockets: 5,
        timeout: 60000,
        freeSocketTimeout: 30000
      }
    });
  }

  const db = admin.firestore();

  // Configurar Firestore com retry e timeout
  db.settings({
    ignoreUndefinedProperties: true,
    timeoutSeconds: 60,
    maxRetries: 3,
    // Configurações adicionais para estabilidade
    cacheSizeBytes: admin.firestore.CACHE_SIZE_UNLIMITED,
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: true
  });

  return db;
};

export default initializeFirebase; 