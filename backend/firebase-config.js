import admin from 'firebase-admin';

// Configurações do Firebase - carregadas de variáveis de ambiente
const initializeFirebase = () => {
  if (!admin.apps.length) {
    // Processar a chave privada corretamente
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
    
    // Remover aspas extras se existirem
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    
    // Substituir \\n por quebras de linha reais
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    // Validar se a chave privada está no formato correto
    if (!privateKey.includes('BEGIN PRIVATE KEY') && !privateKey.includes('BEGIN RSA PRIVATE KEY')) {
      console.error('❌ ERRO: Chave privada do Firebase parece estar incorreta ou ausente!');
      console.error('A chave deve começar com "-----BEGIN PRIVATE KEY-----" ou "-----BEGIN RSA PRIVATE KEY-----"');
      throw new Error('FIREBASE_PRIVATE_KEY inválida ou ausente');
    }
    
    const serviceAccount = {
      type: process.env.FIREBASE_TYPE || 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
      token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN || 'googleapis.com'
    };

    try {
      // Inicializar Firebase Admin SDK com as credenciais de variáveis de ambiente
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      console.log('✅ Firebase Admin SDK inicializado com sucesso');
    } catch (initError) {
      console.error('❌ ERRO ao inicializar Firebase Admin SDK:', initError.message);
      throw initError;
    }
  }

  const db = admin.firestore();
  
  // Configurações mais robustas para Firestore
  db.settings({
    ignoreUndefinedProperties: true
  });

  return db;
};

export default initializeFirebase;
