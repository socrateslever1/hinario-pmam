import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AlertCircle, Edit2, LogOut, Plus, Trash2, Trophy, Medal, Youtube, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { clearStudentSession, getStudentSession } from "@/lib/studentSession";

interface DisciplineCatalogItem {
  id: number;
  name: string;
  description?: string;
  startDate?: string | Date | null;
  examDate?: string | Date | null;
  status?: string;
  studyMaterialUrl?: string | null;
  studyMaterialName?: string | null;
  gaivotasLinks?: string | null;
}

interface StudentGradeEntry {
  id: number;
  studentId: number;
  disciplineId: number;
  disciplineName: string;
  professorName?: string;
  grade?: number;
  evaluationDate?: string;
  observation?: string;
}

interface RankingRow {
  position: number;
  studentId: number;
  nomeGuerra: string;
  numerica: string;
  companhia: number;
  peloton: number;
  average: number;
  totalScore: number;
  disciplineCount: number;
}

const emptyForm = {
  disciplineId: "",
  professorName: "",
  grade1: "",
  grade2: "",
  evaluationDate: "",
  observation: "",
};

const gradePartsPrefix = "[[GRADE_PARTS:";

function normalizeGradeInput(value: string) {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return undefined;
  let grade = Number(trimmed);
  if (grade > 10) grade = grade / 10;
  return grade;
}

function calculateEffectiveGrade(grade1?: number, grade2?: number) {
  const grades = [grade1, grade2].filter((grade): grade is number => grade !== undefined);
  if (grades.length === 0) return undefined;
  const total = grades.reduce((sum, grade) => sum + grade, 0);
  return Math.round((total / grades.length) * 100) / 100;
}

function validateGradeValue(grade: number | undefined) {
  return grade === undefined || (!Number.isNaN(grade) && grade >= 0 && grade <= 10);
}

function parseGradeObservation(observation?: string | null, fallbackGrade?: number) {
  if (!observation?.startsWith(gradePartsPrefix)) {
    return {
      grade1: fallbackGrade === undefined || fallbackGrade === null ? "" : String(fallbackGrade),
      grade2: "",
      observation: observation || "",
    };
  }

  const endIndex = observation.indexOf("]]");
  if (endIndex === -1) {
    return { grade1: fallbackGrade === undefined || fallbackGrade === null ? "" : String(fallbackGrade), grade2: "", observation };
  }

  try {
    const data = JSON.parse(observation.slice(gradePartsPrefix.length, endIndex));
    return {
      grade1: data.grade1 === undefined || data.grade1 === null ? "" : String(data.grade1),
      grade2: data.grade2 === undefined || data.grade2 === null ? "" : String(data.grade2),
      observation: observation.slice(endIndex + 2).replace(/^\n/, ""),
    };
  } catch {
    return { grade1: fallbackGrade === undefined || fallbackGrade === null ? "" : String(fallbackGrade), grade2: "", observation };
  }
}

function buildGradeObservation(grade1: number | undefined, grade2: number | undefined, observation: string) {
  const meta = JSON.stringify({ grade1: grade1 ?? null, grade2: grade2 ?? null });
  const cleanObservation = observation.trim();
  return `${gradePartsPrefix}${meta}]]${cleanObservation ? `\n${cleanObservation}` : ""}`;
}

