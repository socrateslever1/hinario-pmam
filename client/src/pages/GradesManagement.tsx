import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { AlertCircle, Edit2, LogOut, Plus, Trash2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button'; // Mantido para outros usos
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import Navbar from '@/components/Navbar';
import { clearStudentSession, getStudentSession } from '@/lib/studentSession';

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

export default function GradesManagement() {
  const [, setLocation] = useLocation();
  const [studentId, setStudentId] = useState<number | null>(null);
  const [studentName, setStudentName] = useState('');
  const [disciplines, setDisciplines] = useState<DisciplineCatalogItem[]>([]);
  const [grades, setGrades] = useState<StudentGradeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDisciplineId, setEditingDisciplineId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    professorName: '',
    grade1: '',
    grade2: '',
    evaluationDate: '',
    observation: '',
  });

  const gradePartsPrefix = '[[GRADE_PARTS:';

  const normalizeGradeInput = (value: string) => {
    const trimmed = value.trim().replace(',', '.');
    if (!trimmed) return undefined;
    let grade = Number(trimmed);
    if (grade > 10) grade = grade / 10;
    return grade;
  };

  const validateGradeValue = (grade: number | undefined) => {
    return grade === undefined || (!Number.isNaN(grade) && grade >= 0 && grade <= 10);
  };

  const calculateEffectiveGrade = (grade1?: number, grade2?: number) => {
    const grades = [grade1, grade2].filter((grade): grade is number => grade !== undefined);
    if (grades.length === 0) return undefined;
    const total = grades.reduce((sum, grade) => sum + grade, 0);
    return Math.round((total / grades.length) * 100) / 100;
  };

  const parseGradeObservation = (observation?: string | null, fallbackGrade?: number) => {
    if (!observation?.startsWith(gradePartsPrefix)) {
      return {
        grade1: fallbackGrade === undefined || fallbackGrade === null ? '' : String(fallbackGrade),
        grade2: '',
        observation: observation || '',
      };
    }

    const endIndex = observation.indexOf(']]');
    if (endIndex === -1) {
      return {
        grade1: fallbackGrade === undefined || fallbackGrade === null ? '' : String(fallbackGrade),
        grade2: '',
        observation,
      };
    }

    try {
      const data = JSON.parse(observation.slice(gradePartsPrefix.length, endIndex));
      return {
        grade1: data.grade1 === undefined || data.grade1 === null ? '' : String(data.grade1),
        grade2: data.grade2 === undefined || data.grade2 === null ? '' : String(data.grade2),
        observation: observation.slice(endIndex + 2).replace(/^\n/, ''),
      };
    } catch {
      return {
        grade1: fallbackGrade === undefined || fallbackGrade === null ? '' : String(fallbackGrade),
        grade2: '',
        observation,
      };
    }
  };

  const buildGradeObservation = (grade1: number | undefined, grade2: number | undefined, observation: string) => {
    const meta = JSON.stringify({ grade1: grade1 ?? null, grade2: grade2 ?? null });
    const cleanObservation = observation.trim();
    return `${gradePartsPrefix}${meta}]]${cleanObservation ? `\n${cleanObservation}` : ''}`;
  };

  const utils = trpc.useUtils();
  const createGradeMutation = trpc.grades.createStudentGrade.useMutation();
  const updateGradeMutation = trpc.grades.updateStudentGrade.useMutation();
  const deleteGradeMutation = trpc.grades.deleteStudentGrade.useMutation();

  const disciplineRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    const session = getStudentSession();
    if (!session) {
      setLocation('/entrar');
      return;
    }

    setStudentId(session.id);
    setStudentName(session.nomeGuerra);
    void loadPageData(session.id, session.sessionToken);
  }, [setLocation]);

  const loadPageData = async (id: number, sessionToken?: string) => {
    if (!sessionToken) {
      setLocation('/entrar');
      return;
    }

    try {
      setIsLoading(true);
      const [disciplineList, gradeResult] = await Promise.all([
        utils.grades.availableDisciplines.fetch(),
        utils.grades.getMyGrades.fetch({ studentId: id, sessionToken }),
      ]);
      setDisciplines(disciplineList);
      setGrades(gradeResult.grades);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const getGradeForDiscipline = (disciplineId: number) => {
    return grades.find((g) => g.disciplineId === disciplineId);
  };

  const handleAddGrade = (disciplineId: number) => {
    setEditingDisciplineId(disciplineId);
    setEditingId(null);
    setFormData({
      professorName: '',
      grade1: '',
      grade2: '',
      evaluationDate: '',
      observation: '',
    });
  };

  const handleEditGrade = (grade: StudentGradeEntry) => {
    const parsedObservation = parseGradeObservation(grade.observation, grade.grade);
    setEditingId(grade.id);
    setEditingDisciplineId(grade.disciplineId);
    setFormData({
      professorName: grade.professorName || '',
      grade1: parsedObservation.grade1,
      grade2: parsedObservation.grade2,
      evaluationDate: grade.evaluationDate || '',
      observation: parsedObservation.observation,
    });

    // Scroll para a disciplina
    setTimeout(() => {
      disciplineRefs.current[grade.disciplineId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId || !editingDisciplineId) return;

    const session = getStudentSession();
    if (!session) {
      setLocation('/entrar');
      return;
    }

    try {
      const grade1 = normalizeGradeInput(formData.grade1);
      const grade2 = normalizeGradeInput(formData.grade2);

      if (!validateGradeValue(grade1) || !validateGradeValue(grade2)) {
        toast.error('Notas devem estar entre 0 e 10');
        return;
      }

      if (grade1 === undefined && grade2 !== undefined) {
        toast.error('Preencha a 1ª nota antes da 2ª');
        return;
      }

      const gradeValue = calculateEffectiveGrade(grade1, grade2);
      const observation = buildGradeObservation(grade1, grade2, formData.observation);

      if (editingId) {
        // Atualizar nota existente
        await updateGradeMutation.mutateAsync({
          id: editingId,
          studentId,
          grade: gradeValue,
          professorName: formData.professorName || undefined,
          evaluationDate: formData.evaluationDate || undefined,
          observation,
          sessionToken: session.sessionToken,
        });
        toast.success('Nota atualizada com sucesso');
      } else {
        // Criar nova nota
        await createGradeMutation.mutateAsync({
          studentId,
          disciplineId: editingDisciplineId,
          grade: gradeValue,
          professorName: formData.professorName || undefined,
          evaluationDate: formData.evaluationDate || undefined,
          observation,
          sessionToken: session.sessionToken,
        });
        toast.success('Nota lançada com sucesso');
      }

      setEditingId(null);
      setEditingDisciplineId(null);
      await loadPageData(studentId, session.sessionToken);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar nota');
    }
  };

  const handleDeleteGrade = async (id: number) => {
    if (!studentId) return;

    const session = getStudentSession();
    if (!session) {
      setLocation('/entrar');
      return;
    }

    try {
      await deleteGradeMutation.mutateAsync({ id, studentId, sessionToken: session.sessionToken });
      toast.success('Nota deletada');
      await loadPageData(studentId, session.sessionToken);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao deletar nota');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingDisciplineId(null);
    setFormData({
      professorName: '',
      grade1: '',
      grade2: '',
      evaluationDate: '',
      observation: '',
    });
  };

  const handleLogout = () => {
    clearStudentSession();
    setLocation('/entrar');
  };

  if (isLoading) {
    return (
      <div className="mobile-safe-bottom min-h-screen bg-[#062417] md:bg-[#f5f2e8]">
        <Navbar />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center text-white md:text-foreground">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#1a3a2a]" />
            <p>Carregando disciplinas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-safe-bottom min-h-screen bg-[#062417] md:bg-[#f5f2e8]">
      <Navbar />
      <main className="px-4 py-6 md:p-8 md:pb-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-[#0b3323]/78 p-5 text-white shadow-xl shadow-black/15 sm:flex-row sm:items-center sm:justify-between md:mb-8 md:border-0 md:bg-transparent md:p-0 md:text-foreground md:shadow-none">
            <div>
              <h1 className="text-3xl font-bold text-white md:text-[#1a3a2a]">Lançar Notas</h1>
              <p className="text-sm text-white/70 md:text-muted-foreground">{studentName}</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-2 self-start sm:self-auto">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>

          {/* Lista de Disciplinas */}
          <div className="space-y-3">
            {disciplines.map((discipline) => {
              const existingGrade = getGradeForDiscipline(discipline.id);
              const isEditing = editingDisciplineId === discipline.id;
              const hasGrade = !!existingGrade;

              return (
                <div
                  key={discipline.id}
                  ref={(el) => {
                    if (el) disciplineRefs.current[discipline.id] = el;
                  }}
                  className={`rounded-lg border-2 p-4 transition-all ${
                    isEditing
                      ? 'border-[#c4a84b] bg-[#c4a84b]/10'
                      : hasGrade
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 bg-white'
                  }`}
                >
                  {!isEditing && (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#1a3a2a]">{discipline.name}</h3>
                        {hasGrade && (
                          <p className="text-sm text-green-700">
                            ✓ Nota: {typeof existingGrade.grade === 'number' ? existingGrade.grade.toFixed(1) : Number(existingGrade.grade || 0).toFixed(1)} {existingGrade.professorName && `- Prof. ${existingGrade.professorName}`}
                          </p>
                        )}
                        {hasGrade && (() => {
                          const parsedObservation = parseGradeObservation(existingGrade.observation, existingGrade.grade);
                          return parsedObservation.grade2 ? (
                            <p className="text-xs text-green-700/80">
                              Provas: {parsedObservation.grade1 || '-'} e {parsedObservation.grade2}
                            </p>
                          ) : null;
                        })()}
                      </div>
                      {hasGrade && (
                        <button
                          onClick={() => handleEditGrade(existingGrade)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#1a3a2a] hover:bg-[#1a3a2a]/5 rounded-md transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span>Editar</span>
                        </button>
                      )}
                      {!hasGrade && (
                        <button
                          onClick={() => handleAddGrade(discipline.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#c4a84b] hover:bg-[#c4a84b]/10 rounded-md transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Adicionar</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Formulário de Edição */}
                  {isEditing && (
                    <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t pt-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <Label htmlFor={`grade1-${discipline.id}`}>1ª nota (0-10)</Label>
                          <Input
                            id={`grade1-${discipline.id}`}
                            type="text"
                            inputMode="decimal"
                            placeholder="Ex: 9.5 ou 9,5"
                            value={formData.grade1}
                            onChange={(e) => setFormData({ ...formData, grade1: e.target.value.replace(',', '.') })}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`grade2-${discipline.id}`}>2ª nota (opcional)</Label>
                          <Input
                            id={`grade2-${discipline.id}`}
                            type="text"
                            inputMode="decimal"
                            placeholder="Se houver 2ª prova"
                            value={formData.grade2}
                            onChange={(e) => setFormData({ ...formData, grade2: e.target.value.replace(',', '.') })}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`professor-${discipline.id}`}>Professor</Label>
                          <Input
                            id={`professor-${discipline.id}`}
                            placeholder="Nome do professor"
                            value={formData.professorName}
                            onChange={(e) => setFormData({ ...formData, professorName: e.target.value })}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Se lançar duas notas, a disciplina usa a média delas. Se lançar só uma, ela vale integralmente.
                      </p>

                      <div>
                        <Label htmlFor={`date-${discipline.id}`}>Data da Avaliação</Label>
                        <Input
                          id={`date-${discipline.id}`}
                          type="date"
                          value={formData.evaluationDate}
                          onChange={(e) => setFormData({ ...formData, evaluationDate: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor={`observation-${discipline.id}`}>Observações</Label>
                        <Textarea
                          id={`observation-${discipline.id}`}
                          placeholder="Adicione observações sobre a nota"
                          value={formData.observation}
                          onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                          className="resize-none"
                          rows={2}
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          className="flex-1 px-4 py-2 bg-[#1a3a2a] text-white font-medium rounded-md hover:bg-[#0f2620] transition-colors"
                        >
                          Salvar
                        </button>
                        {existingGrade && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Tem certeza que deseja deletar esta nota?')) {
                                handleDeleteGrade(existingGrade.id);
                              }
                            }}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="px-4 py-2 text-[#1a3a2a] hover:bg-[#1a3a2a]/5 rounded-md transition-colors font-medium"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>

          {disciplines.length === 0 && (
            <Card className="border-white/10 bg-[#0b3323]/82 text-white shadow-xl shadow-black/15 md:border-[#c4a84b]/30 md:bg-white md:text-foreground md:shadow-none">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Nenhuma disciplina disponível</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
