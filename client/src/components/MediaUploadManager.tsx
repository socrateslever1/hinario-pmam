import { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Music, FileText, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import "./MediaUploadManager.css";

interface MediaFile {
  id: string;
  name: string;
  type: "image" | "video" | "audio" | "pdf";
  url: string;
  size: number;
  uploadedAt: Date;
}

interface MediaUploadManagerProps {
  onFilesSelected: (files: MediaFile[]) => void;
  maxSize?: number; // em MB
  acceptedTypes?: string[];
}

export default function MediaUploadManager({
  onFilesSelected,
  maxSize = 50,
  acceptedTypes = ["image/*", "video/*", "audio/*", ".pdf"],
}: MediaUploadManagerProps) {
  const [uploadedFiles, setUploadedFiles] = useState<MediaFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const getFileType = (file: File): "image" | "video" | "audio" | "pdf" | null => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) return "pdf";
    return null;
  };

  const handleFiles = useCallback(
    async (files: FileList) => {
      setIsUploading(true);
      const newFiles: MediaFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileType = getFileType(file);

        if (!fileType) {
          console.warn(`Tipo de arquivo não suportado: ${file.name}`);
          continue;
        }

        if (file.size > maxSize * 1024 * 1024) {
          console.warn(`Arquivo muito grande: ${file.name}`);
          continue;
        }

        // Simular upload (em produção, fazer upload real para S3)
        const url = URL.createObjectURL(file);
        const mediaFile: MediaFile = {
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          type: fileType,
          url,
          size: file.size,
          uploadedAt: new Date(),
        };

        newFiles.push(mediaFile);
      }

      setUploadedFiles((prev) => [...prev, ...newFiles]);
      onFilesSelected([...uploadedFiles, ...newFiles]);
      setIsUploading(false);
    },
    [uploadedFiles, maxSize, onFilesSelected]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    const updatedFiles = uploadedFiles.filter((f) => f.id !== id);
    setUploadedFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      case "audio":
        return <Music className="h-5 w-5" />;
      case "pdf":
        return <FileText className="h-5 w-5" />;
      default:
        return <Upload className="h-5 w-5" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="media-upload-manager">
      <div
        className={`upload-zone ${isDragging ? "dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 text-gray-400 mb-2" />
        <p className="text-lg font-semibold text-gray-700">
          Arraste arquivos aqui ou clique para selecionar
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Máximo {maxSize}MB por arquivo (imagens, vídeos, áudio, PDF)
        </p>
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleInputChange}
          className="hidden"
          id="media-input"
          disabled={isUploading}
        />
        <label htmlFor="media-input">
          <Button
            asChild
            variant="default"
            className="mt-4"
            disabled={isUploading}
          >
            <span>{isUploading ? "Enviando..." : "Selecionar Arquivos"}</span>
          </Button>
        </label>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h3 className="text-lg font-semibold mb-4">Arquivos Enviados ({uploadedFiles.length})</h3>
          <div className="files-grid">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="file-card">
                <div className="file-preview">
                  {file.type === "image" && (
                    <img src={file.url} alt={file.name} className="preview-image" />
                  )}
                  {file.type !== "image" && (
                    <div className="file-icon">{getFileIcon(file.type)}</div>
                  )}
                </div>
                <div className="file-info">
                  <p className="file-name">{file.name}</p>
                  <p className="file-size">{formatFileSize(file.size)}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(file.id)}
                  className="remove-btn"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
