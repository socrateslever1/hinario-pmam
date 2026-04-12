import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { useDeferredValue } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import NotFound from "@/pages/NotFound";
import { getStudyModule } from "@/content/studyModules";
import type { StoredAnswer } from "@/lib/studyProgress";
import {
  calculateQuizScore,
  createEmptyModuleProgress,
  getAnsweredCount,
  getStudyCompletion,
  isQuestionCorrect,
} from "@/lib/studyProgress";
import { getStudyProfile } from "@/lib/studyProfile";
import { buildQuestionBank, extractStudyUnits } from "@/lib/studyEngine";
import { buildStudySnippets, cleanExtractedStudyText } from "@/lib/studyText";
import { trpc } from "@/lib/trpc";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Search,
  ShieldCheck,
  Target,
  Trophy,
  Undo2,
} from "lucide-react";

type EducationModuleProps = {
  params: {
    slug: string;
  };
};

const PDF_PATHS: Record<string, string> = {
  "manual-cfap": "https://d2xsxph8kpxj0f.cloudfront.net/310419663028422427/oYQqDtLooPR5vbQ65ChDb9/manual-do-aluno_placeholder.pdf",
  "estatuto-pmam": "https://d2xsxph8kpxj0f.cloudfront.net/310419663028422427/oYQqDtLooPR5vbQ65ChDb9/estatuto-policiais-militares_f512966e.pdf",
  "rupmam-uniformes": "https://d2xsxph8kpxj0f.cloudfront.net/310419663028422427/oYQqDtLooPR5vbQ65ChDb9/rupmam_257e3301.pdf",
  "rcont-continencias": "https://d2xsxph8kpxj0f.cloudfront.net/310419663028422427/oYQqDtLooPR5vbQ65ChDb9/rcont_24d45246.pdf",
  "rdpmam-disciplina": "https://d2xsxph8kpxj0f.cloudfront.net/310419663028422427/oYQqDtLooPR5vbQ65ChDb9/rdpmam_a7f10966.pdf",
  "risg-servicos-gerais": "https://d2xsxph8kpxj0f.cloudfront.net/310419663028422427/oYQqDtLooPR5vbQ65ChDb9/risg_03c43c18.pdf",
};

const STUDY_ITEMS_PER_PAGE = 10;
const QUIZ_ITEMS_PER_PAGE = 12;

function difficultyLabel(level: string) {
  if (level === "base") return "Base";
  if (level === "intermediario") return "Intermediário";
  return "Intensivo";
}

function scoreLabel(score: number | null) {
  if (score === null) return "Sem nota";
  if (score >= 80) return "Aprovação forte";
  if (score >= 70) return "Aprovado";
  if (score >= 50) return "Em recuperação";
  return "Precisa revisar";
}

function toLocalProgress(progress: {
  completedSectionIds?: string[];
  answers?: Record<string, StoredAnswer>;
  lastScore?: number | null;
  bestScore?: number | null;
  lastSubmittedAt?: string | null;
} | null | undefined) {
  return {
    completedSectionIds: progress?.completedSectionIds ?? [],
    answers: progress?.answers ?? {},
    lastScore: progress?.lastScore ?? null,
    bestScore: progress?.bestScore ?? null,
    lastSubmittedAt: progress?.lastSubmittedAt ?? null,
  };
}

