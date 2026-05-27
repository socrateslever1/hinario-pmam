import { useEffect, useState } from 'react';
import { Check, WifiOff } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export function OfflineIndicator() {
  const { isOnline } = usePWA();
  const [showSync, setShowSync] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowSync(false);
      return;
    }

    setShowSync(true);
    const timer = setTimeout(() => setShowSync(false), 3000);
    return () => clearTimeout(timer);
  }, [isOnline]);

  if (isOnline && !showSync) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {!isOnline && (
        <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <WifiOff className="w-5 h-5" />
          <span className="font-medium">Sem conexao com a internet</span>
        </div>
      )}

      {showSync && isOnline && (
        <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <Check className="w-5 h-5" />
          <span className="font-medium">Conexao restaurada</span>
        </div>
      )}
    </div>
  );
}
