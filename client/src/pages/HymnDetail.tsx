import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Music, User, Pen, ChevronLeft, ChevronRight, Play, Youtube, Clock, ExternalLink } from "lucide-react";
import { useMemo } from "react";
import LyricsPlayer from "@/components/LyricsPlayer";
import { useCachedHymn } from "@/hooks/useCachedHymn";
import { usePWA } from "@/hooks/usePWA";

const categoryLabels: Record<string, string> = {
  nacional: "Hino Nacional",
  militar: "Canção Militar",
  pmam: "Canção da PMAM",
  arma: "Canção de Arma",
  oracao: "Oração",
};

const categoryColors: Record<string, string> = {
  nacional: "#c4a84b",
  militar: "#2d5a27",
  pmam: "#1a3a2a",
  arma: "#8b4513",
  oracao: "#1a2744",
};

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
}

interface HymnDetailProps {
  catalog?: "hymns" | "charlie-mike";
}

export default function HymnDetail({ catalog = "hymns" }: HymnDetailProps) {
  const { id } = useParams<{ id: string }>();
  const hymnId = parseInt(id || "0");
  const { isOnline } = usePWA();
  const isCharlieMike = catalog === "charlie-mike";
  const { data: onlineHymn, isLoading: isLoadingOnline } = trpc.hymns.getById.useQuery(
    { id: hymnId },
    { enabled: !isCharlieMike && hymnId > 0 && isOnline, refetchOnMount: "always", refetchOnWindowFocus: true }
  );
  const { data: onlineCharlieTrack, isLoading: isLoadingCharlie } = trpc.charlieMike.getById.useQuery(
    { id: hymnId },
    { enabled: isCharlieMike && hymnId > 0 && isOnline, refetchOnMount: "always", refetchOnWindowFocus: true }
  );
  const onlineTrack = isCharlieMike ? onlineCharlieTrack : onlineHymn;
  const { cachedHymn, cachedAudioUrl, cachedInstrumentalAudioUrl, isLoadingCache, cacheStatus } = useCachedHymn(hymnId, onlineTrack ?? null);
  const hymn = onlineTrack ?? cachedHymn;
  const usingCachedHymn = !onlineTrack && Boolean(cachedHymn);

  const { data: allHymns } = trpc.hymns.list.useQuery(undefined, {
    enabled: isOnline,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const { data: tfmHymns } = trpc.charlieMike.list.useQuery(
    undefined,
    { enabled: isOnline && isCharlieMike, refetchOnMount: "always", refetchOnWindowFocus: true }
  );

  const isTfm = isCharlieMike;
  const tfmTitleNumber = hymn?.title?.match(/(?:canção|cancao)\s+tfm\s+(\d+)/i)?.[1];
  const displayNumber = isTfm
    ? Number(tfmTitleNumber || tfmHymns?.findIndex((item: any) => item.id === hymn.id)! + 1 || hymn.number)
    : hymn.number;
  const displayCategory = isTfm ? "Charlie Mike · TFM" : categoryLabels[hymn.category] || hymn.category;
  const catalogHref = isTfm ? "/charlie-mike" : "/hinos";
  const catalogLabel = isTfm ? "Voltar ao Charlie Mike" : "Voltar ao Catalogo";
  const navigationBase = isTfm ? tfmHymns : allHymns;

  const navigation = useMemo(() => {
    if (!navigationBase || !hymn) return { prev: null, next: null };
    const idx = navigationBase.findIndex((h: any) => h.id === hymn.id);
    return {
      prev: idx > 0 ? navigationBase[idx - 1] : null,
      next: idx < navigationBase.length - 1 ? navigationBase[idx + 1] : null,
    };
  }, [navigationBase, hymn]);

  if ((isLoadingOnline || isLoadingCharlie || isLoadingCache) && !hymn) {
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
          <h2 className="text-2xl font-bold text-foreground">{isCharlieMike ? "Faixa não encontrada" : "Hino não encontrado"}</h2>
          <p className="text-muted-foreground mt-2">O item solicitado não existe ou foi removido.</p>
          <Link href={isCharlieMike ? "/charlie-mike" : "/hinos"}>
            <Button className="mt-6 bg-[#1a3a2a] text-white gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar ao Catálogo
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const catColor = categoryColors[hymn.category] || "#1a3a2a";
  const youtubeId = hymn.youtubeUrl ? extractYouTubeId(hymn.youtubeUrl) : null;
  const sourceUrl = isCharlieMike
    ? hymn.description?.match(/https:\/\/www\.letras\.mus\.br\/[^\s]+/i)?.[0]?.replace(/[.,;]+$/, "") ?? null
    : null;
  const contextDescription = sourceUrl
    ? hymn.description?.replace(/\s*Fonte de cataloga(?:ç|c)ão:\s*https:\/\/www\.letras\.mus\.br\/[^\s]+/i, "").trim()
    : hymn.description;
  const detailBase = isCharlieMike ? "/charlie-mike" : "/hino";

  return (
    <div className="mobile-safe-bottom min-h-screen flex flex-col bg-[#f5f2e8] text-foreground dark:bg-[#020a0f] dark:text-[#f8f7f0]">
      <Navbar />

      {/* Header */}
      <section className="military-page-hero border-b px-3 pb-7 pt-6 md:px-0 md:py-8">
        <div className="px-0 md:container">
          <Link href={catalogHref}>
            <Button variant="ghost" size="sm" className="mb-4 gap-2 text-[#53635a] hover:bg-[#1a3a2a]/5 hover:text-[#17251d] dark:text-[#e2d7b5] dark:hover:bg-white/10 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" /> {catalogLabel}
            </Button>
          </Link>
          <div className="flex items-start gap-5">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
              style={{ backgroundColor: catColor }}
            >
              {String(displayNumber).padStart(2, "0")}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#c4a84b] mb-1">
                {displayCategory}
              </p>
              <h1 className="text-2xl font-bold text-[#1a3a2a] dark:text-[#fff8e8] md:text-3xl" style={{ fontFamily: 'Merriweather, serif' }}>
                {hymn.title}
              </h1>
              {hymn.subtitle && (
                <p className="mt-1 text-muted-foreground dark:text-white/72">{hymn.subtitle}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground dark:text-white/68">
                {hymn.author && (
                  <span className="flex items-center gap-1">
                    <Pen className="h-3 w-3" /> Letra: {hymn.author}
                  </span>
                )}
                {hymn.composer && (
                  <span className="flex items-center gap-1">
                    <Music className="h-3 w-3" /> Música: {hymn.composer}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="checkerboard-pattern w-full mt-8 hidden md:block" />
      </section>

      <section className="bg-transparent px-3 py-6 md:bg-background md:px-0 md:py-10 dark:md:bg-[#020a0f]">
        <div className="px-0 md:container">
          {contextDescription && (
            <Card className="mb-4 border-[#c4a84b]/30 bg-white/90 text-[#17251d] shadow-sm dark:border-[#c4a84b]/25 dark:bg-[#0b1720] dark:text-[#f8f7f0] md:mb-8">
              <CardContent className="p-5 md:p-7">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#755b08] dark:text-[#e4c75f]">
                  História e contexto
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#4f5e55] dark:text-[#d4ddd7] md:text-base">
                  {contextDescription}
                </p>
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            {/* Main Content - Lyrics & Player */}
            <div className="lg:col-span-2">
              <LyricsPlayer
                hymnTitle={hymn.title}
                lyrics={hymn.lyrics}
                lyricsSync={hymn.lyricsSync}
                audioUrl={isOnline ? hymn.audioUrl : cachedAudioUrl}
                instrumentalAudioUrl={isOnline ? hymn.instrumentalAudioUrl : cachedInstrumentalAudioUrl}
                youtubeUrl={isOnline ? hymn.youtubeUrl : null}
                instrumentalYoutubeUrl={isOnline ? hymn.instrumentalYoutubeUrl : null}
              />
              {isCharlieMike && sourceUrl && !hymn.lyrics?.trim() && (
                <Card className="mt-4 border-[#c4a84b]/35 bg-[#c4a84b]/8 dark:border-[#c4a84b]/25 dark:bg-[#132019]">
                  <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold text-foreground">Letra disponível na fonte original</p>
                      <p className="mt-1 text-sm text-muted-foreground">Abra a página oficial da faixa no Letras.mus.br.</p>
                    </div>
                    <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                      <Button className="gap-2 bg-[#c4a84b] font-bold text-[#17251d] hover:bg-[#d2b85c]">
                        Ver letra completa <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {(usingCachedHymn || cacheStatus !== "idle") && (
                <Card className="border-[#c4a84b]/30 bg-[#c4a84b]/5">
                  <CardContent className="p-5">
                    <h3 className="font-bold text-foreground mb-2 text-sm uppercase tracking-wider">
                      Disponibilidade Offline
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {usingCachedHymn
                        ? "Este hino foi carregado do aparelho. A letra sincronizada continua disponivel sem internet."
                        : cacheStatus === "ready"
                          ? "Hino e MP3 salvos neste aparelho para abrir sem internet."
                          : cacheStatus === "saving"
                            ? "Salvando hino e MP3 para uso offline..."
                            : cacheStatus === "metadata-only"
                              ? "Letra salva. O MP3 ainda nao ficou disponivel offline neste aparelho."
                              : "Nao foi possivel concluir o cache offline deste hino."}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Info Card */}
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">
                    Informações
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Número</span>
                      <span className="font-medium text-foreground">{String(displayNumber).padStart(2, "0")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Categoria</span>
                      <span className="font-medium text-foreground">{displayCategory}</span>
                    </div>
                    {hymn.author && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Letrista</span>
                        <span className="font-medium text-foreground text-right max-w-[60%]">{hymn.author}</span>
                      </div>
                    )}
                    {hymn.composer && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Compositor</span>
                        <span className="font-medium text-foreground text-right max-w-[60%]">{hymn.composer}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex gap-3">
                {navigation.prev ? (
                  <Link href={`${detailBase}/${navigation.prev.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-1 text-xs">
                      <ChevronLeft className="h-3 w-3" />
                      Anterior
                    </Button>
                  </Link>
                ) : <div className="flex-1" />}
                {navigation.next ? (
                  <Link href={`${detailBase}/${navigation.next.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-1 text-xs">
                      Próximo
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                ) : <div className="flex-1" />}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