export default function EducationModule({ params }: EducationModuleProps) {
  const module = getStudyModule(params.slug);
  const emptyProgress = useMemo(() => createEmptyModuleProgress(), []);
  const [activeTab, setActiveTab] = useState("estudo");
  const [studentNumber, setStudentNumber] = useState("");
  const [studyAccessToken, setStudyAccessToken] = useState("");
  const [rawText, setRawText] = useState("");
  const [fullText, setFullText] = useState("");
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [studyQuery, setStudyQuery] = useState("");
  const [consultQuery, setConsultQuery] = useState("");
  const [studyPage, setStudyPage] = useState(1);
  const [quizPage, setQuizPage] = useState(1);
  const [progress, setProgress] = useState(emptyProgress);
  const lastSavedProgressRef = useRef(JSON.stringify(emptyProgress));

  const progressQuery = trpc.study.getModuleProgress.useQuery(
    {
      studentNumber,
      accessToken: studyAccessToken,
      moduleSlug: module?.slug ?? "",
    },
    {
      enabled: Boolean(studentNumber && studyAccessToken && module),
      refetchOnWindowFocus: false,
    }
  );

  const saveProgressMutation = trpc.study.saveModuleProgress.useMutation({
    onError: () => {
      toast.error("Não foi possível sincronizar o progresso deste módulo.");
    },
  });

  useEffect(() => {
    const profile = getStudyProfile();
    setStudentNumber(profile?.studentNumber ?? "");
    setStudyAccessToken(profile?.accessToken ?? "");
  }, []);

  const progressErrorMessage = progressQuery.error instanceof Error ? progressQuery.error.message : "";

  useEffect(() => {
    if (!module || !studentNumber || !studyAccessToken) {
      setProgress(emptyProgress);
      lastSavedProgressRef.current = JSON.stringify(emptyProgress);
      return;
    }

    if (!progressQuery.data) return;

    const nextProgress = toLocalProgress(progressQuery.data);
    setProgress(nextProgress);
    lastSavedProgressRef.current = JSON.stringify(nextProgress);
  }, [emptyProgress, module?.slug, progressQuery.data, studyAccessToken, studentNumber]);

  useEffect(() => {
    setStudyPage(1);
  }, [studyQuery]);

  useEffect(() => {
    setQuizPage(1);
  }, [module?.slug]);

  useEffect(() => {
    if (!module) return;

    let cancelled = false;
    setIsLoadingText(true);

    fetch(module.textPath)
      .then((response) => response.text())
      .then((text) => {
        if (!cancelled) {
          setRawText(text);
          setFullText(cleanExtractedStudyText(text, module));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRawText("");
          setFullText("");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingText(false);
      });

    return () => {
      cancelled = true;
    };
  }, [module?.textPath]);

  const deferredStudyQuery = useDeferredValue(studyQuery);
  const deferredConsultQuery = useDeferredValue(consultQuery);
  const studyUnits = useMemo(() => (module && rawText ? extractStudyUnits(module, rawText) : []), [module, rawText]);
  const shouldBuildQuestionBank = activeTab === "avaliacao" || Object.keys(progress.answers).length > 0;
  const questionBank = useMemo(
    () => (module && shouldBuildQuestionBank ? buildQuestionBank(module, studyUnits) : module?.questions ?? []),
    [activeTab, module, progress.answers, shouldBuildQuestionBank, studyUnits]
  );
  const compiledModule = useMemo(() => (module ? { ...module, questions: questionBank } : null), [module, questionBank]);
  const filteredStudyUnits = studyUnits.filter((unit) => {
    const normalizedQuery = deferredStudyQuery.trim().toLowerCase();
    if (!normalizedQuery) return true;
    return [unit.reference, unit.title, unit.summary, unit.simpleExplanation, unit.originalText, unit.keywords.join(" ")]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });
  const studyPageCount = Math.max(1, Math.ceil(filteredStudyUnits.length / STUDY_ITEMS_PER_PAGE));
  const safeStudyPage = Math.min(studyPage, studyPageCount);
  const pagedStudyUnits = filteredStudyUnits.slice((safeStudyPage - 1) * STUDY_ITEMS_PER_PAGE, safeStudyPage * STUDY_ITEMS_PER_PAGE);
  const quizPageCount = Math.max(1, Math.ceil(questionBank.length / QUIZ_ITEMS_PER_PAGE));
  const safeQuizPage = Math.min(quizPage, quizPageCount);
  const pagedQuestions = questionBank.slice((safeQuizPage - 1) * QUIZ_ITEMS_PER_PAGE, safeQuizPage * QUIZ_ITEMS_PER_PAGE);
  const snippets = useMemo(
    () => (activeTab === "consulta" ? buildStudySnippets(fullText, deferredConsultQuery) : []),
    [activeTab, deferredConsultQuery, fullText]
  );

  useEffect(() => {
    if (!studentNumber || !studyAccessToken || !module || !progressQuery.isFetched) return;

    const snapshot = JSON.stringify(progress);
    if (snapshot === lastSavedProgressRef.current) return;

    const timeout = window.setTimeout(() => {
      lastSavedProgressRef.current = snapshot;
      saveProgressMutation.mutate({
        studentNumber,
        accessToken: studyAccessToken,
        moduleSlug: module.slug,
        progress,
      });
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [module, progress, progressQuery.isFetched, saveProgressMutation, studyAccessToken, studentNumber]);

  if (!module) {
    return <NotFound />;
  }

  if (!studentNumber || !studyAccessToken || progressQuery.error || !progress || !compiledModule) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <section className="py-16">
          <div className="container max-w-2xl">
            <Card className="border-[#c4a84b]/40 bg-[#c4a84b]/5">
              <CardHeader>
                <CardTitle style={{ fontFamily: "Merriweather, serif" }}>Identificação obrigatória</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                {progressQuery.error ? (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
                    {progressErrorMessage || "Nao foi possivel carregar seu perfil de estudo neste dispositivo. Reconfirme seu numero no Centro de Estudos."}
                  </div>
                ) : (
                  <p>
                    Para abrir o módulo e salvar o progresso pessoal, primeiro informe o numero do aluno em
                    <Link href="/estudos" className="ml-1 font-medium text-[#1a3a2a] underline-offset-4 hover:underline">Centro de Estudos</Link>.
                  </p>
                )}
                <Link href="/estudos">
                  <Button className="bg-[#1a3a2a] text-white hover:bg-[#10281d]">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para informar meu numero
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const pdfPath = PDF_PATHS[module.slug];
  const completion = getStudyCompletion(module, progress, studyUnits.length || module.studyUnitTarget);
  const totalQuestionCount = shouldBuildQuestionBank
    ? questionBank.length
    : (module.questionTarget ?? module.questions.length);
  const answeredCount = shouldBuildQuestionBank
    ? getAnsweredCount(compiledModule, progress.answers)
    : Object.values(progress.answers).filter((answer) => {
        if (Array.isArray(answer)) return answer.length > 0;
        return Boolean(answer && String(answer).trim().length > 0);
      }).length;
  const currentScore = progress.lastScore;
  const bestScore = progress.bestScore;
  const studyLabel = module.studyMode === "regulation" ? "artigos" : "topicos";

  const persistProgress = (nextProgress: typeof progress) => {
    setProgress(nextProgress);
  };

  const toggleSection = (sectionId: string) => {
    const exists = progress.completedSectionIds.includes(sectionId);
    const completedSectionIds = exists
      ? progress.completedSectionIds.filter((id) => id !== sectionId)
      : [...progress.completedSectionIds, sectionId];

    persistProgress({ ...progress, completedSectionIds });
  };

  const updateSingleAnswer = (questionId: string, value: string) => {
    persistProgress({
      ...progress,
      answers: {
        ...progress.answers,
        [questionId]: value,
      },
    });
  };

  const updateMultiAnswer = (questionId: string, optionId: string) => {
    const current = Array.isArray(progress.answers[questionId]) ? [...(progress.answers[questionId] as string[])] : [];
    const exists = current.includes(optionId);
    const next = exists ? current.filter((id) => id !== optionId) : [...current, optionId];

    persistProgress({
      ...progress,
      answers: {
        ...progress.answers,
        [questionId]: next,
      },
    });
  };

  const updateTextAnswer = (questionId: string, value: string) => {
    persistProgress({
      ...progress,
      answers: {
        ...progress.answers,
        [questionId]: value,
      },
    });
  };

  const resetAnswers = () => {
    persistProgress({
      ...progress,
      answers: {},
      lastScore: null,
      lastSubmittedAt: null,
    });
    toast.success("Respostas limpas. O progresso de leitura foi mantido.");
  };

  const submitQuiz = () => {
    const result = calculateQuizScore(compiledModule, progress.answers);
    const nextProgress = {
      ...progress,
      lastScore: result.percentage,
      bestScore: progress.bestScore === null ? result.percentage : Math.max(progress.bestScore, result.percentage),
      lastSubmittedAt: new Date().toISOString(),
    };

    persistProgress(nextProgress);
    toast.success(`Avaliacao concluída: ${result.percentage}% (${result.correct}/${result.total}).`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <section className="military-gradient py-10 md:py-14">
        <div className="container space-y-6">
          <Link href="/estudos">
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao centro de estudos
            </Button>
          </Link>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-[#c4a84b] text-[#1a1a1a]">{module.shortTitle}</Badge>
                <Badge variant="outline" className="border-white/20 text-white/80">{module.pages} páginas</Badge>
                <Badge variant="outline" className="border-white/20 text-white/80">{difficultyLabel(module.difficulty)}</Badge>
              </div>
              <h1 className="mt-4 text-3xl font-bold text-white md:text-4xl" style={{ fontFamily: "Merriweather, serif" }}>
                {module.title}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-relaxed text-white/70 md:text-lg">{module.description}</p>
              <p className="mt-3 text-sm text-white/50">Fonte: {module.sourceTitle} | arquivo original {module.sourceFileName}</p>
            </div>

            <Card className="border-white/10 bg-white/10 text-white backdrop-blur">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span>Aluno ativo</span>
                  <span>{studentNumber}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Progresso geral</span>
                  <span>{completion.overallPercent}%</span>
                </div>
                <Progress value={completion.overallPercent} className="bg-white/10 [&>*]:bg-[#c4a84b]" />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-white/10 px-3 py-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/50">Leitura</p>
                    <p className="mt-1 font-semibold">{completion.studied}/{completion.sectionCount}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 px-3 py-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/50">Última nota</p>
                    <p className="mt-1 font-semibold">{currentScore ?? 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="checkerboard-pattern mt-8 w-full" />
      </section>

      <section className="py-10">
        <div className="container space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <BookOpenCheck className="h-10 w-10 text-[#1a3a2a]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Leitura concluída</p>
                  <p className="text-2xl font-bold">{completion.studyPercent}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <Target className="h-10 w-10 text-[#1a3a2a]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Perguntas respondidas</p>
                  <p className="text-2xl font-bold">{answeredCount}/{totalQuestionCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <Trophy className="h-10 w-10 text-[#1a3a2a]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Melhor nota</p>
                  <p className="text-2xl font-bold">{bestScore ?? 0}%</p>
                  <p className="text-sm text-muted-foreground">{scoreLabel(bestScore)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-muted/40 p-2">
              <TabsTrigger value="estudo" className="min-w-[160px]">Estudo completo</TabsTrigger>
              <TabsTrigger value="consulta" className="min-w-[150px]">Consulta completa</TabsTrigger>
              <TabsTrigger value="avaliacao" className="min-w-[150px]">Avaliação</TabsTrigger>
            </TabsList>

            <TabsContent value="estudo">
              <div className="space-y-5">
                <Card className="border-[#c4a84b]/40 bg-[#c4a84b]/5">
                  <CardContent className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_repeat(3,auto)] lg:items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input value={studyQuery} onChange={(event) => setStudyQuery(event.target.value)} placeholder={`Buscar ${studyLabel}, assunto ou palavra-chave`} className="pl-9" />
                    </div>
                    <div className="rounded-xl border bg-white px-4 py-2 text-sm text-muted-foreground"><strong className="text-foreground">{filteredStudyUnits.length}</strong> {studyLabel}</div>
                    <div className="rounded-xl border bg-white px-4 py-2 text-sm text-muted-foreground"><strong className="text-foreground">{totalQuestionCount}</strong> questões</div>
                    <div className="rounded-xl border bg-white px-4 py-2 text-sm text-muted-foreground">Página <strong className="text-foreground">{safeStudyPage}</strong> de <strong className="text-foreground">{studyPageCount}</strong></div>
                  </CardContent>
                </Card>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-4">
                    <Accordion type="multiple" className="space-y-4">
                      {pagedStudyUnits.map((unit) => {
                        const done = progress.completedSectionIds.includes(unit.id);
                        return (
                          <AccordionItem key={unit.id} value={unit.id} className={`overflow-hidden rounded-2xl border ${done ? "border-[#c4a84b]/60 bg-[#c4a84b]/5" : "border-border/60 bg-white"}`}>
                            <AccordionTrigger className="px-5 py-4 hover:no-underline">
                              <div className="space-y-2 pr-4 text-left">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge className={done ? "bg-[#1a3a2a] text-white" : "bg-muted text-foreground"}>{unit.reference}</Badge>
                                  <Badge variant="outline">{done ? "Estudado" : "Pendente"}</Badge>
                                </div>
                                <p className="text-lg font-semibold leading-snug text-foreground" style={{ fontFamily: "Merriweather, serif" }}>{unit.title}</p>
                                <p className="text-sm leading-relaxed text-muted-foreground">{unit.summary}</p>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-5 pb-5">
                              <div className="space-y-4">
                                <div className="rounded-2xl border border-[#1a3a2a]/15 bg-[#1a3a2a]/5 p-4">
                                  <p className="text-xs uppercase tracking-[0.2em] text-[#1a3a2a]">Explicacao simples</p>
                                  <p className="mt-2 text-sm leading-7 text-foreground">{unit.simpleExplanation}</p>
                                </div>
                                <div className="rounded-2xl border bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                                  {unit.originalText.split(/\n\n/).map((paragraph, index) => (
                                    <p key={`${unit.id}-paragraph-${index}`} className={index > 0 ? "mt-3" : undefined}>{paragraph}</p>
                                  ))}
                                </div>
                                <div className="flex flex-wrap gap-2">{unit.keywords.map((keyword) => <Badge key={`${unit.id}-${keyword}`} variant="outline">{keyword}</Badge>)}</div>
                                <Button variant={done ? "outline" : "default"} className={done ? "border-[#1a3a2a] text-[#1a3a2a]" : "bg-[#1a3a2a] text-white hover:bg-[#10281d]"} onClick={() => toggleSection(unit.id)}>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  {done ? "Marcado como estudado" : "Marcar como estudado"}
                                </Button>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>

                    {studyPageCount > 1 && (
                      <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">Navegação do estudo completo</p>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" disabled={safeStudyPage <= 1} onClick={() => setStudyPage((current) => Math.max(1, current - 1))}><ChevronLeft className="mr-2 h-4 w-4" />Anterior</Button>
                          <Button variant="outline" disabled={safeStudyPage >= studyPageCount} onClick={() => setStudyPage((current) => Math.min(studyPageCount, current + 1))}>Próxima<ChevronRight className="ml-2 h-4 w-4" /></Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                    <Card>
                      <CardHeader><CardTitle style={{ fontFamily: "Merriweather, serif" }}>Como estudar aqui</CardTitle></CardHeader>
                      <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p>Este módulo foi aberto a partir do próprio PDF que você enviou.</p>
                        <p>Nos regulamentos, a leitura fica artigo por artigo. No manual, a navegacao fica por topicos principais.</p>
                        <p>Cada bloco traz a base do documento, uma explicação simples e palavras-chave para memorização.</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle style={{ fontFamily: "Merriweather, serif" }}>Objetivos do módulo</CardTitle></CardHeader>
                      <CardContent><ul className="space-y-2 text-sm text-muted-foreground">{module.objectives.map((objective) => <li key={objective} className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-[#1a3a2a]" /><span>{objective}</span></li>)}</ul></CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle style={{ fontFamily: "Merriweather, serif" }}>Pontos de memória</CardTitle></CardHeader>
                      <CardContent><ul className="space-y-2 text-sm text-muted-foreground">{module.quickFacts.map((fact) => <li key={fact} className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-[#c4a84b]" /><span>{fact}</span></li>)}</ul></CardContent>
                    </Card>
                  </div>
                </div>

                {quizPageCount > 1 && (
                  <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">Navegação do banco de questões</p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" disabled={safeQuizPage <= 1} onClick={() => setQuizPage((current) => Math.max(1, current - 1))}><ChevronLeft className="mr-2 h-4 w-4" />Anterior</Button>
                      <Button variant="outline" disabled={safeQuizPage >= quizPageCount} onClick={() => setQuizPage((current) => Math.min(quizPageCount, current + 1))}>Próxima<ChevronRight className="ml-2 h-4 w-4" /></Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="consulta">
              <div className="space-y-4">
                <Card>
                  <CardContent className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={consultQuery}
                        onChange={(event) => setConsultQuery(event.target.value)}
                        placeholder="Buscar no texto limpo extraído"
                        className="pl-9"
                      />
                    </div>
                    <a href={module.textPath} target="_blank" rel="noreferrer">
                      <Button variant="outline" className="w-full lg:w-auto">
                        <FileText className="mr-2 h-4 w-4" />
                        Texto bruto
                      </Button>
                    </a>
                    {pdfPath && (
                      <a href={pdfPath} target="_blank" rel="noreferrer">
                        <Button className="w-full bg-[#1a3a2a] text-white hover:bg-[#10281d] lg:w-auto">
                          Abrir PDF original
                        </Button>
                      </a>
                    )}
                  </CardContent>
                </Card>

                {consultQuery.trim() && snippets.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle style={{ fontFamily: "Merriweather, serif" }}>Ocorrências encontradas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {snippets.map((snippet, index) => (
                        <div key={`${snippet}-${index}`} className="rounded-xl border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                          {snippet}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                  <Card className="overflow-hidden border-border/60">
                    <CardHeader>
                      <div className="flex items-center gap-2 text-[#1a3a2a]">
                        <ShieldCheck className="h-5 w-5" />
                        <CardTitle style={{ fontFamily: "Merriweather, serif" }}>PDF original com imagens</CardTitle>
                      </div>
                      <p className="text-sm text-muted-foreground">Visualizacao fiel do documento, preservando ilustrações, tabelas e diagramação.</p>
                    </CardHeader>
                    <CardContent>
                      {pdfPath ? (
                        <iframe
                          title={`PDF ${module.title}`}
                          src={`${pdfPath}#toolbar=1&navpanes=0&view=FitH`}
                          className="h-[72vh] min-h-[420px] w-full rounded-2xl border bg-white"
                        />
                      ) : (
                        <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">PDF original indisponível neste módulo.</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-border/60">
                    <CardHeader>
                      <CardTitle style={{ fontFamily: "Merriweather, serif" }}>Texto limpo para estudo</CardTitle>
                      <p className="text-sm text-muted-foreground">Versão otimizada para leitura, com os parágrafos reorganizados para consulta rápida.</p>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-[72vh] min-h-[420px] overflow-auto rounded-2xl border bg-slate-50 p-4">
                        {isLoadingText ? (
                          <p className="text-sm text-muted-foreground">Carregando texto do módulo...</p>
                        ) : fullText ? (
                          <div className="space-y-4 text-sm leading-7 text-slate-700">
                            {fullText.split(/\n\n/).map((paragraph, index) => (
                              <p key={`consult-${index}`}>{paragraph}</p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Não foi possível carregar o texto extraído deste material.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="avaliacao">
              <div className="space-y-5">
                <Card className="border-[#c4a84b]/40 bg-[#c4a84b]/5">
                  <CardContent className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Você respondeu {answeredCount} de {totalQuestionCount} perguntas.</p>
                      <Progress value={Math.round((answeredCount / Math.max(totalQuestionCount, 1)) * 100)} className="mt-3 [&>*]:bg-[#1a3a2a]" />
                      <p className="mt-3 text-sm text-muted-foreground">Última nota: <strong className="text-foreground">{currentScore ?? 0}%</strong> | Melhor nota: <strong className="text-foreground">{bestScore ?? 0}%</strong></p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row md:flex-col xl:flex-row">
                      <Button variant="outline" onClick={resetAnswers}>
                        <Undo2 className="mr-2 h-4 w-4" />
                        Limpar respostas
                      </Button>
                      <Button className="bg-[#1a3a2a] text-white hover:bg-[#10281d]" onClick={submitQuiz}>
                        Finalizar avaliacao
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {currentScore !== null && (
                  <Card>
                    <CardContent className="grid gap-4 p-5 md:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Nota</p>
                        <p className="mt-1 text-3xl font-bold">{(currentScore / 10).toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Percentual</p>
                        <p className="mt-1 text-3xl font-bold">{currentScore}%</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Status</p>
                        <p className="mt-1 text-xl font-semibold">{scoreLabel(currentScore)}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  {pagedQuestions.map((question, index) => {
                    const answer = progress.answers[question.id] ?? null;
                    const checked = currentScore !== null ? isQuestionCorrect(question, answer as StoredAnswer) : null;

                    return (
                      <Card key={question.id} className="border-border/60">
                        <CardHeader className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <CardTitle className="text-lg" style={{ fontFamily: "Merriweather, serif" }}>
                              {String((safeQuizPage - 1) * QUIZ_ITEMS_PER_PAGE + index + 1).padStart(2, "0")}. {question.prompt}
                            </CardTitle>
                            <Badge variant="outline">{question.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">Referência: {question.reference}</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {(question.type === "single" || question.type === "boolean") && question.options?.map((option) => (
                            <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors hover:border-[#c4a84b]/50">
                              <input
                                type="radio"
                                name={question.id}
                                checked={answer === option.id}
                                onChange={() => updateSingleAnswer(question.id, option.id)}
                                className="mt-1"
                              />
                              <span className="text-sm text-foreground">{option.label}</span>
                            </label>
                          ))}

                          {question.type === "multiple" && question.options?.map((option) => {
                            const selected = Array.isArray(answer) ? answer.includes(option.id) : false;
                            return (
                              <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors hover:border-[#c4a84b]/50">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => updateMultiAnswer(question.id, option.id)}
                                  className="mt-1"
                                />
                                <span className="text-sm text-foreground">{option.label}</span>
                              </label>
                            );
                          })}

                          {question.type === "text" && (
                            <Input
                              value={typeof answer === "string" ? answer : ""}
                              onChange={(event) => updateTextAnswer(question.id, event.target.value)}
                              placeholder="Digite sua resposta"
                            />
                          )}

                          {currentScore !== null && (
                            <div className={`rounded-2xl border px-4 py-3 text-sm ${checked ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
                              <p className="font-semibold">{checked ? "Resposta correta" : "Resposta incorreta"}</p>
                              <p className="mt-1">{question.explanation}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
}


