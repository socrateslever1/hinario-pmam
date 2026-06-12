import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Crown, Save, Shield, Trash2, UserCog, Users } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const weekdays = [
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
];

const conditionLabels: Record<string, string> = {
  pronto: "Pronto (PRONTO)",
  falta: "Falta (FT)",
  atraso: "Atraso (AT)",
  diverso_destino: "Diverso Destino (DD)",
  destino_ignorado: "Destino Ignorado (DI)",
  dispensa_medica: "Dispensa Médica (DM)",
  dispensa_administrativa: "Dispensa Administrativa (DA)",
};

const conditionAbbrs: Record<string, string> = {
  pronto: "PRONTO",
  falta: "FT",
  atraso: "AT",
  diverso_destino: "DD",
  destino_ignorado: "DI",
  dispensa_medica: "DM",
  dispensa_administrativa: "DA",
};

const getConditionBadgeStyle = (cond = "pronto") => {
  switch (cond) {
    case "pronto":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300";
    case "falta":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300";
    case "atraso":
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300";
    case "diverso_destino":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300";
    case "destino_ignorado":
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300";
    case "dispensa_medica":
      return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300";
    case "dispensa_administrativa":
      return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

function getMonday(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function studentLabel(student: any) {
  const suffix = student.condition && student.condition !== "pronto"
    ? ` (${conditionAbbrs[student.condition] || student.condition.toUpperCase()})`
    : "";
  return `${student.numerica} - ${student.nomeGuerra}${suffix}`;
}

export function ServiceScaleTab() {
  const utils = trpc.useUtils();
  const { data: access } = trpc.serviceScale.myAccess.useQuery();
  const { data: users } = trpc.users.list.useQuery(undefined, { enabled: access?.isMaster === true });
  const { data: assignments } = trpc.serviceScale.assignments.useQuery(undefined, { enabled: access?.isMaster === true });

  const [companhia, setCompanhia] = useState("1");
  const [peloton, setPeloton] = useState("1");
  const [weekStart, setWeekStart] = useState(getMonday());
  const [homemHoraId, setHomemHoraId] = useState("");
  const [alunoLigacaoId, setAlunoLigacaoId] = useState("");
  const [xerifeId, setXerifeId] = useState("");
  const [subXerifeId, setSubXerifeId] = useState("");
  const [dutyDate, setDutyDate] = useState("");
  const [aditamento, setAditamento] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [rotationDialogOpen, setRotationDialogOpen] = useState(false);
  const [rotationStartDate, setRotationStartDate] = useState("");
  const [cleaningByDay, setCleaningByDay] = useState<Record<number, string[]>>({});
  const [assignmentForm, setAssignmentForm] = useState({
    userId: "",
    level: "pelotao",
    companhia: "1",
    peloton: "1",
  });

  const selectedCompanhia = Number(companhia);
  const selectedPeloton = Number(peloton);

  useEffect(() => {
    if (!access?.scope) return;
    if (access.scope.companhia) setCompanhia(String(access.scope.companhia));
    if (access.scope.peloton) setPeloton(String(access.scope.peloton));
  }, [access?.scope]);

  const platoonQuery = trpc.serviceScale.getPlatoon.useQuery(
    { companhia: selectedCompanhia, peloton: selectedPeloton, weekStart },
    { enabled: Boolean(selectedCompanhia && selectedPeloton) }
  );

  const students = platoonQuery.data?.students ?? [];
  const roleOptions = useMemo(() => students.map((student: any) => ({
    value: String(student.id),
    label: studentLabel(student),
  })), [students]);

  useEffect(() => {
    const roles = platoonQuery.data?.roles;
    const week = platoonQuery.data?.week;

    setHomemHoraId(roles?.homemHoraId ? String(roles.homemHoraId) : "");
    setAlunoLigacaoId(roles?.alunoLigacaoId ? String(roles.alunoLigacaoId) : "");
    setAditamento(week?.aditamento || roles?.aditamento || "");
    setXerifeId(week?.xerifeId ? String(week.xerifeId) : "");
    setSubXerifeId(week?.subXerifeId ? String(week.subXerifeId) : "");
    setDutyDate(week?.dutyDate || "");
    setIsPublished(Boolean(week?.isPublished));

    const nextCleaning: Record<number, string[]> = {};
    for (const day of weekdays) {
      const existing = week?.cleaning?.find((item: any) => item.weekday === day.value);
      nextCleaning[day.value] = existing?.studentIds?.map((id: number) => String(id)) ?? [];
    }
    setCleaningByDay(nextCleaning);
  }, [platoonQuery.data]);

  const saveRoles = trpc.serviceScale.saveRoles.useMutation({
    onSuccess: async () => {
      toast.success("Funções fixas salvas");
      await platoonQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const saveWeeklyScale = trpc.serviceScale.saveWeeklyScale.useMutation({
    onSuccess: async () => {
      toast.success("Escala semanal salva");
      await Promise.all([
        platoonQuery.refetch(),
        utils.serviceScale.published.invalidate(),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  const updateStudentCondition = trpc.serviceScale.updateStudentCondition.useMutation({
    onSuccess: async () => {
      toast.success("Condição do aluno atualizada");
      await platoonQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const generateRotation = trpc.serviceScale.generateRotation.useMutation({
    onSuccess: async () => {
      toast.success("Escala rotativa de 10 dias gerada com sucesso!");
      setRotationDialogOpen(false);
      await platoonQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const saveAssignment = trpc.serviceScale.saveAssignment.useMutation({
    onSuccess: async () => {
      toast.success("Xerife configurado");
      setAssignmentForm({ userId: "", level: "pelotao", companhia: "1", peloton: "1" });
      await utils.serviceScale.assignments.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteAssignment = trpc.serviceScale.deleteAssignment.useMutation({
    onSuccess: async () => {
      toast.success("Configuração removida");
      await utils.serviceScale.assignments.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const canChangeScope = Boolean(access?.scope?.unrestricted || access?.assignment?.level === "companhia");
  const canChangeCompany = Boolean(access?.scope?.unrestricted);

  const updateCleaning = (weekday: number, slot: number, value: string) => {
    setCleaningByDay((current) => {
      const next = [...(current[weekday] ?? [])];
      next[slot] = value;
      return { ...current, [weekday]: next };
    });
  };

  const handleConditionChange = (studentId: number, condition: string) => {
    updateStudentCondition.mutate({
      studentId,
      condition: condition as any,
    });
  };

  const handleGenerateRotation = () => {
    if (!rotationStartDate) {
      toast.error("Selecione uma data de início");
      return;
    }
    generateRotation.mutate({
      companhia: selectedCompanhia,
      peloton: selectedPeloton,
      startDate: rotationStartDate,
    });
  };

  const handleSaveRoles = () => {
    saveRoles.mutate({
      companhia: selectedCompanhia,
      peloton: selectedPeloton,
      homemHoraId: homemHoraId ? Number(homemHoraId) : null,
      alunoLigacaoId: alunoLigacaoId ? Number(alunoLigacaoId) : null,
      aditamento: aditamento || null,
    });
  };

  const handleSaveWeek = (publish = isPublished) => {
    saveWeeklyScale.mutate({
      companhia: selectedCompanhia,
      peloton: selectedPeloton,
      weekStart,
      dutyDate: dutyDate || null,
      xerifeId: xerifeId ? Number(xerifeId) : null,
      subXerifeId: subXerifeId ? Number(subXerifeId) : null,
      aditamento: aditamento || null,
      isPublished: publish,
      cleaning: weekdays.map((day, index) => ({
        weekday: day.value,
        serviceDate: addDays(weekStart, index),
        studentIds: (cleaningByDay[day.value] ?? []).map(Number).filter(Boolean),
      })),
    });
  };

  const handleSaveAssignment = () => {
    if (!assignmentForm.userId) {
      toast.error("Selecione um usuário");
      return;
    }
    saveAssignment.mutate({
      userId: Number(assignmentForm.userId),
      level: assignmentForm.level as "principal" | "companhia" | "pelotao",
      companhia: assignmentForm.level === "principal" ? null : Number(assignmentForm.companhia),
      peloton: assignmentForm.level === "pelotao" ? Number(assignmentForm.peloton) : null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Companhia</p>
            <p className="mt-2 text-2xl font-bold text-[#1a3a2a]">{selectedCompanhia}ª</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pelotão</p>
            <p className="mt-2 text-2xl font-bold text-[#1a3a2a]">{selectedPeloton}º</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Efetivo</p>
            <p className="mt-2 text-2xl font-bold text-[#1a3a2a]">{students.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status</p>
            <Badge className={`mt-3 ${isPublished ? "bg-green-700 text-white" : "bg-[#c4a84b] text-[#1a1a1a]"}`}>
              {isPublished ? "Publicado" : "Rascunho"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="grid flex-1 gap-3 sm:grid-cols-4">
              <div>
                <Label>Companhia</Label>
                <Select value={companhia} onValueChange={setCompanhia} disabled={!canChangeCompany}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((item) => <SelectItem key={item} value={String(item)}>{item}ª Companhia</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pelotão</Label>
                <Select value={peloton} onValueChange={setPeloton} disabled={!canChangeScope || Boolean(access?.scope?.peloton)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2].map((item) => <SelectItem key={item} value={String(item)}>{item}º Pelotão</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Semana</Label>
                <Input type="date" value={weekStart} onChange={(event) => {
                  const val = event.target.value;
                  if (val) {
                    setWeekStart(getMonday(new Date(`${val}T00:00:00`)));
                  }
                }} />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full gap-2 border-[#c4a84b] text-[#c4a84b] hover:bg-[#c4a84b]/10 hover:text-[#c4a84b]"
                  onClick={() => {
                    setRotationStartDate(weekStart);
                    setRotationDialogOpen(true);
                  }}
                >
                  <CalendarDays className="h-4 w-4" />
                  Gerar Escala Rotativa
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="border-border/50">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-[#c4a84b]" />
              <h2 className="text-lg font-bold text-foreground">Funções fixas</h2>
            </div>
            <div>
              <Label>Homem-Hora</Label>
              <Select value={homemHoraId || "none"} onValueChange={(value) => setHomemHoraId(value === "none" ? "" : value)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não definido</SelectItem>
                  {roleOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Aluno de Ligação</Label>
              <Select value={alunoLigacaoId || "none"} onValueChange={(value) => setAlunoLigacaoId(value === "none" ? "" : value)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não definido</SelectItem>
                  {roleOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Aditamento / referência</Label>
              <Input value={aditamento} onChange={(event) => setAditamento(event.target.value)} placeholder="Ex.: Aditamento nº 12/2026" />
            </div>
            <Button className="w-full gap-2 bg-[#1a3a2a] text-white" onClick={handleSaveRoles} disabled={saveRoles.isPending}>
              <Save className="h-4 w-4" />
              Salvar funções fixas
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#c4a84b]" />
              <h2 className="text-lg font-bold text-foreground">Escala da semana</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Dia de Serviço (Opcional)</Label>
                <Input type="date" value={dutyDate} onChange={(e) => setDutyDate(e.target.value)} />
              </div>
              <div>
                <Label>Xerife</Label>
                <Select value={xerifeId || "none"} onValueChange={(value) => setXerifeId(value === "none" ? "" : value)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não definido</SelectItem>
                    {roleOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sub-xerife</Label>
                <Select value={subXerifeId || "none"} onValueChange={(value) => setSubXerifeId(value === "none" ? "" : value)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não definido</SelectItem>
                    {roleOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              {weekdays.map((day, index) => (
                <div key={day.value} className="rounded-lg border border-border/60 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[#1a3a2a]">{day.label}</p>
                    <span className="text-xs text-muted-foreground">{new Date(`${addDays(weekStart, index)}T00:00:00`).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[0, 1].map((slot) => (
                      <Select
                        key={slot}
                        value={cleaningByDay[day.value]?.[slot] || "none"}
                        onValueChange={(value) => updateCleaning(day.value, slot, value === "none" ? "" : value)}
                      >
                        <SelectTrigger><SelectValue placeholder={`Faxina ${slot + 1}`} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Não definido</SelectItem>
                          {roleOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" className="gap-2" onClick={() => handleSaveWeek(false)} disabled={saveWeeklyScale.isPending}>
                <Save className="h-4 w-4" />
                Salvar rascunho
              </Button>
              <Button className="gap-2 bg-[#c4a84b] text-[#1a1a1a] hover:bg-[#b39740]" onClick={() => handleSaveWeek(true)} disabled={saveWeeklyScale.isPending}>
                <Check className="h-4 w-4" />
                Publicar quadro
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {access?.isMaster && (
        <Card className="border-border/50">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-[#c4a84b]" />
              <h2 className="text-lg font-bold text-foreground">Configurar Xerifes</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_160px_150px_150px_auto] md:items-end">
              <div>
                <Label>Usuário</Label>
                <Select value={assignmentForm.userId} onValueChange={(value) => setAssignmentForm((form) => ({ ...form, userId: value }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o usuário" /></SelectTrigger>
                  <SelectContent>
                    {(users ?? []).filter((user: any) => user.role !== "master").map((user: any) => (
                      <SelectItem key={user.id} value={String(user.id)}>{user.name || user.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nível</Label>
                <Select value={assignmentForm.level} onValueChange={(value) => setAssignmentForm((form) => ({ ...form, level: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="principal">Principal</SelectItem>
                    <SelectItem value="companhia">Companhia</SelectItem>
                    <SelectItem value="pelotao">Pelotão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Companhia</Label>
                <Select value={assignmentForm.companhia} onValueChange={(value) => setAssignmentForm((form) => ({ ...form, companhia: value }))} disabled={assignmentForm.level === "principal"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((item) => <SelectItem key={item} value={String(item)}>{item}ª Companhia</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pelotão</Label>
                <Select value={assignmentForm.peloton} onValueChange={(value) => setAssignmentForm((form) => ({ ...form, peloton: value }))} disabled={assignmentForm.level !== "pelotao"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2].map((item) => <SelectItem key={item} value={String(item)}>{item}º Pelotão</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button className="gap-2 bg-[#1a3a2a] text-white" onClick={handleSaveAssignment} disabled={saveAssignment.isPending}>
                <Shield className="h-4 w-4" />
                Salvar
              </Button>
            </div>

            <div className="space-y-2">
              {(assignments ?? []).map((assignment: any) => (
                <div key={assignment.id} className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">{assignment.userName || assignment.userEmail}</p>
                    <p className="text-xs text-muted-foreground">
                      {assignment.level === "principal" && "Xerife Principal"}
                      {assignment.level === "companhia" && `${assignment.companhia}ª Companhia`}
                      {assignment.level === "pelotao" && `${assignment.companhia}ª Companhia / ${assignment.peloton}º Pelotão`}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" className="gap-1 text-destructive" onClick={() => deleteAssignment.mutate({ id: assignment.id })}>
                    <Trash2 className="h-4 w-4" />
                    Remover
                  </Button>
                </div>
              ))}
              {!assignments?.length && (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Nenhum xerife específico configurado. O master continua com acesso total.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#c4a84b]" />
            <h2 className="text-lg font-bold text-foreground">Efetivo do Pelotão</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {students.map((student: any) => (
              <div key={student.id} className="flex flex-col justify-between rounded-lg border bg-white p-3 text-sm dark:bg-zinc-900">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-[#1a3a2a] dark:text-green-400">{student.nomeGuerra}</p>
                    <Badge className={`border text-[10px] font-semibold px-2 py-0.5 ${getConditionBadgeStyle(student.condition)}`}>
                      {conditionLabels[student.condition || "pronto"]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{student.numerica} - {student.companhia}ª Companhia / {student.peloton}º Pelotão</p>
                </div>
                <div className="mt-3">
                  <Label className="text-[11px] text-muted-foreground">Alterar Condição</Label>
                  <Select
                    value={student.condition || "pronto"}
                    onValueChange={(value) => handleConditionChange(student.id, value)}
                    disabled={updateStudentCondition.isPending}
                  >
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(conditionLabels).map(([val, lbl]) => (
                        <SelectItem key={val} value={val} className="text-xs">
                          {lbl}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
            {!students.length && (
              <p className="text-sm text-muted-foreground">Nenhum aluno cadastrado para este Pelotão.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={rotationDialogOpen} onOpenChange={setRotationDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Gerar Escala Rotativa de 10 Dias</DialogTitle>
            <DialogDescription>
              Esta ação calculará automaticamente as datas de serviço para os próximos 10 dias úteis (segunda a sexta), iniciando a partir da data informada, sequenciando os 10 pelotões da 1ª à 5ª Companhia.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rotation-date">Data de Início do Serviço</Label>
              <Input
                id="rotation-date"
                type="date"
                value={rotationStartDate}
                onChange={(e) => setRotationStartDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                O pelotão atual ({selectedCompanhia}ª Cia / {selectedPeloton}º Pel) será escalado para esta data. Os outros pelotões serão escalados nos dias úteis subsequentes.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRotationDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-[#1a3a2a] text-white hover:bg-[#1a3a2a]/90"
              onClick={handleGenerateRotation}
              disabled={generateRotation.isPending}
            >
              {generateRotation.isPending ? "Gerando..." : "Confirmar e Gerar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
