import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Music,
  User,
  Pen,
  ChevronLeft,
  ChevronRight,
  Play,
  Youtube,
  Clock,
  BookOpen,
  Shield,
  Star,
  Search,
  Sparkles,
  Award,
  Compass,
} from "lucide-react";
import { useMemo, useState } from "react";
import LyricsPlayer from "@/components/LyricsPlayer";
import { useCachedHymn } from "@/hooks/useCachedHymn";
import { usePWA } from "@/hooks/usePWA";

const categoryLabels: Record<string, string> = {
  all: "Todos os Hinos",
  nacional: "Hino Nacional",
  militar: "Canção Militar",
  pmam: "Canção da PMAM",
  arma: "Canção de Arma",
  oracao: "Oração",
};

const categoryColors: Record<string, string> = {
  nacional: "#f0bd3a",
  militar: "#2d5a27",
  pmam: "#145c3a",
  arma: "#8b4513",
  oracao: "#1e3a5f",
};

function getHymnHistoricalContext(hymn: any): string {
  if (hymn.description && hymn.description.trim().length > 20) {
    return hymn.description;
  }

  const titleLower = (hymn.title || "").toLowerCase();
  if (titleLower.includes("nacional")) {
    return "O Hino Nacional Brasileiro é um dos quatro símbolos oficiais da República Federativa do Brasil. Com música de Francisco Manuel da Silva e poema de Joaquim Osório Duque Estrada, representa a soberania, a honra e o patriotismo do povo brasileiro. Na Polícia Militar do Amazonas e no CFAP, sua execução em solenidades e formaturas diárias fortalece o juramento à bandeira e o dever cívico de proteger a sociedade.";
  }
  if (titleLower.includes("independência") || titleLower.includes("independencia")) {
    return "Composto por Evaristo da Veiga e musicado por Dom Pedro I em 1822, o Hino da Independência celebra a emancipação do Brasil. É uma peça cívica vibrante, entoada com orgulho em cerimônias de vulto histórico e formaturas solenes das forças de segurança pública.";
  }
  if (titleLower.includes("bandeira")) {
    return "O Hino à Bandeira, com letra do poeta Olavo Bilac e música de Francisco Braga, foi composto em 1906. Exalta o pavilhão nacional como símbolo da pátria, da bravura e da grandeza territorial e moral do Brasil, entoado tradicionalmente no arriamento e hasteamento da bandeira.";
  }
  if (titleLower.includes("proclamação") || titleLower.includes("proclamacao")) {
    return "Com letra de Medeiros e Albuquerque e música de Leopoldo Miguez, o Hino da Proclamação da República comemora o nascimento da República em 15 de novembro de 1889, simbolizando a liberdade, a igualdade e o progresso democrático.";
  }
  if (titleLower.includes("cfap") || titleLower.includes("canção do cfap") || titleLower.includes("cancao do cfap")) {
    return "A Canção do CFAP é o hino oficial do Centro de Formação e Aperfeiçoamento de Praças da PMAM. Composta pelo Major PM Antônio Guedes Brandão e homologada em 1983, celebra a dedicação, a disciplina e o espírito de corpo que forjam os policiais militares da Amazônia desde a sua fundação.";
  }
  if (hymn.category === "pmam") {
    return "Integrando o acervo institucional da Polícia Militar do Amazonas, esta canção perpetua as tradições de bravura, honra e vigilância da corporação bicentenária, guardiã da ordem pública e da paz na floresta e nos municípios amazonenses.";
  }
  if (hymn.category === "militar") {
    return "Canção tradicional do repertório castrense brasileiro, entoada em marchas, instruções e formaturas militares para manter o ritmo, a fibra moral e a coesão das tropas durante os treinamentos e solenidades operacionais.";
  }
  return "Esta composição integra o acervo oficial de hinos, canções e orações militares da Polícia Militar do Amazonas, utilizada na formação, especialização e solenidades do CFAP.";
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/
  );
  return match ? match[1] : null;
}

