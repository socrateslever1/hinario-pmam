import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  ExternalLink,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Video,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Eye,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { CommanderPortrait } from "@/components/CommanderPortrait";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { mergeCfapCommanders, type CfapCommander, isCurrentCommander } from "@/data/cfapHistory";
import { trpc } from "@/lib/trpc";

type EditorState = {
  rank: string;
  name: string;
  periods: string;
  portraitUrl: string;
  biography: string;
  highlights: string;
  commandPhrase: string;
  memoryGallery: string;
  videos: string;
  sources: string;
  inMemoriam: boolean;
  isVisible: boolean;
  sortOrder: number;
};

function linksToText(items?: { title: string; url: string }[]) {
  return (items ?? []).map((item) => `${item.title} | ${item.url}`).join("\n");
}

function textToLinks(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf("|");
      return separator < 0
        ? { title: "Ver registro", url: line }
        : { title: line.slice(0, separator).trim(), url: line.slice(separator + 1).trim() };
    });
}

function memoryItemsToText(items?: { title: string; description: string; imageUrl: string }[]) {
  return (items ?? []).map((item) => `${item.title} | ${item.description} | ${item.imageUrl}`).join("\n");
}

function textToMemoryItems(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title = "", description = "", imageUrl = ""] = line.split("|").map((part) => part.trim());
      return { title, description, imageUrl };
    })
    .filter((item) => item.title && item.description && item.imageUrl);
}

