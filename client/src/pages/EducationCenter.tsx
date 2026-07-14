import { useMemo, useState } from "react";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import StudyAuthGuard from "@/components/StudyAuthGuard";
import { studyLibraryItems } from "@/lib/studyLibrary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpenCheck, ExternalLink, FileText, GraduationCap, Library, Search, ShieldCheck, UploadCloud } from "lucide-react";

function difficultyLabel(level: string) {
  if (level === "base") return "Base";
  if (level === "intermediario") return "Intermediário";
  return "Intensivo";
}

export default function EducationCenter() {
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const filteredMaterials = useMemo(() => {
    if (!normalizedQuery) return studyLibraryItems;

    return studyLibraryItems.filter((item) =>
      [item.title, item.description, item.sourceTitle, item.sourceFileName, item.theme, item.category]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [normalizedQuery]);

  const manualsCount = studyLibraryItems.filter((item) => item.category === "manual").length;
  const regulationsCount = studyLibraryItems.filter((item) => item.category === "regulamento").length;

  return (
    <StudyAuthGuard>
      <div className="mobile-safe-bottom min-h-screen flex flex-col bg-[#f5f2e8]">
        <Navbar />

      <section className="bg-card border-b border-border/40 px-4 pb-7 pt-6 md:px-0 md:py-12">
        <div className="container text-center">
          <BookOpenCheck className="mx-auto mb-3 h-10 w-10 text-[#c4a84b]" />
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a3a2a]" style={{ fontFamily: "Merriweather, serif" }}>
            Estudos
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground text-sm md:text-base">
            Biblioteca jurídica e de consulta. Aqui ficam os PDFs oficiais para abrir, visualizar e consultar, sem formato de aula.
          </p>
        </div>
        <div className="checkerboard-pattern mt-8 hidden w-full md:block" />
      </section>

      <section className="bg-transparent px-4 py-6 md:bg-background md:px-0 md:py-8">
        <div className="container space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border/50 bg-card text-foreground shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <Library className="h-10 w-10 text-[#c4a84b]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Materiais</p>
                  <p className="text-2xl font-bold text-[#1a3a2a]">{studyLibraryItems.length}</p>
                  <p className="text-sm text-muted-foreground">PDFs prontos para consulta</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card text-foreground shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <BookOpenCheck className="h-10 w-10 text-[#c4a84b]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Coleção</p>
                  <p className="text-2xl font-bold text-[#1a3a2a]">{regulationsCount}</p>
                  <p className="text-sm text-muted-foreground">Regulamentos e leis</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card text-foreground shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <ShieldCheck className="h-10 w-10 text-[#1a3a2a]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Manuais</p>
                  <p className="text-2xl font-bold text-[#1a3a2a]">{manualsCount}</p>
                  <p className="text-sm text-muted-foreground">Base complementar de formação</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50 bg-card text-foreground shadow-sm rounded-xl">
            <CardContent className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_320px] md:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por nome do documento, tema ou arquivo"
                  className="pl-9 bg-card text-foreground placeholder:text-muted-foreground border-border"
                />
              </div>
              <div className="rounded-2xl border border-border/50 bg-[#1a3a2a]/5 px-4 py-3 text-sm text-muted-foreground">
                <p className="font-semibold text-[#1a3a2a]">Biblioteca dinâmica</p>
                <p className="mt-1">
                  A base agora está preparada para receber mais leis, apostilas e regulamentos com PDF, imagem de capa e links complementares.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-10">
              {/* Seção de Manuais */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-2 text-foreground">
                  <ShieldCheck className="h-5 w-5 text-[#c4a84b]" />
                  <h2 className="text-xl font-bold" style={{ fontFamily: "Merriweather, serif" }}>Manuais de Formação</h2>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  {filteredMaterials.filter(m => m.category === "manual").length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Nenhum manual encontrado.</p>
                  ) : (
                    filteredMaterials.filter(m => m.category === "manual").map((item) => (
                      <Card key={item.slug} className="h-full border-border/50 bg-card text-foreground shadow-sm transition-colors hover:border-[#c4a84b]/50">
                        <CardHeader className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-[#1a3a2a] text-white">{item.shortTitle}</Badge>
                            <Badge variant="outline">{item.pages} páginas</Badge>
                            <Badge variant="outline">{difficultyLabel(item.difficulty)}</Badge>
                          </div>
                          <div>
                            <CardTitle className="text-xl text-foreground" style={{ fontFamily: "Merriweather, serif" }}>
                              {item.title}
                            </CardTitle>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">{item.description}</p>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex flex-col gap-2 sm:flex-row mt-auto pt-4">
                            <Link href={`/estudos/${item.slug}`} className="flex-1">
                              <Button className="w-full bg-[#1a3a2a] text-white hover:bg-[#10281d]">
                                <FileText className="mr-2 h-4 w-4" />
                                Estudar Manual
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              {/* Seção de Regulamentos */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-2 text-foreground">
                  <BookOpenCheck className="h-5 w-5 text-[#c4a84b]" />
                  <h2 className="text-xl font-bold" style={{ fontFamily: "Merriweather, serif" }}>Leis e Regulamentos</h2>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  {filteredMaterials.filter(m => m.category === "regulamento").length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Nenhum regulamento encontrado.</p>
                  ) : (
                    filteredMaterials.filter(m => m.category === "regulamento").map((item) => (
                      <Card key={item.slug} className="h-full border-border/50 bg-card text-foreground shadow-sm transition-colors hover:border-[#c4a84b]/50">
                        <CardHeader className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-slate-700 text-white">{item.shortTitle}</Badge>
                            <Badge variant="outline">{item.pages} páginas</Badge>
                            <Badge variant="outline">{difficultyLabel(item.difficulty)}</Badge>
                          </div>
                          <div>
                            <CardTitle className="text-xl text-foreground" style={{ fontFamily: "Merriweather, serif" }}>
                              {item.title}
                            </CardTitle>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">{item.description}</p>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex flex-col gap-2 sm:flex-row mt-auto pt-4">
                            <Link href={`/estudos/${item.slug}`} className="flex-1">
                              <Button className="w-full bg-[#1a3a2a] text-white hover:bg-[#10281d]">
                                <FileText className="mr-2 h-4 w-4" />
                                Iniciar Estudo
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>

            <Card className="h-fit border-[#c4a84b]/40 bg-[#c4a84b]/5 text-foreground shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2 text-[#1a3a2a]">
                  <UploadCloud className="h-5 w-5" />
                  <CardTitle style={{ fontFamily: "Merriweather, serif" }}>Estrutura pronta para upload</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  A área foi preparada para funcionar como acervo. O próximo lote pode receber leis, normas internas, apostilas e PDFs extras.
                </p>
                <ul className="space-y-2">
                  <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-[#c4a84b]" />PDF principal para visualização dentro da página.</li>
                  <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-[#c4a84b]" />Imagem de capa e mídias auxiliares para contexto do material.</li>
                  <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-[#c4a84b]" />Catalogação por tema, origem e tipo documental.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
      </div>
    </StudyAuthGuard>
  );
}
