import { Download, Check, AlertCircle } from 'lucide-react';
import { useYouTubeCache } from '@/hooks/useYouTubeCache';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface YouTubeOfflineIndicatorProps {
  youtubeUrl?: string;
  onWatched?: () => void;
}

/**
 * Indicador que mostra se um vídeo YouTube está disponível offline
 * Permite marcar vídeo como assistido para cache
 */
export function YouTubeOfflineIndicator({
  youtubeUrl,
  onWatched,
}: YouTubeOfflineIndicatorProps) {
  const { isOnline } = usePWA();
  const { isVideoCached, markVideoAsWatched, getCachedVideo } = useYouTubeCache();

  if (!youtubeUrl) return null;

  const isCached = isVideoCached(youtubeUrl);
  const cachedVideo = getCachedVideo(youtubeUrl);

  const handleMarkAsWatched = async () => {
    await markVideoAsWatched(youtubeUrl);
    onWatched?.();
  };

  return (
    <div className="flex items-center gap-2">
      {/* Indicador de Disponibilidade Offline */}
      {isCached ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-sm">
              <Check className="w-4 h-4" />
              <span>Em cache</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p>Vídeo disponível offline</p>
              {cachedVideo && (
                <p className="text-xs opacity-75">
                  Assistido em {new Date(cachedVideo.watchedAt).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Não em cache</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Clique em "Marcar como assistido" para cachear este vídeo
          </TooltipContent>
        </Tooltip>
      )}

      {/* Botão para Marcar como Assistido */}
      {!isCached && isOnline && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleMarkAsWatched}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Marcar como assistido
        </Button>
      )}

      {/* Indicador Offline */}
      {!isOnline && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-xs text-gray-500">Modo offline</div>
          </TooltipTrigger>
          <TooltipContent>
            Você está offline. Apenas vídeos em cache podem ser acessados.
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
