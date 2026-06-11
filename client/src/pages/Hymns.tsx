import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PlaylistPlayer from "@/components/PlaylistPlayer";
import { trpc } from "@/lib/trpc";
import { Link, useSearch } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, ListMusic, Music, Play, Search, Shield, Star, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCachedHymnCatalog } from "@/hooks/useCachedHymn";
import { usePWA } from "@/hooks/usePWA";

const categoryConfig: Record<string, { label: string; icon: any; color: string; description: string }> = {
  all: { label: "Todos", icon: Music, color: "#145c3a", description: "Todos os hinos, canções e orações disponíveis no sistema." },
  nacional: { label: "Hinos Nacionais", icon: Star, color: "#d6b64c", description: "Patrimônio musical nacional para estudo e execução." },
  militar: { label: "Canções Militares", icon: Shield, color: "#145c3a", description: "Canções de marcha, fibra e tradição militar." },
  pmam: { label: "Canções PMAM", icon: Music, color: "#0b3323", description: "Repertório institucional da PMAM." },
  arma: { label: "Canções de Armas", icon: Target, color: "#8b6f2d", description: "Canções históricas e de especialidades militares." },
  oracao: { label: "Orações", icon: BookOpen, color: "#17436a", description: "Textos de formação, fé e inspiração." },
};

export default function Hymns() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const initialCategory = params.get("categoria") || "all";

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState("");
  const { isOnline } = usePWA();
  const { data: onlineHymns, isLoading } = trpc.hymns.list.useQuery(undefined, {
    enabled: isOnline,
  });
  const { cachedHymns, isLoadingCache } = useCachedHymnCatalog(onlineHymns ?? null);
  const hymns = onlineHymns && onlineHymns.length > 0 ? onlineHymns : cachedHymns;

  const filteredHymns = useMemo(() => {
    if (!hymns) return [];

    let filtered = hymns;
    if (activeCategory !== "all") {
      filtered = filtered.filter((h: any) => h.category === activeCategory);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((h: any) =>
        h.title.toLowerCase().includes(term) ||
        h.subtitle?.toLowerCase().includes(term) ||
        h.author?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [activeCategory, hymns, searchTerm]);

  const activeCategoryConfig = categoryConfig[activeCategory] || categoryConfig.all;

  return (
    <div className="mobile-safe-bottom min-h-screen flex flex-col bg-[#f5f2e8]">
      <Navbar />

      <section className="bg-white border-b border-border/40 px-4 pb-5 pt-6 text-foreground md:px-0 md:py-12">
        <div className="container text-left md:text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1a3a2a]/10 text-[#1a3a2a] shadow-sm md:bg-transparent md:shadow-none">
            <Music className="h-7 w-7 md:h-10 md:w-10" />
          </div>
          <h1 className="text-3xl font-black tracking-normal text-[#1a3a2a] md:text-4xl" style={{ fontFamily: "Merriweather, serif" }}>
            Catálogo de Hinos
          </h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground md:mt-3">
            {hymns?.length ?? 0} hinos, canções e orações militares
          </p>
        </div>
        <div className="checkerboard-pattern mt-8 hidden w-full md:block" />
      </section>

      <section className="bg-transparent px-4 pb-8 pt-2 md:bg-background md:px-0 md:py-8">
        <div className="container space-y-6 md:space-y-8">
          <div className="relative mx-auto max-w-md rounded-[1.4rem] border border-border/50 bg-white p-2 shadow-sm md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none">
            <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar hino por nome, subtítulo ou autor..."
              className="h-11 rounded-2xl border-border bg-white pl-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-[#1a3a2a]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <div className="flex min-w-min gap-2 md:flex-wrap md:justify-center">
              {Object.entries(categoryConfig).map(([key, cfg]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  className={`shrink-0 rounded-full border-border px-4 font-black md:gap-2 ${
                    activeCategory === key
                      ? "bg-[#1a3a2a] text-white hover:bg-[#1a3a2a]/90"
                      : "bg-white text-muted-foreground hover:bg-[#1a3a2a]/5 hover:text-[#1a3a2a]"
                  }`}
                  onClick={() => setActiveCategory(key)}
                >
                  <cfg.icon className="mr-2 h-4 w-4" />
                  {cfg.label}
                </Button>
              ))}
            </div>
          </div>

          <PlaylistPlayer
            title={`Playlist: ${activeCategoryConfig.label}`}
            description={activeCategoryConfig.description}
            items={filteredHymns}
            accentColor={activeCategoryConfig.color}
          />

          <div className="flex flex-col gap-2 rounded-[1.4rem] border border-border/50 bg-white p-5 text-foreground shadow-sm sm:flex-row sm:items-center sm:justify-between md:rounded-2xl md:border-border/60 md:bg-white/90 md:shadow-sm">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">Seleção atual</p>
              <h2 className="mt-1 text-2xl font-black tracking-normal text-foreground">{activeCategoryConfig.label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {filteredHymns.length} item(ns) prontos para ouvir individualmente ou em sequência.
              </p>
            </div>
            <div className="flex w-fit items-center gap-2 rounded-full bg-[#1a3a2a]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#1a3a2a]">
              <ListMusic className="h-4 w-4" />
              Player em lista
            </div>
          </div>

          {isLoading && isLoadingCache && filteredHymns.length === 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-36 rounded-2xl bg-muted" />
              ))}
            </div>
          ) : filteredHymns.length === 0 ? (
            <div className="py-16 text-center">
              <Music className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum hino encontrado com os filtros selecionados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
              {filteredHymns.map((hymn: any) => {
                const cfg = categoryConfig[hymn.category] || categoryConfig.all;
                return (
                  <Link key={hymn.id} href={`/hino/${hymn.id}`}>
                    <Card className="hymn-card-hover group h-full cursor-pointer overflow-hidden rounded-lg border-border/50 bg-white shadow-sm hover:border-[#c4a84b]/50">
                      <CardContent className="p-0">
                        <div className="hidden h-1 w-full md:block" style={{ backgroundColor: cfg.color }} />
                        <div className="p-4 md:p-5">
                          <div className="flex items-center gap-4 md:items-start">
                            <div
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-white shadow-sm md:rounded-xl"
                              style={{ backgroundColor: cfg.color }}
                            >
                              {String(hymn.number).padStart(2, "0")}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: cfg.color }}>
                                {cfg.label}
                              </p>
                              <h3 className="truncate text-base font-bold leading-tight text-foreground">
                                {hymn.title}
                              </h3>
                              {hymn.subtitle && (
                                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground md:line-clamp-2">{hymn.subtitle}</p>
                              )}
                              {hymn.author && <p className="mt-2 hidden text-xs text-muted-foreground md:block">{hymn.author}</p>}
                            </div>
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c4a84b] text-white shadow-md md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                              <Play className="h-4 w-4 fill-current" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
