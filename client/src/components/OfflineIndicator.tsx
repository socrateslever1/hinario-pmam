import { useEffect, useState } from 'react';
import { WifiOff, Check } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export function OfflineIndicator() {
  const { isOnline } = usePWA();
  const [visible, setVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      // Mostrar indicador offline permanentemente
      setShouldRender(true);
      setVisible(true);
      return;
    }

    // Quando volta online, mostrar "Sincronizado" por 2 segundos
    setShouldRender(true);
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      // Remover do DOM após animação
      setTimeout(() => setShouldRender(false), 300);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isOnline]);

  // Não renderizar nada se não deve aparecer
  if (!shouldRender) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 pointer-events-none">
      {!isOnline ? (
        // Badge offline - permanente
        <div className="bg-red-500 text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4" />
          <span>Offline</span>
        </div>
      ) : visible ? (
        // Badge online - desaparece após 2 segundos
        <div className="bg-green-500 text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium animate-fade-out">
          <Check className="w-4 h-4" />
          <span>Sincronizado</span>
        </div>
      ) : null}
    </div>
  );
}
