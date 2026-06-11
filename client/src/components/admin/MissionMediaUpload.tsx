import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Trash2, Image, Music, FileText, Video, X } from "lucide-react";

interface MissionMediaUploadProps {
  missionId: number;
  onMediaUploaded?: () => void;
}

export function MissionMediaUpload({ missionId, onMediaUploaded }: MissionMediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [mediaType, setMediaType] = useState<"image" | "video" | "audio" | "pdf" | "document">("image");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const utils = trpc.useUtils();
  const uploadMedia = trpc.missions.uploadMedia.useMutation({
    onSuccess: () => {
      utils.missions.getMedia.invalidate({ missionId });
      onMediaUploaded?.();
    },
    onError: (e) => toast.error(e.message),
  });

  const { data: mediaList } = trpc.missions.getMedia.useQuery({ missionId });

  const deleteMedia = trpc.missions.deleteMedia.useMutation({
    onSuccess: () => {
      toast.success("Mídia removida");
      utils.missions.getMedia.invalidate({ missionId });
    },
    onError: (e) => toast.error(e.message),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    for (const file of selectedFiles) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error(`${file.name}: Arquivo muito grande (máximo 100MB)`);
        continue;
      }
      validFiles.push(file);
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Selecione pelo menos um arquivo");
      return;
    }

    setUploading(true);
    let successCount = 0;

    for (const file of files) {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Data = (e.target?.result as string).split(",")[1];
          uploadMedia.mutate(
            {
              missionId,
              type: mediaType,
              fileName: file.name,
              mimeType: file.type,
              base64Data,
              title: title || file.name,
              description,
            },
            {
              onSuccess: () => {
                successCount++;
                if (successCount === files.length) {
                  toast.success(`${files.length} arquivo(s) enviado(s)`);
                  setFiles([]);
                  setTitle("");
                  setDescription("");
                }
              },
            }
          );
        };
        reader.readAsDataURL(file);
      } catch (error) {
        toast.error(`Erro ao processar ${file.name}`);
      }
    }

    setUploading(false);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "audio":
        return <Music className="h-4 w-4" />;
      case "pdf":
      case "document":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 p-4 border border-dashed border-border rounded-lg">
        <div>
          <Label>Tipo de Mídia</Label>
          <select
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value as any)}
            className="w-full px-3 py-2 border border-input rounded-md text-sm"
          >
            <option value="image">Imagem</option>
            <option value="video">Vídeo</option>
            <option value="audio">Áudio</option>
            <option value="pdf">PDF</option>
            <option value="document">Documento</option>
          </select>
        </div>

        <div>
          <Label>Título (opcional)</Label>
          <Input
            placeholder="Título da mídia"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <Label>Descrição (opcional)</Label>
          <Input
            placeholder="Descrição breve"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <Label>Arquivos (múltiplos)</Label>
          <Input
            type="file"
            multiple
            onChange={handleFileSelect}
            accept={
              mediaType === "image"
                ? "image/*"
                : mediaType === "video"
                  ? "video/*"
                  : mediaType === "audio"
                    ? "audio/*"
                    : mediaType === "pdf"
                      ? ".pdf"
                      : ".doc,.docx,.txt"
            }
          />
          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs text-muted-foreground bg-muted p-2 rounded">
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-destructive hover:underline ml-2"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          {files.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {files.length} arquivo(s) selecionado(s)
            </div>
          )}
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading || uploadMedia.isPending}
            className="w-full bg-[#1a3a2a] text-white gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading || uploadMedia.isPending ? "Enviando..." : "Enviar Mídia(s)"}
          </Button>
          {files.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setFiles([])}
              className="w-full"
            >
              Limpar Seleção
            </Button>
          )}
        </div>
      </div>

      {/* Lista de Mídias */}
      {mediaList && mediaList.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Mídias Enviadas ({mediaList.length})</h3>
          {mediaList.map((media: any) => (
            <Card key={media.id} className="border-border/50">
              <CardContent className="p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getMediaIcon(media.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{media.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {media.type} • {(media.fileSize / 1024 / 1024).toFixed(2)}MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm("Remover esta mídia?")) {
                      deleteMedia.mutate({ mediaId: media.id });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
