import { useEffect, useMemo, useState } from "react";
import { Camera, Search, Upload, UserRound, Volume2, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TODOS_OS_ITENS_DE_ORDEM_UNIDA, OrdemUnidaPanelItem } from "@/lib/ordemUnidaPanel";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ACCEPTED_AUDIO = "audio/*,.mp3,.wav,.ogg,.webm,.mp4,.m4a,.aac,.flac";
const VALID_AUDIO_EXTENSIONS = new Set(["mp3", "wav", "ogg", "webm", "mp4", "m4a", "aac", "flac"]);
const ACCEPTED_PHOTO = "image/jpeg,image/png,image/webp";

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
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [voiceAuthorName, setVoiceAuthorName] = useState("");
  const [voiceAuthorPhoto, setVoiceAuthorPhoto] = useState<File | null>(null);
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

  const profileKey = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "default";
  const audioByItemId = useMemo(
    () => new Map((audiosQuery.data ?? []).map((audio) => [`${audio.itemId}:${audio.voiceProfileKey || "default"}`, audio])),
    [audiosQuery.data],
  );
  const knownVoiceAuthors = useMemo(
    () => Array.from(new Map((audiosQuery.data ?? []).filter((audio) => audio.itemType === "voz" && audio.voiceAuthorName).map((audio) => [audio.voiceProfileKey, audio.voiceAuthorName as string])).values()),
    [audiosQuery.data],
  );
  useEffect(() => {
    if (!voiceAuthorName && knownVoiceAuthors[0]) setVoiceAuthorName(knownVoiceAuthors[0]);
  }, [knownVoiceAuthors, voiceAuthorName]);

  const visibleItems = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    return TODOS_OS_ITENS_DE_ORDEM_UNIDA.filter((item) => {
      if (categoryFilter !== "all" && item.type !== categoryFilter) return false;
      return !normalizedSearch || item.title.toLocaleLowerCase("pt-BR").includes(normalizedSearch);
    });
  }, [search, categoryFilter]);

  const handleFile = async (item: OrdemUnidaPanelItem, file?: File | null) => {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const isAudioType = file.type.startsWith("audio/") || VALID_AUDIO_EXTENSIONS.has(ext);
    if (!isAudioType) {
      toast.error("Selecione um arquivo de áudio compatível (MP3, WAV, OGG, M4A, AAC, FLAC)");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("O arquivo não pode exceder 100 MB");
      return;
    }
    if (item.type === "voz" && !voiceAuthorName.trim()) {
      toast.error("Informe o nome do militar autor da voz antes de enviar");
      return;
    }
    try {
      setUploadingItemId(item.id);
      const fileData = await fileToBase64(file);
      const mimeType = file.type || `audio/${ext === "mp3" ? "mpeg" : ext}`;
      const photoData = item.type === "voz" && voiceAuthorPhoto ? await fileToBase64(voiceAuthorPhoto) : null;
      await uploadMutation.mutateAsync({
        itemId: item.id,
        itemTitle: item.title,
        itemType: item.type,
        fileName: file.name,
        fileSize: file.size,
        mimeType,
        fileData,
        duration: null,
        voiceAuthorName: item.type === "voz" ? voiceAuthorName.trim() : null,
        voiceAuthorPhotoFileName: voiceAuthorPhoto?.name || null,
        voiceAuthorPhotoFileSize: voiceAuthorPhoto?.size || null,
        voiceAuthorPhotoMimeType: voiceAuthorPhoto?.type || null,
        voiceAuthorPhotoFileData: photoData,
      });
    } catch (error) {
      setUploadingItemId(null);
      toast.error(error instanceof Error ? error.message : "Falha ao preparar o áudio");
    }
  };

  const getBadgeLabel = (type: string) => {
    switch (type) {
      case "corneta": return "Corneta";
      case "dobrado": return "Dobrado";
      case "voz": return "Voz";
      default: return type;
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#1a3a2a]/20 bg-[#1a3a2a] p-4 text-white sm:p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#e4cf87]">Ordem Unida</p>
        <h2 className="mt-1 text-xl font-black">Áudios de Execução (Voz, Dobrados e Toques)</h2>
        <p className="mt-1 max-w-3xl text-sm text-white/75">
          Envie os áudios gravados para cada comando de voz, toque de corneta ou dobrado.
          Os arquivos serão salvos e preparados para execução online e offline no painel.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
            placeholder="Buscar por comando, toque ou dobrado"
          />
        </div>
        <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-full sm:w-auto">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="voz">Voz</TabsTrigger>
            <TabsTrigger value="corneta">Toques</TabsTrigger>
            <TabsTrigger value="dobrado">Dobrados</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {categoryFilter === "voz" && (
        <div className="grid gap-3 rounded-2xl border border-[#c4a84b]/40 bg-[#c4a84b]/10 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label htmlFor="voice-author-name" className="mb-1.5 block text-xs font-black uppercase tracking-wide">Militar autor da voz</label>
            <Input id="voice-author-name" list="voice-author-list" value={voiceAuthorName} onChange={(event) => setVoiceAuthorName(event.target.value)} placeholder="Ex.: 2º SGT Silva" />
            <datalist id="voice-author-list">{knownVoiceAuthors.map((name) => <option key={name} value={name} />)}</datalist>
            <p className="mt-1 text-xs text-muted-foreground">Use o mesmo nome para vincular vários comandos ao mesmo militar.</p>
          </div>
          <div>
            <input id="voice-author-photo" type="file" accept={ACCEPTED_PHOTO} className="sr-only" onChange={(event) => setVoiceAuthorPhoto(event.target.files?.[0] || null)} />
            <Button type="button" variant="outline" onClick={() => document.getElementById("voice-author-photo")?.click()}>
              {voiceAuthorPhoto ? <Camera className="mr-2 h-4 w-4" /> : <UserRound className="mr-2 h-4 w-4" />}
              {voiceAuthorPhoto ? voiceAuthorPhoto.name : "Carregar foto"}
            </Button>
          </div>
        </div>
      )}

      {audiosQuery.isLoading ? (
        <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
          Carregando catálogo de áudio…
        </p>
      ) : (
        <div className="grid gap-2 lg:grid-cols-2">
          {visibleItems.map((item) => {
            const selectedProfileKey = item.type === "voz" ? profileKey(voiceAuthorName) : "default";
            const audio = audioByItemId.get(`${item.id}:${selectedProfileKey}`);
            const isUploading = uploadingItemId === item.id;
            return (
              <Card key={item.id} className="border-border/60 py-0">
                <CardContent className="flex min-w-0 items-center gap-2 p-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1a3a2a]/10 text-[#1a3a2a] dark:bg-[#c4a84b]/10 dark:text-[#e5ce7c]">
                    <Volume2 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black">{item.title}</p>
                    <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                        {getBadgeLabel(item.type)}
                      </Badge>
                      {audio?.isActive ? (
                        <span className="truncate text-[11px] text-emerald-700 dark:text-emerald-300">
                          {audio.fileName}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Sem áudio</span>
                      )}
                    </div>
                  </div>
                  <input
                    id={`ordem-unida-audio-${item.id}`}
                    type="file"
                    accept={ACCEPTED_AUDIO}
                    className="sr-only"
                    onChange={(event) => {
                      void handleFile(item, event.target.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading || uploadMutation.isPending}
                    onClick={() => document.getElementById(`ordem-unida-audio-${item.id}`)?.click()}
                    className="shrink-0"
                  >
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    {isUploading ? "Enviando" : audio?.isActive ? "Trocar" : "Enviar"}
                  </Button>
                  {audio?.isActive && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => deactivateMutation.mutate({ id: audio.id })}
                      disabled={deactivateMutation.isPending}
                      className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                      aria-label={`Remover áudio de ${item.title}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {visibleItems.length === 0 && (
            <div className="col-span-2 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhum item encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
