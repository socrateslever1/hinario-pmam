import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Save, KeyRound, Pencil, Youtube } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function GradeAdminTab() {
  const utils = trpc.useUtils();
  const [companhia, setCompanhia] = useState("1");
  const [peloton, setPeloton] = useState("1");

  const { data: scaleAccess } = trpc.serviceScale.myAccess.useQuery();
  const { data: disciplines } = trpc.grades.availableDisciplines.useQuery({
    companhia: Number(companhia),
    peloton: Number(peloton),
  });
  const { data: students } = trpc.gradeAdmin.students.useQuery();
  const { data: allGrades } = trpc.gradeAdmin.allGrades.useQuery();
  const { data: ranking } = trpc.gradeAdmin.ranking.useQuery({
    companhia: Number(companhia),
    peloton: Number(peloton),
  });

  const isLocked = Boolean(
    scaleAccess?.assignment &&
    scaleAccess.assignment.level !== "principal" &&
    !scaleAccess.isMaster
  );

  useEffect(() => {
    if (scaleAccess?.assignment) {
      if (scaleAccess.assignment.companhia) setCompanhia(String(scaleAccess.assignment.companhia));
      if (scaleAccess.assignment.peloton) setPeloton(String(scaleAccess.assignment.peloton));
    }
  }, [scaleAccess]);
  const [disciplineForm, setDisciplineForm] = useState({
    name: "",
    description: "",
    startDate: "",
    examDate: "",
    status: "em_breve",
    studyMaterialUrl: "",
    studyMaterialName: "",
  });
  const [gaivotasLinks, setGaivotasLinks] = useState<{ title: string; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [editingDiscipline, setEditingDiscipline] = useState<any | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [studentForm, setStudentForm] = useState({ numerica: "", nomeGuerra: "", senha: "" });
  const [passwordByStudent, setPasswordByStudent] = useState<Record<number, string>>({});

  const resetDisciplineForm = () => {
    setDisciplineForm({
      name: "",
      description: "",
      startDate: "",
      examDate: "",
      status: "em_breve",
      studyMaterialUrl: "",
      studyMaterialName: "",
    });
    setGaivotasLinks([]);
    setEditingDiscipline(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) throw new Error("Erro ao enviar arquivo");

      const data = await response.json();
      setDisciplineForm(prev => ({
        ...prev,
        studyMaterialUrl: data.url,
        studyMaterialName: file.name
      }));
      toast.success("Material enviado com sucesso!");
    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error("Erro ao fazer upload do material");
    } finally {
      setIsUploading(false);
    }
  };

  const createDiscipline = trpc.gradeAdmin.createDiscipline.useMutation({
    onSuccess: () => {
      toast.success("Disciplina criada");
      resetDisciplineForm();
      setIsFormOpen(false);
      utils.grades.availableDisciplines.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateDiscipline = trpc.gradeAdmin.updateDiscipline.useMutation({
    onSuccess: () => {
      toast.success("Disciplina atualizada");
      resetDisciplineForm();
      setIsFormOpen(false);
      utils.grades.availableDisciplines.invalidate();
      utils.gradeAdmin.allGrades.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteDiscipline = trpc.gradeAdmin.deleteDiscipline.useMutation({
    onSuccess: () => {
      toast.success("Disciplina excluída do catálogo");
      utils.grades.availableDisciplines.invalidate();
      utils.gradeAdmin.allGrades.invalidate();
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
      {/* Selector Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-lg border border-border/50 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-foreground">Pelotão de Referência</h2>
          <p className="text-xs text-muted-foreground">Configurando cronograma de aulas para o pelotão selecionado.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={companhia} onValueChange={setCompanhia} disabled={isLocked}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((item) => (
                <SelectItem key={item} value={String(item)}>
                  {item}ª Companhia
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={peloton} onValueChange={setPeloton} disabled={isLocked}>
            <SelectTrigger className="w-[120px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2].map((item) => (
                <SelectItem key={item} value={String(item)}>
                  {item}º Pelotão
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Disciplinas cadastradas</h2>
              <Button
                size="sm"
                className="bg-[#1a3a2a] text-white gap-2"
                onClick={() => {
                  resetDisciplineForm();
                  setIsFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4" /> Nova disciplina
              </Button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {disciplines?.map((disc: any) => (
                <div key={disc.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{disc.name}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      {disc.status === "em_andamento" && <Badge className="bg-green-600 hover:bg-green-600 text-white text-[10px]">Em Andamento</Badge>}
                      {disc.status === "finalizado" && <Badge variant="secondary" className="text-[10px]">Finalizado</Badge>}
                      {(!disc.status || disc.status === "em_breve") && <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-[10px]">Em Breve</Badge>}
                      {disc.startDate && (
                        <span className="text-[10px] text-muted-foreground">
                          Início: {new Date(disc.startDate).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-[#c4a84b] hover:text-[#c4a84b] hover:bg-[#c4a84b]/10"
                      onClick={() => {
                        setEditingDiscipline(disc);
                        const getFormattedDate = (val: any) => {
                          if (!val) return "";
                          const d = new Date(val);
                          if (isNaN(d.getTime())) return "";
                          return d.toISOString().split("T")[0];
                        };
                        let parsedGaivotas: any[] = [];
                        if (disc.gaivotasLinks) {
                          try {
                            parsedGaivotas = JSON.parse(disc.gaivotasLinks);
                          } catch {
                            parsedGaivotas = [];
                          }
                        }
                        setDisciplineForm({
                          name: disc.name,
                          description: disc.description || "",
                          startDate: getFormattedDate(disc.startDate),
                          examDate: getFormattedDate(disc.examDate),
                          status: disc.status || "em_breve",
                          studyMaterialUrl: disc.studyMaterialUrl || "",
                          studyMaterialName: disc.studyMaterialName || "",
                        });
                        setGaivotasLinks(parsedGaivotas);
                        setIsFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm(`Remover a disciplina "${disc.name}" do catálogo? As notas existentes continuarão salvas, mas ela não estará disponível para novos lançamentos.`)) {
                          deleteDiscipline.mutate({ id: disc.id });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {!disciplines?.length && (
                <p className="text-sm text-muted-foreground">Nenhuma disciplina cadastrada.</p>
              )}
            </div>
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

      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) resetDisciplineForm();
      }}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] overflow-y-auto p-4 sm:max-w-2xl sm:p-6 bg-white text-foreground">
          <DialogHeader>
            <DialogTitle>
              {editingDiscipline ? "Editar disciplina" : "Criar disciplina"}
            </DialogTitle>
            <DialogDescription>
              Insira as informações básicas, cronograma, materiais de estudo e links adicionais da disciplina.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const payload = {
                name: disciplineForm.name,
                description: disciplineForm.description || undefined,
                startDate: disciplineForm.startDate || null,
                examDate: disciplineForm.examDate || null,
                status: disciplineForm.status,
                studyMaterialUrl: disciplineForm.studyMaterialUrl || null,
                studyMaterialName: disciplineForm.studyMaterialName || null,
                gaivotasLinks: gaivotasLinks.length > 0 ? JSON.stringify(gaivotasLinks) : null,
                companhia: Number(companhia),
                peloton: Number(peloton),
              };
              if (editingDiscipline) {
                updateDiscipline.mutate({
                  id: editingDiscipline.id,
                  ...payload,
                });
              } else {
                createDiscipline.mutate(payload);
              }
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
                rows={2}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Data de Início</Label>
                <Input
                  type="date"
                  value={disciplineForm.startDate}
                  onChange={(event) => setDisciplineForm((form) => ({ ...form, startDate: event.target.value }))}
                />
              </div>
              <div>
                <Label>Data da Prova</Label>
                <Input
                  type="date"
                  value={disciplineForm.examDate}
                  onChange={(event) => setDisciplineForm((form) => ({ ...form, examDate: event.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={disciplineForm.status}
                onChange={(event) => setDisciplineForm((form) => ({ ...form, status: event.target.value }))}
              >
                <option value="em_breve">Em Breve</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="finalizado">Finalizado</option>
              </select>
            </div>
            <div>
              <Label>Material de Estudos (opcional)</Label>
              {disciplineForm.studyMaterialUrl ? (
                <div className="mt-1 flex items-center justify-between rounded-md border border-dashed p-2 bg-muted/20">
                  <span className="text-xs font-medium truncate max-w-[200px]" title={disciplineForm.studyMaterialName || "Material"}>
                    📎 {disciplineForm.studyMaterialName || "Material de Estudos"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setDisciplineForm(prev => ({ ...prev, studyMaterialUrl: "", studyMaterialName: "" }))}
                  >
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="mt-1 flex gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    disabled={isUploading}
                    onChange={handleFileUpload}
                    className="text-xs"
                  />
                  {isUploading && <span className="text-xs text-muted-foreground flex items-center">Enviando...</span>}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Youtube className="h-4 w-4 text-red-500" />
                Vídeos (Gaivotas)
              </Label>
              
              {gaivotasLinks.length > 0 && (
                <div className="space-y-1.5 rounded-md border p-2 bg-muted/10 max-h-40 overflow-y-auto">
                  {gaivotasLinks.map((item, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 text-xs bg-white p-1.5 rounded border">
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-foreground block truncate">{item.title}</span>
                        <span className="text-muted-foreground block truncate">{item.url}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setGaivotasLinks(current => current.filter((_, i) => i !== index));
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-2 bg-muted/20 p-2.5 rounded-md border border-dashed">
                <div>
                  <Input
                    placeholder="Título do vídeo"
                    className="h-8 text-xs"
                    id="new-gaivota-title"
                  />
                </div>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="URL do vídeo"
                    className="h-8 text-xs flex-1"
                    id="new-gaivota-url"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => {
                      const titleInput = document.getElementById("new-gaivota-title") as HTMLInputElement;
                      const urlInput = document.getElementById("new-gaivota-url") as HTMLInputElement;
                      const title = titleInput?.value?.trim();
                      const url = urlInput?.value?.trim();
                      if (!title || !url) {
                        toast.error("Preencha título e URL");
                        return;
                      }
                      setGaivotasLinks(current => [...current, { title, url }]);
                      if (titleInput) titleInput.value = "";
                      if (urlInput) urlInput.value = "";
                    }}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetDisciplineForm();
                  setIsFormOpen(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#1a3a2a] text-white gap-2" disabled={createDiscipline.isPending || updateDiscipline.isPending}>
                <Save className="h-4 w-4" />
                {createDiscipline.isPending || updateDiscipline.isPending ? "Salvando..." : editingDiscipline ? "Salvar alterações" : "Criar disciplina"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
