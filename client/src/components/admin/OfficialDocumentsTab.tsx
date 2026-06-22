import { useState } from "react";
import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ACCEPTED_FILES = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.txt,.png,.jpg,.jpeg";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.slice(result.indexOf(",") + 1) : result);
    };
    reader.onerror = () => reject(reader.error || new Error("Falha ao ler o arquivo"));
    reader.readAsDataURL(file);
  });
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function OfficialDocumentsTab() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const utils = trpc.useUtils();
  const documentsQuery = trpc.officialDocuments.listAll.useQuery();

  const uploadDocument = trpc.officialDocuments.upload.useMutation({
    onSuccess: async () => {
      toast.success("Documento publicado");
      setTitle("");
      setDescription("");
      setFile(null);
      const input = document.getElementById("official-document-file") as HTMLInputElement | null;
      if (input) input.value = "";
      await Promise.all([
        utils.officialDocuments.list.invalidate(),
        utils.officialDocuments.listAll.invalidate(),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteDocument = trpc.officialDocuments.delete.useMutation({
    onSuccess: async () => {
      toast.success("Documento removido");
      await Promise.all([
        utils.officialDocuments.list.invalidate(),
        utils.officialDocuments.listAll.invalidate(),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] || null;
    if (selected && selected.size > MAX_FILE_SIZE) {
      toast.error("O arquivo deve ter no máximo 15 MB");
      event.target.value = "";
      setFile(null);
      return;
    }
    setFile(selected);
    if (selected && !title.trim()) {
      setTitle(selected.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
    }
  };

  const handleUpload = async () => {
    if (!file || title.trim().length < 3) {
      toast.error("Informe o título e selecione um arquivo");
      return;
    }

    try {
      const fileBase64 = await fileToBase64(file);
      await uploadDocument.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        fileBase64,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível ler o arquivo");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">Documentos oficiais</h2>
        <p className="text-sm text-muted-foreground">
          Os arquivos publicados aqui aparecem na página Documentos. Não há cadastro por link.
        </p>
      </div>

      <Card className="border-border/50 bg-card py-0">
        <CardContent className="grid gap-3 p-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground" htmlFor="official-document-title">Título</label>
            <Input
              id="official-document-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={180}
              placeholder="Ex.: Manual do Aluno"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground" htmlFor="official-document-description">Descrição</label>
            <Input
              id="official-document-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              placeholder="Descrição breve do documento"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-semibold text-foreground" htmlFor="official-document-file">Arquivo</label>
            <Input
              id="official-document-file"
              type="file"
              accept={ACCEPTED_FILES}
              onChange={handleFileChange}
              disabled={uploadDocument.isPending}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">PDF, Office, OpenDocument, texto ou imagem. Máximo de 15 MB.</p>
          </div>
          <div className="flex items-center justify-between gap-3 md:col-span-2">
            <p className="min-w-0 truncate text-xs text-muted-foreground">
              {file ? `${file.name} · ${formatBytes(file.size)}` : "Nenhum arquivo selecionado"}
            </p>
            <Button
              onClick={handleUpload}
              disabled={!file || title.trim().length < 3 || uploadDocument.isPending}
              className="shrink-0 gap-2 bg-[#1a3a2a] text-white hover:bg-[#1a3a2a]/90"
            >
              {uploadDocument.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploadDocument.isPending ? "Enviando..." : "Publicar arquivo"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {documentsQuery.isLoading && (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando documentos...
          </div>
        )}
        {!documentsQuery.isLoading && documentsQuery.data?.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum documento publicado. A seção de downloads permanecerá oculta para os alunos.
          </div>
        )}
        {documentsQuery.data?.map((item) => (
          <Card key={item.id} className="border-border/50 bg-card py-0">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#1a3a2a]/10">
                <FileText className="h-4 w-4 text-[#1a3a2a] dark:text-[#d6b64c]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.fileName} · {formatBytes(item.fileSize)}
                </p>
              </div>
              <a href={item.fileUrl} target="_blank" rel="noreferrer" download={item.fileName}>
                <Button variant="ghost" size="icon" title="Baixar arquivo">
                  <Download className="h-4 w-4" />
                </Button>
              </a>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                title="Remover documento"
                disabled={deleteDocument.isPending}
                onClick={() => {
                  if (window.confirm(`Remover o documento "${item.title}"?`)) {
                    deleteDocument.mutate({ id: item.id });
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
