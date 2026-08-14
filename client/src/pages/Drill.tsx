import { useEffect, useMemo, useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  DOBRADOS,
  getSessionItems,
  OrdemUnidaPanelItem,
  sanitizeSessionItemIds,
  TOQUES_DE_CORNETA,
  VOZES_DE_COMANDO,
} from "@/lib/ordemUnidaPanel";
import {
  CheckCircle2,
  ListMusic,
  Music2,
  Pin,
  PinOff,
  Radio,
  Star,
  Volume2,
  X,
} from "lucide-react";

const SESSION_STORAGE_KEY = "pmam-ordem-unida-sessao-atual";

function getInitialSessionItemIds() {
  if (typeof window === "undefined") return [];

  try {
    return sanitizeSessionItemIds(JSON.parse(window.localStorage.getItem(SESSION_STORAGE_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

function PanelItemButton({
  item,
  isPinned,
  isSelected,
  onSelect,
  onTogglePin,
}: {
  item: OrdemUnidaPanelItem;
  isPinned: boolean;
  isSelected: boolean;
  onSelect: (item: OrdemUnidaPanelItem) => void;
  onTogglePin: (item: OrdemUnidaPanelItem) => void;
}) {
  const typeStyle = {
    corneta: "border-sky-200 bg-sky-50/70 hover:border-sky-400 hover:bg-sky-100/70 dark:border-sky-900/50 dark:bg-sky-950/20 dark:hover:bg-sky-950/40",
    dobrado: "border-amber-200 bg-amber-50/70 hover:border-amber-400 hover:bg-amber-100/70 dark:border-amber-900/50 dark:bg-amber-950/20 dark:hover:bg-amber-950/40",
    voz: "border-emerald-200 bg-emerald-50/70 hover:border-emerald-400 hover:bg-emerald-100/70 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40",
  }[item.type];

  const typeIcon = item.type === "corneta" ? Radio : item.type === "dobrado" ? Music2 : Volume2;
  const ItemIcon = typeIcon;

  return (
    <div
      className={`group relative flex min-h-20 items-stretch overflow-hidden rounded-2xl border text-left shadow-sm transition-all duration-150 active:scale-[0.985] ${typeStyle} ${isSelected ? "ring-2 ring-[#c4a84b] ring-offset-2 ring-offset-background" : ""}`}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#1a3a2a] focus-visible:ring-inset"
        onClick={() => onSelect(item)}
        aria-pressed={isSelected}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-[#1a3a2a] shadow-sm dark:bg-black/20 dark:text-[#d8bf6e]">
          <ItemIcon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-black uppercase tracking-[0.035em] text-foreground sm:text-sm">{item.title}</span>
          {item.subtitle && <span className="mt-0.5 block text-[11px] font-medium text-muted-foreground">{item.subtitle}</span>}
        </span>
        {isSelected && <CheckCircle2 className="h-5 w-5 shrink-0 text-[#1a3a2a]" aria-label="Selecionado" />}
      </button>
      <button
        type="button"
        className="flex w-12 shrink-0 items-center justify-center border-l border-black/5 text-[#1a3a2a] transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3a2a] focus-visible:ring-inset dark:border-white/10 dark:hover:bg-white/10"
        onClick={() => onTogglePin(item)}
        aria-label={isPinned ? `Remover ${item.title} da sessão atual` : `Fixar ${item.title} na sessão atual`}
        title={isPinned ? "Remover da sessão" : "Fixar na sessão"}
      >
        {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function Drill() {
  const [sessionItemIds, setSessionItemIds] = useState<string[]>(getInitialSessionItemIds);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const sessionItems = useMemo(() => getSessionItems(sessionItemIds), [sessionItemIds]);
  const selectedItem = useMemo(
    () => sessionItems.find((item) => item.id === selectedItemId) ?? [...TOQUES_DE_CORNETA, ...DOBRADOS, ...VOZES_DE_COMANDO].find((item) => item.id === selectedItemId),
    [selectedItemId, sessionItems],
  );

  useEffect(() => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionItemIds));
  }, [sessionItemIds]);

  const toggleSessionItem = (item: OrdemUnidaPanelItem) => {
    setSessionItemIds((current) => (
      current.includes(item.id)
        ? current.filter((id) => id !== item.id)
        : [...current, item.id]
    ));
  };

  const selectItem = (item: OrdemUnidaPanelItem) => {
    setSelectedItemId(item.id);
  };

  const isPinned = (item: OrdemUnidaPanelItem) => sessionItemIds.includes(item.id);

  return (
    <div className="mobile-safe-bottom min-h-screen bg-[#f5f2e8] text-foreground dark:bg-background">
      <Navbar />

      <main className="px-3 py-4 sm:px-5 sm:py-6 md:px-0 md:py-9">
        <div className="container max-w-6xl space-y-5 sm:space-y-7">
          <section className="overflow-hidden rounded-[1.8rem] border border-[#1a3a2a]/20 bg-[#1a3a2a] text-white shadow-lg">
            <div className="relative px-5 py-7 sm:px-8 sm:py-9">
              <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full border-[28px] border-[#c4a84b]/15" />
              <div className="relative max-w-3xl">
                <div className="mb-3 flex items-center gap-2 text-[#e4cf87]">
                  <ListMusic className="h-5 w-5" />
                  <span className="text-[11px] font-black uppercase tracking-[0.18em]">Painel operacional</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl" style={{ fontFamily: "Merriweather, serif" }}>Ordem Unida</h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
                  Organize os toques e comandos que serão usados na instrução. Fixe os itens da sessão atual no topo para acessá-los em poucos toques.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-[#c4a84b]/45 bg-[#fffdf7] p-4 shadow-sm dark:bg-card sm:p-5" aria-labelledby="sessao-atual-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c4a84b] text-[#1a3a2a] shadow-sm"><Star className="h-5 w-5" /></span>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#806919]">Acesso rápido</p>
                  <h2 id="sessao-atual-title" className="text-lg font-black text-[#1a3a2a] dark:text-[#e5ce7c]">Sessão atual</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">Os itens fixados ficam salvos neste aparelho para a próxima instrução.</p>
                </div>
              </div>
              {sessionItems.length > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setSessionItemIds([])} className="h-9 text-xs font-bold text-muted-foreground hover:text-destructive">
                  <X className="mr-1.5 h-4 w-4" /> Limpar sessão
                </Button>
              )}
            </div>

            {sessionItems.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-[#c4a84b]/60 bg-[#c4a84b]/5 px-4 py-5 text-center">
                <Pin className="mx-auto h-5 w-5 text-[#a88d34]" />
                <p className="mt-2 text-sm font-bold text-foreground">Ainda não há itens nesta sessão.</p>
                <p className="mt-1 text-xs text-muted-foreground">Use o ícone de fixar nos painéis abaixo para montar o acesso rápido.</p>
              </div>
            ) : (
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {sessionItems.map((item) => (
                  <PanelItemButton
                    key={item.id}
                    item={item}
                    isPinned
                    isSelected={selectedItemId === item.id}
                    onSelect={selectItem}
                    onTogglePin={toggleSessionItem}
                  />
                ))}
              </div>
            )}
          </section>

          {selectedItem && (
            <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1a3a2a]/20 bg-card px-4 py-3 shadow-sm" aria-live="polite">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a3a2a] text-[#e5ce7c]"><CheckCircle2 className="h-4 w-4" /></span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">Selecionado para a sessão</p>
                  <p className="text-sm font-black text-foreground">{selectedItem.title}</p>
                </div>
              </div>
              <p className="max-w-md text-xs text-muted-foreground">A lógica de execução, incluindo a sequência a partir de Sentido e a interrupção segura da ação anterior, será configurada na próxima etapa.</p>
            </section>
          )}

          <section className="space-y-3" aria-labelledby="dobrados-title">
            <div className="flex items-end justify-between gap-3 px-1">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#9a7e23]">Cadência de marcha</p>
                <h2 id="dobrados-title" className="text-xl font-black text-[#1a3a2a] dark:text-[#e5ce7c]">Dobrados e toques de marcha</h2>
              </div>
              <span className="rounded-full bg-[#c4a84b]/15 px-2.5 py-1 text-[11px] font-black text-[#806919]">{DOBRADOS.length} itens</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {DOBRADOS.map((item) => (
                <PanelItemButton key={item.id} item={item} isPinned={isPinned(item)} isSelected={selectedItemId === item.id} onSelect={selectItem} onTogglePin={toggleSessionItem} />
              ))}
            </div>
          </section>

          <section className="space-y-3" aria-labelledby="vozes-title">
            <div className="flex items-end justify-between gap-3 px-1">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">Comandos verbais</p>
                <h2 id="vozes-title" className="text-xl font-black text-[#1a3a2a] dark:text-[#e5ce7c]">Vozes de comando</h2>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black text-emerald-700 dark:text-emerald-300">{VOZES_DE_COMANDO.length} itens</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {VOZES_DE_COMANDO.map((item) => (
                <PanelItemButton key={item.id} item={item} isPinned={isPinned(item)} isSelected={selectedItemId === item.id} onSelect={selectItem} onTogglePin={toggleSessionItem} />
              ))}
            </div>
          </section>

          <section className="space-y-3" aria-labelledby="cornetas-title">
            <div className="flex flex-wrap items-end justify-between gap-3 px-1">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">Acervo completo da referência</p>
                <h2 id="cornetas-title" className="text-xl font-black text-[#1a3a2a] dark:text-[#e5ce7c]">Toques de corneta</h2>
              </div>
              <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-[11px] font-black text-sky-700 dark:text-sky-300">{TOQUES_DE_CORNETA.length} itens</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {TOQUES_DE_CORNETA.map((item) => (
                <PanelItemButton key={item.id} item={item} isPinned={isPinned(item)} isSelected={selectedItemId === item.id} onSelect={selectItem} onTogglePin={toggleSessionItem} />
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
