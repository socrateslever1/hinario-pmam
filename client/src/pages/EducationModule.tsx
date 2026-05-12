import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import NotFound from "@/pages/NotFound";
import { getStudyModule } from "@/content/studyModules";
import { getStudyLibraryItem, ordemUnidaManualHighlights } from "@/lib/studyLibrary";
import { buildStudySnippets, cleanExtractedStudyText } from "@/lib/studyText";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  BookOpenCheck,
  ExternalLink,
  FileText,
  FolderOpen,
  Library,
  Search,
  ShieldCheck,
  UploadCloud,
  GraduationCap,
  Layout,
  BookOpen
} from "lucide-react";
import StudyStudio from "@/components/StudyStudio";
import StudyAuthGuard, { useStudyAuth } from "@/components/StudyAuthGuard";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { saveLastAccessed } from "@/lib/lastAccessed";

type EducationModuleProps = {
  params: {
    slug: string;
  };
};

function categoryLabel(category: string) {
  return category === "manual" ? "Manual institucional" : "Lei e regulamento";
}

function difficultyLabel(level: string) {
  if (level === "base") return "Base";
  if (level === "intermediario") return "Intermediário";
  return "Intensivo";
}

export default function EducationModule({ params }: EducationModuleProps) {
  const { session } = useStudyAuth();
  const updateLastAccessed = trpc.study.updateLastAccessed.useMutation();

  useEffect(() => {
    if (session?.student?.studentNumber && params.slug) {
      updateLastAccessed.mutate({
        studentNumber: session.student.studentNumber,
        moduleSlug: params.slug
      });
      
      if (libraryItem) {
        saveLastAccessed({
          type: "study",
          id: params.slug,
          title: libraryItem.title,
          subtitle: libraryItem.category === "manual" ? "Manual de Formação" : "Lei/Regulamento",
          url: `/estudos/${params.slug}`
        });
      }
    }
  }, [params.slug, session?.student?.studentNumber, libraryItem]);

  const module = getStudyModule(params.slug);
  const libraryItem = getStudyLibraryItem(params.slug);
  const [query, setQuery] = useState("");
  const [fullText, setFullText] = useState("");
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [viewMode, setViewMode] = useState<"interactive" | "library">("interactive");

  useEffect(() => {
    if (!module) return;

    let cancelled = false;
    setIsLoadingText(true);

    fetch(module.textPath)
      .then((response) => response.text())
      .then((text) => {
        if (!cancelled) {
          setFullText(cleanExtractedStudyText(text, module));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFullText("");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingText(false);
      });

    return () => {
      cancelled = true;
    };
  }, [module]);

  const deferredQuery = useDeferredValue(query);
  const snippets = useMemo(
    () => buildStudySnippets(fullText, deferredQuery),
    [deferredQuery, fullText],
  );

  if (!module || !libraryItem) {
    return <NotFound />;
  }

  const highlightNotes =
    module.slug === "manual-cfap"
      ? ordemUnidaManualHighlights
      : module.quickFacts.slice(0, 3);

  return (
    <StudyAuthGuard>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />

      <section className="military-gradient relative overflow-hidden py-10 md:py-14">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-0 top-0 h-56 w-56 rounded-full bg-[#c4a84b] blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#2d5a27] blur-[140px]" />
        </div>
        <div className="container relative space-y-6">
          <Link href="/estudos">
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para a biblioteca
            </Button>
          </Link>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-end">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-[#c4a84b] text-[#1a1a1a]">{libraryItem.shortTitle}</Badge>
                <Badge variant="outline" className="border-white/20 text-white/80">
                  {categoryLabel(libraryItem.category)}
                </Badge>
                <Badge variant="outline" className="border-white/20 text-white/80">
                  {libraryItem.pages} páginas
                </Badge>
                <Badge variant="outline" className="border-white/20 text-white/80">
                  {difficultyLabel(libraryItem.difficulty)}
                </Badge>
              </div>

              <div>
                <h1
                  className="text-3xl font-bold text-white md:text-4xl"
                  style={{ fontFamily: "Merriweather, serif" }}
                >
                  {libraryItem.title}
                </h1>
                <p className="mt-3 max-w-3xl text-base leading-relaxed text-white/70 md:text-lg">
                  {libraryItem.description}
                </p>
                <p className="mt-3 text-sm text-white/55">
                  Fonte: {libraryItem.sourceTitle} | arquivo {libraryItem.sourceFileName}
                </p>
              </div>
            </div>

            <Card className="border-white/10 bg-white/10 text-white backdrop-blur">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-3">
                  <Library className="h-9 w-9 text-[#c4a84b]" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/55">Modo consulta</p>
                    <p className="text-sm text-white/80">
                      Esta página foi simplificada para biblioteca. Aqui você abre o PDF oficial e consulta o texto.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-white/75">
                  <p><strong className="text-white">Tema:</strong> {libraryItem.theme}</p>
                  <p><strong className="text-white">Categoria:</strong> {categoryLabel(libraryItem.category)}</p>
                  <p><strong className="text-white">Base:</strong> pronta para receber novos materiais por upload.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="checkerboard-pattern mt-8 w-full" />
      </section>

      <section className="py-8">
        <div className="container">
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 bg-muted rounded-xl border border-border/40 shadow-sm">
              <Button
                variant={viewMode === "interactive" ? "default" : "ghost"}
                className={cn(
                  "rounded-lg gap-2",
                  viewMode === "interactive" ? "bg-[#1a3a2a] text-white hover:bg-[#10281d]" : "text-muted-foreground"
                )}
                onClick={() => setViewMode("interactive")}
              >
                <GraduationCap className="h-4 w-4" />
                Estudo Interativo
              </Button>
              <Button
                variant={viewMode === "library" ? "default" : "ghost"}
                className={cn(
                  "rounded-lg gap-2",
                  viewMode === "library" ? "bg-[#1a3a2a] text-white hover:bg-[#10281d]" : "text-muted-foreground"
                )}
                onClick={() => setViewMode("library")}
              >
                <Library className="h-4 w-4" />
                Biblioteca de Referência
              </Button>
            </div>
          </div>

          {viewMode === "interactive" ? (
            <StudyStudio module={module} />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-border/60">
                  <CardContent className="flex items-center gap-4 p-5">
                    <FileText className="h-10 w-10 text-[#1a3a2a]" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Documento oficial</p>
                      <p className="text-2xl font-bold">{libraryItem.pages}</p>
                      <p className="text-sm text-muted-foreground">Páginas catalogadas</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/60">
                  <CardContent className="flex items-center gap-4 p-5">
                    <BookOpenCheck className="h-10 w-10 text-[#1a3a2a]" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Consulta rápida</p>
                      <p className="text-2xl font-bold">{libraryItem.quickFacts.length}</p>
                      <p className="text-sm text-muted-foreground">Pontos de referência</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/60">
                  <CardContent className="flex items-center gap-4 p-5">
                    <UploadCloud className="h-10 w-10 text-[#1a3a2a]" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Estrutura dinâmica</p>
                      <p className="text-2xl font-bold">Pronta</p>
                      <p className="text-sm text-muted-foreground">Para mais materiais</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-[#c4a84b]/40 bg-[#c4a84b]/5">
                <CardContent className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
                  <div className="rounded-2xl border bg-white px-4 py-3 text-sm text-muted-foreground">
                    Esta área agora serve como acervo. Em vez de aula, o foco é abrir o material oficial, consultar o texto
                    limpo e usar a página como biblioteca de referência.
                  </div>
                  {libraryItem.pdfUrl && (
                    <a href={libraryItem.pdfUrl} target="_blank" rel="noreferrer">
                      <Button className="w-full bg-[#1a3a2a] text-white hover:bg-[#10281d] lg:w-auto">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Abrir PDF
                      </Button>
                    </a>
                  )}
                  <a href={module.textPath} target="_blank" rel="noreferrer">
                    <Button variant="outline" className="w-full lg:w-auto">
                      <FolderOpen className="mr-2 h-4 w-4" />
                      Texto extraído
                    </Button>
                  </a>
                </CardContent>
              </Card>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <Card className="overflow-hidden border-border/60">
                  <CardHeader>
                    <CardTitle style={{ fontFamily: "Merriweather, serif" }}>PDF para abrir e visualizar</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Visualização integral do documento oficial.
                    </p>
                  </CardHeader>
                  <CardContent>
                    {libraryItem.pdfUrl ? (
                      <iframe
                        title={`PDF ${libraryItem.title}`}
                        src={`${libraryItem.pdfUrl}#toolbar=1&navpanes=0&view=FitH`}
                        className="h-[74vh] min-h-[460px] w-full rounded-2xl border bg-white"
                      />
                    ) : (
                      <div className="rounded-2xl border bg-muted/20 p-5 text-sm text-muted-foreground">
                        PDF ainda não vinculado neste material.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                  <Card>
                    <CardHeader>
                      <CardTitle style={{ fontFamily: "Merriweather, serif" }}>Leitura guiada</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-sm text-muted-foreground">
                        {highlightNotes.map((note) => (
                          <li key={note} className="flex gap-2">
                            <span className="mt-1 h-2 w-2 rounded-full bg-[#c4a84b]" />
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2 text-[#1a3a2a]">
                        <ShieldCheck className="h-5 w-5" />
                        <CardTitle style={{ fontFamily: "Merriweather, serif" }}>Base atual</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p><strong className="text-foreground">Origem:</strong> {libraryItem.sourceTitle}</p>
                      <p><strong className="text-foreground">Arquivo:</strong> {libraryItem.sourceFileName}</p>
                      <p><strong className="text-foreground">Tema:</strong> {libraryItem.theme}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle style={{ fontFamily: "Merriweather, serif" }}>Texto limpo para consulta</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Versão otimizada para leitura rápida.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Buscar termo, artigo, palavra-chave ou assunto"
                      className="pl-9"
                    />
                  </div>

                  {query.trim() && snippets.length > 0 && (
                    <div className="space-y-3">
                      {snippets.map((snippet, index) => (
                        <div key={`${snippet}-${index}`} className="rounded-xl border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                          {snippet}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="max-h-[720px] min-h-[320px] overflow-auto rounded-2xl border bg-slate-50 p-4">
                    {isLoadingText ? (
                      <p className="text-sm text-muted-foreground">Carregando texto do documento...</p>
                    ) : fullText ? (
                      <div className="space-y-4 text-sm leading-7 text-slate-700">
                        {fullText.split(/\n\n/).map((paragraph, index) => (
                          <p key={`consult-${index}`}>{paragraph}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Não foi possível carregar o texto extraído deste material.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      <Footer />
      </div>
    </StudyAuthGuard>
  );
}
