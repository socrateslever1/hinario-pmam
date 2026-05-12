import { useState } from 'react';
import { Trash2, Download, RotateCcw } from 'lucide-react';
import { useYouTubeCache } from '@/hooks/useYouTubeCache';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * Gerenciador de cache de vídeos YouTube
 * Mostra histórico, tamanho do cache e permite limpeza
 */
export function YouTubeCacheManager() {
  const { cachedVideos, clearCache, removeVideo, getCacheSize } = useYouTubeCache();
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [videoToRemove, setVideoToRemove] = useState<string | null>(null);

  const cacheSize = getCacheSize();
  const cacheSizeMB = (cacheSize / (1024 * 1024)).toFixed(2);

  const handleClearAll = () => {
    clearCache();
    setShowClearDialog(false);
  };

  const handleRemoveVideo = (videoId: string) => {
    removeVideo(videoId);
    setVideoToRemove(null);
  };

  return (
    <div className="space-y-4">
      {/* Resumo do Cache */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Cache de Vídeos YouTube</h3>
            <p className="text-sm text-gray-600">
              {cachedVideos.length} vídeo{cachedVideos.length !== 1 ? 's' : ''} em cache
            </p>
            <p className="text-xs text-gray-500">
              Tamanho: {cacheSizeMB} MB
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowClearDialog(true)}
            disabled={cachedVideos.length === 0}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Limpar Tudo
          </Button>
        </div>
      </Card>

      {/* Lista de Vídeos em Cache */}
      {cachedVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cachedVideos.map((video) => (
            <Card key={video.videoId} className="overflow-hidden">
              {/* Thumbnail */}
              <div className="relative w-full aspect-video bg-gray-200 overflow-hidden">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setVideoToRemove(video.videoId)}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remover
                  </Button>
                </div>
              </div>

              {/* Informações */}
              <div className="p-3">
                <h4 className="font-medium text-sm line-clamp-2">{video.title}</h4>
                <p className="text-xs text-gray-500 mt-1">
                  ID: {video.videoId}
                </p>
                <p className="text-xs text-gray-500">
                  Assistido em {new Date(video.watchedAt).toLocaleDateString('pt-BR')}
                </p>
                {video.duration && (
                  <p className="text-xs text-gray-500">
                    Duração: {formatDuration(video.duration)}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Download className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-600">Nenhum vídeo em cache</p>
          <p className="text-sm text-gray-500">
            Marque vídeos como assistidos para tê-los disponíveis offline
          </p>
        </Card>
      )}

      {/* Diálogo de Confirmação - Limpar Tudo */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Limpar Cache?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso removerá todos os {cachedVideos.length} vídeo{cachedVideos.length !== 1 ? 's' : ''} em cache.
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll} className="bg-destructive">
              Limpar Tudo
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de Confirmação - Remover Vídeo */}
      <AlertDialog open={videoToRemove !== null} onOpenChange={(open) => {
        if (!open) setVideoToRemove(null);
      }}>
        <AlertDialogContent>
          <AlertDialogTitle>Remover Vídeo?</AlertDialogTitle>
          <AlertDialogDescription>
            O vídeo será removido do cache, mas você pode marcá-lo novamente como assistido.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => videoToRemove && handleRemoveVideo(videoToRemove)}
              className="bg-destructive"
            >
              Remover
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function formatDuration(seconds?: number): string {
  if (!seconds) return 'N/A';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}
