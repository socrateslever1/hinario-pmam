import { useEffect } from "react";
import { getStudentSession, saveStudentSession } from "@/lib/studentSession";

/**
 * Hook para renovar automaticamente a sessão do aluno
 * Estende a expiração a cada 5 minutos de atividade
 */
export function useSessionRefresh() {
  useEffect(() => {
    const refreshSession = () => {
      const session = getStudentSession();
      if (session) {
        // Renovar sessão por mais 30 dias
        saveStudentSession(session);
      }
    };

    // Renovar sessão a cada 5 minutos de atividade
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    let refreshTimer: NodeJS.Timeout;

    const handleActivity = () => {
      // Limpar timer anterior
      if (refreshTimer) clearTimeout(refreshTimer);

      // Renovar após 5 minutos de inatividade
      refreshTimer = setTimeout(() => {
        refreshSession();
      }, 5 * 60 * 1000);
    };

    // Adicionar listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Renovar sessão ao montar o hook
    refreshSession();

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, []);
}
