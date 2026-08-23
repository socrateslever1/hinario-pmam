import { useEffect, useMemo, useState } from "react";
import { BookOpen, ExternalLink, Plus, Save, Search, ShieldCheck, Video } from "lucide-react";
import { toast } from "sonner";
import { CommanderPortrait } from "@/components/CommanderPortrait";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { mergeCfapCommanders, type CfapCommander } from "@/data/cfapHistory";
import { trpc } from "@/lib/trpc";

type EditorState = {
  rank: string;
  name: string;
  periods: string;
  portraitUrl: string;
  biography: string;
  highlights: string;
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
  return value.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const separator = line.indexOf("|");
    return separator < 0
      ? { title: "Ver registro", url: line }
      : { title: line.slice(0, separator).trim(), url: line.slice(separator + 1).trim() };
  });
}

function commanderToEditor(commander: CfapCommander): EditorState {
  return {
    rank: commander.rank,
    name: commander.name,
    periods: commander.periods.join("\n"),
    portraitUrl: commander.portraitUrl ?? "",
    biography: commander.biography ?? "",
    highlights: (commander.highlights ?? []).join("\n"),
    videos: linksToText(commander.videos),
    sources: linksToText(commander.sources),
    inMemoriam: Boolean(commander.inMemoriam),
    isVisible: commander.isVisible !== false,
    sortOrder: commander.sortOrder ?? 0,
  };
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 160);
}

