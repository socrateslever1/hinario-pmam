import { useEffect, useState } from 'react';
import { AlertCircle, Wifi, WifiOff, Check, Database } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export function OfflineIndicator() {
  const { isOnline, swReady, updateAvailable } = usePWA();
  const [showSync, setShowSync] = useState(false);
  const [cacheSize, setCacheSize] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowSync(false);
      return;
    }

    // Mostrar mensagem de sincronização por 3 segundos
    setShowSync(true);
    const timer = setTimeout(() => setShowSync(false), 3000);
    return () => clearTimeout(timer);
  }, [isOnline]);

  // Calcular tamanho do cache
  useEffect(() => {
    const calculateCacheSize = async () => {
      try {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          const usedMB = (estimate.usage! / 1024 / 1024).toFixed(2);
          setCacheSize(`${usedMB} MB`);
        }
      } catch (err) {
        console.warn('[OfflineIndicator] Erro ao calcular cache:', err);
      }
    };

    calculateCacheSize();
    const interval = setInterval(calculateCacheSize, 10000);
    return () => clearInterval(interval);
  }, []);

  // Não mostrar nada se online e sem atualizações
  if (isOnline && !updateAvailable && !showSync) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {/* Indicador de Offline */}
      {!isOnline && (
        <div 
          className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse cursor-pointer hover:bg-red-600 transition"
          onClick={() => setShowDetails(!showDetails)}
        >
          <WifiOff className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-medium block">Modo offline</span>
            <span className="text-xs opacity-90">Dados em cache</span>
          </div>
          <Database className="w-4 h-4 flex-shrink-0" />
        </div>
      )}

      {/* Detalhes do Cache (quando offline) */}
      {!isOnline && showDetails && cacheSize && (
        <div className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          <p className="font-medium mb-1">Cache disponível:</p>
          <p className="opacity-90">{cacheSize}</p>
          <p className="opacity-75 text-xs mt-1">Você pode acessar hinos, estudos e drill offline</p>
        </div>
      )}

      {/* Indicador de Sincronização */}
      {showSync && isOnline && (
        <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <Check className="w-5 h-5" />
          <div className="flex-1">
            <span className="font-medium block">Sincronizado</span>
            <span className="text-xs opacity-90">Conectado à internet</span>
          </div>
        </div>
      )}

      {/* Indicador de Atualização Disponível */}
      {updateAvailable && (
        <div className="bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Atualização disponível</p>
            <p className="text-sm opacity-90">Recarregue para instalar</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="ml-2 px-3 py-1 bg-white text-blue-500 rounded font-medium text-sm hover:bg-opacity-90 transition flex-shrink-0"
          >
            Atualizar
          </button>
        </div>
      )}

      {/* Status do Service Worker */}
      {!swReady && (
        <div className="bg-yellow-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <Wifi className="w-5 h-5 animate-spin flex-shrink-0" />
          <div className="flex-1">
            <span className="font-medium block">Preparando offline</span>
            <span className="text-xs opacity-90">Service Worker ativando...</span>
          </div>
        </div>
      )}

      {/* Indicador de Online (quando volta) */}
      {isOnline && swReady && !updateAvailable && !showSync && (
        <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm opacity-75">
          <Wifi className="w-4 h-4" />
          <span>Online - PWA pronto</span>
        </div>
      )}
    </div>
  );
}
