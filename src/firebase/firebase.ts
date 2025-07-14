import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, type Auth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, type Firestore, doc, getDoc } from "firebase/firestore";

// Remover dotenv do frontend
// Configuração do Firebase com as chaves diretamente no arquivo
const firebaseConfig = {
  apiKey: "AIzaSyB5l4GKLnTngSJCbzguRHYdhsQVqN8hSoE",
  authDomain: "cliqagenda-45f37.firebaseapp.com",
  projectId: "cliqagenda-45f37",
  storageBucket: "cliqagenda-45f37.firebasestorage.app",
  messagingSenderId: "220545416405",
  appId: "1:220545416405:web:54ff95bfaca0b1bef5f65c",
  measurementId: "G-VZN6PPFKND",
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
