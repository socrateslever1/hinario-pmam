import { useState, useCallback, useRef } from "react";
import { UploadItem } from "@/components/UploadProgressBar";

interface UploadOptions {
  onProgress?: (item: UploadItem) => void;
  onComplete?: (item: UploadItem) => void;
  onError?: (item: UploadItem, error: string) => void;
}

interface UploadRequest {
  file: File;
  itemId: string;
  xhr?: XMLHttpRequest;
  startTime?: number;
}

export function useUploadProgress(options: UploadOptions = {}) {
  const [uploadItems, setUploadItems] = useState<Map<string, UploadItem>>(
    new Map()
  );
  const uploadsRef = useRef<Map<string, UploadRequest>>(new Map());
  const cancelledRef = useRef<Set<string>>(new Set());

  const updateItem = useCallback(
    (itemId: string, updates: Partial<UploadItem>) => {
      setUploadItems((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(itemId);
        if (existing) {
          const updated = { ...existing, ...updates };
          newMap.set(itemId, updated);
          options.onProgress?.(updated);
        }
        return newMap;
      });
    },
    [options]
  );

  const addItem = useCallback(
    (file: File, itemId: string) => {
      const item: UploadItem = {
        id: itemId,
        fileName: file.name,
        fileSize: file.size,
        status: "pending",
        progress: 0,
      };
      setUploadItems((prev) => new Map(prev).set(itemId, item));
      uploadsRef.current.set(itemId, { file, itemId });
      cancelledRef.current.delete(itemId);
    },
    []
  );

  const uploadFile = useCallback(
    async (
      itemId: string,
      uploadFn: (
        file: File,
        onProgress: (progress: number, uploadedBytes: number) => void,
        onCancel: () => boolean
      ) => Promise<{ success: boolean; error?: string }>
    ): Promise<{ success: boolean; error?: string }> => {
      const uploadRequest = uploadsRef.current.get(itemId);
      if (!uploadRequest) {
        return Promise.resolve({ success: false, error: "Arquivo não encontrado para envio" });
      }

      const { file } = uploadRequest;
      const startTime = Date.now();

      updateItem(itemId, {
        status: "uploading",
        startTime,
      });

      try {
        const isCancelled = () => cancelledRef.current.has(itemId);

        const onProgress = (progress: number, uploadedBytes: number) => {
          const elapsed = (Date.now() - startTime) / 1000;
          const speedBytesPerSecond = uploadedBytes / elapsed;
          const remainingBytes = file.size - uploadedBytes;
          const estimatedTimeRemaining = remainingBytes / speedBytesPerSecond;

          updateItem(itemId, {
            progress,
            uploadedBytes,
            estimatedTimeRemaining: Math.max(0, estimatedTimeRemaining),
          });
        };

        const result = await uploadFn(file, onProgress, isCancelled);

        if (isCancelled()) {
          return { success: false, error: "Upload cancelado pelo usuário" };
        }

        if (result.success) {
          updateItem(itemId, {
            status: "completed",
            progress: 100,
            uploadedBytes: file.size,
            estimatedTimeRemaining: 0,
          });
          options.onComplete?.(uploadItems.get(itemId)!);
          return result;
        } else {
          const errorMsg = result.error || "Erro desconhecido durante upload";
          updateItem(itemId, {
            status: "error",
            error: errorMsg,
          });
          options.onError?.(uploadItems.get(itemId)!, errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Erro ao fazer upload";
        updateItem(itemId, {
          status: "error",
          error: errorMsg,
        });
        options.onError?.(uploadItems.get(itemId)!, errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        uploadsRef.current.delete(itemId);
      }
    },
    [updateItem, options]
  );

  const cancelUpload = useCallback((itemId: string) => {
    cancelledRef.current.add(itemId);
    updateItem(itemId, { status: "error", error: "Upload cancelado pelo usuário" });
    uploadsRef.current.delete(itemId);
  }, [updateItem]);

  const clearItems = useCallback(() => {
    setUploadItems(new Map());
    uploadsRef.current.clear();
    cancelledRef.current.clear();
  }, []);

  const getItems = useCallback(() => {
    return Array.from(uploadItems.values());
  }, [uploadItems]);

  return {
    uploadItems: getItems(),
    addItem,
    uploadFile,
    cancelUpload,
    updateItem,
    clearItems,
  };
}
