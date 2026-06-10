import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Music, Upload, Save, Youtube, Loader2 } from "lucide-react";
import { buildLyricsSyncLines, hasLyricsSyncData } from "@/lib/lyricsSync";

const categoryOptions = [
  { value: "nacional", label: "Hino Nacional" },
  { value: "militar", label: "Canção Militar" },
  { value: "pmam", label: "Canção PMAM" },
  { value: "arma", label: "Canção de Arma" },
  { value: "oracao", label: "Oração" },
];

function getDefaultHymnFormState(hymn?: any) {
  return {
    number: hymn?.number ?? 0,
    title: hymn?.title ?? "",
    subtitle: hymn?.subtitle ?? "",
    author: hymn?.author ?? "",
    composer: hymn?.composer ?? "",
    category: hymn?.category ?? "pmam",
    collection: hymn?.collection ?? null,
    lyrics: hymn?.lyrics ?? "",
    description: hymn?.description ?? "",
    youtubeUrl: hymn?.youtubeUrl ?? "",
    instrumentalYoutubeUrl: hymn?.instrumentalYoutubeUrl ?? "",
    audioUrl: hymn?.audioUrl ?? "",
    instrumentalAudioUrl: hymn?.instrumentalAudioUrl ?? "",
  };
}

export function HymnForm({ hymn, onSuccess }: { hymn?: any; onSuccess: () => void }) {
  const [form, setForm] = useState(() => getDefaultHymnFormState(hymn));
  const [uploading, setUploading] = useState(false);
  const [uploadingInstrumental, setUploadingInstrumental] = useState(false);
  const utils = trpc.useUtils();
  const createMut = trpc.hymns.create.useMutation({
    onSuccess: async () => {
      toast.success("Hino criado!");
      await Promise.all([
        utils.hymns.list.invalidate(),
        utils.hymns.listAll.invalidate(),
      ]);
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.hymns.update.useMutation({
    onSuccess: async (_data, variables) => {
      toast.success("Hino atualizado!");
      await Promise.all([
        utils.hymns.list.invalidate(),
        utils.hymns.listAll.invalidate(),
        utils.hymns.getById.invalidate({ id: variables.id }),
        utils.hymns.getByNumber.invalidate({ number: variables.number }),
      ]);
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });
  const uploadAudioMut = trpc.hymns.uploadAudio.useMutation({
    onSuccess: (data, variables) => {
      setForm(f => variables.variant === "instrumental"
        ? ({ ...f, instrumentalAudioUrl: data.url })
        : ({ ...f, audioUrl: data.url }));
      toast.success("Áudio enviado com sucesso!");
      setUploading(false);
      setUploadingInstrumental(false);
    },
    onError: (e) => {
      toast.error(`Erro ao enviar áudio: ${e.message}`);
      setUploading(false);
      setUploadingInstrumental(false);
    },
  });
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>, variant: "voice" | "instrumental" = "voice") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx 50MB)");
      return;
    }
    if (!hymn?.id) {
      toast.error("Salve o hino primeiro antes de fazer upload de áudio");
      return;
    }
    if (variant === "instrumental") setUploadingInstrumental(true);
    else setUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64 = (evt.target?.result as string)?.split(',')[1];
      if (!base64) return;
      uploadAudioMut.mutate({
        id: hymn.id,
        fileName: file.name,
        fileData: base64,
        variant,
      });
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    setForm(getDefaultHymnFormState(hymn));
  }, [hymn]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.lyrics) { toast.error("Título e letra são obrigatórios"); return; }
    const data = {
      ...form,
      subtitle: form.subtitle || undefined,
      author: form.author || undefined,
      composer: form.composer || undefined,
      description: form.description || undefined,
      youtubeUrl: form.youtubeUrl.trim() || undefined,
      instrumentalYoutubeUrl: form.instrumentalYoutubeUrl.trim() || undefined,
      audioUrl: form.audioUrl.trim() || undefined,
      instrumentalAudioUrl: form.instrumentalAudioUrl.trim() || undefined,
      category: form.category as any,
    };
    if (hymn) { updateMut.mutate({ id: hymn.id, ...data }); }
    else { createMut.mutate(data); }
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[min(72vh,calc(100vh-10rem))] overflow-y-auto pr-1">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div><Label>Número</Label><Input type="number" value={form.number} onChange={e => setForm(f => ({ ...f, number: parseInt(e.target.value) || 0 }))} /></div>
        <div><Label>Categoria</Label>
          <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{categoryOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Coleção</Label>
          <Select value={form.collection || "hymnal"} onValueChange={v => setForm(f => ({ ...f, collection: v === "hymnal" ? null : v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hymnal">Hinário Principal</SelectItem>
              <SelectItem value="tfm">Charlie Mike (TFM)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
      <div><Label>Subtítulo</Label><Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} /></div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div><Label>Autor / Letrista</Label><Input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} /></div>
        <div><Label>Compositor</Label><Input value={form.composer} onChange={e => setForm(f => ({ ...f, composer: e.target.value }))} /></div>
      </div>
      <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
      <div><Label>Letra *</Label><Textarea value={form.lyrics} onChange={e => setForm(f => ({ ...f, lyrics: e.target.value }))} rows={10} required className="font-mono text-sm" /></div>
      <div><Label className="flex items-center gap-2"><Youtube className="h-4 w-4 text-red-500" /> URL do YouTube</Label>
        <Input value={form.youtubeUrl} onChange={e => setForm(f => ({ ...f, youtubeUrl: e.target.value }))} placeholder="https://youtube.com/watch?v=..." /></div>
      <div><Label className="flex items-center gap-2"><Youtube className="h-4 w-4 text-red-500" /> URL do YouTube Instrumental</Label>
        <Input value={form.instrumentalYoutubeUrl} onChange={e => setForm(f => ({ ...f, instrumentalYoutubeUrl: e.target.value }))} placeholder="https://youtube.com/watch?v=..." /></div>
      <div><Label className="flex items-center gap-2"><Music className="h-4 w-4" /> URL do Áudio (MP3)</Label>
        <div className="flex gap-2">
          <Input value={form.audioUrl} onChange={e => setForm(f => ({ ...f, audioUrl: e.target.value }))} placeholder="https://..." className="flex-1" />
          <Button type="button" variant="outline" disabled={uploading || !hymn?.id} className="gap-2" onClick={() => document.getElementById('audio-upload')?.click()}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Enviando..." : "Upload MP3"}
          </Button>
          <input id="audio-upload" type="file" accept="audio/mpeg,audio/wav,audio/ogg" onChange={handleAudioUpload} className="hidden" />
        </div>
        {form.audioUrl && <p className="text-xs text-green-600 mt-1">✓ Áudio salvo</p>}
      </div>
      <div><Label className="flex items-center gap-2"><Music className="h-4 w-4" /> URL do Instrumental (MP3)</Label>
        <div className="flex gap-2">
          <Input value={form.instrumentalAudioUrl} onChange={e => setForm(f => ({ ...f, instrumentalAudioUrl: e.target.value }))} placeholder="https://..." className="flex-1" />
          <Button type="button" variant="outline" disabled={uploadingInstrumental || !hymn?.id} className="gap-2" onClick={() => document.getElementById('instrumental-audio-upload')?.click()}>
            {uploadingInstrumental ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploadingInstrumental ? "Enviando..." : "Upload Instrumental"}
          </Button>
          <input id="instrumental-audio-upload" type="file" accept="audio/mpeg,audio/wav,audio/ogg" onChange={(event) => handleAudioUpload(event, "instrumental")} className="hidden" />
        </div>
        {form.instrumentalAudioUrl && <p className="text-xs text-green-600 mt-1">Instrumental salvo</p>}
      </div>
      <Button type="submit" className="w-full bg-[#1a3a2a] text-white gap-2" disabled={saving}>
        <Save className="h-4 w-4" />{saving ? "Salvando..." : hymn ? "Atualizar Hino" : "Criar Hino"}
      </Button>
    </form>
  );
}
