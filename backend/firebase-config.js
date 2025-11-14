import admin from 'firebase-admin';

// Configurações do Firebase - definidas diretamente no código
const FIREBASE_CONFIG = {
  type: 'service_account',
  project_id: 'cliqagenda-45f37',
  private_key_id: '3adf6158e2ece925eed2634a700571a156266c06',
  private_key: `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDWe2GCC8qtgbox
VIUmO4WdrRqu9OeCMRKpJQ54MP1F1t/gToNfgroOQdlFXqjd9Kc/30CpRi08AE3M
ssccy1MuBDZvxLGnmhZ5Vxu+bSC2UPxYiKBasiXPQJHDexvx+67U4nDBO67vKK3q
pEZ4AuiJrkhiHUzFZGVv9c3rDTGLdI0LRN21BWK5R2fRTmmVzm4flw5N32blfod8
7DwgK6L+p+E6SFiofSpC8s1mnL7ePwfgu9b3WIrPhQKHc87Fg178OooctwYvtK3L
67niwETy9/qtt43xiL0O0fVJU4RkD2IQOx7tEGcYzMwqheDqX5oBXHH98qqEQneY
C+8j5MhhAgMBAAECggEAVbnx4ss4wrnXxFDOeVYQFVIzmJtdjx1zInUjv+mAyfHV
ALAQ9VNobztljsMDhtd7I93lV+MrQFC0x+zrBbjE8d8QLQM2qNE/S1eESMwQZ56e
Bfrx8N5Em35o5HOn20PoAMHTJIDo7kFZpi/r1JsA+8rTtpeUcE8s9h+OovTeiSic
q25Gv1kEBQECpX/HUayCtr/1lMHhKj1sZxbDECy52KLH7YVALUJKYHoWuX/RBRga
qLvwMWnc+cCfVKLNyz4XkfTZuPXuPvmCy+3oCjQIE47oB8iPu8w6dCQfSkic4cGQ
lQ474a6J7nGMV0Jt7hJlgDPQYevnOxskiI8nwNhfcwKBgQDymwHVe5DJREKa0rzo
YbFFX9gFBwNTYp3x0yuEtsVFNHkOxsVy4VIFymBQLUQ6LQgEvJjFTDw8bC369Nms
TYbyfaLTUOuDLcUK044lqvi5dYYlS0R2GEaPZuOQqKtYP1XJLwwG3oUw8OMhbmxS
MyEXennpCJdPyj4TXks06SQR+wKBgQDiUt/0xl2TUIaiWYHdXmTNM83oVurLkNjU
DJiDd/a5So9z0h4WMY2mBlSfspM5jZYHORWlffVkGkVVrSJ0YsoW7lfhMYGlIs4h
x+inkoQ/9orpCUtJkgXuEaZ/k+EujwWjT6kF6LpPxq+Su+qYnao5BxqqZ4STWz/K
a5uxwFqcUwKBgDK37zE3TPSWvanqZq3aRpovSFT8u1hCZKy6rf1nzGQEbU6GhZ7X
tjMZtPruC7Zx1ZxP5UxR/MHRB+fQKnWYG580Xsb4wtPAzNHPmocLcEYtaKcBTkW2
G4I9S1PhvziKvR97I3OIL6YkpgdGM4UXxVJIO5ZZQnDe4g1giC5+kxjjAoGAOFBs
v2g4UnZ/+ZeR87YQGOsh+gTeiWZyPVkg/d10u6gsx6HpsJYF6+C5X788WN69DPEM
TNBppc3PoMDiyNjn9gq6PSNnYeKmLcujPUb8tzmuWMviOt0lspYburTeHAqkWX1x
zjGZYk5K05UEi5L3jxcQcIQvfcb/uWtLI1B8e1cCgYAD6VrAxVPTtBFTR0Gp3wgY
4Y6nt+8kb9J30IhqllADiRYh9uGyOQzL0AjwrcV/vTThGNCglwwJJI0mzwT6sAGh
7TngBdY9+S0jWQPh6GvkmzDFT/RLd0Yb6NrVfoqO+ibC0FaDnxtbXCTAzdpQoobb
DsTy1JOaHiwBjkfIOdJWhA==
-----END PRIVATE KEY-----`,
  client_email: 'firebase-adminsdk-fbsvc@cliqagenda-45f37.iam.gserviceaccount.com',
  client_id: '116803846830973112231',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40cliqagenda-45f37.iam.gserviceaccount.com',
  universe_domain: 'googleapis.com'
};

const initializeFirebase = () => {
  if (!admin.apps.length) {
    try {
      // Inicializar Firebase Admin SDK com as credenciais definidas diretamente
      admin.initializeApp({
        credential: admin.credential.cert(FIREBASE_CONFIG),
        projectId: FIREBASE_CONFIG.project_id
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