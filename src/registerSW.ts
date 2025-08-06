// Script para registrar o Service Worker
export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registrado com sucesso:', registration);
          
          // Verificar se há uma nova versão do SW
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('🔄 Nova versão do Service Worker encontrada');
            
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🆕 Nova versão do Service Worker instalada. Recarregue a página para atualizar.');
                // Aqui você pode mostrar uma notificação para o usuário recarregar
                if (confirm('Uma nova versão do app está disponível. Deseja recarregar a página?')) {
                  window.location.reload();
                }
              }
            });
          });
        })
        .catch((error) => {
          console.error('❌ Erro ao registrar Service Worker:', error);
        });
    });
  } else {
    console.log('❌ Service Worker não suportado neste navegador');
  }
}

// Função para verificar se o app está instalado
export function checkIfAppInstalled(): boolean {
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
    console.log('✅ App instalado e rodando em modo standalone');
    return true;
  }
  return false;
}

// Função para solicitar permissão de notificações
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    console.log('🔔 Permissão de notificação:', permission);
    return permission;
  }
  return 'denied';
}

// Função para enviar notificação
export function sendNotification(title: string, options: NotificationOptions = {}): Notification | null {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      ...options
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    return notification;
  }
  return null;
}

// Função para sincronizar dados em background
export async function syncInBackground(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      // Verificar se sync está disponível antes de usar
      if ('sync' in registration) {
        await (registration as any).sync.register('background-sync');
        console.log('🔄 Sincronização em background registrada');
      } else {
        console.log('⚠️ Background Sync não suportado neste navegador');
      }
    } catch (error) {
      console.error('❌ Erro ao sincronizar em background:', error);
    }
  }
} 