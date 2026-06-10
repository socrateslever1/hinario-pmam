import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Save, KeyRound } from "lucide-react";

export function GradeAdminTab() {
  const utils = trpc.useUtils();
  const { data: disciplines } = trpc.grades.availableDisciplines.useQuery();
  const { data: students } = trpc.gradeAdmin.students.useQuery();
  const { data: allGrades } = trpc.gradeAdmin.allGrades.useQuery();
  const { data: ranking } = trpc.gradeAdmin.ranking.useQuery({});
  const [disciplineForm, setDisciplineForm] = useState({ name: "", description: "" });
  const [studentForm, setStudentForm] = useState({ numerica: "", nomeGuerra: "", senha: "" });
  const [passwordByStudent, setPasswordByStudent] = useState<Record<number, string>>({});

  const createDiscipline = trpc.gradeAdmin.createDiscipline.useMutation({
    onSuccess: () => {
      toast.success("Disciplina criada");
      setDisciplineForm({ name: "", description: "" });
      utils.grades.availableDisciplines.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const createStudent = trpc.gradeAdmin.createStudent.useMutation({
    onSuccess: () => {
      toast.success("Aluno criado");
      setStudentForm({ numerica: "", nomeGuerra: "", senha: "" });
      utils.gradeAdmin.students.invalidate();
      utils.gradeAdmin.ranking.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const resetStudentPassword = trpc.gradeAdmin.resetStudentPassword.useMutation({
    onSuccess: (_data, variables) => {
      toast.success("Senha do aluno alterada");
      setPasswordByStudent((current) => ({ ...current, [variables.studentId]: "" }));
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteStudent = trpc.gradeAdmin.deleteStudent.useMutation({
    onSuccess: () => {
      toast.success("Aluno removido");
      utils.gradeAdmin.students.invalidate();
      utils.gradeAdmin.allGrades.invalidate();
      utils.gradeAdmin.ranking.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const cleanNumerica = (value: string) => value.replace(/\D/g, "").slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Alunos</p>
            <p className="text-3xl font-bold text-[#1a3a2a]">{students?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Disciplinas</p>
            <p className="text-3xl font-bold text-[#1a3a2a]">{disciplines?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Notas lançadas</p>
            <p className="text-3xl font-bold text-[#1a3a2a]">{allGrades?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <h2 className="mb-4 text-lg font-bold text-foreground">Criar disciplina</h2>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                createDiscipline.mutate({
                  name: disciplineForm.name,
                  description: disciplineForm.description || undefined,
                });
              }}
            >
              <div>
                <Label>Nome *</Label>
                <Input
                  value={disciplineForm.name}
                  onChange={(event) => setDisciplineForm((form) => ({ ...form, name: event.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={disciplineForm.description}
                  onChange={(event) => setDisciplineForm((form) => ({ ...form, description: event.target.value }))}
                  rows={3}
                />
              </div>
              <Button type="submit" className="bg-[#1a3a2a] text-white gap-2" disabled={createDiscipline.isPending}>
                <Save className="h-4 w-4" />
                {createDiscipline.isPending ? "Salvando..." : "Criar disciplina"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <h2 className="mb-4 text-lg font-bold text-foreground">Criar conta de aluno</h2>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                createStudent.mutate(studentForm);
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Numérica *</Label>
                  <Input
                    inputMode="numeric"
                    value={studentForm.numerica}
                    onChange={(event) => setStudentForm((form) => ({ ...form, numerica: cleanNumerica(event.target.value) }))}
                    required
                  />
                </div>
                <div>
                  <Label>Senha inicial *</Label>
                  <Input
                    type="password"
                    value={studentForm.senha}
                    onChange={(event) => setStudentForm((form) => ({ ...form, senha: event.target.value }))}
                    minLength={6}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Nome de guerra *</Label>
                <Input
                  value={studentForm.nomeGuerra}
                  onChange={(event) => setStudentForm((form) => ({ ...form, nomeGuerra: event.target.value }))}
                  required
                />
              </div>
              <Button type="submit" className="bg-[#1a3a2a] text-white gap-2" disabled={createStudent.isPending}>
                <Plus className="h-4 w-4" />
                {createStudent.isPending ? "Criando..." : "Criar aluno"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-5">
          <h2 className="mb-4 text-lg font-bold text-foreground">Alunos e suporte</h2>
          <div className="space-y-2">
            {students?.map((student: any) => (
              <div key={student.id} className="flex flex-col gap-3 rounded-md border p-3 lg:flex-row lg:items-center">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{student.nomeGuerra}</p>
                  <p className="text-xs text-muted-foreground">
                    {student.numerica} - {student.companhia}ª Companhia / {student.peloton}º Pelotão
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    type="password"
                    placeholder="Nova senha"
                    className="h-9 sm:w-40"
                    value={passwordByStudent[student.id] || ""}
                    onChange={(event) =>
                      setPasswordByStudent((current) => ({ ...current, [student.id]: event.target.value }))
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    disabled={!passwordByStudent[student.id] || resetStudentPassword.isPending}
                    onClick={() =>
                      resetStudentPassword.mutate({
                        studentId: student.id,
                        senha: passwordByStudent[student.id],
                      })
                    }
                  >
                    <KeyRound className="h-4 w-4" />
                    Trocar senha
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm("Remover este aluno e suas notas?")) {
                        deleteStudent.mutate({ studentId: student.id });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {!students?.length && <p className="text-sm text-muted-foreground">Nenhum aluno cadastrado.</p>}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <h2 className="mb-4 text-lg font-bold text-foreground">Ranking geral</h2>
            <div className="space-y-2">
              {ranking?.map((row: any) => (
                <div key={row.studentId} className="flex items-center gap-3 rounded-md border p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1a3a2a] text-sm font-bold text-white">
                    {row.position}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{row.nomeGuerra}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.numerica} - {row.companhia}ª Cia / {row.peloton}º Pel
                    </p>
                  </div>
                </div>
              ))}
              {!ranking?.length && <p className="text-sm text-muted-foreground">Ranking vazio.</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <h2 className="mb-4 text-lg font-bold text-foreground">Notas lançadas</h2>
            <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
              {allGrades?.map((entry: any) => (
                <div key={entry.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{entry.studentName} - {entry.numerica}</p>
                      <p className="text-xs text-muted-foreground">{entry.disciplineName}</p>
                    </div>
                    <Badge className="bg-[#c4a84b] text-[#1a1a1a]">{entry.grade ?? "-"}</Badge>
                  </div>
                  {entry.professorName && <p className="mt-2 text-xs text-muted-foreground">Professor: {entry.professorName}</p>}
                </div>
              ))}
              {!allGrades?.length && <p className="text-sm text-muted-foreground">Nenhuma nota lançada.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