export function CfapHistoryTab() {
  const query = trpc.cfapHistory.listAdmin.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();
  const commanders = useMemo(() => mergeCfapCommanders(query.data ?? [], { includeHidden: true }), [query.data]);
  const [search, setSearch] = useState("");
  const [selectedSlug, setSelectedSlug] = useState("");
  const selected = commanders.find((item) => item.slug === selectedSlug) ?? commanders[0];
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [draftSlug, setDraftSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedSlug && commanders[0]) setSelectedSlug(commanders[0].slug);
  }, [commanders, selectedSlug]);

  useEffect(() => {
    if (selected && !draftSlug) setEditor(commanderToEditor(selected));
  }, [selected?.slug, query.data, draftSlug]);

  const save = trpc.cfapHistory.upsert.useMutation({
    onSuccess: async () => {
      toast.success(draftSlug ? "Novo comandante publicado na galeria." : "Registro histórico salvo.");
      if (draftSlug) setSelectedSlug(draftSlug);
      setDraftSlug(null);
      await Promise.all([utils.cfapHistory.list.invalidate(), utils.cfapHistory.listAdmin.invalidate()]);
    },
    onError: (error) => toast.error(error.message),
  });

  const filtered = commanders.filter((item) => `${item.name} ${item.rank} ${item.periods.join(" ")}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")));

  const handleSave = () => {
    if (!editor) return;
    const slug = draftSlug ?? selected?.slug;
    if (!slug) return;
    save.mutate({
      slug,
      rank: editor.rank,
      name: editor.name,
      periods: editor.periods.split("\n").map((item) => item.trim()).filter(Boolean),
      portraitUrl: editor.portraitUrl.trim() || null,
      biography: editor.biography.trim() || null,
      highlights: editor.highlights.split("\n").map((item) => item.trim()).filter(Boolean),
      videos: textToLinks(editor.videos),
      sources: textToLinks(editor.sources),
      inMemoriam: editor.inMemoriam,
      isVisible: editor.isVisible,
      sortOrder: editor.sortOrder,
    });
  };

  const handleNew = () => {
    const nextOrder = Math.max(-1, ...commanders.map((item) => item.sortOrder ?? 0)) + 1;
    setDraftSlug("novo-comandante");
    setEditor({ rank: "", name: "", periods: "", portraitUrl: "", biography: "", highlights: "", videos: "", sources: "", inMemoriam: false, isVisible: true, sortOrder: nextOrder });
  };

  if (!editor || (!selected && !draftSlug)) return <p className="py-10 text-center text-sm text-muted-foreground">Carregando acervo histórico...</p>;

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="h-fit border-border/60">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-[#9f8123]" /><h2 className="font-bold">Homenageados</h2></div><Button size="sm" onClick={handleNew} className="gap-1.5 bg-[#183e2a] text-white"><Plus className="h-4 w-4" />Novo</Button></div>
          <div className="relative mb-3"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nome ou período" className="pl-9" /></div>
          <div className="max-h-[62vh] space-y-1 overflow-y-auto pr-1">
            {filtered.map((commander) => (
              <button key={commander.slug} type="button" onClick={() => { setDraftSlug(null); setSelectedSlug(commander.slug); }} className={`w-full rounded-lg border px-3 py-2 text-left transition ${commander.slug === selected?.slug && !draftSlug ? "border-[#c4a84b] bg-[#c4a84b]/10" : "border-transparent hover:bg-muted"}`}>
                <span className="block text-sm font-bold leading-tight">{commander.name}</span>
                <span className="mt-1 block text-[11px] text-muted-foreground">{commander.periods.join(" • ")}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="space-y-5 p-4 md:p-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-[#c4a84b]/25 bg-gradient-to-r from-[#153b29] to-[#0c241a] p-4 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c4a84b]/15 text-[#e3c65d]"><ShieldCheck className="h-5 w-5" /></span><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#e3c65d]">Editor premium</p><p className="text-sm text-white/70">Curadoria, publicação e acervo audiovisual em um só lugar.</p></div></div>
            <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/65">{draftSlug ? "Novo registro" : "Registro catalogado"}</span>
          </div>
          <div className="grid gap-5 md:grid-cols-[190px_1fr]">
            <CommanderPortrait name={editor.name || "Novo comandante"} portraitIndex={draftSlug ? undefined : selected?.portraitIndex} portraitUrl={editor.portraitUrl} className="rounded-2xl border" />
            <div className="grid content-start gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Posto/graduação</Label><Input value={editor.rank} onChange={(event) => setEditor({ ...editor, rank: event.target.value })} /></div>
              <div className="space-y-1.5"><Label>Nome completo</Label><Input value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value })} /></div>
              {draftSlug && <div className="space-y-1.5 sm:col-span-2"><Label>Identificador da página</Label><Input value={draftSlug} onChange={(event) => setDraftSlug(slugify(event.target.value))} placeholder="nome-do-comandante" /><p className="text-[11px] text-muted-foreground">Usado na URL pública. Deve ser único e não poderá ficar vazio.</p></div>}
              <div className="space-y-1.5 sm:col-span-2"><Label>Imagem em alta resolução</Label><Input value={editor.portraitUrl} onChange={(event) => setEditor({ ...editor, portraitUrl: event.target.value })} placeholder="/history/commanders/retrato.webp ou URL HTTPS" /></div>
              <div className="space-y-1.5"><Label>Ordem de exibição</Label><Input type="number" min={0} value={editor.sortOrder} onChange={(event) => setEditor({ ...editor, sortOrder: Number(event.target.value) || 0 })} /></div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2"><Label>Visível na galeria</Label><Switch checked={editor.isVisible} onCheckedChange={(checked) => setEditor({ ...editor, isVisible: checked })} /></div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2"><Label>In memoriam</Label><Switch checked={editor.inMemoriam} onCheckedChange={(checked) => setEditor({ ...editor, inMemoriam: checked })} /></div>
            </div>
          </div>

          <div className="space-y-1.5"><Label>Períodos no comando - um por linha</Label><Textarea rows={3} value={editor.periods} onChange={(event) => setEditor({ ...editor, periods: event.target.value })} /></div>
          <div className="space-y-1.5"><Label>Biografia e legado</Label><Textarea rows={8} value={editor.biography} onChange={(event) => setEditor({ ...editor, biography: event.target.value })} placeholder="Registre somente fatos documentados e atribua as fontes abaixo." /></div>
          <div className="space-y-1.5"><Label>Destaques históricos - um por linha</Label><Textarea rows={5} value={editor.highlights} onChange={(event) => setEditor({ ...editor, highlights: event.target.value })} /></div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-1.5"><Label className="flex items-center gap-2"><Video className="h-4 w-4" />Vídeos</Label><Textarea rows={5} value={editor.videos} onChange={(event) => setEditor({ ...editor, videos: event.target.value })} placeholder="Título do vídeo | https://...\nUm vídeo por linha" /><p className="text-[11px] text-muted-foreground">Aceita YouTube, Vimeo e links públicos de vídeo.</p></div>
            <div className="space-y-1.5"><Label className="flex items-center gap-2"><ExternalLink className="h-4 w-4" />Fontes públicas</Label><Textarea rows={5} value={editor.sources} onChange={(event) => setEditor({ ...editor, sources: event.target.value })} placeholder="Nome da fonte | https://...\nUma fonte por linha" /><p className="text-[11px] text-muted-foreground">As fontes aparecerão na ficha pública.</p></div>
          </div>

          <div className="flex justify-end"><Button onClick={handleSave} disabled={save.isPending || !editor.name.trim() || !editor.rank.trim() || !editor.periods.trim() || Boolean(draftSlug !== null && !draftSlug)} className="w-full gap-2 bg-[#1a3a2a] text-white sm:w-auto"><Save className="h-4 w-4" />{save.isPending ? "Salvando..." : draftSlug ? "Adicionar à galeria" : "Salvar homenageado"}</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}
