import admin from 'firebase-admin';

const initializeFirebase = () => {
  if (!admin.apps.length) {
    // Credenciais do Firebase definidas diretamente
    const serviceAccount = {
      type: "service_account",
      project_id: "cliqagenda-45f37",
      private_key_id: "3adf6158e2ece925eed2634a700571a156266c06",
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDWe2GCC8qtgbox\nVIUmO4WdrRqu9OeCMRKpJQ54MP1F1t/gToNfgroOQdlFXqjd9Kc/30CpRi08AE3M\nssccy1MuBDZvxLGnmhZ5Vxu+bSC2UPxYiKBasiXPQJHDexvx+67U4nDBO67vKK3q\npEZ4AuiJrkhiHUzFZGVv9c3rDTGLdI0LRN21BWK5R2fRTmmVzm4flw5N32blfod8\n7DwgK6L+p+E6SFiofSpC8s1mnL7ePwfgu9b3WIrPhQKHc87Fg178OooctwYvtK3L\n67niwETy9/qtt43xiL0O0fVJU4RkD2IQOx7tEGcYzMwqheDqX5oBXHH98qqEQneY\nC+8j5MhhAgMBAAECggEAVbnx4ss4wrnXxFDOeVYQFVIzmJtdjx1zInUjv+mAyfHV\nALAQ9VNobztljsMDhtd7I93lV+MrQFC0x+zrBbjE8d8QLQM2qNE/S1eESMwQZ56e\nBfrx8N5Em35o5HOn20PoAMHTJIDo7kFZpi/r1JsA+8rTtpeUcE8s9h+OovTeiSic\nq25Gv1kEBQECpX/HUayCtr/1lMHhKj1sZxbDECy52KLH7YVALUJKYHoWuX/RBRga\nqLvwMWnc+cCfVKLNyz4XkfTZuPXuPvmCy+3oCjQIE47oB8iPu8w6dCQfSkic4cGQ\nlQ474a6J7nGMV0Jt7hJlgDPQYevnOxskiI8nwNhfcwKBgQDymwHVe5DJREKa0rzo\nYbFFX9gFBwNTYp3x0yuEtsVFNHkOxsVy4VIFymBQLUQ6LQgEvJjFTDw8bC369Nms\nTYbyfaLTUOuDLcUK044lqvi5dYYlS0R2GEaPZuOQqKtYP1XJLwwG3oUw8OMhbmxS\nMyEXennpCJdPyj4TXks06SQR+wKBgQDiUt/0xl2TUIaiWYHdXmTNM83oVurLkNjU\nDJiDd/a5So9z0h4WMY2mBlSfspM5jZYHORWlffVkGkVVrSJ0YsoW7lfhMYGlIs4h\nx+inkoQ/9orpCUtJkgXuEaZ/k+EujwWjT6kF6LpPxq+Su+qYnao5BxqqZ4STWz/K\na5uxwFqcUwKBgDK37zE3TPSWvanqZq3aRpovSFT8u1hCZKy6rf1nzGQEbU6GhZ7X\ntjMZtPruC7Zx1ZxP5UxR/MHRB+fQKnWYG580Xsb4wtPAzNHPmocLcEYtaKcBTkW2\nG4I9S1PhvziKvR97I3OIL6YkpgdGM4UXxVJIO5ZZQnDe4g1giC5+kxjjAoGAOFBs\nv2g4UnZ/+ZeR87YQGOsh+gTeiWZyPVkg/d10u6gsx6HpsJYF6+C5X788WN69DPEM\nTNBppc3PoMDiyNjn9gq6PSNnYeKmLcujPUb8tzmuWMviOt0lspYburTeHAqkWX1x\nzjGZYk5K05UEi5L3jxcQcIQvfcb/uWtLI1B8e1cCgYAD6VrAxVPTtBFTR0Gp3wgY\n4Y6nt+8kb9J30IhqllADiRYh9uGyOQzL0AjwrcV/vTThGNCglwwJJI0mzwT6sAGh\n7TngBdY9+S0jWQPh6GvkmzDFT/RLd0Yb6NrVfoqO+ibC0FaDnxtbXCTAzdpQoobb\nDsTy1JOaHiwBjkfIOdJWhA==\n-----END PRIVATE KEY-----\n",
      client_email: "firebase-adminsdk-fbsvc@cliqagenda-45f37.iam.gserviceaccount.com",
      client_id: "116803846830973112231",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40cliqagenda-45f37.iam.gserviceaccount.com",
      universe_domain: "googleapis.com"
    };

    try {
      // Configuração mais robusta para resolver problemas gRPC
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: "cliqagenda-45f37"
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