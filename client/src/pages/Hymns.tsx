import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PlaylistPlayer from "@/components/PlaylistPlayer";
import { trpc } from "@/lib/trpc";
import { Link, useSearch } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music, Search, Star, Shield, Target, BookOpen, Play, ListMusic } from "lucide-react";
import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const categoryConfig: Record<string, { label: string; icon: any; color: string; description: string }> = {
  all: { label: "Todos", icon: Music, color: "#1a3a2a", description: "Todos os hinos, canções e orações disponíveis no sistema." },
  nacional: { label: "Hinos Nacionais", icon: Star, color: "#c4a84b", description: "Patrimônio musical nacional para estudo e execução." },
  militar: { label: "Canções Militares", icon: Shield, color: "#2d5a27", description: "Canções de marcha, fibra e tradição militar." },
  pmam: { label: "Canções PMAM", icon: Music, color: "#1a3a2a", description: "Repertório institucional da PMAM." },
  arma: { label: "Canções de Armas", icon: Target, color: "#8b4513", description: "Canções históricas e de especialidades militares." },
  oracao: { label: "Orações", icon: BookOpen, color: "#1a2744", description: "Textos de formação, fé e inspiração." },
};

export default function Hymns() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const initialCategory = params.get("categoria") || "all";

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: hymns, isLoading } = trpc.hymns.list.useQuery();

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
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <section className="military-gradient py-12">
        <div className="container text-center">
          <Music className="mx-auto mb-3 h-10 w-10 text-[#c4a84b]" />
          <h1 className="text-3xl font-bold text-white md:text-4xl" style={{ fontFamily: "Merriweather, serif" }}>
            Catálogo de Hinos
          </h1>
          <p className="mt-3 text-white/60">
            {hymns?.length ?? 0} hinos, canções e orações militares
          </p>
        </div>
        <div className="checkerboard-pattern mt-8 w-full" />
      </section>

      <section className="bg-background py-8">
        <div className="container space-y-8">
          <div className="relative mx-auto max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar hino por nome, subtítulo ou autor..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {Object.entries(categoryConfig).map(([key, cfg]) => (
              <Button
                key={key}
                variant={activeCategory === key ? "default" : "outline"}
                size="sm"
                className={`gap-2 ${activeCategory === key ? "bg-[#1a3a2a] text-white hover:bg-[#1a3a2a]/90" : ""}`}
                onClick={() => setActiveCategory(key)}
              >
                <cfg.icon className="h-4 w-4" />
                {cfg.label}
              </Button>
            ))}
          </div>

          <PlaylistPlayer
            title={`Playlist: ${activeCategoryConfig.label}`}
            description={activeCategoryConfig.description}
            items={filteredHymns}
            accentColor={activeCategoryConfig.color}
          />

          <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-white/90 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">Seleção atual</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">{activeCategoryConfig.label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {filteredHymns.length} item(ns) prontos para ouvir individualmente ou em sequência.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-[#1a3a2a]/6 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#1a3a2a]">
              <ListMusic className="h-4 w-4" />
              Player em lista
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-36 rounded-2xl" />
              ))}
            </div>
          ) : filteredHymns.length === 0 ? (
            <div className="py-16 text-center">
              <Music className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum hino encontrado com os filtros selecionados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredHymns.map((hymn: any) => {
                const cfg = categoryConfig[hymn.category] || categoryConfig.all;
                return (
                  <Link key={hymn.id} href={`/hino/${hymn.id}`}>
                    <Card className="hymn-card-hover group h-full cursor-pointer overflow-hidden border-border/50 bg-white hover:border-[#c4a84b]/50">
                      <CardContent className="p-0">
                        <div className="h-1 w-full" style={{ backgroundColor: cfg.color }} />
                        <div className="p-5">
                          <div className="flex items-start gap-4">
                            <div
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white shadow-sm"
                              style={{ backgroundColor: cfg.color }}
                            >
                              {String(hymn.number).padStart(2, "0")}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: cfg.color }}>
                                {cfg.label}
                              </p>
                              <h3 className="text-base font-bold leading-tight text-foreground">
                                {hymn.title}
                              </h3>
                              {hymn.subtitle && (
                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{hymn.subtitle}</p>
                              )}
                              {hymn.author && <p className="mt-2 text-xs text-muted-foreground">{hymn.author}</p>}
                            </div>
                            <div className="opacity-0 transition-opacity group-hover:opacity-100">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c4a84b] shadow-md">
                                <Play className="h-4 w-4 fill-white text-white" />
                              </div>
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

      <Footer />
    </div>
  );
}
