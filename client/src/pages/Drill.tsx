import { useMemo, useState } from "react";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { ordemUnidaManualHighlights } from "@/lib/studyLibrary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Play,
  Search,
  ShieldCheck,
  Target,
  UploadCloud,
  Video,
} from "lucide-react";

const difficultyLabels: Record<string, string> = {
  basico: "Básico",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

const difficultyClasses: Record<string, string> = {
  basico: "bg-emerald-100 text-emerald-800",
  intermediario: "bg-amber-100 text-amber-800",
  avancado: "bg-red-100 text-red-800",
};

export default function Drill() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const { data: drills, isLoading } = trpc.drill.list.useQuery();

  const categories = useMemo(() => {
    if (!drills) return [];
    return Array.from(new Set(drills.map((item: any) => item.category).filter(Boolean))).sort();
  }, [drills]);

  const filteredDrills = useMemo(() => {
    if (!drills) return [];

    const normalizedQuery = query.trim().toLowerCase();

    return drills.filter((item: any) => {
      const matchesQuery =
        !normalizedQuery ||
        [item.title, item.subtitle, item.description, item.instructor, item.category]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      const matchesDifficulty = !selectedDifficulty || item.difficulty === selectedDifficulty;

      return matchesQuery && matchesCategory && matchesDifficulty;
    });
  }, [drills, query, selectedCategory, selectedDifficulty]);

  const mediaCount = filteredDrills.filter((item: any) => item.videoUrl || item.imageUrl || item.pdfUrl).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <section className="military-gradient py-12">
        <div className="container text-center">
          <Target className="mx-auto mb-3 h-10 w-10 text-[#c4a84b]" />
          <h1 className="text-3xl font-bold text-white md:text-4xl" style={{ fontFamily: "Merriweather, serif" }}>
            Ordem Unida
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-white/60">
            Conteúdo organizado para instrução, consulta e demonstração, com espaço para vídeo, imagem e PDF em cada material.
          </p>
        </div>
        <div className="checkerboard-pattern mt-8 w-full" />
      </section>

      <section className="bg-background py-8">
        <div className="container space-y-8">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="flex items-center gap-4 p-5">
                <Target className="h-10 w-10 text-[#1a3a2a]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Publicados</p>
                  <p className="text-2xl font-bold">{drills?.length ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Itens de ordem unida</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="flex items-center gap-4 p-5">
                <Video className="h-10 w-10 text-[#1a3a2a]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Mídias</p>
                  <p className="text-2xl font-bold">{mediaCount}</p>
                  <p className="text-sm text-muted-foreground">Vídeos, imagens e PDFs</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="flex items-center gap-4 p-5">
                <ShieldCheck className="h-10 w-10 text-[#1a3a2a]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Base Doutrinária</p>
                  <p className="text-2xl font-bold">CFAP</p>
                  <p className="text-sm text-muted-foreground">Integrado aos manuais</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-[#c4a84b]/40 bg-[#c4a84b]/5">
            <CardContent className="flex items-start gap-4 p-6">
              <ShieldCheck className="mt-1 h-8 w-8 flex-shrink-0 text-[#c4a84b]" />
              <div className="space-y-2">
                <h3 className="font-bold text-foreground">Referência no Manual do Aluno</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {ordemUnidaManualHighlights.map((highlight) => (
                    <li key={highlight} className="flex gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-[#c4a84b]" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1fr)_330px]">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar por título, instrutor, categoria ou descrição"
                    className="pl-9"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    className={selectedCategory === null ? "bg-[#1a3a2a] text-white hover:bg-[#10281d]" : ""}
                    onClick={() => setSelectedCategory(null)}
                  >
                    Todas as categorias
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      className={selectedCategory === category ? "bg-[#1a3a2a] text-white hover:bg-[#10281d]" : ""}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedDifficulty === null ? "outline" : "ghost"}
                    onClick={() => setSelectedDifficulty(null)}
                  >
                    Todas as dificuldades
                  </Button>
                  {Object.entries(difficultyLabels).map(([key, label]) => (
                    <Button
                      key={key}
                      variant={selectedDifficulty === key ? "default" : "outline"}
                      className={selectedDifficulty === key ? "bg-[#c4a84b] text-[#1a1a1a] hover:bg-[#b79834]" : ""}
                      onClick={() => setSelectedDifficulty(key)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border bg-[#1a3a2a]/5 p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-[#1a3a2a]">O que já está pronto</p>
                <ul className="mt-3 space-y-2">
                  <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-[#c4a84b]" />Cada item pode carregar vídeo, PDF e imagem.</li>
                  <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-[#c4a84b]" />A página pública pode reunir orientação, demonstração e material complementar no mesmo fluxo.</li>
                  <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-[#c4a84b]" />O admin já serve de base para incluir novos materiais de ordem unida.</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <Card className="border-border/60">
              <CardContent className="p-12 text-center text-muted-foreground">
                Carregando ordem unida...
              </CardContent>
            </Card>
          ) : filteredDrills.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="p-12 text-center text-muted-foreground">
                Nenhum material de ordem unida encontrado com esse filtro.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredDrills.map((item: any) => (
                <Link key={item.id} href={`/drill/${item.id}`}>
                  <Card className="h-full cursor-pointer overflow-hidden border-border/60 transition-all hover:-translate-y-0.5 hover:border-[#c4a84b]/50">
                    <div className="relative aspect-[16/9] overflow-hidden bg-[#0f1f18]">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#10281d] to-[#1f4735]">
                          <Target className="h-14 w-14 text-[#c4a84b]" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <div className="flex flex-wrap gap-2">
                          {item.videoUrl && <Badge className="bg-red-600 text-white"><Play className="mr-1 h-3 w-3" />Vídeo</Badge>}
                          {item.pdfUrl && <Badge className="bg-blue-600 text-white"><FileText className="mr-1 h-3 w-3" />PDF</Badge>}
                          {item.imageUrl && <Badge className="bg-emerald-600 text-white"><ImageIcon className="mr-1 h-3 w-3" />Imagem</Badge>}
                        </div>
                      </div>
                    </div>

                    <CardContent className="space-y-4 p-5">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.category && <Badge variant="outline">{item.category}</Badge>}
                          {item.difficulty && (
                            <Badge className={difficultyClasses[item.difficulty] ?? "bg-slate-100 text-slate-800"}>
                              {difficultyLabels[item.difficulty] ?? item.difficulty}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-xl font-semibold text-foreground" style={{ fontFamily: "Merriweather, serif" }}>
                          {item.title}
                        </h3>
                        {item.subtitle && (
                          <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
                          {item.description}
                        </p>
                      )}

                      <div className="rounded-2xl border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                        <p><strong className="text-foreground">Instrutor:</strong> {item.instructor || "Não informado"}</p>
                        <p className="mt-1"><strong className="text-foreground">Duração:</strong> {item.duration ? `${item.duration} min` : "Livre"}</p>
                      </div>

                      <Button className="w-full bg-[#1a3a2a] text-white hover:bg-[#10281d]">
                        Abrir material
                      </Button>
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
