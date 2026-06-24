import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Image as ImageIcon, Video, FileAudio } from "lucide-react";
import { toast } from "sonner";

interface ProofFile {
  id: string;
  file: File;
  preview?: string;
  type: "foto" | "video" | "audio" | "documento";
}

interface FOProofUploaderProps {
  onProofsChange: (proofs: ProofFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

const ACCEPTED_TYPES = {
  foto: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"],
  documento: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};

const ACCEPTED_EXTENSIONS = {
  foto: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
  video: [".mp4", ".webm", ".mov", ".avi"],
  audio: [".mp3", ".wav", ".ogg", ".m4a"],
  documento: [".pdf", ".doc", ".docx"],
};

export function FOProofUploader({ onProofsChange, maxFiles = 5, maxSizeMB = 50 }: FOProofUploaderProps) {
  const [proofs, setProofs] = useState<ProofFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const getProofType = (file: File): "foto" | "video" | "audio" | "documento" | null => {
    const mimeType = file.type;
    const extension = "." + file.name.split(".").pop()?.toLowerCase();

    if (ACCEPTED_TYPES.foto.includes(mimeType) || ACCEPTED_EXTENSIONS.foto.includes(extension)) {
      return "foto";
    }
    if (ACCEPTED_TYPES.video.includes(mimeType) || ACCEPTED_EXTENSIONS.video.includes(extension)) {
      return "video";
    }
    if (ACCEPTED_TYPES.audio.includes(mimeType) || ACCEPTED_EXTENSIONS.audio.includes(extension)) {
      return "audio";
    }
    if (ACCEPTED_TYPES.documento.includes(mimeType) || ACCEPTED_EXTENSIONS.documento.includes(extension)) {
      return "documento";
    }
    return null;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newProofs: ProofFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validar tamanho
      if (file.size > maxSizeBytes) {
        toast.error(`${file.name} excede o tamanho máximo de ${maxSizeMB}MB`);
        continue;
      }

      // Validar tipo
      const proofType = getProofType(file);
      if (!proofType) {
        toast.error(`${file.name} não é um tipo de arquivo válido`);
        continue;
      }

      // Validar limite de arquivos
      if (proofs.length + newProofs.length >= maxFiles) {
        toast.error(`Máximo de ${maxFiles} arquivos permitido`);
        break;
      }

      const id = `proof-${Date.now()}-${Math.random()}`;
      const proof: ProofFile = { id, file, type: proofType };

      // Criar preview para imagens e vídeos
      if (proofType === "foto" || proofType === "video") {
        const reader = new FileReader();
        reader.onload = (e) => {
          setProofs((prev) =>
            prev.map((p) => (p.id === id ? { ...p, preview: e.target?.result as string } : p))
          );
        };
        reader.readAsDataURL(file);
      }

      newProofs.push(proof);
    }

    const updatedProofs = [...proofs, ...newProofs];
    setProofs(updatedProofs);
    onProofsChange(updatedProofs);

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveProof = (id: string) => {
    const updatedProofs = proofs.filter((p) => p.id !== id);
    setProofs(updatedProofs);
    onProofsChange(updatedProofs);
  };

  const getProofIcon = (type: string) => {
    switch (type) {
      case "foto":
        return <ImageIcon className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "audio":
        return <FileAudio className="h-4 w-4" />;
      default:
        return <Upload className="h-4 w-4" />;
    }
  };

  const getProofLabel = (type: string) => {
    switch (type) {
      case "foto":
        return "Foto";
      case "video":
        return "Vídeo";
      case "audio":
        return "Áudio";
      case "documento":
        return "Documento";
      default:
        return "Arquivo";
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        className="relative rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/5 p-6 text-center cursor-pointer transition-colors hover:border-muted-foreground/50 hover:bg-muted/10"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add("border-primary", "bg-primary/5");
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove("border-primary", "bg-primary/5");
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove("border-primary", "bg-primary/5");
          handleFileSelect(e.dataTransfer.files);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={[
            ...ACCEPTED_EXTENSIONS.foto,
            ...ACCEPTED_EXTENSIONS.video,
            ...ACCEPTED_EXTENSIONS.audio,
            ...ACCEPTED_EXTENSIONS.documento,
          ].join(",")}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2">
          <Upload className="h-6 w-6 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Clique ou arraste arquivos</p>
            <p className="text-xs text-muted-foreground">
              Fotos, vídeos, áudio ou documentos (máx {maxSizeMB}MB cada)
            </p>
          </div>
        </div>
      </div>

      {/* Proofs List */}
      {proofs.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Provas ({proofs.length}/{maxFiles})
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {proofs.map((proof) => (
              <Card key={proof.id} className="relative overflow-hidden">
                {proof.preview ? (
                  <img
                    src={proof.preview}
                    alt={proof.file.name}
                    className="h-24 w-full object-cover"
                  />
                ) : (
                  <CardContent className="flex h-24 items-center justify-center bg-muted">
                    {getProofIcon(proof.type)}
                  </CardContent>
                )}

                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all hover:bg-black/40">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 rounded-full p-0 opacity-0 transition-opacity hover:opacity-100"
                    onClick={() => handleRemoveProof(proof.id)}
                  >
                    <X className="h-4 w-4 text-white" />
                  </Button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {getProofLabel(proof.type)}
                  </Badge>
                  <p className="truncate text-[10px] text-white">
                    {proof.file.name}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-muted-foreground">
        Máximo de {maxFiles} arquivos, {maxSizeMB}MB cada. Suporta fotos, vídeos, áudio e documentos.
      </p>
    </div>
  );
}