function commanderToEditor(commander: CfapCommander): EditorState {
  return {
    rank: commander.rank,
    name: commander.name,
    periods: commander.periods.join("\n"),
    portraitUrl: commander.portraitUrl ?? "",
    biography: commander.biography ?? "",
    highlights: (commander.highlights ?? []).join("\n"),
    commandPhrase: commander.commandPhrase ?? "",
    memoryGallery: memoryItemsToText(commander.memoryGallery),
    videos: linksToText(commander.videos),
    sources: linksToText(commander.sources),
    inMemoriam: Boolean(commander.inMemoriam),
    isVisible: commander.isVisible !== false,
    sortOrder: commander.sortOrder ?? 0,
  };
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

export function CfapHistoryTab() {
  const query = trpc.cfapHistory.listAdmin.useQuery(undefined, { retry: false });
  const { data: settings } = trpc.settings.getAll.useQuery();
  const utils = trpc.useUtils();
  const commanders = useMemo(
    () => mergeCfapCommanders(query.data ?? [], { includeHidden: true }),
    [query.data]
  );

  const [search, setSearch] = useState("");
  const [selectedSlug, setSelectedSlug] = useState("");
  const selected = commanders.find((item) => item.slug === selectedSlug) ?? commanders[0];
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [draftSlug, setDraftSlug] = useState<string | null>(null);
  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const [uploadingMemoryImage, setUploadingMemoryImage] = useState(false);
  const portraitFileRef = useRef<HTMLInputElement>(null);
  const memoryImageFileRef = useRef<HTMLInputElement>(null);

  const [flanksForm, setFlanksForm] = useState({
    cfap_current_commander_flanks_enabled: "false",
    cfap_current_commander_left_photo: "",
    cfap_current_commander_right_photo: "",
  });
  const [uploadingLeft, setUploadingLeft] = useState(false);
  const [uploadingRight, setUploadingRight] = useState(false);
  const leftFileRef = useRef<HTMLInputElement>(null);
  const rightFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setFlanksForm({
        cfap_current_commander_flanks_enabled:
          settings.cfap_current_commander_flanks_enabled || "false",
        cfap_current_commander_left_photo: settings.cfap_current_commander_left_photo || "",
        cfap_current_commander_right_photo: settings.cfap_current_commander_right_photo || "",
      });
    }
  }, [settings]);

  useEffect(() => {
    if (!selectedSlug && commanders[0]) setSelectedSlug(commanders[0].slug);
  }, [commanders, selectedSlug]);

  useEffect(() => {
    if (selected && !draftSlug) setEditor(commanderToEditor(selected));
  }, [selected?.slug, query.data, draftSlug]);

  const updateSettingsBatch = trpc.settings.updateBatch.useMutation({
    onSuccess: () => {
      utils.settings.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const save = trpc.cfapHistory.upsert.useMutation({
    onSuccess: async () => {
      toast.success(
        draftSlug ? "Novo comandante publicado na galeria." : "Registro do comandante salvo com sucesso."
      );
      if (draftSlug) setSelectedSlug(draftSlug);
      setDraftSlug(null);
      await Promise.all([
        utils.cfapHistory.list.invalidate(),
        utils.cfapHistory.listAdmin.invalidate(),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  const commanderPayload = (currentEditor: EditorState) => {
    const slug = draftSlug ?? selected?.slug;
    if (!slug) return null;
    return {
      slug,
      rank: currentEditor.rank,
      name: currentEditor.name,
      periods: currentEditor.periods.split("\n").map((item) => item.trim()).filter(Boolean),
      portraitUrl: currentEditor.portraitUrl.trim() || null,
      biography: currentEditor.biography.trim() || null,
      highlights: currentEditor.highlights.split("\n").map((item) => item.trim()).filter(Boolean),
      commandPhrase: currentEditor.commandPhrase.trim() || null,
      memoryGallery: textToMemoryItems(currentEditor.memoryGallery),
      videos: textToLinks(currentEditor.videos),
      sources: textToLinks(currentEditor.sources),
      inMemoriam: currentEditor.inMemoriam,
      isVisible: currentEditor.isVisible,
      sortOrder: currentEditor.sortOrder,
    };
  };

  const handlePortraitUpload = async (file: File) => {
    setUploadingPortrait(true);
    try {
      if (!editor) throw new Error("Selecione um comandante antes de enviar a foto.");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "commanders"); // Organiza na pasta 'commanders'
      formData.append("assetSlug", draftSlug ?? selected?.slug ?? slugify(editor.name || file.name));
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Erro ao fazer upload da imagem");
      }
      const result = await response.json();
      const nextEditor = { ...editor, portraitUrl: result.url };
      setEditor(nextEditor);
      const payload = commanderPayload(nextEditor);
      if (payload && !draftSlug) {
        try {
          await save.mutateAsync(payload);
          toast.success("Foto aplicada ao comandante e publicada no mural.");
        } catch (publishError: any) {
          toast.error(publishError?.message || "Foto carregada, mas não foi possível publicar o vínculo agora.");
        }
      } else {
        toast.success("Foto carregada. Conclua os dados e publique o novo comandante.");
      }
    } catch (err: any) {
      toast.error(err.message || "Falha no upload");
    } finally {
      setUploadingPortrait(false);
    }
  };

  const handleMemoryImageUpload = async (file: File) => {
    setUploadingMemoryImage(true);
    try {
      if (!editor) throw new Error("Selecione um comandante antes de enviar a imagem.");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "cfap-memory");
      formData.append("assetSlug", draftSlug ?? selected?.slug ?? slugify(editor.name || file.name));
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Erro ao fazer upload da imagem");
      }
      const result = await response.json();
      const nextLine = `Novo registro | Descreva este momento histórico. | ${result.url}`;
      setEditor((prev) =>
        prev
          ? {
              ...prev,
              memoryGallery: [prev.memoryGallery.trim(), nextLine].filter(Boolean).join("\n"),
            }
          : prev
      );
      toast.success("Imagem enviada e adicionada ao campo Memória visual.");
    } catch (err: any) {
      toast.error(err.message || "Falha no upload");
    } finally {
      setUploadingMemoryImage(false);
      if (memoryImageFileRef.current) memoryImageFileRef.current.value = "";
    }
  };

  const handleFlankUpload = async (file: File, side: "left" | "right") => {
    const setUploading = side === "left" ? setUploadingLeft : setUploadingRight;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "cfap-backgrounds");
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Erro ao fazer upload da imagem");
      }
      const result = await response.json();
      if (side === "left") {
        setFlanksForm((f) => ({ ...f, cfap_current_commander_left_photo: result.url }));
      } else {
        setFlanksForm((f) => ({ ...f, cfap_current_commander_right_photo: result.url }));
      }
      toast.success(`Foto lateral ${side === "left" ? "esquerda" : "direita"} carregada com sucesso.`);
    } catch (err: any) {
      toast.error(err.message || "Falha no upload");
    } finally {
      setUploading(false);
    }
  };

  const filtered = commanders.filter((item) =>
    `${item.name} ${item.rank} ${item.periods.join(" ")}`
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR"))
  );

  const handleSave = () => {
    if (!editor) return;
    const payload = commanderPayload(editor);
    if (!payload) return;

    // Salva o comandante no BD
    save.mutate(payload);

    // Salva as fotos de fundo se for o comandante atual
    const isCurrent = editor.periods.toLocaleLowerCase("pt-BR").includes("atual");
    if (isCurrent) {
      const settingsArr = Object.entries(flanksForm).map(([key, value]) => ({
        key,
        value: value || "",
      }));
      updateSettingsBatch.mutate({ settings: settingsArr });
    }
  };

  const handleNew = () => {
    const nextOrder = Math.max(-1, ...commanders.map((item) => item.sortOrder ?? 0)) + 1;
    setDraftSlug("novo-comandante");
    setEditor({
      rank: "",
      name: "",
      periods: "",
      portraitUrl: "",
      biography: "",
      highlights: "",
      commandPhrase: "",
      memoryGallery: "",
      videos: "",
      sources: "",
      inMemoriam: false,
      isVisible: true,
      sortOrder: nextOrder,
    });
  };

  if (!editor || (!selected && !draftSlug))
    return <p className="py-10 text-center text-sm text-muted-foreground">Carregando acervo histórico...</p>;

  const isEditingCurrent = editor.periods.toLocaleLowerCase("pt-BR").includes("atual") || isCurrentCommander(selected);
  const isFlanksEnabled = flanksForm.cfap_current_commander_flanks_enabled === "true";

  return (
    <div className="space-y-6">
      {/* GERENCIADOR E EDITOR DE COMANDANTES */}
      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        
        {/* Coluna Lateral: Lista de Comandantes */}
        <Card className="h-fit border-border/70 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#9f8123]" />
                <h2 className="font-serif font-bold text-base">Comandantes</h2>
              </div>
              <Button size="sm" onClick={handleNew} className="gap-1.5 bg-[#183e2a] text-white text-xs">
                <Plus className="h-4 w-4" />
                Novo
              </Button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar nome ou período"
                className="pl-9 h-10 text-xs"
              />
            </div>

            <div className="max-h-[70vh] space-y-1.5 overflow-y-auto pr-1">
              {filtered.map((commander) => {
                const isCurrent = isCurrentCommander(commander);
                const isSelected = commander.slug === selected?.slug && !draftSlug;
                return (
                  <button
                    key={commander.slug}
                    type="button"
                    onClick={() => {
                      setDraftSlug(null);
                      setSelectedSlug(commander.slug);
                    }}
                    className={`w-full rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? "border-[#c4a84b] bg-[#c4a84b]/15 shadow-sm"
                        : "border-transparent hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="block text-sm font-bold leading-tight truncate text-foreground">
                        {commander.name}
                      </span>
                      {isCurrent && (
                        <span className="shrink-0 rounded-full bg-[#f0bd3a]/20 border border-[#f0bd3a]/50 px-2 py-0.5 text-[9px] font-black text-[#f0bd3a]">
                          ATUAL
                        </span>
                      )}
                    </div>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {commander.periods.join(" • ")}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Coluna Principal: Editor do Comandante */}
        <Card className="border-border/70 shadow-sm">
          <CardContent className="space-y-6 p-5 md:p-8">
            <div className="flex flex-col gap-3 rounded-2xl border border-[#c4a84b]/30 bg-gradient-to-r from-[#153b29] to-[#0c241a] p-5 text-white sm:flex-row sm:items-center sm:justify-between shadow-md">
              <div className="flex items-center gap-3.5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c4a84b]/20 text-[#e3c65d] border border-[#c4a84b]/30">
                  <ShieldCheck className="h-6 w-6" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-black uppercase tracking-[.18em] text-[#e3c65d]">
                      Editor do Comandante
                    </p>
                    {isEditingCurrent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f0bd3a] text-black px-2 py-0.5 text-[9px] font-black uppercase">
                        <Star className="h-3 w-3 fill-black" /> Em Exercício (Atual)
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-white/75 mt-0.5">
                    Configure os dados biográficos, fotos e acervo no banco de dados.
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                {draftSlug ? "Novo registro" : "Registro catalogado"}
              </span>
            </div>

            {/* Foto do retrato */}
            <div className="grid gap-6 md:grid-cols-[240px_1fr] bg-muted/15 p-5 rounded-2xl border border-border/60">
              <div className="space-y-3 flex flex-col items-center">
                <div className="relative w-full max-w-[220px] aspect-square overflow-hidden rounded-2xl border-2 border-[#c4a84b]/50 bg-black/40 shadow-md">
                  <CommanderPortrait
                    name={editor.name || "Novo comandante"}
                    portraitIndex={draftSlug ? undefined : selected?.portraitIndex}
                    portraitUrl={editor.portraitUrl}
                    className="h-full w-full object-cover"
                  />
                </div>

                <input
                  type="file"
                  ref={portraitFileRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePortraitUpload(file);
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full max-w-[220px] gap-2 text-xs font-bold border-[#c4a84b]/50 bg-[#c4a84b]/15 text-foreground hover:bg-[#c4a84b]/25 h-10"
                  onClick={() => portraitFileRef.current?.click()}
                  disabled={uploadingPortrait}
                >
                  <Upload className="h-4 w-4 text-[#f0bd3a]" />
                  {uploadingPortrait ? "Carregando..." : "Carregar Foto do Retrato"}
                </Button>

                {editor.portraitUrl && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs text-red-500 hover:text-red-600"
                    onClick={() => setEditor((prev) => (prev ? { ...prev, portraitUrl: "" } : prev))}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Remover Foto
                  </Button>
                )}
              </div>

              {/* Campos Principais */}
              <div className="grid content-start gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Posto / Graduação</Label>
                  <Input
                    value={editor.rank}
                    onChange={(event) => setEditor({ ...editor, rank: event.target.value })}
                    placeholder="Ex: Tenente-Coronel PM"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Nome Completo</Label>
                  <Input
                    value={editor.name}
                    onChange={(event) => setEditor({ ...editor, name: event.target.value })}
                    placeholder="Nome do Comandante"
                    className="h-10"
                  />
                </div>

                {draftSlug && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold">Identificador da página (slug)</Label>
                    <Input
                      value={draftSlug}
                      onChange={(event) => setDraftSlug(slugify(event.target.value))}
                      placeholder="nome-do-comandante"
                      className="h-10"
                    />
                  </div>
                )}

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold">Foto do comandante</Label>
                  <Input
                    value={editor.portraitUrl}
                    onChange={(event) =>
                      setEditor({ ...editor, portraitUrl: event.target.value })
                    }
                    placeholder="Será preenchido automaticamente após o upload"
                    className="h-10 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Ordem de exibição</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editor.sortOrder}
                    onChange={(event) =>
                      setEditor({ ...editor, sortOrder: Number(event.target.value) || 0 })
                    }
                    className="h-10"
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-2.5">
                  <Label className="text-xs font-bold">Visível na galeria</Label>
                  <Switch
                    checked={editor.isVisible}
                    onCheckedChange={(checked) => setEditor({ ...editor, isVisible: checked })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-2.5 sm:col-span-2">
                  <Label className="text-xs font-bold">In memoriam</Label>
                  <Switch
                    checked={editor.inMemoriam}
                    onCheckedChange={(checked) =>
                      setEditor({ ...editor, inMemoriam: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">
                  Períodos no comando (um por linha)
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  Use <code className="text-[#f0bd3a] font-bold">"atual"</code> para ativar o destaque de Comandante Atual
                </span>
              </div>
              <Textarea
                rows={2}
                value={editor.periods}
                onChange={(event) => setEditor({ ...editor, periods: event.target.value })}
                placeholder="Ex: Abr 2024 – atual"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Biografia e legado histórico</Label>
              <Textarea
                rows={5}
                value={editor.biography}
                onChange={(event) => setEditor({ ...editor, biography: event.target.value })}
                placeholder="Registre os fatos documentados e histórico da gestão."
                className="text-sm leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Destaques históricos (um por linha)</Label>
              <Textarea
                rows={3}
                value={editor.highlights}
                onChange={(event) => setEditor({ ...editor, highlights: event.target.value })}
                placeholder="Destaques da gestão..."
                className="text-sm leading-relaxed"
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-bold">
                  <Sparkles className="h-4 w-4 text-[#c4a84b]" />
                  Frase de comando
                </Label>
                <Textarea
                  rows={3}
                  value={editor.commandPhrase}
                  onChange={(event) => setEditor({ ...editor, commandPhrase: event.target.value })}
                  placeholder="Registre uma frase curta usada ou associada ao comandante."
                  className="text-sm leading-relaxed"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-bold">
                  <ImageIcon className="h-4 w-4 text-[#c4a84b]" />
                  Memória visual
                </Label>
                <Textarea
                  rows={3}
                  value={editor.memoryGallery}
                  onChange={(event) => setEditor({ ...editor, memoryGallery: event.target.value })}
                  placeholder="Título | Texto curto | /uploads/imagem.jpg"
                  className="text-xs leading-relaxed"
                />
                <input
                  type="file"
                  ref={memoryImageFileRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleMemoryImageUpload(file);
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 gap-2 text-xs font-bold border-[#c4a84b]/40 bg-[#c4a84b]/10"
                  onClick={() => memoryImageFileRef.current?.click()}
                  disabled={uploadingMemoryImage}
                >
                  <Upload className="h-4 w-4 text-[#c4a84b]" />
                  {uploadingMemoryImage ? "Enviando imagem..." : "Enviar imagem"}
                </Button>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Um item por linha. Use imagens locais do sistema ou links HTTPS.
                </p>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-bold">
                  <Video className="h-4 w-4 text-[#c4a84b]" />
                  Vídeos
                </Label>
                <Textarea
                  rows={3}
                  value={editor.videos}
                  onChange={(event) => setEditor({ ...editor, videos: event.target.value })}
                  placeholder="Título do vídeo | https://..."
                  className="text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-bold">
                  <ExternalLink className="h-4 w-4 text-[#c4a84b]" />
                  Fontes públicas
                </Label>
                <Textarea
                  rows={3}
                  value={editor.sources}
                  onChange={(event) => setEditor({ ...editor, sources: event.target.value })}
                  placeholder="Nome da fonte | https://..."
                  className="text-xs"
                />
              </div>
            </div>

            {/* SEÇÃO LÁ EMBAIXO: FOTOS LATERAIS DE FUNDO (EXCLUSIVO PARA O COMANDANTE ATUAL) */}
            {isEditingCurrent && (
              <div className="mt-8 pt-6 border-t-2 border-[#c4a84b]/30 space-y-5 rounded-2xl bg-muted/20 p-5 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#f0bd3a]" />
                      <h4 className="font-serif font-black text-foreground text-base">
                        Fotos Laterais de Fundo (Fumê / Fundidas) — Comandante Atual
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Exibição de fotos institucionais suaves no fundo do destaque do comandante atual.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-card px-3.5 py-2 rounded-xl border border-border/60">
                    <Label htmlFor="bottom-flanks-toggle" className="text-xs font-bold cursor-pointer">
                      {isFlanksEnabled ? "Fotos Ativadas" : "Fotos Desativadas"}
                    </Label>
                    <Switch
                      id="bottom-flanks-toggle"
                      checked={isFlanksEnabled}
                      onCheckedChange={(checked) =>
                        setFlanksForm((f) => ({
                          ...f,
                          cfap_current_commander_flanks_enabled: checked ? "true" : "false",
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Foto Esquerda */}
                  <div className="space-y-3 rounded-xl border border-border/60 bg-card p-4">
                    <div className="flex items-center justify-between">
                      <Label className="font-bold flex items-center gap-1.5 text-xs text-foreground">
                        <ImageIcon className="h-3.5 w-3.5 text-[#c4a84b]" />
                        Foto Lateral Esquerda
                      </Label>
                      {flanksForm.cfap_current_commander_left_photo && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[11px] text-red-500 hover:text-red-600"
                          onClick={() =>
                            setFlanksForm((f) => ({ ...f, cfap_current_commander_left_photo: "" }))
                          }
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Remover
                        </Button>
                      )}
                    </div>

                    <div
                      onClick={() => leftFileRef.current?.click()}
                      className="group flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-[#c4a84b] bg-muted/40 p-4 text-center cursor-pointer transition-all hover:bg-[#c4a84b]/5"
                    >
                      <input
                        type="file"
                        ref={leftFileRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFlankUpload(file, "left");
                        }}
                      />
                      <Upload className="h-4 w-4 text-[#f0bd3a] group-hover:scale-110 transition-transform" />
                      <p className="mt-1 text-xs font-bold text-foreground">
                        {uploadingLeft ? "Enviando..." : "Carregar Foto Esquerda"}
                      </p>
                    </div>

                    <Input
                      value={flanksForm.cfap_current_commander_left_photo}
                      onChange={(e) =>
                        setFlanksForm((f) => ({
                          ...f,
                          cfap_current_commander_left_photo: e.target.value,
                        }))
                      }
                      placeholder="https://... ou faça upload"
                      className="text-xs h-8"
                    />

                    {flanksForm.cfap_current_commander_left_photo && (
                      <div className="relative h-20 w-full overflow-hidden rounded-lg border border-[#c4a84b]/40 bg-black/80">
                        <div className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-[#061a11]/60 to-[#061a11]" />
                        <img
                          src={flanksForm.cfap_current_commander_left_photo}
                          alt="Preview Esquerda"
                          className="h-full w-full object-cover object-left opacity-60 mix-blend-luminosity filter contrast-125"
                        />
                        <span className="absolute bottom-1 left-2 z-20 text-[9px] font-black uppercase text-[#f0bd3a]">
                          Preview Fumê Esquerdo
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Foto Direita */}
                  <div className="space-y-3 rounded-xl border border-border/60 bg-card p-4">
                    <div className="flex items-center justify-between">
                      <Label className="font-bold flex items-center gap-1.5 text-xs text-foreground">
                        <ImageIcon className="h-3.5 w-3.5 text-[#c4a84b]" />
                        Foto Lateral Direita
                      </Label>
                      {flanksForm.cfap_current_commander_right_photo && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[11px] text-red-500 hover:text-red-600"
                          onClick={() =>
                            setFlanksForm((f) => ({ ...f, cfap_current_commander_right_photo: "" }))
                          }
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Remover
                        </Button>
                      )}
                    </div>

                    <div
                      onClick={() => rightFileRef.current?.click()}
                      className="group flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-[#c4a84b] bg-muted/40 p-4 text-center cursor-pointer transition-all hover:bg-[#c4a84b]/5"
                    >
                      <input
                        type="file"
                        ref={rightFileRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFlankUpload(file, "right");
                        }}
                      />
                      <Upload className="h-4 w-4 text-[#f0bd3a] group-hover:scale-110 transition-transform" />
                      <p className="mt-1 text-xs font-bold text-foreground">
                        {uploadingRight ? "Enviando..." : "Carregar Foto Direita"}
                      </p>
                    </div>

                    <Input
                      value={flanksForm.cfap_current_commander_right_photo}
                      onChange={(e) =>
                        setFlanksForm((f) => ({
                          ...f,
                          cfap_current_commander_right_photo: e.target.value,
                        }))
                      }
                      placeholder="https://... ou faça upload"
                      className="text-xs h-8"
                    />

                    {flanksForm.cfap_current_commander_right_photo && (
                      <div className="relative h-20 w-full overflow-hidden rounded-lg border border-[#c4a84b]/40 bg-black/80">
                        <div className="absolute inset-0 z-10 bg-gradient-to-l from-transparent via-[#061a11]/60 to-[#061a11]" />
                        <img
                          src={flanksForm.cfap_current_commander_right_photo}
                          alt="Preview Direita"
                          className="h-full w-full object-cover object-right opacity-60 mix-blend-luminosity filter contrast-125"
                        />
                        <span className="absolute bottom-1 right-2 z-20 text-[9px] font-black uppercase text-[#f0bd3a]">
                          Preview Fumê Direito
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* BOTÃO PRINCIPAL DE SALVAR */}
            <div className="flex justify-end pt-4 border-t border-border/50">
              <Button
                onClick={handleSave}
                disabled={
                  save.isPending ||
                  !editor.name.trim() ||
                  !editor.rank.trim() ||
                  !editor.periods.trim() ||
                  Boolean(draftSlug !== null && !draftSlug)
                }
                className="w-full gap-2 bg-[#1a3a2a] hover:bg-[#225539] text-white sm:w-auto px-7 py-3 font-bold shadow-md text-sm"
              >
                <Save className="h-4 w-4" />
                {save.isPending
                  ? "Gravando no Banco de Dados..."
                  : draftSlug
                  ? "Adicionar à Galeria"
                  : "Salvar Dados do Comandante no BD"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
