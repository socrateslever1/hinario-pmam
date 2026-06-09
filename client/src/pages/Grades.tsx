import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AlertCircle, Edit2, LogOut, Plus, Trash2, Trophy, Medal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { clearStudentSession, getStudentSession } from "@/lib/studentSession";

interface DisciplineCatalogItem {
  id: number;
  name: string;
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
  grade: "",
  evaluationDate: "",
  observation: "",
};

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
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const utils = trpc.useUtils();
  const createGradeMutation = trpc.grades.createStudentGrade.useMutation();
  const updateGradeMutation = trpc.grades.updateStudentGrade.useMutation();
  const deleteGradeMutation = trpc.grades.deleteStudentGrade.useMutation();

  useEffect(() => {
    const session = getStudentSession();
    if (!session) {
      setLocation("/entrar");
      return;
    }

    setStudentId(session.id);
    setStudentName(session.nomeGuerra);
    setStudentNumber(session.numerica);
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
        utils.grades.availableDisciplines.fetch(),
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
    } catch (err) {
      toast.error("Erro ao carregar notas");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!studentId || isSubmitting) return;

    const disciplineId = Number(formData.disciplineId);
    if (!disciplineId) {
      toast.error("Selecione uma disciplina");
      return;
    }

    let grade = formData.grade === "" ? undefined : Number(formData.grade);
    
    // Converter notas acima de 10 (ex: 70 -> 7.0, 100 -> 10.0)
    if (grade !== undefined && grade > 10) {
      grade = grade / 10;
    }
    
    // Validar nota (0-10)
    if (grade !== undefined && (isNaN(grade) || grade < 0 || grade > 10)) {
      toast.error("Nota deve estar entre 0 e 10");
      return;
    }
    
    const session = getStudentSession();
    if (!session) {
      setLocation("/entrar");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateGradeMutation.mutateAsync({
          id: editingId,
          studentId,
          sessionToken: session.sessionToken,
          disciplineId,
          professorName: formData.professorName || undefined,
          grade,
          evaluationDate: formData.evaluationDate || null,
          observation: formData.observation || null,
        });
        toast.success("Nota atualizada");
      } else {
        await createGradeMutation.mutateAsync({
          studentId,
          sessionToken: session.sessionToken,
          disciplineId,
          professorName: formData.professorName || undefined,
          grade,
          evaluationDate: formData.evaluationDate || undefined,
          observation: formData.observation || undefined,
        });
        toast.success("Nota lançada");
      }

      resetForm();
      await loadPageData(studentId, session.companhia, session.peloton, session.sessionToken);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar nota");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (entry: StudentGradeEntry) => {
    setFormData({
      disciplineId: String(entry.disciplineId),
      professorName: entry.professorName || "",
      grade: entry.grade === undefined || entry.grade === null ? "" : String(entry.grade),
      evaluationDate: entry.evaluationDate ? String(entry.evaluationDate).slice(0, 10) : "",
      observation: entry.observation || "",
    });
    setEditingId(entry.id);
    setShowForm(true);
    toast.info("Atualize a nota");
    setTimeout(() => {
      document.getElementById("form-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
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
    clearStudentSession();
    setLocation("/entrar");
  };

  const [expandedRankings, setExpandedRankings] = useState<Set<string>>(new Set());

  const RankingList = ({ title, rows }: { title: string; rows: RankingRow[] }) => {
    const isExpanded = expandedRankings.has(title);
    const displayRows = isExpanded ? rows : rows.slice(0, 3);

    return (
    <Card className="border-[#c4a84b]/30">
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
                row.studentId === studentId ? "border-[#c4a84b] bg-[#c4a84b]/10" : "bg-white"
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
                <p className="text-sm font-bold text-[#1a3a2a]">{row.totalScore.toFixed(1)}</p>
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
      <div className="min-h-screen bg-[#f5f2e8]">
        <Navbar />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#1a3a2a]" />
            <p>Carregando notas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f2e8]">
      <Navbar />
      <main className="p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1a3a2a]">Notas do Curso</h1>
            <p className="text-sm text-muted-foreground">
              {studentName || "Aluno"} - {studentNumber}
            </p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            <Button onClick={() => setLocation('/lançar-notas')} className="gap-2 bg-[#1a3a2a] hover:bg-[#0f2620]">
              <Plus className="h-4 w-4" />
              Lançar Notas
            </Button>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="border-[#c4a84b]/30">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Média geral</p>
              <p className="text-4xl font-bold text-[#1a3a2a]">{average.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="border-[#c4a84b]/30">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Notas lançadas</p>
              <p className="text-4xl font-bold text-[#1a3a2a]">{grades.length}</p>
            </CardContent>
          </Card>
          <Card className="border-[#c4a84b]/30">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Disciplinas disponíveis</p>
              <p className="text-4xl font-bold text-[#1a3a2a]">{disciplines.length}</p>
            </CardContent>
          </Card>
        </div>

        {showForm ? (
          <Card id="form-section" className="mb-8 border-[#c4a84b]/30">
            <CardHeader>
              <CardTitle>{editingId ? "Editar nota" : "Lançar nota"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="discipline">Disciplina</Label>
                  <select
                    id="discipline"
                    value={formData.disciplineId}
                    onChange={(event) =>
                      setFormData({ ...formData, disciplineId: event.target.value })
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    required
                  >
                    <option value="">Selecione uma disciplina</option>
                    {disciplines.map((discipline) => (
                      <option key={discipline.id} value={discipline.id}>
                        {discipline.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="professor">Professor</Label>
                  <Input
                    id="professor"
                    value={formData.professorName}
                    onChange={(event) =>
                      setFormData({ ...formData, professorName: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">Nota (0-10)</Label>
                  <Input
                    id="grade"
                    type="text"
                    placeholder="Ex: 9.5 ou 9,5"
                    value={formData.grade}
                    onChange={(event) => {
                      // Aceita vírgula e ponto, converte para ponto
                      const value = event.target.value.replace(',', '.');
                      setFormData({ ...formData, grade: value });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.evaluationDate}
                    onChange={(event) =>
                      setFormData({ ...formData, evaluationDate: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="observation">Observação</Label>
                  <Textarea
                    id="observation"
                    value={formData.observation}
                    onChange={(event) =>
                      setFormData({ ...formData, observation: event.target.value })
                    }
                  />
                </div>
                <div className="flex gap-2 md:col-span-2">
                  <Button type="submit" className="bg-[#1a3a2a] hover:bg-[#214936]" disabled={isSubmitting}>
                    {isSubmitting ? (editingId ? "Atualizando..." : "Salvando...") : (editingId ? "Atualizar" : "Salvar")}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Button
            onClick={() => setShowForm(true)}
            className="mb-8 gap-2 bg-[#1a3a2a] hover:bg-[#214936]"
            disabled={disciplines.length === 0}
          >
            <Plus className="h-4 w-4" />
            Lançar nota
          </Button>
        )}

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
            grades.map((entry) => (
              <Card key={entry.id} className="border-[#c4a84b]/30">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[#1a3a2a]">{entry.disciplineName}</h3>
                      {entry.professorName && (
                        <p className="text-sm text-muted-foreground">Professor: {entry.professorName}</p>
                      )}
                      <p className="mt-2 text-sm">
                        Nota:{" "}
                        <span className={Number(entry.grade || 0) >= 7 ? "font-semibold text-green-700" : "font-semibold text-red-700"}>
                          {entry.grade ?? "-"}
                        </span>
                      </p>
                      {entry.evaluationDate && (
                        <p className="text-sm text-muted-foreground">
                          Data: {String(entry.evaluationDate).slice(0, 10)}
                        </p>
                      )}
                      {entry.observation && <p className="mt-2 text-sm">{entry.observation}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(entry)} className="gap-1">
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
            ))
          )}
        </div>
      </div>
      </main>
    </div>
  );
}
