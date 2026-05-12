import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Music, User, Pen, ChevronLeft, ChevronRight, Play, Youtube, Clock } from "lucide-react";
import { useMemo } from "react";
import LyricsPlayer from "@/components/LyricsPlayer";
import { useEffect } from "react";
import { saveLastAccessed } from "@/lib/lastAccessed";

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

export default function HymnDetail() {
  const { id } = useParams<{ id: string }>();
  const hymnId = parseInt(id || "0");
  const { data: hymn, isLoading } = trpc.hymns.getById.useQuery(
    { id: hymnId },
    { enabled: hymnId > 0, refetchOnMount: "always", refetchOnWindowFocus: true }
  );
  const { data: allHymns } = trpc.hymns.list.useQuery(undefined, {
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const { data: tfmHymns } = trpc.hymns.getByCollection.useQuery(
    { collection: "tfm" },
    { enabled: hymn?.collection === "tfm", refetchOnMount: "always", refetchOnWindowFocus: true }
  );

  useEffect(() => {
    if (hymn) {
      saveLastAccessed({
        type: "hymn",
        id: hymn.id,
        title: hymn.title,
        subtitle: hymn.author || hymn.subtitle || undefined,
        url: `/hino/${hymn.id}`
      });
    }
  }, [hymn]);

  const isTfm = hymn?.collection === "tfm";
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

  if (isLoading) {
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
          <h2 className="text-2xl font-bold text-foreground">Hino não encontrado</h2>
          <p className="text-muted-foreground mt-2">O hino solicitado não existe ou foi removido.</p>
          <Link href="/hinos">
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Header */}
      <section className="military-gradient py-10">
        <div className="container">
          <Link href={catalogHref}>
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" /> {catalogLabel}
            </Button>
          </Link>
          <div className="flex items-start gap-5">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
              style={{ backgroundColor: catColor }}
            >
              {String(hymn.number).padStart(2, "0")}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#c4a84b] mb-1">
                {categoryLabels[hymn.category] || hymn.category}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Merriweather, serif' }}>
                {hymn.title}
              </h1>
              {hymn.subtitle && (
                <p className="text-white/60 mt-1">{hymn.subtitle}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-white/50">
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
        <div className="checkerboard-pattern w-full mt-8" />
      </section>

      <section className="py-10 bg-background">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Lyrics & Player */}
            <div className="lg:col-span-2">
              <LyricsPlayer
                hymnTitle={hymn.title}
                lyrics={hymn.lyrics}
                lyricsSync={hymn.lyricsSync}
                audioUrl={hymn.audioUrl}
                youtubeUrl={hymn.youtubeUrl}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Description */}
              {hymn.description && (
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-foreground mb-3 text-sm uppercase tracking-wider">
                      Sobre este Hino
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {hymn.description}
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
                      <span className="font-medium text-foreground">{hymn.number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Categoria</span>
                      <span className="font-medium text-foreground">{categoryLabels[hymn.category]}</span>
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
                  <Link href={`/hino/${navigation.prev.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-1 text-xs">
                      <ChevronLeft className="h-3 w-3" />
                      Anterior
                    </Button>
                  </Link>
                ) : <div className="flex-1" />}
                {navigation.next ? (
                  <Link href={`/hino/${navigation.next.id}`} className="flex-1">
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
