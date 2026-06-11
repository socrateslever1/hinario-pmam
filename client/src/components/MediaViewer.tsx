import { useState } from "react";
import { X, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface MediaItem {
  id: number;
  url: string;
  type: "image" | "video" | "audio" | "pdf" | "document";
  title?: string;
  mimeType?: string;
}

interface MediaViewerProps {
  media: MediaItem[];
  onDelete?: (id: number) => void;
  readOnly?: boolean;
}

export function MediaViewer({ media, onDelete, readOnly = false }: MediaViewerProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handlePreview = (item: MediaItem) => {
    setSelectedMedia(item);
    setIsOpen(true);
  };

  const handleDownload = (url: string, title?: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = title || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!media.length) return null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {media.map((item) => (
          <div key={item.id} className="relative group border rounded-lg overflow-hidden bg-muted">
            {/* Thumbnail */}
            {item.type === "image" && (
              <img
                src={item.url}
                alt={item.title}
                className="w-full h-40 object-cover"
              />
            )}
            {item.type === "video" && (
              <div className="w-full h-40 bg-black flex items-center justify-center">
                <span className="text-white text-2xl">▶</span>
              </div>
            )}
            {item.type === "audio" && (
              <div className="w-full h-40 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-2xl">♪</span>
              </div>
            )}
            {(item.type === "pdf" || item.type === "document") && (
              <div className="w-full h-40 bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-2xl">📄</span>
              </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                size="icon"
                variant="secondary"
                onClick={() => handlePreview(item)}
                title="Visualizar"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={() => handleDownload(item.url, item.title)}
                title="Baixar"
              >
                <Download className="h-4 w-4" />
              </Button>
              {!readOnly && onDelete && (
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => onDelete(item.id)}
                  title="Remover"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Title */}
            {item.title && (
              <div className="p-2 text-xs font-medium truncate text-foreground">
                {item.title}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMedia?.title || "Visualizar Mídia"}</DialogTitle>
          </DialogHeader>

          {selectedMedia && (
            <div className="w-full">
              {selectedMedia.type === "image" && (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.title}
                  className="w-full max-h-96 object-contain"
                />
              )}

              {selectedMedia.type === "video" && (
                <video
                  src={selectedMedia.url}
                  controls
                  className="w-full max-h-96"
                />
              )}

              {selectedMedia.type === "audio" && (
                <audio
                  src={selectedMedia.url}
                  controls
                  className="w-full"
                />
              )}

              {selectedMedia.type === "pdf" && (
                <iframe
                  src={`${selectedMedia.url}#toolbar=1`}
                  className="w-full h-96 border rounded"
                  title="PDF Viewer"
                />
              )}

              {selectedMedia.type === "document" && (
                <div className="p-4 text-center text-muted-foreground">
                  <p className="mb-4">Documento: {selectedMedia.title}</p>
                  <Button
                    onClick={() => handleDownload(selectedMedia.url, selectedMedia.title)}
                  >
                    Baixar Documento
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
