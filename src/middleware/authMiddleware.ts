import { auth, firestore } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

// Verifica o status do usuário apenas quando o estado de autenticação muda
auth.onAuthStateChanged(async (user) => {
  if (user) {
    try {
      const collaboratorDoc = await getDoc(doc(firestore, 'colaboradores', user.uid));
      
      if (!collaboratorDoc.exists() || collaboratorDoc.data().status === 'inactive') {
        await signOut(auth);
      }
    } catch (error) {
      console.error('Erro ao verificar status do usuário:', error);
      await signOut(auth);
    }
  }
}); 