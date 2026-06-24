import { useEffect } from 'react';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos

export function useSessionManager() {
  let inactivityTimer: NodeJS.Timeout | null = null;

  useEffect(() => {
    // Detectar inatividade do usuário
    const handleUserActivity = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      inactivityTimer = setTimeout(() => {
        // Se passou muito tempo sem atividade, faz logout
        fetch('/api/trpc/auth.logout', { method: 'POST' }).then(() => {
          window.location.href = '/login';
        });
      }, INACTIVITY_TIMEOUT);
    };

    // Adicionar listeners de atividade
    document.addEventListener('mousemove', handleUserActivity);
    document.addEventListener('keypress', handleUserActivity);
    document.addEventListener('touchstart', handleUserActivity);

    // Iniciar timer de inatividade
    handleUserActivity();

    return () => {
      // Limpar listeners
      document.removeEventListener('mousemove', handleUserActivity);
      document.removeEventListener('keypress', handleUserActivity);
      document.removeEventListener('touchstart', handleUserActivity);

      if (inactivityTimer) clearTimeout(inactivityTimer);
    };
  }, []);
}
