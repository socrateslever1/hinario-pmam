import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Plus, Trash2, Edit2, LogOut } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface Discipline {
  id: number;
  disciplineName: string;
  professorName?: string;
  grade?: number;
}

export default function Grades() {
  const [, setLocation] = useLocation();
  const [studentId, setStudentId] = useState<number | null>(null);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    disciplineName: '',
    professorName: '',
    grade: '',
  });

  const createDisciplineMutation = trpc.grades.createDiscipline.useMutation();
  const updateDisciplineMutation = trpc.grades.updateDiscipline.useMutation();
  const deleteDisciplineMutation = trpc.grades.deleteDiscipline.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    const id = sessionStorage.getItem('gradeStudentId');
    if (!id) {
      setLocation('/grades-login');
      return;
    }

    const studentIdNum = parseInt(id);
    setStudentId(studentIdNum);
    loadDisciplines(studentIdNum);
  }, [setLocation]);

  const loadDisciplines = async (id: number) => {
    try {
      setIsLoading(true);
      const result = await utils.grades.getDisciplines.fetch({ studentId: id });
      setDisciplines(result.disciplines);
      setTotal(result.total);
    } catch (err) {
      toast.error('Erro ao carregar disciplinas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDiscipline = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.disciplineName.trim()) {
      toast.error('Nome da disciplina é obrigatório');
      return;
    }

    try {
      if (editingId) {
        await updateDisciplineMutation.mutateAsync({
          id: editingId,
          disciplineName: formData.disciplineName,
          professorName: formData.professorName || undefined,
          grade: formData.grade ? parseInt(formData.grade) : undefined,
        });
        toast.success('Disciplina atualizada com sucesso');
      } else {
        await createDisciplineMutation.mutateAsync({
          studentId: studentId!,
          disciplineName: formData.disciplineName,
          professorName: formData.professorName || undefined,
          grade: formData.grade ? parseInt(formData.grade) : undefined,
        });
        toast.success('Disciplina adicionada com sucesso');
      }

      setFormData({ disciplineName: '', professorName: '', grade: '' });
      setEditingId(null);
      setShowForm(false);

      if (studentId) {
        await loadDisciplines(studentId);
      }
    } catch (err) {
      toast.error('Erro ao salvar disciplina');
    }
  };

  const handleEdit = (discipline: Discipline) => {
    setFormData({
      disciplineName: discipline.disciplineName,
      professorName: discipline.professorName || '',
      grade: discipline.grade?.toString() || '',
    });
    setEditingId(discipline.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta disciplina?')) return;

    try {
      await deleteDisciplineMutation.mutateAsync({ id });
      toast.success('Disciplina deletada com sucesso');

      if (studentId) {
        await loadDisciplines(studentId);
      }
    } catch (err) {
      toast.error('Erro ao deletar disciplina');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('gradeStudentId');
    sessionStorage.removeItem('gradeStudentNumber');
    setLocation('/grades-login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c4a84b] mx-auto mb-4"></div>
          <p>Carregando disciplinas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Gerenciador de Notas</h1>
            <p className="text-muted-foreground">Aluno: {sessionStorage.getItem('gradeStudentNumber')}</p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>

        <Card className="mb-8 bg-gradient-to-r from-[#c4a84b]/10 to-[#c4a84b]/5 border-[#c4a84b]/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Média Geral</p>
              <p className="text-4xl font-bold text-[#c4a84b]">{total.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingId ? 'Editar Disciplina' : 'Adicionar Nova Disciplina'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddDiscipline} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome da Disciplina</label>
                  <Input
                    placeholder="Ex: Direito Penal"
                    value={formData.disciplineName}
                    onChange={(e) => setFormData({ ...formData, disciplineName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Professor</label>
                  <Input
                    placeholder="Ex: Prof. João Silva"
                    value={formData.professorName}
                    onChange={(e) => setFormData({ ...formData, professorName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Nota (0-100)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Ex: 85"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="flex-1 bg-[#c4a84b] hover:bg-[#c4a84b]/90 text-[#1a3a2a] font-bold"
                  >
                    {editingId ? 'Atualizar' : 'Adicionar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setFormData({ disciplineName: '', professorName: '', grade: '' });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="mb-8 gap-2 bg-[#c4a84b] hover:bg-[#c4a84b]/90 text-[#1a3a2a] font-bold"
          >
            <Plus className="w-4 h-4" />
            Adicionar Disciplina
          </Button>
        )}

        <div className="space-y-4">
          {disciplines.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma disciplina adicionada ainda</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Clique em "Adicionar Disciplina" para começar
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            disciplines.map((discipline) => (
              <Card key={discipline.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{discipline.disciplineName}</h3>
                      {discipline.professorName && (
                        <p className="text-sm text-muted-foreground">Prof. {discipline.professorName}</p>
                      )}
                      {discipline.grade !== undefined && (
                        <p className="text-sm mt-2">
                          <span className="font-semibold">Nota:</span>{' '}
                          <span className={discipline.grade >= 70 ? 'text-green-600' : 'text-red-600'}>
                            {discipline.grade}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(discipline)}
                        className="gap-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(discipline.id)}
                        className="gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