export default function Grades() {
  const [, setLocation] = useLocation();
  const [studentId, setStudentId] = useState<number | null>(null);
  const [studentName, setStudentName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [disciplines, setDisciplines] = useState<DisciplineCatalogItem[]>([]);
  const [grades, setGrades] = useState<StudentGradeEntry[]>([]);
  const [generalRanking, setGeneralRanking] = useState<RankingRow[]>([]);
  const [companyRanking, setCompanyRanking] = useState<RankingRow[]>([]);
  const [platoonRanking, setPlatoonRanking] = useState<RankingRow[]>([]);
  const [average, setAverage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const utils = trpc.useUtils();
  const deleteGradeMutation = trpc.grades.deleteStudentGrade.useMutation();

  const profileQuery = trpc.student.getProfile.useQuery(
    { id: studentId ?? 0, sessionToken: getStudentSession()?.sessionToken ?? "" },
    { enabled: !!studentId }
  );
  const studentPhotoUrl = profileQuery.data?.fotoUrl;


  useEffect(() => {
    const session = getStudentSession();
    if (!session) {
      setLocation("/entrar");
      return;
    }

    setStudentId(session.id);
    setStudentName(session.nomeGuerra);
    setStudentNumber(session.numerica);

    // Carregar dados salvos em cache para visualização instantânea offline
    try {
      const cachedDisciplines = localStorage.getItem(`pmam-grades-disciplines-${session.id}`);
      const cachedGrades = localStorage.getItem(`pmam-grades-grades-${session.id}`);
      const cachedAverage = localStorage.getItem(`pmam-grades-average-${session.id}`);
      const cachedGeneralRanking = localStorage.getItem(`pmam-grades-generalRanking-${session.id}`);
      const cachedCompanyRanking = localStorage.getItem(`pmam-grades-companyRanking-${session.id}`);
      const cachedPlatoonRanking = localStorage.getItem(`pmam-grades-platoonRanking-${session.id}`);

      if (cachedDisciplines) setDisciplines(JSON.parse(cachedDisciplines));
      if (cachedGrades) setGrades(JSON.parse(cachedGrades));
      if (cachedAverage) setAverage(Number(cachedAverage));
      if (cachedGeneralRanking) setGeneralRanking(JSON.parse(cachedGeneralRanking));
      if (cachedCompanyRanking) setCompanyRanking(JSON.parse(cachedCompanyRanking));
      if (cachedPlatoonRanking) setPlatoonRanking(JSON.parse(cachedPlatoonRanking));
    } catch (e) {
      console.warn("Erro ao ler cache offline:", e);
    }

    void loadPageData(session.id, session.companhia, session.peloton, session.sessionToken);
  }, [setLocation]);

  const loadPageData = async (id: number, companhia?: number, peloton?: number, sessionToken?: string) => {
    if (!sessionToken) {
      setLocation("/entrar");
      return;
    }

    try {
      setIsLoading(true);
      const [disciplineList, gradeResult, generalRows, companyRows, platoonRows] = await Promise.all([
        utils.grades.availableDisciplines.fetch({ companhia, peloton }),
        utils.grades.getMyGrades.fetch({ studentId: id, sessionToken }),
        utils.grades.ranking.fetch({ studentId: id, sessionToken }),
        companhia ? utils.grades.ranking.fetch({ studentId: id, sessionToken, companhia }) : Promise.resolve([]),
        companhia && peloton ? utils.grades.ranking.fetch({ studentId: id, sessionToken, companhia, peloton }) : Promise.resolve([]),
      ]);
      setDisciplines(disciplineList);
      setGrades(gradeResult.grades);
      setAverage(gradeResult.average);
      setGeneralRanking(generalRows);
      setCompanyRanking(companyRows);
      setPlatoonRanking(platoonRows);

      // Salvar em cache local para funcionamento offline
      try {
        localStorage.setItem(`pmam-grades-disciplines-${id}`, JSON.stringify(disciplineList));
        localStorage.setItem(`pmam-grades-grades-${id}`, JSON.stringify(gradeResult.grades));
        localStorage.setItem(`pmam-grades-average-${id}`, String(gradeResult.average));
        localStorage.setItem(`pmam-grades-generalRanking-${id}`, JSON.stringify(generalRows));
        localStorage.setItem(`pmam-grades-companyRanking-${id}`, JSON.stringify(companyRows));
        localStorage.setItem(`pmam-grades-platoonRanking-${id}`, JSON.stringify(platoonRows));
      } catch (e) {
        console.warn("Erro ao salvar cache offline:", e);
      }
    } catch (err: any) {
      // Sessão inválida → redirecionar para login
      if (err?.data?.code === "UNAUTHORIZED" || err?.message?.includes("Sessão inválida") || err?.message?.includes("expirada")) {
        clearStudentSession();
        setLocation("/entrar");
        return;
      }
      // Se falhar a conexão (offline), exibimos aviso mas mantemos os dados carregados do cache
      toast.error("Sem conexão com o servidor. Exibindo dados salvos localmente.");
    } finally {
      setIsLoading(false);
    }
  };



  const handleDelete = async (id: number) => {
    if (!studentId || !confirm("Tem certeza que deseja deletar esta nota?")) return;

    try {
      const session = getStudentSession();
      if (!session) {
        setLocation("/entrar");
        return;
      }

      await deleteGradeMutation.mutateAsync({ id, studentId, sessionToken: session.sessionToken });
      toast.success("Nota deletada");
      await loadPageData(studentId, session.companhia, session.peloton, session.sessionToken);
    } catch (err: any) {
      toast.error(err.message || "Erro ao deletar nota");
    }
  };

  const handleLogout = () => {
    if (studentId) {
      try {
        localStorage.removeItem(`pmam-grades-disciplines-${studentId}`);
        localStorage.removeItem(`pmam-grades-grades-${studentId}`);
        localStorage.removeItem(`pmam-grades-average-${studentId}`);
        localStorage.removeItem(`pmam-grades-generalRanking-${studentId}`);
        localStorage.removeItem(`pmam-grades-companyRanking-${studentId}`);
        localStorage.removeItem(`pmam-grades-platoonRanking-${studentId}`);
      } catch (e) {
        console.warn("Erro ao limpar cache local:", e);
      }
    }
    clearStudentSession();
    setLocation("/entrar");
  };

  const [expandedRankings, setExpandedRankings] = useState<Set<string>>(new Set());

  const RankingList = ({ title, rows }: { title: string; rows: RankingRow[] }) => {
    const isExpanded = expandedRankings.has(title);
    const displayRows = isExpanded ? rows : rows.slice(0, 3);

    return (
    <Card className="border-border/50 bg-white dark:bg-zinc-900/60 dark:border-white/10 text-foreground dark:text-foreground shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayRows.map((row) => {
          // Renderização do badge de posição (ouro, prata, bronze ou comum)
          const renderPositionBadge = (pos: number) => {
            if (pos === 1) {
              return (
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ffd700] via-[#c5a01a] to-[#ffd700] font-bold text-[#1a3a2a] shadow-[0_0_8px_rgba(255,215,0,0.6)] border-2 border-[#fff7c2]">
                  <Trophy className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 text-[#ffd700] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] fill-[#ffd700]" />
                  <span className="text-xs font-black">1</span>
                </div>
              );
            }
            if (pos === 2) {
              return (
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#e0e0e0] via-[#9e9e9e] to-[#e0e0e0] font-bold text-[#1a1a1a] shadow-[0_0_6px_rgba(158,158,158,0.4)] border-2 border-[#ffffff]">
                  <Medal className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 text-[#d1d1d1] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] fill-[#d1d1d1]" />
                  <span className="text-xs font-black">2</span>
                </div>
              );
            }
            if (pos === 3) {
              return (
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#cd7f32] via-[#8c531d] to-[#cd7f32] font-bold text-white shadow-[0_0_6px_rgba(140,83,29,0.4)] border-2 border-[#ffbc80]">
                  <Medal className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 text-[#cd7f32] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] fill-[#cd7f32]" />
                  <span className="text-xs font-black">3</span>
                </div>
              );
            }
            return (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#1a3a2a] text-sm font-bold text-white">
                {pos}
              </div>
            );
          };

          return (
            <div
              key={`${title}-${row.studentId}`}
              className={`flex items-center gap-3 rounded-md border p-3 ${
                row.studentId === studentId ? "border-[#c4a84b] bg-[#c4a84b]/10" : "border-border bg-muted/20 dark:bg-zinc-800/20"
              }`}
            >
              {renderPositionBadge(row.position)}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{row.nomeGuerra}</p>
                <p className="text-xs text-muted-foreground">
                  {row.numerica} - {row.companhia}ª Cia / {row.peloton}º Pel
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <p className="text-sm font-bold text-[#c4a84b] dark:text-[#c4a84b] md:text-[#1a3a2a]">{row.totalScore.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">pontos</p>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <p className="text-sm text-muted-foreground">Ranking vazio.</p>}
        {rows.length > 3 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newSet = new Set(expandedRankings);
              if (newSet.has(title)) {
                newSet.delete(title);
              } else {
                newSet.add(title);
              }
              setExpandedRankings(newSet);
            }}
            className="w-full mt-2"
          >
            {isExpanded ? "Mostrar Menos" : `Mostrar Mais (${rows.length - 3})`}
          </Button>
        )}
      </CardContent>
    </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="mobile-safe-bottom min-h-screen bg-[#f5f2e8]">
        <Navbar />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center text-foreground">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#1a3a2a]" />
            <p>Carregando notas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-safe-bottom min-h-screen bg-[#f5f2e8] text-foreground">
      <Navbar />

      <section className="bg-white border-b border-border/40 px-4 pb-7 pt-6 md:px-0 md:py-12">
        <div className="container text-center flex flex-col items-center">
          {studentPhotoUrl ? (
            <img
              src={studentPhotoUrl}
              alt="Foto do Aluno"
              className="mx-auto mb-3 h-20 w-20 rounded-full object-cover border-2 border-[#c4a84b] shadow-md"
            />
          ) : (
            <Trophy className="mx-auto mb-3 h-10 w-10 text-[#c4a84b]" />
          )}
          <h1 className="text-3xl font-bold text-[#1a3a2a] md:text-4xl" style={{ fontFamily: "Merriweather, serif" }}>
            Notas do Curso
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground text-sm md:text-base">
            {studentName} (Nº {studentNumber}) — Acompanhe seu desempenho acadêmico, média geral e classificação.
          </p>
        </div>
        <div className="checkerboard-pattern mt-8 hidden w-full md:block" />
      </section>

      <main className="container flex-1 px-4 py-6 md:py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-wrap gap-2 justify-end">
            <Button onClick={() => setLocation('/lançar-notas')} className="gap-2 bg-[#1a3a2a] hover:bg-[#0f2620] text-white">
              <Plus className="h-4 w-4" />
              Lançar Notas
            </Button>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>

          <div className="mb-5 grid grid-cols-3 gap-2 sm:mb-8 sm:gap-4">
            <Card className="border-border/50 bg-white dark:bg-zinc-900/60 dark:border-white/10 text-foreground dark:text-foreground shadow-sm">
              <CardContent className="p-2.5 sm:p-4">
                <p className="text-[11px] leading-tight text-muted-foreground sm:text-sm">Média geral</p>
                <p className="text-xl font-bold leading-none text-[#1a3a2a] dark:text-[#c4a84b] sm:text-3xl">{average.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-white dark:bg-zinc-900/60 dark:border-white/10 text-foreground dark:text-foreground shadow-sm">
              <CardContent className="p-2.5 sm:p-4">
                <p className="text-[11px] leading-tight text-muted-foreground sm:text-sm">Notas lançadas</p>
                <p className="text-xl font-bold leading-none text-[#1a3a2a] dark:text-[#c4a84b] sm:text-3xl">{grades.length}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-white dark:bg-zinc-900/60 dark:border-white/10 text-foreground dark:text-foreground shadow-sm">
              <CardContent className="p-2.5 sm:p-4">
                <p className="text-[11px] leading-tight text-muted-foreground sm:text-sm">Disciplinas disponíveis</p>
                <p className="text-xl font-bold leading-none text-[#1a3a2a] dark:text-[#c4a84b] sm:text-3xl">{disciplines.length}</p>
              </CardContent>
            </Card>
          </div>



        {disciplines.length === 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="flex gap-3 pt-6 text-sm text-amber-800">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>Nenhuma disciplina foi criada pelo xerife ainda.</p>
            </CardContent>
          </Card>
        )}

        <div className="mb-8 grid gap-4 lg:grid-cols-3">
          <RankingList title="Ranking Geral" rows={generalRanking} />
          <RankingList title="Ranking da Companhia" rows={companyRanking} />
          <RankingList title="Ranking do Pelotão" rows={platoonRanking} />
        </div>

        <div className="space-y-4">
          {grades.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Nenhuma nota lançada ainda.
              </CardContent>
            </Card>
          ) : (
            grades.map((entry) => {
              const grade = Number(entry.grade || 0);
              let cardBg = "border-border bg-white dark:bg-zinc-900/60 dark:border-white/10 text-foreground dark:text-foreground";
              let titleColor = "text-[#1a3a2a] dark:text-foreground";
              let subtitleColor = "text-muted-foreground dark:text-zinc-400";
              let gradeColor = "text-muted-foreground font-black";

              if (grade < 6) {
                cardBg = "border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/50 text-red-950 dark:text-red-200";
                titleColor = "text-red-950 dark:text-red-200";
                subtitleColor = "text-red-800 dark:text-red-300/80";
                gradeColor = "text-red-600 dark:text-red-400 font-bold";
              } else if (grade < 9) {
                cardBg = "border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900/50 text-green-950 dark:text-green-200";
                titleColor = "text-green-950 dark:text-green-200";
                subtitleColor = "text-green-800 dark:text-green-300/80";
                gradeColor = "text-green-600 dark:text-green-400 font-bold";
              } else {
                cardBg = "border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/50 text-blue-950 dark:text-blue-200";
                titleColor = "text-blue-950 dark:text-blue-200";
                subtitleColor = "text-blue-800 dark:text-blue-300/80";
                gradeColor = "text-blue-600 dark:text-blue-400 font-bold";
              }

              const disciplineInfo = disciplines.find((d) => d.id === entry.disciplineId);

              return (
                <Card key={entry.id} className={`shadow-sm transition-all hover:shadow-md ${cardBg}`}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className={`text-lg font-bold ${titleColor}`}>{entry.disciplineName}</h3>
                          {(() => {
                            const hasGrade = entry.grade !== null && entry.grade !== undefined;
                            const status = hasGrade ? "finalizado" : (disciplineInfo?.status || "em_breve");
                            if (status === "em_andamento") {
                              return <Badge className="bg-amber-600 hover:bg-amber-600 text-white text-[10px]">Em Andamento</Badge>;
                            } else if (status === "finalizado") {
                              return <Badge variant="secondary" className="text-[10px]">Finalizado</Badge>;
                            } else {
                              return <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-[10px]">Em Breve</Badge>;
                            }
                          })()}
                        </div>

                        {entry.professorName && (
                          <p className={`text-sm font-semibold ${subtitleColor}`}>Professor: {entry.professorName}</p>
                        )}
                        
                        <div className="mt-2 flex gap-4 flex-wrap text-xs opacity-80">
                          {disciplineInfo?.startDate && (
                            <span>
                              📅 Início: {new Date(disciplineInfo.startDate).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          {disciplineInfo?.examDate && (
                            <span>
                              📝 Prova: {new Date(disciplineInfo.examDate).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm">
                          Nota da disciplina:{" "}
                          <span className={gradeColor}>
                            {entry.grade ?? "-"}
                          </span>
                        </p>

                        {(() => {
                          const parsedObservation = parseGradeObservation(entry.observation, entry.grade);
                          return parsedObservation.grade2 ? (
                            <p className={`text-sm font-semibold ${subtitleColor}`}>
                              Provas: {parsedObservation.grade1 || "-"} e {parsedObservation.grade2}
                            </p>
                          ) : null;
                        })()}
                        {entry.evaluationDate && (
                          <p className="text-xs opacity-75 mt-1">
                            Lançado em: {String(entry.evaluationDate).slice(0, 10)}
                          </p>
                        )}
                        {(() => {
                          const parsedObservation = parseGradeObservation(entry.observation, entry.grade);
                          return parsedObservation.observation ? <p className="mt-2 text-sm">{parsedObservation.observation}</p> : null;
                        })()}

                        {/* Material de Estudos */}
                        {disciplineInfo?.studyMaterialUrl && (
                          <div className="mt-3">
                            <a
                              href={disciplineInfo.studyMaterialUrl}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold border p-2 rounded-lg bg-black/10 hover:bg-black/20 border-white/10 md:bg-muted/30 md:border-border/50"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Material: {disciplineInfo.studyMaterialName || "Download PDF/Doc"}
                            </a>
                          </div>
                        )}

                        {/* Vídeos Gaivotas */}
                        {(() => {
                          let parsedVideos: any[] = [];
                          if (disciplineInfo?.gaivotasLinks) {
                            try {
                              parsedVideos = JSON.parse(disciplineInfo.gaivotasLinks);
                            } catch {
                              parsedVideos = [];
                            }
                          }
                          if (parsedVideos.length === 0) return null;
                          return (
                            <div className="mt-3 p-2.5 rounded-lg border border-dashed max-w-lg bg-black/10 border-white/10 md:bg-muted/20 md:border-border/50">
                              <p className="text-xs font-bold mb-1.5 flex items-center gap-1">
                                <Youtube className="h-3.5 w-3.5 text-red-500" />
                                Aulas (Gaivotas):
                              </p>
                              <div className="flex gap-2 flex-wrap">
                                {parsedVideos.map((vid: any, i: number) => (
                                  <a
                                    key={i}
                                    href={vid.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-blue-300 hover:text-blue-100 bg-blue-950/40 px-2 py-1 rounded border border-blue-800/40 font-medium md:text-blue-600 md:hover:text-blue-800 md:bg-blue-50 md:border-blue-100"
                                  >
                                    🎥 {vid.title}
                                  </a>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                     <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setLocation('/lançar-notas')} className="gap-1">
                        <Edit2 className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(entry.id)} className="gap-1">
                        <Trash2 className="h-4 w-4" />
                        Deletar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
          )}
        </div>
      </div>
      </main>
    </div>
  );
}
