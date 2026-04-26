import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  CheckCircle2, 
  ChevronRight, 
  FileQuestion, 
  GraduationCap, 
  Info, 
  Layout, 
  ListChecks, 
  ShieldCheck, 
  Trophy,
  ArrowRight,
  RotateCcw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StudyModule, StudySection, StudyQuestion } from "@/content/types";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useStudyAuth } from "./StudyAuthGuard";

type StudyStudioProps = {
  module: StudyModule;
};

type StudyMode = "overview" | "study" | "exam" | "results";

export default function StudyStudio({ module }: StudyStudioProps) {
  const { session } = useStudyAuth();
  const [mode, setMode] = useState<StudyMode>("overview");
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [examAnswers, setExamAnswers] = useState<Record<string, string[]>>({});
  const [showExamResults, setShowExamResults] = useState(false);
  const [completedSectionIds, setCompletedSectionIds] = useState<string[]>([]);
  const [bestScore, setBestScore] = useState<number | null>(null);

  // Carregar progresso inicial
  trpc.study.getDashboard.useQuery(
    { studentNumber: session?.student.studentNumber || "", accessToken: session?.accessToken },
    {
      enabled: !!session,
      staleTime: Infinity,
      onSuccess: (data) => {
        const prog = data.modules.find(m => m.moduleSlug === module.slug);
        if (prog) {
          setCompletedSectionIds(prog.completedSectionIds);
          setBestScore(prog.bestScore);
        }
      }
    }
  );

  const saveProgressMutation = trpc.study.saveProgress.useMutation();

  const handleSaveProgress = (newCompletedSections: string[], score: number | null) => {
    if (!session) return;
    saveProgressMutation.mutate({
      studentNumber: session.student.studentNumber,
      accessToken: session.accessToken,
      moduleSlug: module.slug,
      progress: {
        completedSectionIds: newCompletedSections,
        lastScore: score,
        bestScore: score !== null ? Math.max(score, bestScore || 0) : bestScore,
        lastSubmittedAt: score !== null ? new Date().toISOString() : undefined,
      }
    });
    if (score !== null && score > (bestScore || 0)) {
      setBestScore(score);
    }
  };

  const activeSection = module.sections[activeSectionIndex];
  const progress = (completedSectionIds.length / module.sections.length) * 100;

  const startStudy = () => setMode("study");
  const startExam = () => {
    setExamAnswers({});
    setShowExamResults(false);
    setMode("exam");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Sidebar Navigation */}
      <aside className="space-y-4">
        <Card className="border-border/60 bg-card/50 backdrop-blur">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Navegação do Módulo
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-1 p-2">
            <NavButton 
              active={mode === "overview"} 
              onClick={() => setMode("overview")}
              icon={<Info className="h-4 w-4" />}
              label="Visão Geral"
            />
            <div className="my-2 border-t border-border/40" />
            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Estudo Guiado
            </p>
            {module.sections.map((section, idx) => (
              <NavButton
                key={section.id}
                active={mode === "study" && activeSectionIndex === idx}
                onClick={() => {
                  setMode("study");
                  setActiveSectionIndex(idx);
                }}
                icon={<BookOpen className="h-4 w-4" />}
                label={section.title}
                completed={idx < activeSectionIndex}
              />
            ))}
            <div className="my-2 border-t border-border/40" />
            <NavButton
              active={mode === "exam" || mode === "results"}
              onClick={startExam}
              icon={<GraduationCap className="h-4 w-4" />}
              label="Prova Final"
              variant="gold"
            />
          </CardContent>
        </Card>

        {mode === "study" && (
          <Card className="border-[#c4a84b]/20 bg-[#c4a84b]/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#1a3a2a]">
                <span>Progresso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="mt-2 h-1.5 bg-[#c4a84b]/20 [&>div]:bg-[#c4a84b]" />
            </CardContent>
          </Card>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="min-h-[600px]">
        <AnimatePresence mode="wait">
          {mode === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <Card className="overflow-hidden border-border/60">
                <div className="military-gradient h-32 w-full p-6 flex items-end">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                      <Layout className="h-8 w-8 text-[#c4a84b]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "Merriweather, serif" }}>
                        {module.title}
                      </h2>
                      <p className="text-white/60 text-sm">{module.theme}</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6 space-y-8">
                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <ListChecks className="h-5 w-5 text-[#c4a84b]" />
                        Objetivos de Aprendizagem
                      </h3>
                      <ul className="space-y-3">
                        {module.objectives.map((obj, i) => (
                          <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                            <span className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full bg-[#c4a84b]" />
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-[#c4a84b]" />
                        Fatos Rápidos
                      </h3>
                      <div className="grid gap-3">
                        {module.quickFacts.map((fact, i) => (
                          <div key={i} className="rounded-xl border border-border/40 bg-muted/30 p-3 text-sm italic text-muted-foreground">
                            "{fact}"
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
                    <Button 
                      size="lg" 
                      className="bg-[#1a3a2a] text-white hover:bg-[#10281d] px-8"
                      onClick={startStudy}
                    >
                      Começar Estudo Guiado
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {mode === "study" && (
            <motion.div
              key={`section-${activeSection.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="border-border/60">
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-[#c4a84b]/40 text-[#c4a84b]">
                      Seção {activeSectionIndex + 1} de {module.sections.length}
                    </Badge>
                    <span className="text-xs text-muted-foreground italic">
                      Ref: {activeSection.reference}
                    </span>
                  </div>
                  <CardTitle className="text-2xl mt-2" style={{ fontFamily: "Merriweather, serif" }}>
                    {activeSection.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-4">
                    <p className="text-lg leading-relaxed text-foreground/90 font-medium">
                      {activeSection.summary}
                    </p>
                    <div className="grid gap-4 md:grid-cols-2 mt-6">
                      {activeSection.bullets.map((bullet, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-2xl border border-border/40 bg-muted/20">
                          <CheckCircle2 className="h-5 w-5 text-[#c4a84b] shrink-0" />
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {bullet}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Card className="border-[#1a3a2a]/20 bg-[#1a3a2a]/5">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-[#1a3a2a] p-2 text-white">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-semibold text-[#1a3a2a]">Ponto de Verificação</h4>
                          <p className="text-sm text-muted-foreground/80">
                            {activeSection.checkpoint}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <Button
                      variant="ghost"
                      onClick={() => setActiveSectionIndex(Math.max(0, activeSectionIndex - 1))}
                      disabled={activeSectionIndex === 0}
                    >
                      Anterior
                    </Button>
                    {activeSectionIndex < module.sections.length - 1 ? (
                      <Button
                        className="bg-[#1a3a2a] text-white hover:bg-[#10281d]"
                        onClick={() => {
                          const newCompleted = Array.from(new Set([...completedSectionIds, activeSection.id]));
                          setCompletedSectionIds(newCompleted);
                          handleSaveProgress(newCompleted, bestScore);
                          setActiveSectionIndex(activeSectionIndex + 1);
                        }}
                      >
                        Próxima Seção
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        className="bg-[#c4a84b] text-[#1a1a1a] hover:bg-[#b39740]"
                        onClick={() => {
                          const newCompleted = Array.from(new Set([...completedSectionIds, activeSection.id]));
                          setCompletedSectionIds(newCompleted);
                          handleSaveProgress(newCompleted, bestScore);
                          startExam();
                        }}
                      >
                        Ir para Prova Final
                        <GraduationCap className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {(mode === "exam" || mode === "results") && (
            <motion.div
              key="exam"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <StudyExam 
                module={module} 
                onFinish={() => setMode("results")}
                onRestart={startExam}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavButton({ 
  active, 
  onClick, 
  icon, 
  label, 
  completed,
  variant = "default" 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  completed?: boolean;
  variant?: "default" | "gold";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
        active 
          ? variant === "gold" 
            ? "bg-[#c4a84b] text-[#1a1a1a] font-semibold" 
            : "bg-[#1a3a2a] text-white font-semibold shadow-lg shadow-[#1a3a2a]/20"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <span className={cn(
        "shrink-0",
        active ? "text-current" : "text-muted-foreground/60"
      )}>
        {completed ? <CheckCircle2 className="h-4 w-4 text-[#c4a84b]" /> : icon}
      </span>
      <span className="truncate">{label}</span>
      {active && <motion.div layoutId="active-pill" className="ml-auto h-1.5 w-1.5 rounded-full bg-current" />}
    </button>
  );
}

function StudyExam({ 
  module, 
  onFinish,
  onRestart 
}: { 
  module: StudyModule; 
  onFinish: () => void;
  onRestart: () => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [isFinished, setIsFinished] = useState(false);

  const questions = module.questions;
  const currentQuestion = questions[currentIdx];

  const handleOptionToggle = (optionId: string) => {
    const current = answers[currentQuestion.id] || [];
    if (currentQuestion.type === "single" || currentQuestion.type === "boolean") {
      setAnswers({ ...answers, [currentQuestion.id]: [optionId] });
    } else {
      if (current.includes(optionId)) {
        setAnswers({ ...answers, [currentQuestion.id]: current.filter(id => id !== optionId) });
      } else {
        setAnswers({ ...answers, [currentQuestion.id]: [...current, optionId] });
      }
    }
  };

  const score = useMemo(() => {
    let correct = 0;
    questions.forEach(q => {
      const ans = answers[q.id] || [];
      const correctIds = q.correctOptionIds || [];
      if (ans.length === correctIds.length && ans.every(id => correctIds.includes(id))) {
        correct++;
      }
    });
    return (correct / questions.length) * 100;
  }, [answers, questions]);

  if (isFinished) {
    return (
      <Card className="border-border/60">
        <CardContent className="p-12 text-center space-y-8">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#c4a84b]/20 text-[#c4a84b]">
            <Trophy className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold" style={{ fontFamily: "Merriweather, serif" }}>
              Prova Concluída!
            </h2>
            <p className="text-muted-foreground">
              Você completou a avaliação do módulo <strong>{module.shortTitle}</strong>.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 max-w-md mx-auto">
            <Card className="bg-muted/30 border-border/40">
              <CardContent className="p-4">
                <p className="text-sm uppercase tracking-widest text-muted-foreground/60">Sua Nota</p>
                <p className="text-4xl font-black text-[#1a3a2a]">{Math.round(score)}%</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-border/40">
              <CardContent className="p-4">
                <p className="text-sm uppercase tracking-widest text-muted-foreground/60">Status</p>
                <p className={cn(
                  "text-2xl font-bold mt-1",
                  score >= 70 ? "text-green-600" : "text-red-600"
                )}>
                  {score >= 70 ? "APROVADO" : "REPROVADO"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button variant="outline" onClick={onRestart}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
            <Button className="bg-[#1a3a2a] text-white hover:bg-[#10281d]">
              Concluir Módulo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="bg-muted/20 border-b">
        <div className="flex items-center justify-between">
          <Badge className="bg-[#c4a84b] text-[#1a1a1a]">Questão {currentIdx + 1} de {questions.length}</Badge>
          <div className="text-xs font-mono text-muted-foreground">
            {Math.round((currentIdx / questions.length) * 100)}% CONCLUÍDO
          </div>
        </div>
        <Progress value={(currentIdx / questions.length) * 100} className="mt-4 h-1" />
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold leading-relaxed">
            {currentQuestion.prompt}
          </h3>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            {currentQuestion.type === "multiple" ? "Selecione todas as corretas" : "Selecione uma opção"}
          </p>
        </div>

        <div className="grid gap-3">
          {currentQuestion.options?.map((opt) => {
            const isSelected = (answers[currentQuestion.id] || []).includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => handleOptionToggle(opt.id)}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
                  isSelected 
                    ? "bg-[#1a3a2a]/10 border-[#1a3a2a] shadow-inner" 
                    : "bg-white border-border/60 hover:border-[#1a3a2a]/50 hover:bg-muted/20"
                )}
              >
                <div className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                  isSelected ? "bg-[#1a3a2a] border-[#1a3a2a] text-white" : "bg-white border-border"
                )}>
                  {isSelected && <CheckCircle2 className="h-4 w-4" />}
                </div>
                <span className={cn(
                  "text-sm font-medium",
                  isSelected ? "text-[#1a3a2a]" : "text-foreground"
                )}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="ghost"
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
          >
            Anterior
          </Button>
          {currentIdx < questions.length - 1 ? (
            <Button
              className="bg-[#1a3a2a] text-white hover:bg-[#10281d]"
              onClick={() => setCurrentIdx(currentIdx + 1)}
              disabled={!(answers[currentQuestion.id]?.length > 0)}
            >
              Próxima
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              className="bg-[#1a3a2a] text-white hover:bg-[#10281d] px-8"
              onClick={() => {
                setIsFinished(true);
                handleSaveProgress(completedSectionIds, score);
              }}
              disabled={!(answers[currentQuestion.id]?.length > 0)}
            >
              Finalizar Prova
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
