import { useMemo, useState } from "react";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import StudyAuthGuard, { useStudyAuth } from "@/components/StudyAuthGuard";
import { studyLibraryItems, getStudyLibraryItem } from "@/lib/studyLibrary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpenCheck, ExternalLink, FileText, GraduationCap, Library, Search, ShieldCheck, UploadCloud, PlayCircle, History } from "lucide-react";
import { trpc } from "@/lib/trpc";

function difficultyLabel(level: string) {
  if (level === "base") return "Base";
  if (level === "intermediario") return "Intermediário";
  return "Intensivo";
}

export default function EducationCenter() {
  const { session } = useStudyAuth();
  const { data: dashboard } = trpc.study.dashboard.useQuery(
    { studentNumber: session?.student.studentNumber || "", accessToken: session?.accessToken || "" },
    { enabled: !!session }
  );

  const [query, setQuery] = useState("");

  const lastModule = dashboard?.student.lastModuleSlug ? getStudyLibraryItem(dashboard.student.lastModuleSlug) : null;

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
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />

      <section className="military-gradient relative overflow-hidden py-12 md:py-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-0 top-0 h-56 w-56 rounded-full bg-[#c4a84b] blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#2d5a27] blur-[140px]" />
        </div>
        <div className="container relative">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80">
              <GraduationCap className="h-4 w-4 text-[#c4a84b]" />
              Biblioteca jurídica e de consulta
            </div>
            <h1 className="text-4xl font-bold text-white md:text-5xl" style={{ fontFamily: "Merriweather, serif" }}>
              Estudos
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
              Esta área agora funciona como biblioteca. Aqui ficam os PDFs oficiais para abrir, visualizar e consultar,
              sem formato de aula. A estrutura está pronta para receber mais leis, regulamentos e manuais de forma dinâmica.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Card className="border-white/10 bg-white/10 text-white backdrop-blur">
              <CardContent className="flex items-center gap-4 p-5">
                <Library className="h-10 w-10 text-[#c4a84b]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/60">Materiais</p>
                  <p className="text-2xl font-bold">{studyLibraryItems.length}</p>
                  <p className="text-sm text-white/60">PDFs prontos para consulta</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/10 text-white backdrop-blur">
              <CardContent className="flex items-center gap-4 p-5">
                <BookOpenCheck className="h-10 w-10 text-[#c4a84b]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/60">Coleção</p>
                  <p className="text-2xl font-bold">{regulationsCount}</p>
                  <p className="text-sm text-white/60">Regulamentos e leis</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/10 text-white backdrop-blur">
              <CardContent className="flex items-center gap-4 p-5">
                <ShieldCheck className="h-10 w-10 text-[#c4a84b]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/60">Manuais</p>
                  <p className="text-2xl font-bold">{manualsCount}</p>
                  <p className="text-sm text-white/60">Base complementar de formação</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="checkerboard-pattern mt-8 w-full" />
      </section>

      <section className="py-10 md:py-12">
        <div className="container space-y-6">
          <Card className="border-border/60">
            <CardContent className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_320px] md:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por nome do documento, tema ou arquivo"
                  className="pl-9"
                />
              </div>
              <div className="rounded-2xl border bg-[#1a3a2a]/5 px-4 py-3 text-sm text-muted-foreground">
                <p className="font-semibold text-[#1a3a2a]">Biblioteca dinâmica</p>
                <p className="mt-1">
                  A base agora está preparada para receber mais leis, apostilas e regulamentos com PDF, imagem de capa e links complementares.
                </p>
              </div>
            </CardContent>
          </Card>

          {lastModule && (
            <Card className="border-[#c4a84b]/40 bg-gradient-to-r from-[#1a3a2a] to-[#2d5a27] text-white overflow-hidden relative group">
              <div className="absolute right-0 top-0 h-full w-32 bg-[#c4a84b]/10 skew-x-12 translate-x-10 group-hover:bg-[#c4a84b]/20 transition-colors" />
              <CardContent className="p-6 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[#c4a84b]">
                      <History className="h-4 w-4 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-widest">Continuar de onde parei</span>
                    </div>
                    <h2 className="text-2xl font-bold" style={{ fontFamily: "Merriweather, serif" }}>{lastModule.title}</h2>
                    <p className="text-white/70 text-sm max-w-xl line-clamp-1">{lastModule.description}</p>
                  </div>
                  <Link href={`/estudos/${lastModule.slug}`}>
                    <Button className="bg-[#c4a84b] text-[#1a3a2a] hover:bg-[#d4b85b] font-bold px-8 h-12 shadow-lg shadow-black/20">
                      <PlayCircle className="mr-2 h-5 w-5" />
                      Retomar Agora
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-10">
              {/* Seção de Manuais */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <ShieldCheck className="h-5 w-5 text-[#c4a84b]" />
                  <h2 className="text-xl font-bold" style={{ fontFamily: "Merriweather, serif" }}>Manuais de Formação</h2>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  {filteredMaterials.filter(m => m.category === "manual").length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Nenhum manual encontrado.</p>
                  ) : (
                    filteredMaterials.filter(m => m.category === "manual").map((item) => (
                      <Card key={item.slug} className="h-full border-border/60 transition-colors hover:border-[#c4a84b]/50">
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
                <div className="flex items-center gap-2 border-b pb-2">
                  <BookOpenCheck className="h-5 w-5 text-[#c4a84b]" />
                  <h2 className="text-xl font-bold" style={{ fontFamily: "Merriweather, serif" }}>Leis e Regulamentos</h2>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  {filteredMaterials.filter(m => m.category === "regulamento").length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Nenhum regulamento encontrado.</p>
                  ) : (
                    filteredMaterials.filter(m => m.category === "regulamento").map((item) => (
                      <Card key={item.slug} className="h-full border-border/60 transition-colors hover:border-[#c4a84b]/50">
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

            <Card className="h-fit border-[#c4a84b]/40 bg-[#c4a84b]/5">
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
