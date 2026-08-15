import { useMemo, useState } from "react";
import { Search, Upload, Volume2, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { VOZES_DE_COMANDO } from "@/lib/ordemUnidaPanel";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ACCEPTED_AUDIO = "audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/webm,audio/mp4,audio/x-m4a,audio/aac,audio/flac";

async function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo"));
    reader.onload = () => {
      const result = String(reader.result || "");
      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}

export function OrdemUnidaAudioManager() {
  const [search, setSearch] = useState("");
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const audiosQuery = trpc.ordemUnidaAudio.listAll.useQuery();
  const uploadMutation = trpc.ordemUnidaAudio.upload.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.ordemUnidaAudio.list.invalidate(), utils.ordemUnidaAudio.listAll.invalidate()]);
      toast.success("Áudio vinculado à Ordem Unida");
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => setUploadingItemId(null),
  });
  const deactivateMutation = trpc.ordemUnidaAudio.deactivate.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.ordemUnidaAudio.list.invalidate(), utils.ordemUnidaAudio.listAll.invalidate()]);
      toast.success("Áudio removido do painel de execução");
    },
    onError: (error) => toast.error(error.message),
  });

  const audioByItemId = useMemo(
    () => new Map((audiosQuery.data ?? []).map((audio) => [audio.itemId, audio])),
    [audiosQuery.data],
  );
  const visibleItems = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    return VOZES_DE_COMANDO.filter((item) => {
      return !normalizedSearch || item.title.toLocaleLowerCase("pt-BR").includes(normalizedSearch);
    });
  }, [search]);

  const handleFile = async (item: (typeof VOZES_DE_COMANDO)[number], file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      toast.error("Selecione um arquivo de áudio compatível");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("O arquivo não pode exceder 100 MB");
      return;
    }
    try {
      setUploadingItemId(item.id);
      const fileData = await fileToBase64(file);
      await uploadMutation.mutateAsync({
        itemId: item.id,
        itemTitle: item.title,
        itemType: item.type,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "audio/mpeg",
        fileData,
        duration: null,
      });
    } catch (error) {
      setUploadingItemId(null);
      toast.error(error instanceof Error ? error.message : "Falha ao preparar o áudio");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#1a3a2a]/20 bg-[#1a3a2a] p-4 text-white sm:p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#e4cf87]">Ordem Unida</p>
        <h2 className="mt-1 text-xl font-black">Comandos de voz</h2>
        <p className="mt-1 max-w-3xl text-sm text-white/75">Envie a gravação real do comandante para Firme, Sentido e os demais comandos. O nome do arquivo pode identificar o comandante; a voz aparecerá no painel e será preparada para uso offline.</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Buscar comando de voz" /></div>
      </div>

      {audiosQuery.isLoading ? <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">Carregando catálogo de áudio…</p> : <div className="grid gap-2 lg:grid-cols-2">
        {visibleItems.map((item) => {
          const audio = audioByItemId.get(item.id);
          const isUploading = uploadingItemId === item.id;
          return <Card key={item.id} className="border-border/60 py-0"><CardContent className="flex min-w-0 items-center gap-2 p-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1a3a2a]/10 text-[#1a3a2a] dark:bg-[#c4a84b]/10 dark:text-[#e5ce7c]"><Volume2 className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{item.title}</p><div className="mt-0.5 flex min-w-0 items-center gap-1.5"><Badge variant="outline" className="h-5 px-1.5 text-[10px]">Voz</Badge>{audio?.isActive ? <span className="truncate text-[11px] text-emerald-700 dark:text-emerald-300">{audio.fileName}</span> : <span className="text-[11px] text-muted-foreground">Sem áudio</span>}</div></div>
            <input id={`ordem-unida-audio-${item.id}`} type="file" accept={ACCEPTED_AUDIO} className="sr-only" onChange={(event) => { void handleFile(item, event.target.files?.[0]); event.currentTarget.value = ""; }} />
            <Button type="button" variant="outline" size="sm" disabled={isUploading || uploadMutation.isPending} onClick={() => document.getElementById(`ordem-unida-audio-${item.id}`)?.click()} className="shrink-0"><Upload className="mr-1.5 h-3.5 w-3.5" />{isUploading ? "Enviando" : audio?.isActive ? "Trocar" : "Enviar"}</Button>
            {audio?.isActive && <Button type="button" variant="ghost" size="icon" onClick={() => deactivateMutation.mutate({ itemId: item.id })} disabled={deactivateMutation.isPending} className="h-8 w-8 shrink-0 text-destructive hover:text-destructive" aria-label={`Remover áudio de ${item.title}`}><X className="h-4 w-4" /></Button>}
          </CardContent></Card>;
        })}
      </div>}
    </div>
  );
}
