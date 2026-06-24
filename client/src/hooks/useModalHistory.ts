import { useEffect, useRef } from "react";

export function useModalHistory(isOpen: boolean, onClose: () => void, modalKey: string) {
  const onCloseRef = useRef(onClose);

  // Sempre manter o ref do callback atualizado com a versão mais recente
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const stateKey = `modal-${modalKey}`;
    let isApplied = false;

    const handlePopState = (event: PopStateEvent) => {
      // Se voltamos no histórico além do ponto em que o modal estava ativo
      if (event.state?.modalStateKey !== stateKey) {
        onCloseRef.current();
      }
    };

    // Atrasamos a aplicação do histórico para evitar race conditions com outros modais fechando e chamando history.back()
    const timeoutId = setTimeout(() => {
      window.history.pushState({ modalStateKey: stateKey }, "");
      window.addEventListener("popstate", handlePopState);
      isApplied = true;
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      if (isApplied) {
        window.removeEventListener("popstate", handlePopState);
        // Se o modal foi fechado programaticamente (isOpen mudou para false),
        // e a entrada de histórico deste modal ainda é a ativa, nós removemos do histórico.
        if (window.history.state?.modalStateKey === stateKey) {
          window.history.back();
        }
      }
    };
  }, [isOpen, modalKey]); // O efeito não depende de onClose para evitar reinicializações destrutivas
}
