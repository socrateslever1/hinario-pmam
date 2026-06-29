import { useEffect, useState } from 'react';
import { WifiOff, Check } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export function OfflineIndicator() {
  const { isOnline } = usePWA();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setVisible(true);
      return;
    }

    // Mostrar "Sincronizado" por 2 segundos quando volta online
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, [isOnline]);

  // Não mostrar nada se online
  if (isOnline && !visible) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOnline ? (
        // Badge offline - simples e sucinto
        <div className="bg-red-500 text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4" />
          <span>Offline</span>
        </div>
      ) : (
        // Badge online - desaparece após 2 segundos
        <div className="bg-green-500 text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium animate-fade-out">
          <Check className="w-4 h-4" />
          <span>Sincronizado</span>
        </div>
      )}
    </div>
  );
}
