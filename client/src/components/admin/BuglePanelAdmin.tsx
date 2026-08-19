import { useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Music, Pause, Play, Pencil, Plus, Search, Square, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { BUGLE_AUDIO_ACCEPT, validateBugleAudioFile } from "@/lib/bugleAudioUpload";
import { OrdemUnidaAudioManager } from "./OrdemUnidaAudioManager";

type Kind = "call" | "march";

const ICON_OPTIONS = [
  ["music", "Música"], ["shield", "Militar"], ["users", "Tropa"], ["user", "Autoridade"],
  ["footprints", "Marcha"], ["flag", "Bandeira"], ["clock", "Horário"], ["bell", "Alerta"],
  ["hand", "Alto"], ["relaxed", "Descansar"], ["rotate", "Volver"], ["eye", "Olhar"],
  ["sun", "Alvorada"], ["utensils", "Rancho"], ["volume-off", "Silêncio"],
] as const;

function fileToBase64(file: File, onProgress?: (percent: number) => void) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 30);
        onProgress(percent);
      }
    };
    reader.onload = () => {
      if (onProgress) onProgress(30);
      resolve(String(reader.result || "").split(",")[1] || "");
    };
    reader.readAsDataURL(file);
  });
}

function uploadWithXHRProgress(payload: any, onProgress: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/trpc/buglePanel.uploadAudio", true);
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

function emptyForm(kind: Kind) {
  return kind === "call"
    ? { name: "", audioUrl: "", iconKey: "music", troopState: "", category: "geral", sourceUrl: "", sortOrder: 0, isActive: true }
    : { title: "", composer: "", audioUrl: "", sourceUrl: "", sortOrder: 0, isActive: true };
}

export function BuglePanelAdmin() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.buglePanel.listAll.useQuery();
  const [kind, setKind] = useState<Kind>("call");
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadingItemKey, setUploadingItemKey] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [search, setSearch] = useState("");
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

  const invalidate = () => Promise.all([
    utils.buglePanel.list.invalidate(),
    utils.buglePanel.listAll.invalidate(),
    utils.ordemUnidaAudio.list.invalidate(),
    utils.ordemUnidaAudio.listAll.invalidate(),
  ]);
  const createCall = trpc.buglePanel.createCall.useMutation();
  const updateCall = trpc.buglePanel.updateCall.useMutation();
  const deleteCall = trpc.buglePanel.deleteCall.useMutation();
  const createMarch = trpc.buglePanel.createMarch.useMutation();
  const updateMarch = trpc.buglePanel.updateMarch.useMutation();
  const deleteMarch = trpc.buglePanel.deleteMarch.useMutation();
  const uploadAudio = trpc.buglePanel.uploadAudio.useMutation();

  const openCreate = (nextKind: Kind) => {
    setKind(nextKind);
    setEditing(null);
    setForm(emptyForm(nextKind));
    setAudioFile(null);
  };

  const openEdit = (nextKind: Kind, item: any) => {
    setKind(nextKind);
    setEditing(item);
    setForm({ ...emptyForm(nextKind), ...item, audioUrl: item.audioUrl || "", sourceUrl: item.sourceUrl || "", troopState: item.troopState || "", composer: item.composer || "" });
    setAudioFile(null);
  };

  const closeDialog = () => {
    setEditing(null);
    setForm(null);
    setAudioFile(null);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (audioFile) {
        const validationError = validateBugleAudioFile(audioFile);
        if (validationError) throw new Error(validationError);
      }
      let id = editing?.id as number | undefined;
      if (kind === "call") {
        const payload = {
          name: String(form.name).trim(),
          audioUrl: form.audioUrl || null,
          iconKey: form.iconKey || "music",
          troopState: form.troopState || null,
          category: form.category || "geral",
          sourceUrl: form.sourceUrl || null,
          sortOrder: Number(form.sortOrder) || 0,
          isActive: Boolean(form.isActive),
        };
        if (id) await updateCall.mutateAsync({ id, ...payload });
        else id = (await createCall.mutateAsync(payload)).id;
      } else {
        const payload = {
          title: String(form.title).trim(),
          composer: form.composer || null,
          audioUrl: form.audioUrl || null,
          sourceUrl: form.sourceUrl || null,
          sortOrder: Number(form.sortOrder) || 0,
          isActive: Boolean(form.isActive),
        };
        if (id) await updateMarch.mutateAsync({ id, ...payload });
        else id = (await createMarch.mutateAsync(payload)).id;
      }
      if (audioFile) {
        if (!id) throw new Error("O item foi salvo, mas não foi possível identificar o registro para enviar o áudio.");
        await uploadAudio.mutateAsync({ kind, id, fileName: audioFile.name, fileData: await fileToBase64(audioFile) });
      }
      await invalidate();
      toast.success(kind === "call" ? "Toque salvo." : "Dobrado salvo.");
      closeDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  };

  const toggleActive = async (nextKind: Kind, item: any, isActive: boolean) => {
    try {
      if (nextKind === "call") await updateCall.mutateAsync({ id: item.id, isActive });
      else await updateMarch.mutateAsync({ id: item.id, isActive });
      await invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar.");
    }
  };

  const uploadItemAudio = async (nextKind: Kind, item: any, file?: File | null) => {
    if (!file) return;
    const validationError = validateBugleAudioFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const itemKey = `${nextKind}-${item.id}`;
    try {
      setUploadingItemKey(itemKey);
      setUploadProgress(5);
      const base64Data = await fileToBase64(file, (percent) => setUploadProgress(percent));
      await uploadWithXHRProgress(
        { kind: nextKind, id: item.id, fileName: file.name, fileData: base64Data },
        (percent) => setUploadProgress(percent)
      );
      await invalidate();
      toast.success(item.audioUrl ? "Áudio substituído." : "Áudio enviado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar o áudio.");
    } finally {
      setUploadingItemKey(null);
      setUploadProgress(0);
    }
  };

  const remove = async (nextKind: Kind, item: any) => {
    const label = nextKind === "call" ? item.name : item.title;
    if (!confirm(`Remover “${label}”?`)) return;
    try {
      if (nextKind === "call") await deleteCall.mutateAsync({ id: item.id });
      else await deleteMarch.mutateAsync({ id: item.id });
      await invalidate();
      toast.success("Item removido.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover.");
    }
  };

  const filteredCalls = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return (data?.calls || []).filter((item: any) => !term || `${item.name} ${item.category} ${item.troopState || ""}`.toLocaleLowerCase("pt-BR").includes(term));
  }, [data?.calls, search]);

  const filteredMarches = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return (data?.marches || []).filter((item: any) => !term || `${item.title} ${item.composer || ""}`.toLocaleLowerCase("pt-BR").includes(term));
  }, [data?.marches, search]);

  const renderItems = (nextKind: Kind, items: any[]) => (
    <div className="space-y-2">
      {items.map((item) => (
        <Card key={item.id} className="border-border/50">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{nextKind === "call" ? item.name : item.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {nextKind === "call" ? `${item.category} • sequência operacional automática` : item.composer || "Compositor não informado"}
              </p>
              <p className={`mt-1 text-xs ${item.audioUrl ? "text-emerald-700" : "text-amber-700"}`}>{item.audioUrl ? "Áudio disponível" : "Aguardando áudio"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id={`bugle-audio-${nextKind}-${item.id}`}
                type="file"
                accept={BUGLE_AUDIO_ACCEPT}
                className="sr-only"
                onChange={(event) => {
                  void uploadItemAudio(nextKind, item, event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={Boolean(uploadingItemKey) || uploadAudio.isPending}
                onClick={() => document.getElementById(`bugle-audio-${nextKind}-${item.id}`)?.click()}
                className="shrink-0 font-bold min-w-[120px]"
              >
                {uploadingItemKey === `${nextKind}-${item.id}` ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-primary" />
                    {uploadProgress > 0 ? `Enviando ${uploadProgress}%` : "Enviando..."}
                  </>
                ) : (
                  <>
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    {item.audioUrl ? "Trocar áudio" : "Enviar áudio"}
                  </>
                )}
              </Button>
              {item.audioUrl && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => {
                    const url = item.audioUrl.startsWith("data:") || item.audioUrl.startsWith("http")
                      ? item.audioUrl
                      : `/api/bugle-audio/${nextKind}/${item.id}`;
                    togglePlay(url);
                  }}
                  className="h-8 w-8 shrink-0 bg-primary/10 text-primary hover:bg-primary/20"
                  title={playingUrl ? "Pausar prévia" : "Ouvir áudio cadastrado"}
                >
                  {playingUrl === item.audioUrl ? (
                    <Square className="h-3.5 w-3.5 fill-current" />
                  ) : (
                    <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                  )}
                </Button>
              )}
              <Switch checked={item.isActive} onCheckedChange={(checked) => toggleActive(nextKind, item, checked)} aria-label={`Ativar ${nextKind === "call" ? item.name : item.title}`} />
              <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(nextKind, item)}><Pencil className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(nextKind, item)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {!isLoading && items.length === 0 && <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum item encontrado.</div>}
    </div>
  );

  const dialogOpen = Boolean(form);
  const saving = createCall.isPending || updateCall.isPending || createMarch.isPending || updateMarch.isPending || uploadAudio.isPending;

  return (
    <div>
      <Tabs defaultValue="calls">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold">Painel de Ordem Unida</h2>
            <p className="text-sm text-muted-foreground">Gerencie botões, comandos, dobrados, vozes de comando e áudios de execução.</p>
          </div>
          <TabsList className="grid w-full grid-cols-2 gap-1 sm:flex sm:w-auto">
            <TabsTrigger value="calls">Toques</TabsTrigger>
            <TabsTrigger value="marches">Dobrados</TabsTrigger>
            <TabsTrigger value="voices">Vozes de Comando</TabsTrigger>
            <TabsTrigger value="audios">Treino de corneta</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="calls" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Buscar toques..." />
            </div>
            <Button type="button" onClick={() => openCreate("call")} className="bg-[#1a3a2a] text-white shrink-0"><Plus className="mr-2 h-4 w-4" /> Novo toque</Button>
          </div>
          {renderItems("call", filteredCalls)}
        </TabsContent>

        <TabsContent value="marches" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Buscar dobrados..." />
            </div>
            <Button type="button" onClick={() => openCreate("march")} className="bg-[#1a3a2a] text-white shrink-0"><Plus className="mr-2 h-4 w-4" /> Novo dobrado</Button>
          </div>
          {renderItems("march", filteredMarches)}
        </TabsContent>

        <TabsContent value="voices" className="space-y-4">
          <OrdemUnidaAudioManager initialCategory="voz" showSubTabs={false} />
        </TabsContent>

        <TabsContent value="audios" className="space-y-4">
          <OrdemUnidaAudioManager initialCategory="all" showSubTabs={true} />
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar" : "Cadastrar"} {kind === "call" ? "toque" : "dobrado"}</DialogTitle>
            <DialogDescription>Envie o arquivo diretamente. A URL do áudio é uma alternativa opcional.</DialogDescription>
          </DialogHeader>
          {form && (
            <form onSubmit={save} className="space-y-4">
              {kind === "call" ? (
                <>
                  <div><Label htmlFor="bugle-name">Nome *</Label><Input id="bugle-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><Label>Ícone</Label><Select value={form.iconKey} onValueChange={(value) => setForm({ ...form, iconKey: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ICON_OPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label htmlFor="bugle-category">Categoria</Label><Input id="bugle-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
                  </div>
                  <div className="rounded-xl border border-[#c4a84b]/40 bg-[#c4a84b]/10 p-3 text-sm text-muted-foreground">
                    A sequência operacional é aplicada automaticamente conforme o comando. Toques novos ficam restritos à posição <strong className="text-foreground">Sentido</strong> até receberem uma regra no sistema.
                  </div>
                </>
              ) : (
                <>
                  <div><Label htmlFor="march-title">Título *</Label><Input id="march-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                  <div><Label htmlFor="march-composer">Compositor</Label><Input id="march-composer" value={form.composer} onChange={(e) => setForm({ ...form, composer: e.target.value })} /></div>
                </>
              )}
              <div className="rounded-xl border border-dashed p-4">
                <Label htmlFor="audio-file" className="flex cursor-pointer items-center gap-2"><Upload className="h-4 w-4" /> {editing?.audioUrl ? "Trocar arquivo de áudio" : "Enviar arquivo de áudio"}</Label>
                <Input id="audio-file" type="file" accept={BUGLE_AUDIO_ACCEPT} className="mt-2" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} />
                <p className="mt-2 text-xs text-muted-foreground">Esta opção está sempre disponível. MP3, WAV, OGG, M4A, AAC ou WEBM, até 50 MB.</p>
                {(audioFile || form.audioUrl) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 flex items-center gap-1.5 font-semibold text-primary"
                    onClick={() => {
                      const url = audioFile ? URL.createObjectURL(audioFile) : form.audioUrl;
                      if (url) togglePlay(url);
                    }}
                  >
                    {playingUrl && (playingUrl === form.audioUrl || audioFile) ? (
                      <Square className="h-3.5 w-3.5 fill-current" />
                    ) : (
                      <Play className="h-3.5 w-3.5 fill-current" />
                    )}
                    Ouvir prévia do áudio
                  </Button>
                )}
              </div>
              <div><Label htmlFor="audio-url">URL do áudio (alternativa)</Label><Input id="audio-url" type="url" value={form.audioUrl} onChange={(e) => setForm({ ...form, audioUrl: e.target.value })} placeholder="https://.../audio.mp3" /></div>
              <div><Label htmlFor="source-url">URL da fonte/crédito</Label><Input id="source-url" type="url" value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} placeholder="https://..." /></div>
              <div><Label htmlFor="sort-order">Ordem de exibição</Label><Input id="sort-order" type="number" min={0} max={10000} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></div>
              <label className="flex items-center justify-between rounded-xl border p-3"><span className="text-sm font-medium">Visível no painel</span><Switch checked={form.isActive} onCheckedChange={(checked) => setForm({ ...form, isActive: checked })} /></label>
              <Button type="submit" disabled={saving} className="w-full bg-[#1a3a2a] text-white"><Music className="mr-2 h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
