import { useEffect } from "react";

export function useModalHistory(isOpen: boolean, onClose: () => void, modalKey: string) {
  useEffect(() => {
    if (!isOpen) return;

    const stateKey = `modal-${modalKey}`;
    // Adiciona uma entrada fictícia no histórico de navegação para o modal
    window.history.pushState({ modalStateKey: stateKey }, "");

    const handlePopState = (event: PopStateEvent) => {
      // Se voltamos no histórico além do ponto em que o modal estava ativo
      if (event.state?.modalStateKey !== stateKey) {
        onClose();
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      // Se o modal foi fechado programaticamente (isOpen mudou para false),
      // e a entrada de histórico deste modal ainda é a ativa, nós removemos do histórico.
      if (window.history.state?.modalStateKey === stateKey) {
        window.history.back();
      }
    };
  }, [isOpen, onClose, modalKey]);
}
