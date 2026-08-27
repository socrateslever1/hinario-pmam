import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PlaylistPlayer from "@/components/PlaylistPlayer";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  Search,
  Play,
  Music,
  Flame,
  Radio,
  ListMusic,
} from "lucide-react";
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
  const { data: songsData, isLoading } = trpc.hymns.getByCollection.useQuery({
    collection: "tfm",
  });

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
    return allSongs.filter(
      (item: any) =>
        item.title.toLowerCase().includes(term) ||
        item.subtitle?.toLowerCase().includes(term) ||
        item.author?.toLowerCase().includes(term)
    );
  }, [allSongs, searchTerm]);

  const featuredSongs = useMemo(() => {
    const byTitle = new Map(
      allSongs.map((item: any) => [normalizeText(item.title), item])
    );
    return FEATURED_TRACK_TITLES.map(title =>
      byTitle.get(normalizeText(title))
    ).filter(Boolean) as any[];
  }, [allSongs]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <section className="military-gradient py-6 md:py-7">
        <div className="container text-center">
          <Shield className="mx-auto mb-2 h-8 w-8 text-[#c4a84b]" />
          <h1
            className="text-[28px] font-bold leading-tight text-white md:text-3xl"
            style={{ fontFamily: "Merriweather, serif" }}
          >
            Charlie Mike
          </h1>
          <p className="mx-auto mt-2 max-w-3xl text-sm leading-relaxed text-white/75 md:text-base">
            Coleção TFM com canções militares para marcha, moral, instrução e preparo contínuo.
          </p>
        </div>
        <div className="checkerboard-pattern mt-4 w-full md:mt-5" />
      </section>

      <section className="bg-background py-5 md:py-6">
        <div className="container space-y-5 md:space-y-6">
          <PlaylistPlayer
            title="Charlie Mike"
            description="Acervo TFM em fila contínua para treino, instrução e ambientação, com leitura mais confortável em web e mobile."
            items={songs}
            accentColor="#c4a84b"
          />

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
            <div className="rounded-[28px] border border-border/60 bg-white/95 p-4 shadow-sm backdrop-blur md:p-5 dark:bg-card/95">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#1a3a2a]/65 dark:text-[#d6bd66]">
                    <Radio className="h-4 w-4 text-[#c4a84b]" />
                    Explorar coleção
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Filtre o acervo e encontre rapidamente a faixa que você quer abrir ou estudar.
                  </p>
                </div>
                <div className="inline-flex min-h-10 w-fit items-center gap-2 rounded-full bg-[#1a3a2a]/6 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1a3a2a] dark:bg-[#d6bd66]/10 dark:text-[#d6bd66]">
                  <ListMusic className="h-4 w-4" />
                  {songs.length} faixa(s)
                </div>
              </div>

              <div className="relative mt-4 w-full max-w-2xl">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar canção militar..."
                  className="rounded-2xl pl-10"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  aria-label="Buscar canção Charlie Mike"
                />
              </div>

              {featuredSongs.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {featuredSongs.slice(0, 8).map((song: any) => (
                    <Link key={song.id} href={`/hino/${song.id}`}>
                      <span className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-[#c4a84b]/35 bg-[#c4a84b]/10 px-3 py-2 text-xs font-bold leading-tight text-[#7b641f] transition-colors hover:bg-[#c4a84b]/18 dark:text-[#e0c86e]">
                        <Flame className="h-3.5 w-3.5 shrink-0" />
                        {song.title}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#1a3a2a]/10 bg-[#f7faf7] p-4 shadow-sm dark:border-white/10 dark:bg-card">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1a3a2a]/60 dark:text-[#d6bd66]">
                Mais fortes do acervo
              </p>
              <div className="mt-3 space-y-2.5">
                {featuredSongs.slice(0, 4).map((song: any) => (
                  <Link key={song.id} href={`/hino/${song.id}`}>
                    <div className="cursor-pointer rounded-2xl border border-[#1a3a2a]/10 bg-white px-3 py-3 transition-all hover:-translate-y-0.5 hover:border-[#c4a84b]/45 hover:shadow-sm dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1a3a2a] text-xs font-black text-white shadow-sm">
                          {String(song.number).padStart(2, "0")}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold leading-snug text-foreground">
                            {song.title}
                          </h3>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {song.subtitle || song.author || "Faixa destaque da Charlie Mike"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-white/90 p-4 shadow-sm dark:bg-card/90 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                Catálogo Charlie Mike
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-foreground md:text-2xl">
                Canções Militares
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {songs.length} item(ns) na visualização atual. Letras já carregadas e links de mídia conectados quando disponíveis.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-36 rounded-2xl" />
              ))}
            </div>
          ) : songs.length === 0 ? (
            <div className="py-14 text-center">
              <Music className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground md:text-base">
                Nenhuma canção militar encontrada.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {songs.map((song: any) => (
                <Link key={song.id} href={`/hino/${song.id}`}>
                  <Card className="hymn-card-hover group h-full cursor-pointer overflow-hidden border-border/50 bg-white hover:border-[#c4a84b]/50 dark:bg-card">
                    <CardContent className="p-0">
                      <div className="h-1 w-full bg-[#2d5a27]" />
                      <div className="p-4 md:p-5">
                        <div className="flex items-start gap-3.5 md:gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2d5a27] text-sm font-black text-white shadow-sm">
                            {String(song.number).padStart(2, "0")}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="mb-1 text-xs font-black uppercase tracking-[0.16em] text-[#2d5a27] dark:text-[#9ccc83]">
                              Canção Militar
                            </p>
                            <h3 className="text-base font-bold leading-snug text-foreground">
                              {song.title}
                            </h3>
                            {song.subtitle && (
                              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                {song.subtitle}
                              </p>
                            )}
                            {song.author && (
                              <p className="mt-2 text-[13px] text-muted-foreground">
                                {song.author}
                              </p>
                            )}
                          </div>
                          <div className="opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c4a84b] shadow-md" aria-hidden="true">
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
