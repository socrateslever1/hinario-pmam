import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { studyModules } from "@/content/studyModules";
import { getStudyCompletion } from "@/lib/studyProgress";
import { getStudyProfile, normalizeStudentNumber, saveStudyProfile } from "@/lib/studyProfile";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { BookOpenCheck, ChevronRight, FileSearch, GraduationCap, IdCard, Search, ShieldCheck, Trophy } from "lucide-react";

function difficultyLabel(level: string) {
  if (level === "base") return "Base";
  if (level === "intermediario") return "Intermediario";
  return "Intensivo";
}

export default function EducationCenter() {
  const [query, setQuery] = useState("");
  const [studentNumberInput, setStudentNumberInput] = useState("");
  const [studentNumber, setStudentNumber] = useState("");

  useEffect(() => {
    const profile = getStudyProfile();
    if (profile?.studentNumber) {
      setStudentNumber(profile.studentNumber);
      setStudentNumberInput(profile.studentNumber);
    }
  }, []);

  const ensureStudent = trpc.study.ensureStudent.useMutation();
  const dashboardQuery = trpc.study.dashboard.useQuery(
    { studentNumber },
    {
      enabled: Boolean(studentNumber),
      refetchOnWindowFocus: true,
    }
  );

  const moduleProgressMap = useMemo(
    () => new Map((dashboardQuery.data?.modules ?? []).map((progress) => [progress.moduleSlug, progress])),
    [dashboardQuery.data?.modules]
  );

  const normalizedQuery = query.trim().toLowerCase();
  const filteredModules = studyModules.filter((module) => {
    if (!normalizedQuery) return true;
    return [module.title, module.description, module.theme, module.sourceTitle]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });

  const metrics = useMemo(() => {
    if (!studentNumber) {
      return { sections: 0, sectionTotal: 0, quizCount: 0, scoreSum: 0 };
    }

    return studyModules.reduce(
      (acc, module) => {
        const progress = moduleProgressMap.get(module.slug) ?? {
          moduleSlug: module.slug,
          completedSectionIds: [],
          answers: {},
          lastScore: null,
          bestScore: null,
          lastSubmittedAt: null,
          updatedAt: null,
        };
        const completion = getStudyCompletion(module, progress);
        acc.sections += completion.studied;
        acc.sectionTotal += completion.sectionCount;
        acc.quizCount += progress.lastScore !== null ? 1 : 0;
        acc.scoreSum += progress.lastScore ?? 0;
        return acc;
      },
      { sections: 0, sectionTotal: 0, quizCount: 0, scoreSum: 0 }
    );
  }, [moduleProgressMap, studentNumber]);

  const globalPercent = metrics.sectionTotal > 0 ? Math.round((metrics.sections / metrics.sectionTotal) * 100) : 0;
  const averageScore = metrics.quizCount > 0 ? Math.round(metrics.scoreSum / metrics.quizCount) : 0;

  const handleSaveStudentNumber = async () => {
    const normalized = normalizeStudentNumber(studentNumberInput);
    if (normalized.length < 2) {
      toast.error("Informe seu numero antes de entrar nos modulos.");
      return;
    }

    try {
      const student = await ensureStudent.mutateAsync({ studentNumber: normalized });
      saveStudyProfile(student?.studentNumber ?? normalized);
      setStudentNumber(student?.studentNumber ?? normalized);
      setStudentNumberInput(student?.studentNumber ?? normalized);
      toast.success(`Progresso pessoal vinculado ao numero ${student?.studentNumber ?? normalized}.`);
    } catch {
      toast.error("Nao foi possivel vincular o numero do aluno ao banco.");
    }
  };

  return (
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
              Sessao educacional PMAM
            </div>
            <h1 className="text-4xl font-bold text-white md:text-5xl" style={{ fontFamily: "Merriweather, serif" }}>
              Centro de Estudos
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
              Material de consulta, estudo completo artigo por artigo, leitura em linguagem simples e avaliacoes amplas baseadas nos regulamentos e manuais que voce enviou.
              O progresso fica separado por numero do aluno para nao misturar respostas entre pessoas.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Card className="border-white/10 bg-white/10 text-white backdrop-blur">
              <CardContent className="flex items-center gap-4 p-5">
                <ShieldCheck className="h-10 w-10 text-[#c4a84b]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/60">Modulos</p>
                  <p className="text-2xl font-bold">{studyModules.length}</p>
                  <p className="text-sm text-white/60">Documentos estudaveis</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/10 text-white backdrop-blur">
              <CardContent className="flex items-center gap-4 p-5">
                <BookOpenCheck className="h-10 w-10 text-[#c4a84b]" />
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/60">Progresso de estudo</p>
                  <p className="text-2xl font-bold">{studentNumber ? `${globalPercent}%` : "--"}</p>
                  <Progress value={studentNumber ? globalPercent : 0} className="mt-2 bg-white/10 [&>*]:bg-[#c4a84b]" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/10 text-white backdrop-blur">
              <CardContent className="flex items-center gap-4 p-5">
                <Trophy className="h-10 w-10 text-[#c4a84b]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/60">Media das notas</p>
                  <p className="text-2xl font-bold">{studentNumber ? `${averageScore}%` : "--"}</p>
                  <p className="text-sm text-white/60">{studentNumber ? `Aluno ${studentNumber}` : "Informe o numero do aluno"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="checkerboard-pattern mt-10 w-full" />
      </section>

      <section className="py-10 md:py-12">
        <div className="container space-y-8">
          <Card className="border-[#c4a84b]/40 bg-[#c4a84b]/5">
            <CardContent className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#1a3a2a]">
                  <IdCard className="h-5 w-5" />
                  <p className="font-semibold">Identificacao do aluno</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Antes de entrar nos modulos, informe o seu numero para que o progresso e as respostas fiquem salvos no seu perfil pessoal.
                </p>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Input
                    value={studentNumberInput}
                    onChange={(event) => setStudentNumberInput(event.target.value)}
                    placeholder="Ex.: 23145 ou numero de guerra"
                  />
                  <Button className="bg-[#1a3a2a] text-white hover:bg-[#10281d]" onClick={handleSaveStudentNumber} disabled={ensureStudent.isPending}>
                    Salvar meu numero
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl border bg-white px-4 py-3 text-sm text-muted-foreground">
                <p className="text-xs uppercase tracking-[0.2em] text-[#1a3a2a]">Numero ativo</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{studentNumber || "Nao informado"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_280px] md:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por documento, tema ou assunto"
                  className="pl-9"
                />
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
                <div className="rounded-xl border bg-muted/20 px-3 py-2">Estudo completo</div>
                <div className="rounded-xl border bg-muted/20 px-3 py-2">PDF com imagens</div>
                <div className="rounded-xl border bg-muted/20 px-3 py-2">100+ questoes</div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-5 md:grid-cols-2">
              {filteredModules.map((module) => {
                const progress = studentNumber
                  ? moduleProgressMap.get(module.slug) ?? {
                      moduleSlug: module.slug,
                      completedSectionIds: [],
                      answers: {},
                      lastScore: null,
                      bestScore: null,
                      lastSubmittedAt: null,
                      updatedAt: null,
                    }
                  : {
                      moduleSlug: module.slug,
                      completedSectionIds: [],
                      answers: {},
                      lastScore: null,
                      bestScore: null,
                      lastSubmittedAt: null,
                      updatedAt: null,
                    };
                const completion = getStudyCompletion(module, progress);
                const disabled = !studentNumber;

                return (
                  <Card key={`${module.slug}-${studentNumber || "sem-numero"}`} className="h-full border-border/60 transition-colors hover:border-[#c4a84b]/50">
                    <CardHeader className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-[#1a3a2a] text-white">{module.shortTitle}</Badge>
                        <Badge variant="outline">{module.pages} paginas</Badge>
                        <Badge variant="outline">{difficultyLabel(module.difficulty)}</Badge>
                      </div>
                      <div>
                        <CardTitle className="text-xl text-foreground" style={{ fontFamily: "Merriweather, serif" }}>
                          {module.title}
                        </CardTitle>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{module.description}</p>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">Progresso geral</span>
                          <span className="text-muted-foreground">{studentNumber ? `${completion.overallPercent}%` : "Bloqueado"}</span>
                        </div>
                        <Progress value={studentNumber ? completion.overallPercent : 0} className="[&>*]:bg-[#1a3a2a]" />
                      </div>

                      <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                        <div className="rounded-xl border bg-muted/20 px-3 py-2">
                          <p className="text-xs uppercase tracking-[0.18em]">Leitura</p>
                          <p className="mt-1 font-semibold text-foreground">{studentNumber ? `${completion.studied}/${completion.sectionCount}` : "--"}</p>
                        </div>
                        <div className="rounded-xl border bg-muted/20 px-3 py-2">
                          <p className="text-xs uppercase tracking-[0.18em]">Quiz</p>
                          <p className="mt-1 font-semibold text-foreground">{studentNumber ? `${progress.lastScore ?? 0}%` : "--"}</p>
                        </div>
                        <div className="rounded-xl border bg-muted/20 px-3 py-2">
                          <p className="text-xs uppercase tracking-[0.18em]">Tempo</p>
                          <p className="mt-1 font-semibold text-foreground">{module.estimatedMinutes} min</p>
                        </div>
                      </div>

                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {module.quickFacts.slice(0, 2).map((fact) => (
                          <li key={fact} className="flex gap-2">
                            <span className="mt-1 h-2 w-2 rounded-full bg-[#c4a84b]" />
                            <span>{fact}</span>
                          </li>
                        ))}
                      </ul>

                      {disabled ? (
                        <Button className="w-full" variant="outline" onClick={() => toast.error("Informe seu numero antes de entrar nos modulos.")}>
                          Informe seu numero para entrar
                        </Button>
                      ) : (
                        <Link href={`/estudos/${module.slug}`}>
                          <Button className="w-full bg-[#1a3a2a] text-white hover:bg-[#10281d]">
                            Abrir modulo
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="h-fit border-[#c4a84b]/40 bg-[#c4a84b]/5">
              <CardHeader>
                <div className="flex items-center gap-2 text-[#1a3a2a]">
                  <FileSearch className="h-5 w-5" />
                  <CardTitle style={{ fontFamily: "Merriweather, serif" }}>Como estudar aqui</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Cada modulo foi montado a partir do texto extraido do PDF original. Agora a consulta completa combina um texto limpo para leitura rapida com o PDF original embutido para manter imagens e diagramação.
                </p>
                <ul className="space-y-2">
                  <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-[#c4a84b]" />Banco reforcado: pelo menos 100 questoes por modulo, misturando unica escolha, multipla escolha, verdadeiro/falso e resposta curta.</li>
                  <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-[#c4a84b]" />O progresso fica salvo por numero do aluno, evitando mistura de respostas entre usuarios.</li>
                  <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-[#c4a84b]" />Os regulamentos abrem em fluxo artigo por artigo, com explicacao simples para acelerar a fixacao.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
