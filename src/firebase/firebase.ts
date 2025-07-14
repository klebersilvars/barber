import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, type Auth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, type Firestore, doc, getDoc } from "firebase/firestore";

// Carrega variáveis de ambiente
import dotenv from "dotenv";
dotenv.config();

// Configuração do Firebase a partir de variáveis de ambiente
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

let app;
let analytics;
let auth: Auth;
let firestore: Firestore;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  firestore = getFirestore(app);

  // Analytics só funciona no navegador e fora do localhost
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.error("Erro ao inicializar Firebase:", error);
}

export const loginWithEmailAndPassword = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    const collaboratorDoc = await getDoc(doc(firestore, 'colaboradores', userId));

    if (!collaboratorDoc.exists() || collaboratorDoc.data().status === 'inactive') {
      await signOut(auth);
      throw new Error('Esta conta está desativada ou foi excluída. Entre em contato com o administrador.');
    }

    return userCredential;
  } catch (error: any) {
    console.error('Erro durante o login:', error);
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error('Email ou senha inválidos');
    }
    throw error;
  }
};

export { app, analytics, auth, firestore };