interface HymnDetailProps {
  catalog?: "hymns" | "charlie-mike";
}

export default function HymnDetail({ catalog = "hymns" }: HymnDetailProps) {
  const { id } = useParams<{ id: string }>();
  const hymnId = parseInt(id || "0");
  const { isOnline } = usePWA();
  const isCharlieCatalog = catalog === "charlie-mike";
  const [hymnSearch, setHymnSearch] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  const { data: onlineHymn, isLoading: isLoadingOnline } =
    trpc.hymns.getById.useQuery(
      { id: hymnId },
      {
        enabled: hymnId > 0 && isOnline,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
      }
    );

  const {
    cachedHymn,
    cachedAudioUrl,
    cachedInstrumentalAudioUrl,
    isLoadingCache,
    cacheStatus,
  } = useCachedHymn(hymnId, onlineHymn ?? null);

  const hymn = onlineHymn ?? cachedHymn;
  const usingCachedHymn = !onlineHymn && Boolean(cachedHymn);

  const { data: allHymns } = trpc.hymns.list.useQuery(undefined, {
    enabled: isOnline,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const { data: tfmHymns } = trpc.hymns.getByCollection.useQuery(
    { collection: "tfm" },
    {
      enabled: isOnline && hymn?.collection === "tfm",
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
    }
  );

  const isTfm = isCharlieCatalog || hymn?.collection === "tfm";
  const catalogHref = isTfm ? "/charlie-mike" : "/hinos";
  const catalogLabel = isTfm ? "Voltar ao Charlie Mike" : "Voltar ao Catálogo";
  const navigationBase = isTfm ? tfmHymns : allHymns;
  const detailBase = isTfm ? "/charlie-mike" : "/hino";

  const navigation = useMemo(() => {
    if (!navigationBase || !hymn) return { prev: null, next: null };
    const idx = navigationBase.findIndex((h: any) => h.id === hymn.id);
    return {
      prev: idx > 0 ? navigationBase[idx - 1] : null,
      next: idx < navigationBase.length - 1 ? navigationBase[idx + 1] : null,
    };
  }, [navigationBase, hymn]);

  // Lista dos demais hinos para escolher
  const otherHymnsList = useMemo(() => {
    if (!navigationBase) return [];
    const query = hymnSearch.trim().toLowerCase();
    return navigationBase.filter((item: any) => {
      const matchesCategory =
        selectedCategoryFilter === "all" || item.category === selectedCategoryFilter;
      const matchesQuery =
        !query ||
        item.title.toLowerCase().includes(query) ||
        (item.author && item.author.toLowerCase().includes(query)) ||
        String(item.number).includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [navigationBase, selectedCategoryFilter, hymnSearch]);

  if ((isLoadingOnline || isLoadingCache) && !hymn) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="container py-12">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-12 w-96 mb-8" />
          <Skeleton className="h-[400px] w-full" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!hymn) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground">
            Hino não encontrado
          </h2>
          <p className="text-muted-foreground mt-2">
            O hino solicitado não existe ou foi removido.
          </p>
          <Link href={isCharlieCatalog ? "/charlie-mike" : "/hinos"}>
            <Button className="mt-6 bg-[#1a3a2a] text-white gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar ao Catálogo
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const historicalContext = getHymnHistoricalContext(hymn);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Header Militar Superior */}
      <section className="military-gradient py-4 md:py-5 border-b border-[#c4a84b]/30">
        <div className="container">
          <Link href={catalogHref}>
            <Button
              variant="ghost"
              size="sm"
              className="mb-2 h-auto gap-2 px-0 py-1 text-xs text-white/75 hover:bg-transparent hover:text-[#f0bd3a] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> {catalogLabel}
            </Button>
          </Link>
          <div className="flex items-center gap-3.5">
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-base font-black text-black shadow-lg md:h-14 md:w-14 md:text-lg border-2 border-white/20"
              style={{ backgroundColor: "#f0bd3a" }}
            >
              {String(hymn.number).padStart(2, "0")}
            </div>
            <div className="min-w-0">
              <p className="mb-0.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#f0bd3a] md:text-xs">
                {categoryLabels[hymn.category] || hymn.category}
              </p>
              <h1
                className="truncate text-xl font-black leading-tight text-white md:text-3xl font-serif drop-shadow-sm"
              >
                {hymn.title}
              </h1>
            </div>
          </div>
        </div>
        <div className="checkerboard-pattern mt-3 w-full opacity-70" />
      </section>

      {/* Conteúdo Principal Perfeitamente Alinhado */}
      <section className="py-8 md:py-10 bg-background flex-1">
        <div className="container space-y-8">

          {/* 1. Grade Superior: Player & Letra (2 cols) + Ficha Técnica e Navegação (1 col) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            {/* Player de Vídeo/Áudio e Letra Sincronizada */}
            <div className="lg:col-span-2">
              <LyricsPlayer
                hymnTitle={hymn.title}
                lyrics={hymn.lyrics}
                lyricsSync={hymn.lyricsSync}
                audioUrl={isOnline ? hymn.audioUrl : cachedAudioUrl}
                instrumentalAudioUrl={
                  isOnline
                    ? hymn.instrumentalAudioUrl
                    : cachedInstrumentalAudioUrl
                }
                youtubeUrl={isOnline ? hymn.youtubeUrl : null}
                instrumentalYoutubeUrl={
                  isOnline ? hymn.instrumentalYoutubeUrl : null
                }
              />
            </div>

            {/* Sidebar Alinhada com Ficha Técnica e Navegação */}
            <div className="space-y-5">

              {/* Ficha Técnica / Informações */}
              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-bold text-foreground text-xs uppercase tracking-[0.16em] flex items-center gap-2 border-b border-border/50 pb-3">
                    <Compass className="h-4 w-4 text-[#c4a84b]" />
                    Ficha Técnica do Hino
                  </h3>

                  <div className="space-y-2.5 text-xs sm:text-sm">
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Número Oficial</span>
                      <span className="font-bold text-foreground">
                        #{String(hymn.number).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Categoria</span>
                      <Badge variant="outline" className="text-[11px] font-bold border-[#c4a84b]/50 text-[#9f8123] dark:text-[#f0bd3a]">
                        {categoryLabels[hymn.category] || hymn.category}
                      </Badge>
                    </div>

                    {hymn.author && (
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Letrista / Autor</span>
                        <span className="font-bold text-foreground text-right max-w-[60%] truncate">
                          {hymn.author}
                        </span>
                      </div>
                    )}

                    {hymn.composer && (
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Compositor</span>
                        <span className="font-bold text-foreground text-right max-w-[60%] truncate">
                          {hymn.composer}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Disponibilidade Offline (quando aplicável) */}
              {(usingCachedHymn || cacheStatus !== "idle") && (
                <Card className="border-[#c4a84b]/30 bg-[#c4a84b]/5">
                  <CardContent className="p-4">
                    <h3 className="font-bold text-foreground mb-1 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[#f0bd3a]" />
                      Disponibilidade Offline
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {usingCachedHymn
                        ? "Este hino foi carregado do aparelho. A letra sincronizada continua disponível sem internet."
                        : cacheStatus === "ready"
                          ? "Hino e MP3 salvos neste aparelho para reprodução sem internet."
                          : "Salvando para acesso offline..."}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Navegação Rápida: Anterior / Próximo */}
              <div className="flex gap-2.5">
                {navigation.prev ? (
                  <Link
                    href={`${detailBase}/${navigation.prev.id}`}
                    className="flex-1 no-underline"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1.5 text-xs font-bold border-border/60 hover:border-[#c4a84b] hover:bg-[#c4a84b]/10"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Anterior
                    </Button>
                  </Link>
                ) : (
                  <div className="flex-1" />
                )}

                {navigation.next ? (
                  <Link
                    href={`${detailBase}/${navigation.next.id}`}
                    className="flex-1 no-underline"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1.5 text-xs font-bold border-border/60 hover:border-[#c4a84b] hover:bg-[#c4a84b]/10"
                    >
                      Próximo
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            </div>
          </div>

          {/* 2. CARD DE HISTÓRICO & TRADIÇÃO DO HINO (LARGURA TOTAL - 100% ALINHADO) */}
          <Card className="border border-[#c4a84b]/35 bg-gradient-to-br from-[#10281d]/90 via-[#0a1c14] to-[#06120d] text-white shadow-md">
            <CardContent className="p-6 md:p-7 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-[#c4a84b]/25 pb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0bd3a]/20 text-[#f0bd3a]">
                  <BookOpen className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-black text-[#fffdf5]">
                    Histórico & Significado Institucional
                  </h3>
                  <p className="text-[11px] text-white/60">
                    Contexto histórico, doutrina e tradição da canção
                  </p>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-white/85 text-justify">
                {historicalContext}
              </p>

              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-white/75">
                <div className="flex items-start gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
                  <Shield className="h-4 w-4 text-[#f0bd3a] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold">Execução Militar:</strong>
                    <span>Entoado na posição de sentido em formaturas solenes e atos institucionais.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
                  <Award className="h-4 w-4 text-[#f0bd3a] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold">Doutrina & Civismo:</strong>
                    <span>Reforça a disciplina, a hierarquia e o sentimento de pertencimento ao CFAP/PMAM.</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. SEÇÃO INFERIOR: REPERTÓRIO INSTITUCIONAL (LARGURA TOTAL) */}
          <div className="pt-6 border-t-2 border-border/60 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0bd3a]/20 text-[#f0bd3a]">
                    <Music className="h-4 w-4" />
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-black text-foreground">
                    Repertório Institucional
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Coletânea de hinos cívico-militares, canções de marcha e tradições do CFAP/PMAM.
                </p>
              </div>

              {/* Campo de Busca Rápida de Hinos */}
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={hymnSearch}
                  onChange={(e) => setHymnSearch(e.target.value)}
                  placeholder="Buscar hino por título ou número..."
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            {/* Filtros de Categoria */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { key: "all", label: "Todos" },
                { key: "nacional", label: "Nacionais" },
                { key: "militar", label: "Militares" },
                { key: "pmam", label: "PMAM" },
                { key: "arma", label: "Armas" },
                { key: "oracao", label: "Orações" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(tab.key)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategoryFilter === tab.key
                      ? "bg-[#145c3a] text-white shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Grade de Hinos Disponíveis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {otherHymnsList.map((item: any) => {
                const isCurrentHymn = item.id === hymn.id;
                return (
                  <Link
                    key={item.id}
                    href={`${detailBase}/${item.id}`}
                    className="no-underline group focus:outline-none"
                  >
                    <Card
                      className={`h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
                        isCurrentHymn
                          ? "border-[#f0bd3a] bg-[#f0bd3a]/10 ring-1 ring-[#f0bd3a]"
                          : "border-border/60 bg-card hover:border-[#c4a84b]/60"
                      }`}
                    >
                      <CardContent className="p-3.5 flex items-start gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-black transition-colors ${
                            isCurrentHymn
                              ? "bg-[#f0bd3a] text-black"
                              : "bg-muted text-foreground group-hover:bg-[#145c3a] group-hover:text-white"
                          }`}
                        >
                          {String(item.number).padStart(2, "0")}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                              {categoryLabels[item.category] || item.category}
                            </span>
                            {isCurrentHymn && (
                              <span className="shrink-0 rounded-full bg-[#f0bd3a] text-black px-1.5 py-0.2 text-[8px] font-black uppercase">
                                Tocando
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-foreground truncate mt-0.5 group-hover:text-[#9f8123] dark:group-hover:text-[#f0bd3a]">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {item.author || "Acervo PMAM"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {otherHymnsList.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground rounded-xl border border-dashed">
                Nenhum hino encontrado para essa busca.
              </div>
            )}
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
