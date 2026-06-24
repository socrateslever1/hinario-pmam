import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { X, Check, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UploadItem {
  id: string;
  fileName: string;
  fileSize: number;
  status: "pending" | "uploading" | "completed" | "error";
  progress: number; // 0-100
  error?: string;
  uploadedBytes?: number;
  startTime?: number;
  estimatedTimeRemaining?: number; // em segundos
}

interface UploadProgressBarProps {
  items: UploadItem[];
  onCancel?: (itemId: string) => void;
  showDetails?: boolean;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
};

const getStatusIcon = (status: UploadItem["status"]) => {
  switch (status) {
    case "completed":
      return <Check className="h-5 w-5 text-green-600" />;
    case "error":
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    case "uploading":
      return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
    default:
      return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
  }
};

const getStatusLabel = (status: UploadItem["status"]): string => {
  switch (status) {
    case "completed":
      return "Concluído";
    case "error":
      return "Erro";
    case "uploading":
      return "Enviando";
    default:
      return "Pendente";
  }
};

const getStatusColor = (status: UploadItem["status"]): string => {
  switch (status) {
    case "completed":
      return "text-green-700 dark:text-green-400";
    case "error":
      return "text-red-700 dark:text-red-400";
    case "uploading":
      return "text-blue-700 dark:text-blue-400";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
};

export function UploadProgressBar({
  items,
  onCancel,
  showDetails = true,
}: UploadProgressBarProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const totalItems = items.length;
  const completedItems = items.filter((i) => i.status === "completed").length;
  const errorItems = items.filter((i) => i.status === "error").length;
  const uploadingItems = items.filter((i) => i.status === "uploading").length;

  const overallProgress =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  if (totalItems === 0) return null;

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/5 p-4">
      {/* Resumo geral */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            Progresso de Upload ({completedItems + errorItems}/{totalItems})
          </h3>
          <span className="text-xs text-muted-foreground">
            {overallProgress}%
          </span>
        </div>
        <Progress value={overallProgress} className="h-2" />

        {/* Estatísticas */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          {uploadingItems > 0 && (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
              {uploadingItems} enviando
            </span>
          )}
          {completedItems > 0 && (
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3 text-green-600" />
              {completedItems} concluído
            </span>
          )}
          {errorItems > 0 && (
            <span className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-red-600" />
              {errorItems} erro
            </span>
          )}
        </div>
      </div>

      {/* Lista de arquivos */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {items.map((item) => {
          const isExpanded = expandedItems.has(item.id);
          const speedMBps =
            item.startTime && item.uploadedBytes
              ? (item.uploadedBytes / (Date.now() - item.startTime)) * 1000 / (1024 * 1024)
              : 0;

          return (
            <div
              key={item.id}
              className={cn(
                "rounded-md border p-3 transition-colors",
                item.status === "error"
                  ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
                  : item.status === "completed"
                    ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                    : "border-border bg-background"
              )}
            >
              {/* Cabeçalho do item */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 pt-0.5">
                  {getStatusIcon(item.status)}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Nome do arquivo e status */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-medium truncate">
                      {item.fileName}
                    </p>
                    <span
                      className={cn(
                        "text-xs font-medium whitespace-nowrap",
                        getStatusColor(item.status)
                      )}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </div>

                  {/* Informações do arquivo */}
                  <p className="text-xs text-muted-foreground mb-2">
                    {formatBytes(item.fileSize)}
                  </p>

                  {/* Barra de progresso */}
                  {item.status !== "pending" && (
                    <>
                      <Progress value={item.progress} className="h-1.5 mb-2" />

                      {/* Detalhes de progresso */}
                      {showDetails && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{item.progress}%</span>

                          {item.status === "uploading" && (
                            <div className="flex gap-3">
                              {speedMBps > 0 && (
                                <span>
                                  {speedMBps.toFixed(2)} MB/s
                                </span>
                              )}
                              {item.estimatedTimeRemaining && (
                                <span>
                                  ~{formatTime(item.estimatedTimeRemaining)}
                                </span>
                              )}
                            </div>
                          )}

                          {item.status === "completed" && item.uploadedBytes && (
                            <span>
                              {formatBytes(item.uploadedBytes)} enviado
                            </span>
                          )}

                          {item.status === "error" && (
                            <button
                              onClick={() => toggleExpanded(item.id)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline"
                            >
                              Ver erro
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Mensagem de erro expandida */}
                  {isExpanded && item.error && (
                    <div className="mt-2 rounded bg-red-100 dark:bg-red-900 p-2 text-xs text-red-800 dark:text-red-200">
                      {item.error}
                    </div>
                  )}
                </div>

                {/* Botão de cancelar */}
                {item.status === "uploading" && onCancel && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 flex-shrink-0"
                    onClick={() => onCancel(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
