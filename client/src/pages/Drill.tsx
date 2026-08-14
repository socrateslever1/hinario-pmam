import { useEffect, useMemo, useRef, useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { getOfflineCachedUrls, usePWA } from "@/hooks/usePWA";
import { getOrdemUnidaPlaybackPlan } from "@/lib/ordemUnidaPlayback";
import { toast } from "sonner";
import {
  createDefaultSessionConfig,
  DOBRADOS,
  getConfiguredItems,
  getConfiguredSessionItems,
  OrdemUnidaItemType,
  OrdemUnidaPanelItem,
  OrdemUnidaSessionConfig,
  sanitizeSessionConfig,
  TOQUES_DE_CORNETA,
  VOZES_DE_COMANDO,
} from "@/lib/ordemUnidaPanel";
import {
  CheckCircle2,
  CircleStop,
  ClipboardPenLine,
  Download,
  ListMusic,
  Music2,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Radio,
  Save,
  Star,
  Trash2,
  Volume2,
  X,
} from "lucide-react";

const SESSION_STORAGE_KEY = "pmam-ordem-unida-sessao-atual";

function getInitialSessionConfig() {
  if (typeof window === "undefined") return createDefaultSessionConfig();

  try {
    return sanitizeSessionConfig(JSON.parse(window.localStorage.getItem(SESSION_STORAGE_KEY) ?? "{}"));
  } catch {
    return createDefaultSessionConfig();
  }
}

function PanelItemButton({
  item,
  isInSession,
  isExecuting,
  onExecute,
  onToggleSession,
}: {
  item: OrdemUnidaPanelItem;
  isInSession: boolean;
  isExecuting: boolean;
  onExecute: (item: OrdemUnidaPanelItem) => void;
  onToggleSession: (item: OrdemUnidaPanelItem) => void;
}) {
  const typeStyle = {
    corneta: "border-sky-200 bg-sky-50/70 hover:border-sky-400 hover:bg-sky-100/70 dark:border-sky-900/50 dark:bg-sky-950/20 dark:hover:bg-sky-950/40",
    dobrado: "border-amber-200 bg-amber-50/70 hover:border-amber-400 hover:bg-amber-100/70 dark:border-amber-900/50 dark:bg-amber-950/20 dark:hover:bg-amber-950/40",
    voz: "border-emerald-200 bg-emerald-50/70 hover:border-emerald-400 hover:bg-emerald-100/70 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40",
  }[item.type];
  const ItemIcon = item.type === "corneta" ? Radio : item.type === "dobrado" ? Music2 : Volume2;

  return (
    <div className={`group relative flex min-h-20 items-stretch overflow-hidden rounded-2xl border text-left shadow-sm transition-all duration-150 active:scale-[0.985] ${typeStyle} ${isExecuting ? "ring-2 ring-[#c4a84b] ring-offset-2 ring-offset-background" : ""}`}>
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#1a3a2a] focus-visible:ring-inset"
        onClick={() => onExecute(item)}
        aria-pressed={isExecuting}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-[#1a3a2a] shadow-sm dark:bg-black/20 dark:text-[#d8bf6e]"><ItemIcon className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-black uppercase tracking-[0.035em] text-foreground sm:text-sm">{item.title}</span>
          {item.subtitle && <span className="mt-0.5 block text-[11px] font-medium text-muted-foreground">{item.subtitle}</span>}
        </span>
        {isExecuting && <CheckCircle2 className="h-5 w-5 shrink-0 text-[#1a3a2a]" aria-label="Em execução" />}
      </button>
      <button
        type="button"
        className="flex w-12 shrink-0 items-center justify-center border-l border-black/5 text-[#1a3a2a] transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3a2a] focus-visible:ring-inset dark:border-white/10 dark:hover:bg-white/10"
        onClick={() => onToggleSession(item)}
        aria-label={isInSession ? `Remover ${item.title} da sessão pessoal` : `Adicionar ${item.title} à sessão pessoal`}
        title={isInSession ? "Remover da sessão" : "Adicionar à sessão"}
      >
        {isInSession ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function Drill() {
  const [sessionConfig, setSessionConfig] = useState<OrdemUnidaSessionConfig>(getInitialSessionConfig);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSubtitle, setDraftSubtitle] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customType, setCustomType] = useState<OrdemUnidaItemType>("corneta");
  const [isCachingAudios, setIsCachingAudios] = useState(false);
  const [audiosCached, setAudiosCached] = useState(false);
  const [audioCacheMessage, setAudioCacheMessage] = useState("");
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const audioCatalogQuery = trpc.ordemUnidaAudio.list.useQuery();
  const { cacheUrls, isOnline } = usePWA();

  const allConfiguredItems = useMemo(() => getConfiguredItems(sessionConfig), [sessionConfig]);
  const sessionItems = useMemo(() => getConfiguredSessionItems(sessionConfig), [sessionConfig]);
  const currentItem = useMemo(() => allConfiguredItems.find((item) => item.id === sessionConfig.currentItemId), [allConfiguredItems, sessionConfig.currentItemId]);
  const cornetas = useMemo(() => allConfiguredItems.filter((item) => TOQUES_DE_CORNETA.some((baseItem) => baseItem.id === item.id)), [allConfiguredItems]);
  const dobrados = useMemo(() => allConfiguredItems.filter((item) => DOBRADOS.some((baseItem) => baseItem.id === item.id)), [allConfiguredItems]);
  const vozes = useMemo(() => allConfiguredItems.filter((item) => VOZES_DE_COMANDO.some((baseItem) => baseItem.id === item.id)), [allConfiguredItems]);
  const audioByItemId = useMemo(
    () => new Map((audioCatalogQuery.data ?? []).map((audio) => [audio.itemId, audio])),
    [audioCatalogQuery.data],
  );
  const audioUrls = useMemo(
    () => Array.from(new Set((audioCatalogQuery.data ?? []).map((audio) => audio.audioUrl).filter(Boolean))),
    [audioCatalogQuery.data],
  );
  const currentAudio = currentItem ? audioByItemId.get(currentItem.id) : undefined;

  useEffect(() => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionConfig));
  }, [sessionConfig]);

  useEffect(() => () => {
    audioPlayerRef.current?.pause();
    audioPlayerRef.current = null;
  }, []);

  useEffect(() => {
    let active = true;
    if (!audioUrls.length) {
      setAudiosCached(false);
      setAudioCacheMessage("");
      return () => { active = false; };
    }

    void getOfflineCachedUrls(audioUrls).then((cachedUrls) => {
      if (!active) return;
      const complete = cachedUrls.length === audioUrls.length;
      setAudiosCached(complete);
      setAudioCacheMessage(complete ? `${cachedUrls.length} áudio${cachedUrls.length === 1 ? "" : "s"} pronto${cachedUrls.length === 1 ? "" : "s"} para uso offline.` : cachedUrls.length ? `${cachedUrls.length} de ${audioUrls.length} áudio${audioUrls.length === 1 ? "" : "s"} já está${cachedUrls.length === 1 ? "" : "ão"} no aparelho.` : "");
    }).catch(() => undefined);

    return () => { active = false; };
  }, [audioUrls]);

  const isInSession = (item: OrdemUnidaPanelItem) => sessionConfig.itemIds.includes(item.id);

  const toggleSessionItem = (item: OrdemUnidaPanelItem) => {
    setSessionConfig((current) => ({
      ...current,
      itemIds: current.itemIds.includes(item.id) ? current.itemIds.filter((id) => id !== item.id) : [...current.itemIds, item.id],
    }));
  };

  const stopPlayback = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const stopExecution = () => {
    stopPlayback();
    setSessionConfig((current) => ({ ...current, currentItemId: null }));
  };

  const executeItem = (item: OrdemUnidaPanelItem) => {
    stopPlayback();
    setSessionConfig((current) => ({ ...current, currentItemId: item.id }));
    const audio = audioByItemId.get(item.id);
    const playback = getOrdemUnidaPlaybackPlan(item, audio?.audioUrl);
    if (playback.mode === "audio" && typeof window !== "undefined") {
      const player = new Audio(playback.audioUrl);
      audioPlayerRef.current = player;
      void player.play().catch(() => undefined);
    } else if (playback.mode === "speech" && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(playback.text);
      utterance.lang = "pt-BR";
      utterance.rate = 0.92;
      window.speechSynthesis.speak(utterance);
    }
  };

  const cacheRegisteredAudios = async () => {
    if (!audioUrls.length || !isOnline) return;
    setIsCachingAudios(true);
    try {
      const result = await cacheUrls(audioUrls);
      const completed = result.cachedUrls.length === audioUrls.length;
      setAudiosCached(completed);
      if (completed) {
        const message = `${result.cachedUrls.length} áudio${result.cachedUrls.length === 1 ? "" : "s"} pronto${result.cachedUrls.length === 1 ? "" : "s"} para uso offline.`;
        setAudioCacheMessage(message);
        toast.success(message);
      } else {
        const message = `${result.cachedUrls.length} de ${audioUrls.length} áudios foram preparados. Tente novamente para concluir os restantes.`;
        setAudioCacheMessage(message);
        toast.warning(message);
      }
    } finally {
      setIsCachingAudios(false);
    }
  };

  const startEditing = (item: OrdemUnidaPanelItem) => {
    setEditingItemId(item.id);
    setDraftTitle(item.title);
    setDraftSubtitle(item.subtitle ?? "");
  };

  const saveItemEdition = () => {
    if (!editingItemId || !draftTitle.trim()) return;
    setSessionConfig((current) => ({
      ...current,
      overrides: {
        ...current.overrides,
        [editingItemId]: { title: draftTitle.trim(), ...(draftSubtitle.trim() ? { subtitle: draftSubtitle.trim() } : {}) },
      },
    }));
    setEditingItemId(null);
  };

  const addPersonalItem = () => {
    const title = customTitle.trim();
    if (!title) return;
    const item: OrdemUnidaPanelItem = {
      id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      type: customType,
      subtitle: "Item pessoal",
    };
    setSessionConfig((current) => ({ ...current, customItems: [...current.customItems, item], itemIds: [...current.itemIds, item.id] }));
    setCustomTitle("");
  };

  const removeFromSession = (item: OrdemUnidaPanelItem) => {
    setSessionConfig((current) => ({
      ...current,
      itemIds: current.itemIds.filter((id) => id !== item.id),
      customItems: current.customItems.filter((customItem) => customItem.id !== item.id),
      currentItemId: current.currentItemId === item.id ? null : current.currentItemId,
    }));
  };

  return (
    <div className="mobile-safe-bottom min-h-screen bg-[#f5f2e8] text-foreground dark:bg-background">
      <Navbar />
      <main className="px-3 py-4 sm:px-5 sm:py-6 md:px-0 md:py-9">
        <div className="container max-w-6xl space-y-5 sm:space-y-7">
          <section className="overflow-hidden rounded-[1.8rem] border border-[#1a3a2a]/20 bg-[#1a3a2a] text-white shadow-lg">
            <div className="relative px-5 py-7 sm:px-8 sm:py-9">
              <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full border-[28px] border-[#c4a84b]/15" />
              <div className="relative max-w-3xl">
                <div className="mb-3 flex items-center gap-2 text-[#e4cf87]"><ListMusic className="h-5 w-5" /><span className="text-[11px] font-black uppercase tracking-[0.18em]">Painel operacional</span></div>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl" style={{ fontFamily: "Merriweather, serif" }}>Ordem Unida</h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">Execute toques e comandos diretamente pelos botões. O estado atual permanece visível para orientar a instrução e a sessão pessoal fica guardada neste aparelho.</p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[1.6rem] border border-[#1a3a2a]/30 bg-card shadow-sm" aria-labelledby="execucao-atual-title" aria-live="polite">
            <div className="bg-[#1a3a2a] px-4 py-3 text-white sm:px-5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#e4cf87]">Estado da execução</p>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${currentItem ? "bg-[#c4a84b] text-[#1a3a2a]" : "bg-white/10 text-white/70"}`}><Radio className="h-5 w-5" /></span>
                  <div className="min-w-0"><h2 id="execucao-atual-title" className="truncate text-xl font-black">{currentItem ? `Está em ${currentItem.title}` : "Aguardando comando"}</h2><p className="mt-0.5 text-xs text-white/70">{currentItem ? currentAudio ? "Reprodução vinculada em andamento; o botão ativo está destacado." : "O botão ativo está destacado. O áudio será executado assim que estiver vinculado." : "Pressione um toque, dobrado ou voz de comando para iniciar a execução."}</p></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {audioUrls.length > 0 && <Button type="button" variant="outline" size="sm" onClick={() => void cacheRegisteredAudios()} disabled={!isOnline || isCachingAudios} className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white disabled:opacity-50"><Download className="mr-1.5 h-4 w-4" />{isCachingAudios ? "Preparando…" : audiosCached ? "Áudios prontos" : "Baixar áudios"}</Button>}
                  {currentItem && <Button type="button" variant="outline" size="sm" onClick={stopExecution} className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"><CircleStop className="mr-1.5 h-4 w-4" /> Encerrar</Button>}
                </div>
              </div>
              {audioUrls.length > 0 && <p className="mt-2 text-[11px] text-white/70">{audioCacheMessage || (isOnline ? "Baixe os áudios vinculados para mantê-los disponíveis mesmo sem conexão." : "Conecte-se para baixar os áudios disponíveis neste aparelho.")}</p>}
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-[#c4a84b]/45 bg-[#fffdf7] p-4 shadow-sm dark:bg-card sm:p-5" aria-labelledby="sessao-atual-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c4a84b] text-[#1a3a2a] shadow-sm"><Star className="h-5 w-5" /></span><div><p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#806919]">Acesso rápido</p><h2 id="sessao-atual-title" className="text-lg font-black text-[#1a3a2a] dark:text-[#e5ce7c]">{sessionConfig.name || "Sessão atual"}</h2><p className="mt-0.5 text-xs text-muted-foreground">Os itens pessoais ficam salvos neste aparelho para a próxima instrução.</p></div></div>
              <div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => setEditorOpen((current) => !current)} className="h-9 text-xs font-bold"><ClipboardPenLine className="mr-1.5 h-4 w-4" />{editorOpen ? "Fechar editor" : "Editor pessoal"}</Button>{sessionItems.length > 0 && <Button type="button" variant="ghost" size="sm" onClick={() => setSessionConfig((current) => ({ ...current, itemIds: [], currentItemId: null }))} className="h-9 text-xs font-bold text-muted-foreground hover:text-destructive"><X className="mr-1.5 h-4 w-4" />Limpar</Button>}</div>
            </div>
            {sessionItems.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed border-[#c4a84b]/60 bg-[#c4a84b]/5 px-4 py-5 text-center"><Pin className="mx-auto h-5 w-5 text-[#a88d34]" /><p className="mt-2 text-sm font-bold text-foreground">Ainda não há itens nesta sessão.</p><p className="mt-1 text-xs text-muted-foreground">Use o editor pessoal ou o ícone de fixar nos painéis abaixo.</p></div> : <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{sessionItems.map((item) => <PanelItemButton key={item.id} item={item} isInSession isExecuting={sessionConfig.currentItemId === item.id} onExecute={executeItem} onToggleSession={toggleSessionItem} />)}</div>}
          </section>

          {editorOpen && <section className="rounded-[1.6rem] border border-[#1a3a2a]/20 bg-card p-4 shadow-sm sm:p-5" aria-labelledby="editor-pessoal-title">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#806919]">Configuração local</p><h2 id="editor-pessoal-title" className="text-lg font-black text-[#1a3a2a] dark:text-[#e5ce7c]">Editor pessoal da sessão</h2><p className="mt-0.5 text-xs text-muted-foreground">Monte a lista, altere os nomes exibidos e adicione itens sem mudar o acervo geral.</p></div><span className="rounded-full bg-[#c4a84b]/15 px-2.5 py-1 text-[11px] font-black text-[#806919]">{sessionItems.length} itens</span></div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
              <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-3"><label className="block text-xs font-black uppercase tracking-[0.1em] text-muted-foreground">Nome da sessão</label><Input value={sessionConfig.name} onChange={(event) => setSessionConfig((current) => ({ ...current, name: event.target.value.slice(0, 60) }))} placeholder="Ex.: Instrução 1º Pelotão" /><div className="border-t border-border/60 pt-3"><p className="text-xs font-black uppercase tracking-[0.1em] text-muted-foreground">Adicionar item pessoal</p><div className="mt-2 flex flex-col gap-2 sm:flex-row"><Input value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} placeholder="Nome do toque ou comando" /><select value={customType} onChange={(event) => setCustomType(event.target.value as OrdemUnidaItemType)} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-medium"><option value="corneta">Corneta</option><option value="dobrado">Dobrado</option><option value="voz">Voz</option></select></div><Button type="button" size="sm" onClick={addPersonalItem} disabled={!customTitle.trim()} className="mt-2 w-full bg-[#1a3a2a] text-white hover:bg-[#12281d]"><Plus className="mr-1.5 h-4 w-4" />Adicionar à sessão</Button></div><details className="rounded-xl border border-dashed border-border/80 p-3"><summary className="cursor-pointer text-sm font-bold text-[#1a3a2a] dark:text-[#e5ce7c]">Adicionar do acervo existente</summary><div className="mt-3 grid max-h-60 gap-1 overflow-y-auto pr-1">{allConfiguredItems.filter((item) => !isInSession(item)).map((item) => <button key={item.id} type="button" onClick={() => toggleSessionItem(item)} className="flex min-w-0 items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-xs font-semibold hover:bg-muted"><span className="truncate">{item.title}</span><Plus className="h-4 w-4 shrink-0 text-[#806919]" /></button>)}</div></details></div>
              <div className="space-y-2"><p className="text-xs font-black uppercase tracking-[0.1em] text-muted-foreground">Itens da sessão</p>{sessionItems.length === 0 ? <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">Adicione itens do acervo ou crie um item pessoal.</p> : sessionItems.map((item) => editingItemId === item.id ? <div key={item.id} className="rounded-xl border border-[#c4a84b]/50 bg-[#c4a84b]/5 p-3"><div className="grid gap-2 sm:grid-cols-2"><Input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} aria-label="Nome do item" /><Input value={draftSubtitle} onChange={(event) => setDraftSubtitle(event.target.value)} placeholder="Descrição opcional" aria-label="Descrição do item" /></div><div className="mt-2 flex justify-end gap-2"><Button type="button" variant="ghost" size="sm" onClick={() => setEditingItemId(null)}>Cancelar</Button><Button type="button" size="sm" onClick={saveItemEdition} disabled={!draftTitle.trim()} className="bg-[#1a3a2a] text-white"><Save className="mr-1.5 h-4 w-4" />Salvar</Button></div></div> : <div key={item.id} className="flex min-w-0 items-center gap-2 rounded-xl border border-border/60 bg-background p-2.5"><button type="button" onClick={() => executeItem(item)} className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-black">{item.title}</p><p className="truncate text-xs text-muted-foreground">{item.subtitle || "Item da sessão"}</p></button><Button type="button" variant="ghost" size="icon" onClick={() => startEditing(item)} aria-label={`Editar ${item.title}`}><Pencil className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" onClick={() => removeFromSession(item)} aria-label={`Remover ${item.title}`} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></div>)}</div>
            </div>
          </section>}

          <section className="space-y-3" aria-labelledby="dobrados-title"><div className="flex items-end justify-between gap-3 px-1"><div><p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#9a7e23]">Cadência de marcha</p><h2 id="dobrados-title" className="text-xl font-black text-[#1a3a2a] dark:text-[#e5ce7c]">Dobrados e toques de marcha</h2></div><span className="rounded-full bg-[#c4a84b]/15 px-2.5 py-1 text-[11px] font-black text-[#806919]">{dobrados.length} itens</span></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{dobrados.map((item) => <PanelItemButton key={item.id} item={item} isInSession={isInSession(item)} isExecuting={sessionConfig.currentItemId === item.id} onExecute={executeItem} onToggleSession={toggleSessionItem} />)}</div></section>

          <section className="space-y-3" aria-labelledby="vozes-title"><div className="flex items-end justify-between gap-3 px-1"><div><p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">Comandos verbais</p><h2 id="vozes-title" className="text-xl font-black text-[#1a3a2a] dark:text-[#e5ce7c]">Vozes de comando</h2></div><span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black text-emerald-700 dark:text-emerald-300">{vozes.length} itens</span></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{vozes.map((item) => <PanelItemButton key={item.id} item={item} isInSession={isInSession(item)} isExecuting={sessionConfig.currentItemId === item.id} onExecute={executeItem} onToggleSession={toggleSessionItem} />)}</div></section>

          <section className="space-y-3" aria-labelledby="cornetas-title"><div className="flex flex-wrap items-end justify-between gap-3 px-1"><div><p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">Acervo completo da referência</p><h2 id="cornetas-title" className="text-xl font-black text-[#1a3a2a] dark:text-[#e5ce7c]">Toques de corneta</h2></div><span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-[11px] font-black text-sky-700 dark:text-sky-300">{cornetas.length} itens</span></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{cornetas.map((item) => <PanelItemButton key={item.id} item={item} isInSession={isInSession(item)} isExecuting={sessionConfig.currentItemId === item.id} onExecute={executeItem} onToggleSession={toggleSessionItem} />)}</div></section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
