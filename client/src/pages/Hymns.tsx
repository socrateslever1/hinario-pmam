import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Link, useSearch } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music, Search, Star, Shield, Target, BookOpen, Play } from "lucide-react";
import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const categoryConfig: Record<string, { label: string; icon: any; color: string }> = {
  all: { label: "Todos", icon: Music, color: "#1a3a2a" },
  nacional: { label: "Hinos Nacionais", icon: Star, color: "#c4a84b" },
  militar: { label: "Canções Militares", icon: Shield, color: "#2d5a27" },
  pmam: { label: "Canções PMAM", icon: Music, color: "#1a3a2a" },
  arma: { label: "Canções de Armas", icon: Target, color: "#8b4513" },
  oracao: { label: "Orações", icon: BookOpen, color: "#1a2744" },
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
        (h.subtitle?.toLowerCase().includes(term)) ||
        (h.author?.toLowerCase().includes(term))
      );
    }
    return filtered;
  }, [hymns, activeCategory, searchTerm]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Header */}
      <section className="military-gradient py-12">
        <div className="container text-center">
          <Music className="h-10 w-10 text-[#c4a84b] mx-auto mb-3" />
          <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Merriweather, serif' }}>
            Catálogo de Hinos
          </h1>
          <p className="mt-3 text-white/60">
            {hymns?.length ?? 26} hinos, canções e orações militares
          </p>
        </div>
        <div className="checkerboard-pattern w-full mt-8" />
      </section>

      <section className="py-8 bg-background">
        <div className="container">
          {/* Search */}
          <div className="relative max-w-md mx-auto mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar hino por nome ou autor..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
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

          {/* Hymn List */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : filteredHymns.length === 0 ? (
            <div className="text-center py-16">
              <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum hino encontrado com os filtros selecionados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHymns.map((hymn: any) => {
                const cfg = categoryConfig[hymn.category] || categoryConfig.all;
                return (
                  <Link key={hymn.id} href={`/hino/${hymn.id}`}>
                    <Card className="hymn-card-hover cursor-pointer border-border/50 hover:border-[#c4a84b]/50 h-full group">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                            style={{ backgroundColor: cfg.color }}
                          >
                            {String(hymn.number).padStart(2, "0")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: cfg.color }}>
                              {cfg.label}
                            </p>
                            <h3 className="font-semibold text-foreground text-sm leading-tight truncate">
                              {hymn.title}
                            </h3>
                            {hymn.subtitle && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{hymn.subtitle}</p>
                            )}
                            {hymn.author && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {hymn.author}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 rounded-full bg-[#c4a84b] flex items-center justify-center">
                              <Play className="h-4 w-4 text-white fill-white" />
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
