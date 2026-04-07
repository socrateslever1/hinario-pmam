import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PlaylistPlayer from "@/components/PlaylistPlayer";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Search, Play, ListMusic, Music, Flame, Radio } from "lucide-react";
import { useMemo, useState } from "react";

const FEATURED_TRACK_TITLES = [
  "Espíritos da Guerra",
  "Demônios Camuflados Surgem da Escuridão",
  "Ai, Ai, Mamãe!",
  "Eu Sou a Morte",
  "Fui Chamado Para Guerrear",
  "Aonde Quer Que Vamos",
  "Olhar de Psico, Ladrão Logo Treme",
  "Quando Eu Morrer, Quero Ir de FAL e de Beretta",
  "Xambioá do Sertão",
  "Troquei Meu Playstation Por Um Fuzil",
];

function normalizeText(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export default function CharlieMike() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: songsData, isLoading } = trpc.hymns.getByCollection.useQuery({ collection: "tfm" });

  const allSongs = useMemo(() => {
    return (songsData ?? []).map((item: any, index: number) => ({
      ...item,
      number: index + 1,
      originalNumber: item.number,
    }));
  }, [songsData]);

  const songs = useMemo(() => {
    if (!searchTerm.trim()) return allSongs;

    const term = searchTerm.toLowerCase();
    return allSongs.filter((item: any) =>
      item.title.toLowerCase().includes(term) ||
      item.subtitle?.toLowerCase().includes(term) ||
      item.author?.toLowerCase().includes(term)
    );
  }, [allSongs, searchTerm]);

  const featuredSongs = useMemo(() => {
    const byTitle = new Map(allSongs.map((item: any) => [normalizeText(item.title), item]));
    return FEATURED_TRACK_TITLES.map((title) => byTitle.get(normalizeText(title))).filter(Boolean) as any[];
  }, [allSongs]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <section className="military-gradient py-12">
        <div className="container text-center">
          <Shield className="mx-auto mb-3 h-10 w-10 text-[#c4a84b]" />
          <h1 className="text-3xl font-bold text-white md:text-4xl" style={{ fontFamily: "Merriweather, serif" }}>
            Charlie Mike
          </h1>
          <p className="mt-3 text-white/70">
            Coleção TFM com canções militares para marcha, moral, instrução e preparo contínuo.
          </p>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-white/45">
            Numeração exibida em sequência própria da coleção
          </p>
        </div>
        <div className="checkerboard-pattern mt-8 w-full" />
      </section>

      <section className="bg-background py-8">
        <div className="container space-y-8">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar canção militar..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="rounded-2xl border border-border/60 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#1a3a2a]/60">
                <Radio className="h-4 w-4 text-[#c4a84b]" />
                Destaques do TFM
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Seleção montada a partir das mais conhecidas do acervo pesquisado em TFM/Letras para dar identidade mais forte à página.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {featuredSongs.slice(0, 6).map((song: any) => (
                  <Link key={song.id} href={`/hino/${song.id}`}>
                    <span className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#c4a84b]/35 bg-[#c4a84b]/10 px-3 py-1.5 text-xs font-bold text-[#7b641f] transition-colors hover:bg-[#c4a84b]/18">
                      <Flame className="h-3.5 w-3.5" />
                      {song.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <PlaylistPlayer
            title="Charlie Mike"
            description="Acervo TFM em fila contínua. Toque uma, avance automaticamente ou deixe em repeat para treino, instrução e ambientação. A fila já respeita a numeração própria da coleção."
            items={songs}
            accentColor="#c4a84b"
          />

          <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-white/90 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">Seleção Charlie Mike</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">Canções Militares</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {songs.length} item(ns) na visualização atual. Letras já carregadas e links de mídia conectados quando disponíveis.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-[#1a3a2a]/6 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#1a3a2a]">
              <ListMusic className="h-4 w-4" />
              Fluxo contínuo
            </div>
          </div>

          {featuredSongs.length > 0 && (
            <div className="rounded-3xl border border-[#1a3a2a]/10 bg-[#f7faf7] p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#1a3a2a]/60">
                <Flame className="h-4 w-4 text-[#c4a84b]" />
                Mais pedidas da coleção
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {featuredSongs.map((song: any) => (
                  <Link key={song.id} href={`/hino/${song.id}`}>
                    <div className="cursor-pointer rounded-2xl border border-[#1a3a2a]/10 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#c4a84b]/45 hover:shadow-md">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1a3a2a] text-sm font-black text-white shadow-sm">
                          {String(song.number).padStart(2, "0")}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a3a2a]/55">Destaque TFM</p>
                          <h3 className="mt-1 text-sm font-bold leading-tight text-foreground">{song.title}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">{song.subtitle || song.author || "Canção de referência do acervo"}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-36 rounded-2xl" />
              ))}
            </div>
          ) : songs.length === 0 ? (
            <div className="py-16 text-center">
              <Music className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma canção militar encontrada.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {songs.map((song: any) => (
                <Link key={song.id} href={`/hino/${song.id}`}>
                  <Card className="hymn-card-hover group h-full cursor-pointer overflow-hidden border-border/50 bg-white hover:border-[#c4a84b]/50">
                    <CardContent className="p-0">
                      <div className="h-1 w-full bg-[#2d5a27]" />
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2d5a27] text-sm font-black text-white shadow-sm">
                            {String(song.number).padStart(2, "0")}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#2d5a27]">
                              Canção Militar
                            </p>
                            <h3 className="text-base font-bold leading-tight text-foreground">{song.title}</h3>
                            {song.subtitle && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{song.subtitle}</p>}
                            {song.author && <p className="mt-2 text-xs text-muted-foreground">{song.author}</p>}
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
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
