import { useEffect, useRef, useState } from 'react';

interface VersionInfo {
  version: string;
  timestamp: number;
  buildTime: string;
}

interface AutoUpdateState {
  currentVersion: string | null;
  latestVersion: string | null;
  updateAvailable: boolean;
  isChecking: boolean;
  lastCheckTime: number | null;
  userIsActive: boolean;
}

const STORAGE_KEY = 'hinario_pmam_version';
const CHECK_INTERVAL = 60000; // 1 minuto entre verificações
const INACTIVITY_TIMEOUT = 30000; // 30 segundos de inatividade para considerar usuário inativo

export function useAutoUpdate() {
  const [state, setState] = useState<AutoUpdateState>({
    currentVersion: localStorage.getItem(STORAGE_KEY),
    latestVersion: null,
    updateAvailable: false,
    isChecking: false,
    lastCheckTime: null,
    userIsActive: true,
  });

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const checkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  /**
   * Detectar atividade do usuário
   */
  const detectUserActivity = () => {
    lastActivityRef.current = Date.now();
    setState((prev) => ({ ...prev, userIsActive: true }));

    // Resetar timer de inatividade
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      setState((prev) => ({ ...prev, userIsActive: false }));
    }, INACTIVITY_TIMEOUT);
  };

  /**
   * Verificar versão no servidor
   */
  const checkForUpdates = async () => {
    // Não verificar se usuário está ativo
    if (state.userIsActive) {
      console.log('[AutoUpdate] User is active, skipping check');
      return;
    }

    setState((prev) => ({ ...prev, isChecking: true }));

    try {
      const response = await fetch('/api/version', {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });

      if (!response.ok) {
        throw new Error(`Version check failed: ${response.status}`);
      }

      const versionInfo: VersionInfo = await response.json();
      const latestVersion = versionInfo.version;

      setState((prev) => {
        const hasUpdate = prev.currentVersion && prev.currentVersion !== latestVersion;

        if (hasUpdate) {
          console.log(
            `[AutoUpdate] Update available: ${prev.currentVersion} -> ${latestVersion}`
          );
          localStorage.setItem(STORAGE_KEY, latestVersion);

          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.controller?.postMessage({
              type: 'UPDATE_CACHE_VERSION',
              version: latestVersion,
            });
          }
        }

        return {
          ...prev,
          latestVersion,
          updateAvailable: hasUpdate || false,
          isChecking: false,
          lastCheckTime: Date.now(),
        };
      });
    } catch (error) {
      console.error('[AutoUpdate] Version check failed:', error);
      setState((prev) => ({ ...prev, isChecking: false }));
    }
  };

  /**
   * Aplicar atualização silenciosamente
   */
  const applyUpdate = () => {
    console.log('[AutoUpdate] Applying update silently');

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
    }

    // Aguardar um pouco para o SW processar
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  /**
   * Inicializar hook
   */
  useEffect(() => {
    // Armazenar versão atual na primeira carga
    if (!state.currentVersion) {
      const hash = Buffer.from(`${Date.now()}`).toString('base64').slice(0, 8);
      setState((prev) => ({ ...prev, currentVersion: hash }));
      localStorage.setItem(STORAGE_KEY, hash);
    }

    // Detectar atividade do usuário
    const events = ['mousedown', 'keydown', 'touchstart', 'click', 'scroll'];
    events.forEach((event) => {
      window.addEventListener(event, detectUserActivity, true);
    });

    // Verificar atualizações a cada intervalo
    checkTimerRef.current = setInterval(() => {
      checkForUpdates();
    }, CHECK_INTERVAL);

    // Verificação inicial após 5 segundos
    const initialCheckTimer = setTimeout(() => {
      checkForUpdates();
    }, 5000);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, detectUserActivity, true);
      });

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      if (checkTimerRef.current) {
        clearInterval(checkTimerRef.current);
      }

      clearTimeout(initialCheckTimer);
    };
  }, []);

  /**
   * Aplicar atualização quando disponível e usuário inativo
   */
  useEffect(() => {
    if (state.updateAvailable && !state.userIsActive) {
      console.log('[AutoUpdate] Applying silent update');
      applyUpdate();
    }
  }, [state.updateAvailable, state.userIsActive]);

  return {
    ...state,
    checkForUpdates,
    applyUpdate,
  };
}
