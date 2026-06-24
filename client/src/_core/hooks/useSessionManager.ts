import { useEffect } from 'react';
import { useLocation } from 'wouter';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos
const BACKGROUND_TIMEOUT = 5 * 60 * 1000; // 5 minutos em background

export function useSessionManager() {
  const [, setLocation] = useLocation();
  let inactivityTimer: NodeJS.Timeout | null = null;
  let backgroundTimer: NodeJS.Timeout | null = null;

  useEffect(() => {
    // Detectar quando o app sai do foco (vai para background)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App foi para background
        backgroundTimer = setTimeout(() => {
          // Se passou muito tempo em background, recarrega
          window.location.reload();
        }, BACKGROUND_TIMEOUT);
      } else {
        // App voltou ao foco
        if (backgroundTimer) {
          clearTimeout(backgroundTimer);
          backgroundTimer = null;
        }
      }
    };

    // Detectar inatividade do usuário
    const handleUserActivity = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      inactivityTimer = setTimeout(() => {
        // Se passou muito tempo sem atividade, recarrega
        window.location.reload();
      }, INACTIVITY_TIMEOUT);
    };

    // Interceptar botão voltar do navegador
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      const confirmed = window.confirm('Deseja sair da sessão?');
      if (confirmed) {
        // Fazer logout
        fetch('/api/trpc/auth.logout', { method: 'POST' }).then(() => {
          window.location.href = '/login';
        });
      } else {
        // Voltar ao estado anterior
        window.history.pushState(null, '', window.location.href);
      }
    };

    // Adicionar listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('mousemove', handleUserActivity);
    document.addEventListener('keypress', handleUserActivity);
    document.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('popstate', handlePopState);

    // Empurrar estado inicial para interceptar voltar
    window.history.pushState(null, '', window.location.href);

    // Iniciar timer de inatividade
    handleUserActivity();

    return () => {
      // Limpar listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('mousemove', handleUserActivity);
      document.removeEventListener('keypress', handleUserActivity);
      document.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('popstate', handlePopState);

      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (backgroundTimer) clearTimeout(backgroundTimer);
    };
  }, []);
}
