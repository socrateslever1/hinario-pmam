import { useMemo, useRef, useState } from "react";
import { Camera, Loader2, Play, Plus, Save, Search, Square, Upload, UserRound, Volume2, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TODOS_OS_ITENS_DE_ORDEM_UNIDA, OrdemUnidaPanelItem } from "@/lib/ordemUnidaPanel";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ACCEPTED_AUDIO = "audio/*,.mp3,.wav,.ogg,.webm,.mp4,.m4a,.aac,.flac";
const VALID_AUDIO_EXTENSIONS = new Set(["mp3", "wav", "ogg", "webm", "mp4", "m4a", "aac", "flac"]);
const ACCEPTED_PHOTO = "image/jpeg,image/png,image/webp";

async function fileToBase64(file: File, onProgress?: (percent: number) => void) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo"));
    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 30);
        onProgress(percent);
      }
    };
    reader.onload = () => {
      if (onProgress) onProgress(30);
      const result = String(reader.result || "");
      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}

function uploadWithXHRProgress(payload: any, onProgress: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/trpc/ordemUnidaAudio.upload", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = 30 + Math.round((event.loaded / event.total) * 65);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        try {
          const json = JSON.parse(xhr.responseText);
          const msg = json?.error?.json?.message || json?.error?.message || `Erro HTTP ${xhr.status}`;
          reject(new Error(msg));
        } catch {
          reject(new Error(`Erro HTTP ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Erro de rede ao enviar arquivo"));
    xhr.send(JSON.stringify({ json: payload }));
  });
}

interface OrdemUnidaAudioManagerProps {
  initialCategory?: string;
  showSubTabs?: boolean;
}

export function OrdemUnidaAudioManager({ initialCategory = "all", showSubTabs = true }: OrdemUnidaAudioManagerProps = {}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategory);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = (url: string) => {
    if (playingUrl === url) {
      audioPreviewRef.current?.pause();
      setPlayingUrl(null);
      return;
    }
    if (!audioPreviewRef.current) {
      audioPreviewRef.current = new Audio();
      audioPreviewRef.current.onended = () => setPlayingUrl(null);
      audioPreviewRef.current.onerror = () => {
        setPlayingUrl(null);
        toast.error("Não foi possível reproduzir o áudio.");
      };
    }
    audioPreviewRef.current.pause();
    audioPreviewRef.current.src = url;
    audioPreviewRef.current.play().then(() => {
      setPlayingUrl(url);
    }).catch(() => {
      setPlayingUrl(null);
      toast.error("Erro ao iniciar prévia do áudio.");
    });
  };
  const [voiceAuthorName, setVoiceAuthorName] = useState("");
  const [voiceAuthorPhoto, setVoiceAuthorPhoto] = useState<File | null>(null);
  const [selectedVoiceProfileKey, setSelectedVoiceProfileKey] = useState("new");
  const utils = trpc.useUtils();
  const audiosQuery = trpc.ordemUnidaAudio.listAll.useQuery();
  const voiceProfilesQuery = trpc.ordemUnidaAudio.listVoiceProfiles.useQuery();

  const saveVoiceProfileMutation = trpc.ordemUnidaAudio.saveVoiceProfile.useMutation({
    onSuccess: async (profile) => {
      await voiceProfilesQuery.refetch();
      setSelectedVoiceProfileKey(profile.profileKey);
      setVoiceAuthorPhoto(null);
      toast.success("Militar salvo no banco de vozes");
    },
    onError: (error) => toast.error(error.message),
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
  const voiceProfiles = voiceProfilesQuery.data ?? [];

  const selectVoiceProfile = (key: string) => {
    setSelectedVoiceProfileKey(key);
    setVoiceAuthorPhoto(null);
    setVoiceAuthorName(key === "new" ? "" : voiceProfiles.find((profile) => profile.profileKey === key)?.name || "");
  };

  const saveVoiceProfile = async () => {
    if (!voiceAuthorName.trim()) return toast.error("Informe o nome do militar");
    const photoData = voiceAuthorPhoto ? await fileToBase64(voiceAuthorPhoto) : null;
    await saveVoiceProfileMutation.mutateAsync({
      name: voiceAuthorName.trim(),
      photoFileName: voiceAuthorPhoto?.name || null,
      photoFileSize: voiceAuthorPhoto?.size || null,
      photoMimeType: voiceAuthorPhoto?.type || null,
      photoFileData: photoData,
    });
  };

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
      setUploadProgress(0);
      const fileData = await fileToBase64(file, (percent) => setUploadProgress(percent));
      const mimeType = file.type || `audio/${ext === "mp3" ? "mpeg" : ext}`;
      const photoData = item.type === "voz" && voiceAuthorPhoto ? await fileToBase64(voiceAuthorPhoto) : null;

      await uploadWithXHRProgress({
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
      }, (percent) => setUploadProgress(percent));

      await Promise.all([utils.ordemUnidaAudio.list.invalidate(), utils.ordemUnidaAudio.listAll.invalidate()]);
      toast.success(`Áudio "${item.title}" enviado com sucesso!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar o áudio");
    } finally {
      setUploadingItemId(null);
      setUploadProgress(0);
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
    <div className="space-y-3">
      <div className="rounded-xl border border-[#1a3a2a]/20 bg-[#1a3a2a] p-3 sm:p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#e4cf87]">Ordem Unida</p>
            <h2 className="text-base sm:text-lg font-black">Áudios de Execução</h2>
          </div>
          <p className="hidden sm:block text-xs text-white/70 max-w-sm text-right">
            Vozes de comando, toques e dobrados para execução online e offline.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9 h-9 text-xs sm:text-sm"
            placeholder="Buscar comando, toque ou dobrado..."
          />
        </div>
        {showSubTabs && (
          <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-4 gap-1 p-1 bg-muted/80 rounded-xl h-auto sm:flex sm:w-auto">
              <TabsTrigger value="all" className="py-1.5 px-2 text-xs font-bold rounded-lg data-[state=active]:bg-[#1a3a2a] data-[state=active]:text-white">Todos</TabsTrigger>
              <TabsTrigger value="voz" className="py-1.5 px-2 text-xs font-bold rounded-lg data-[state=active]:bg-[#1a3a2a] data-[state=active]:text-white">Voz</TabsTrigger>
              <TabsTrigger value="corneta" className="py-1.5 px-2 text-xs font-bold rounded-lg data-[state=active]:bg-[#1a3a2a] data-[state=active]:text-white">Toques</TabsTrigger>
              <TabsTrigger value="dobrado" className="py-1.5 px-2 text-xs font-bold rounded-lg data-[state=active]:bg-[#1a3a2a] data-[state=active]:text-white">Dobrados</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {categoryFilter === "voz" && (
        <div className="rounded-2xl border border-[#c4a84b]/40 bg-[#c4a84b]/10 p-4">
          <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full border-2 border-[#c4a84b] bg-[#1a3a2a] text-white">
              {voiceAuthorPhoto ? (
                <img src={URL.createObjectURL(voiceAuthorPhoto)} alt="Nova foto do militar" className="h-full w-full object-cover" />
              ) : voiceProfiles.find((profile) => profile.profileKey === selectedVoiceProfileKey)?.photoUrl ? (
                <img src={voiceProfiles.find((profile) => profile.profileKey === selectedVoiceProfileKey)?.photoUrl || ""} alt={voiceAuthorName} className="h-full w-full object-cover" />
              ) : <UserRound className="h-8 w-8" />}
            </div>
            <div>
              <label htmlFor="voice-profile-select" className="mb-1.5 block text-xs font-black uppercase tracking-wide">Escolher militar</label>
              <Select value={selectedVoiceProfileKey} onValueChange={selectVoiceProfile}>
                <SelectTrigger id="voice-profile-select"><SelectValue placeholder="Escolha o militar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new"><span className="flex items-center gap-2"><Plus className="h-4 w-4" />Adicionar novo militar</span></SelectItem>
                  {voiceProfiles.map((profile) => <SelectItem key={profile.profileKey} value={profile.profileKey}>{profile.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <div>
              <label htmlFor="voice-author-name" className="mb-1.5 block text-xs font-black uppercase tracking-wide">Militar autor da voz</label>
              <Input id="voice-author-name" value={voiceAuthorName} onChange={(event) => setVoiceAuthorName(event.target.value)} placeholder="Ex.: 2º SGT Silva" />
            </div>
            <div>
              <input id="voice-author-photo" type="file" accept={ACCEPTED_PHOTO} className="sr-only" onChange={(event) => setVoiceAuthorPhoto(event.target.files?.[0] || null)} />
              <Button type="button" variant="outline" onClick={() => document.getElementById("voice-author-photo")?.click()}>
                {voiceAuthorPhoto ? <Camera className="mr-2 h-4 w-4" /> : <UserRound className="mr-2 h-4 w-4" />}
                {voiceAuthorPhoto ? voiceAuthorPhoto.name : "Carregar foto"}
              </Button>
            </div>
            <Button type="button" onClick={() => void saveVoiceProfile()} disabled={saveVoiceProfileMutation.isPending || !voiceAuthorName.trim()} className="bg-[#1a3a2a] text-white hover:bg-[#244c38]">
              <Save className="mr-2 h-4 w-4" />{saveVoiceProfileMutation.isPending ? "Salvando" : "Salvar militar"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Depois de salvar, selecione este militar e envie todos os comandos gravados com a voz dele.</p>
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
                <CardContent className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
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
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
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
                      disabled={isUploading}
                      onClick={() => document.getElementById(`ordem-unida-audio-${item.id}`)?.click()}
                      className="h-8 shrink-0 font-bold px-3 text-xs"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-primary" />
                          {uploadProgress > 0 ? `${uploadProgress}%` : "Enviando..."}
                        </>
                      ) : (
                        <>
                          <Upload className="mr-1.5 h-3.5 w-3.5" />
                          {audio?.isActive ? "Trocar" : "Enviar"}
                        </>
                      )}
                    </Button>
                    {audio?.isActive && audio.audioUrl && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={() => togglePlay(audio.audioUrl)}
                        className="h-8 w-8 shrink-0 bg-primary/10 text-primary hover:bg-primary/20"
                        title={playingUrl === audio.audioUrl ? "Pausar prévia" : "Ouvir áudio cadastrado"}
                      >
                        {playingUrl === audio.audioUrl ? (
                          <Square className="h-3.5 w-3.5 fill-current" />
                        ) : (
                          <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                        )}
                      </Button>
                    )}
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
                  </div>
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
