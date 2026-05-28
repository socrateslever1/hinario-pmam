import { useEffect, useState } from 'react';
import { AlertCircle, Wifi, WifiOff, Check } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export function OfflineIndicator() {
  const { isOnline, swReady, updateAvailable } = usePWA();
  const [showSync, setShowSync] = useState(false);

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

  // Não mostrar nada se online e sem atualizações
  if (isOnline && !updateAvailable && !showSync) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {/* Indicador de Offline */}
      {!isOnline && (
        <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <WifiOff className="w-5 h-5" />
          <span className="font-medium">Modo offline - Dados em cache</span>
        </div>
      )}

      {/* Indicador de Sincronização */}
      {showSync && isOnline && (
        <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <Check className="w-5 h-5" />
          <span className="font-medium">Sincronizado com sucesso</span>
        </div>
      )}

      {/* Indicador de Atualização Disponível */}
      {updateAvailable && (
        <div className="bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <div className="flex-1">
            <p className="font-medium">Atualização disponível</p>
            <p className="text-sm opacity-90">Recarregue para instalar</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="ml-2 px-3 py-1 bg-white text-blue-500 rounded font-medium text-sm hover:bg-opacity-90 transition"
          >
            Atualizar
          </button>
        </div>
      )}

      {/* Status do Service Worker */}
      {!swReady && (
        <div className="bg-yellow-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <Wifi className="w-5 h-5 animate-spin" />
          <span className="font-medium">Preparando modo offline...</span>
        </div>
      )}
    </div>
  );
}
