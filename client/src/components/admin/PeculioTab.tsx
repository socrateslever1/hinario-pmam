/**
 * MANUS_LOCK: PECULIO_CRITICAL_MODULE
 * Nao alterar deliberadamente este arquivo sem autorizacao explicita do dono do projeto.
 * Este componente controla frequencia, fechamento, chegada tardia, justificativas e assinatura do Peculio.
 * Mudancas aqui devem preservar regras de negocio, permissoes do Xerife Geral/Xerife nomeado e auditoria por aluno.
 */
import { useEffect, useMemo, useState } from "react";
import { Check, Clock, FileText, Lock, Printer, Save, ShieldCheck, UnlockKeyhole, Users } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const statusList = [
  { value: "pronto", label: "PRONTO", color: "bg-green-700 text-white hover:bg-green-800" },
  { value: "falta", label: "FT", color: "bg-red-600 text-white hover:bg-red-700" },
  { value: "atraso", label: "AT", color: "bg-amber-500 text-black hover:bg-amber-600" },
  { value: "diverso_destino", label: "DD", color: "bg-blue-600 text-white hover:bg-blue-700" },
  { value: "destino_ignorado", label: "DI", color: "bg-gray-600 text-white hover:bg-gray-700" },
  { value: "dispensa_medica", label: "DM", color: "bg-orange-600 text-white hover:bg-orange-700" },
  { value: "dispensa_administrativa", label: "DA", color: "bg-purple-600 text-white hover:bg-purple-700" },
];

const legendDetails = [
  { abbr: "FT", name: "Falta" },
  { abbr: "AT", name: "Atraso" },
  { abbr: "DD", name: "Diverso Destino" },
  { abbr: "DI", name: "Destino Ignorado" },
  { abbr: "DM", name: "Dispensa Médica" },
  { abbr: "DA", name: "Dispensa Administrativa" },
];

const conditionAbbrs: Record<string, string> = {
  pronto: "PRONTO",
  falta: "FT",
  atraso: "AT",
  diverso_destino: "DD",
  destino_ignorado: "DI",
  dispensa_medica: "DM",
  dispensa_administrativa: "DA",
};

type StudentStatusState = {
  status: string;
  observacao: string;
  arrivalTime: string | null;
  justificationNote: string;
  justificationStatus: string | null;
};

interface PeculioTabProps {
  companhia?: string;
  setCompanhia?: (val: string) => void;
  peloton?: string;
  setPeloton?: (val: string) => void;
}

export function PeculioTab({
  companhia: propCompanhia,
  setCompanhia: propSetCompanhia,
  peloton: propPeloton,
  setPeloton: propSetPeloton,
}: PeculioTabProps = {}) {
  const { data: access } = trpc.serviceScale.myAccess.useQuery();

  const [localCompanhia, localSetCompanhia] = useState("1");
  const [localPeloton, localSetPeloton] = useState("1");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const companhia = propCompanhia ?? localCompanhia;
  const setCompanhia = propSetCompanhia ?? localSetCompanhia;
  const peloton = propPeloton ?? localPeloton;
  const setPeloton = propSetPeloton ?? localSetPeloton;

  const isPropsPassed = propCompanhia !== undefined && propPeloton !== undefined;

  // Instructions & Signatures
  const [instrucaoLocal, setInstrucaoLocal] = useState("");
  const [instrucaoDisciplina, setInstrucaoDisciplina] = useState("");
  const [instrucaoExterna, setInstrucaoExterna] = useState(false);
  const [chefeTurma, setChefeTurma] = useState("");
  const [subchefeTurma, setSubchefeTurma] = useState("");
  const [cmtPel, setCmtPel] = useState("");
  const [releaseReason, setReleaseReason] = useState("");
  const [entryTime, setEntryTime] = useState("05:00");

  // Student statuses state
  const [studentStatuses, setStudentStatuses] = useState<Record<number, StudentStatusState>>({});
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);

  const selectedCompanhia = Number(companhia);
  const selectedPeloton = Number(peloton);

  useEffect(() => {
    if (isPropsPassed || !access?.scope) return;
    if (access.scope.companhia) setCompanhia(String(access.scope.companhia));
    if (access.scope.peloton) setPeloton(String(access.scope.peloton));
  }, [access?.scope, isPropsPassed]);

  // Load students for platoon
  const studentsQuery = trpc.serviceScale.students.useQuery(
    { companhia: selectedCompanhia, peloton: selectedPeloton },
    { enabled: Boolean(selectedCompanhia && selectedPeloton) }
  );

  // Load Peculio Report for selected date
  const peculioQuery = trpc.peculio.get.useQuery(
    { companhia: selectedCompanhia, peloton: selectedPeloton, date },
    { enabled: Boolean(selectedCompanhia && selectedPeloton && date) }
  );

  const students = studentsQuery.data ?? [];
  const lock = peculioQuery.data?.lock;
  const isLocked = Boolean(lock?.isLocked);
  const canRelease = Boolean(lock?.canRelease);
  const canEdit = lock?.canEdit !== false;

  useEffect(() => {
    if (peculioQuery.data) {
      const { report, statuses } = peculioQuery.data;

      // Update header
      setInstrucaoLocal(report?.instrucaoLocal || "");
      setInstrucaoDisciplina(report?.instrucaoDisciplina || "");
      setInstrucaoExterna(Boolean(report?.instrucaoExterna));
      setChefeTurma(report?.chefeTurma || "");
      setSubchefeTurma(report?.subchefeTurma || "");
      setCmtPel(report?.cmtPel || "");
      setEntryTime(report?.entryTime || peculioQuery.data.lock?.entryTime || "05:00");

      // Update statuses
      const nextStatuses: Record<number, StudentStatusState> = {};
      for (const student of students) {
        const existing = statuses.find((s) => s.studentId === student.id);
        nextStatuses[student.id] = {
          status: existing?.status || "pronto",
          observacao: existing?.observacao || "",
          arrivalTime: existing?.arrivalTime || null,
          justificationNote: existing?.justificationNote || "",
          justificationStatus: existing?.justificationStatus || null,
        };
      }
      setStudentStatuses(nextStatuses);
    }
  }, [peculioQuery.data, students]);

  const savePeculio = trpc.peculio.save.useMutation({
    onSuccess: async () => {
      toast.success("Pecúlio salvo com sucesso!");
      await peculioQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const releasePeculio = trpc.peculio.release.useMutation({
    onSuccess: async () => {
      toast.success("Pecúlio liberado temporariamente.");
      setReleaseReason("");
      await peculioQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const closePeculio = trpc.peculio.close.useMutation({
    onSuccess: async () => {
      toast.success("Pecúlio fechado e autenticado.");
      await peculioQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const registerArrival = trpc.peculio.registerArrival.useMutation({
    onSuccess: async () => {
      toast.success("Chegada registrada com hora do sistema.");
      await peculioQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const requestJustification = trpc.peculio.requestJustification.useMutation({
    onSuccess: async () => {
      toast.success("Justificativa enviada ao Xerife Geral.");
      await peculioQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const reviewJustification = trpc.peculio.reviewJustification.useMutation({
    onSuccess: async () => {
      toast.success("Justificativa analisada.");
      await peculioQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const handleStatusChange = (studentId: number, status: string) => {
    if (!canEdit) return;
    setStudentStatuses((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        status,
        arrivalTime: current[studentId]?.arrivalTime ?? null,
        justificationNote: current[studentId]?.justificationNote ?? "",
        justificationStatus: current[studentId]?.justificationStatus ?? null,
      },
    }));
  };

  const handleObservacaoChange = (studentId: number, observacao: string) => {
    if (!canEdit) return;
    setStudentStatuses((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        observacao,
        arrivalTime: current[studentId]?.arrivalTime ?? null,
        justificationNote: current[studentId]?.justificationNote ?? "",
        justificationStatus: current[studentId]?.justificationStatus ?? null,
      },
    }));
  };

  const buildStatusesPayload = () => students.map((student) => {
    const entry = studentStatuses[student.id] || { status: "pronto", observacao: "", arrivalTime: null };
    return {
      studentId: student.id,
      status: entry.status as any,
      observacao: entry.observacao || null,
      arrivalTime: entry.arrivalTime,
    };
  });

  const buildPeculioPayload = () => ({
    companhia: selectedCompanhia,
    peloton: selectedPeloton,
    date,
    instrucaoLocal: instrucaoLocal || null,
    instrucaoDisciplina: instrucaoDisciplina || null,
    instrucaoExterna,
    entryTime,
    chefeTurma: chefeTurma || null,
    subchefeTurma: subchefeTurma || null,
    cmtPel: cmtPel || null,
    statuses: buildStatusesPayload(),
  });

  const handleSave = () => {
    if (!canEdit) {
      toast.error("Pecúlio fechado. Solicite liberação ao Xerife Geral.");
      return;
    }
    savePeculio.mutate(buildPeculioPayload());
  };

  const handleClose = async () => {
    if (!canEdit) {
      toast.error("Pecúlio fechado. Solicite liberação ao Xerife Geral.");
      return;
    }
    const confirmed = window.confirm("Fechar o pecúlio e autenticar com seu usuário?");
    if (!confirmed) return;
    try {
      await savePeculio.mutateAsync(buildPeculioPayload());
      await closePeculio.mutateAsync({
        companhia: selectedCompanhia,
        peloton: selectedPeloton,
        date,
        entryTime,
      });
    } catch {
      // Os mutations já mostram a mensagem de erro ao usuário.
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRelease = () => {
    releasePeculio.mutate({
      companhia: selectedCompanhia,
      peloton: selectedPeloton,
      date,
      reason: releaseReason || null,
      hours: 12,
    });
  };

  const handleRegisterArrival = (studentId: number) => {
    registerArrival.mutate({
      companhia: selectedCompanhia,
      peloton: selectedPeloton,
      date,
      studentId,
    });
  };

  const handleRequestJustification = (studentId: number) => {
    const note = window.prompt("Explique por que a frequência precisa ser corrigida pelo Xerife Geral:");
    if (!note?.trim()) return;
    requestJustification.mutate({
      companhia: selectedCompanhia,
      peloton: selectedPeloton,
      date,
      studentId,
      note: note.trim(),
    });
  };

  const handleReviewJustification = (studentId: number, approved: boolean) => {
    reviewJustification.mutate({
      companhia: selectedCompanhia,
      peloton: selectedPeloton,
      date,
      studentId,
      approved,
      approvedStatus: "pronto",
    });
  };

  const canChangeCompany = Boolean(access?.scope?.unrestricted);
  const canChangeScope = Boolean(access?.scope?.unrestricted || access?.assignment?.level === "companhia");

  const formattedDate = date ? new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR") : "";
  const statusNames = useMemo(() => ({
    falta: "Falta",
    atraso: "Atraso",
    diverso_destino: "Diverso Destino",
    destino_ignorado: "Destino Ignorado",
    dispensa_medica: "Dispensa Médica",
    dispensa_administrativa: "Dispensa Administrativa",
  }), []);
  const changedRows = useMemo(() => students
    .map((student) => {
      const entry = studentStatuses[student.id] || { status: "pronto", observacao: "", arrivalTime: null, justificationNote: "", justificationStatus: null };
      return {
        student,
        status: entry.status,
        observacao: entry.observacao.trim(),
        arrivalTime: entry.arrivalTime,
        justificationStatus: entry.justificationStatus,
      };
    })
    .filter((item) => item.status !== "pronto" || item.arrivalTime || item.justificationStatus), [students, studentStatuses]);
  const getStatusName = (status: string) => statusNames[status as keyof typeof statusNames] ?? status;
  const formatDateTime = (value?: string | null) => value ? new Date(value).toLocaleString("pt-BR") : "";

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* 1. Header controls */}
      <Card className="border-border/50 bg-white dark:bg-zinc-900 print:hidden">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className={`grid min-w-0 flex-1 grid-cols-1 gap-3 ${isPropsPassed ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
              {!isPropsPassed && (
                <>
                  <div>
                    <Label>Companhia</Label>
                    <select
                      value={companhia}
                      onChange={(e) => setCompanhia(e.target.value)}
                      disabled={!canChangeCompany}
                      className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-10 sm:text-sm"
                    >
                      {[1, 2, 3, 4, 5].map((item) => (
                        <option key={item} value={String(item)}>
                          {item}ª Companhia
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Pelotão</Label>
                    <select
                      value={peloton}
                      onChange={(e) => setPeloton(e.target.value)}
                      disabled={!canChangeScope || Boolean(access?.scope?.peloton)}
                      className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-10 sm:text-sm"
                    >
                      {[1, 2].map((item) => (
                        <option key={item} value={String(item)}>
                          {item}º Pelotão
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div>
                <Label>Data do Pecúlio</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 text-base sm:h-10 sm:text-sm" />
              </div>
              <div>
                <Label>Horário de entrada</Label>
                <Input
                  type="time"
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value || "05:00")}
                  disabled={!canEdit}
                  className="h-11 text-base sm:h-10 sm:text-sm"
                />
              </div>
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end">
                <Button className="min-h-11 flex-1 gap-2 bg-[#1a3a2a] text-white touch-manipulation" onClick={handleSave} disabled={savePeculio.isPending || !canEdit}>
                  <Save className="h-4 w-4" />
                  Salvar Pecúlio
                </Button>
                <Button
                  className="min-h-11 flex-1 gap-2 bg-[#c4a84b] font-bold text-black hover:bg-[#b8973e] touch-manipulation"
                  onClick={handleClose}
                  disabled={savePeculio.isPending || closePeculio.isPending || !canEdit}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Fechar
                </Button>
                <Button variant="outline" className="min-h-11 gap-2 touch-manipulation" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {lock && (
        <Card className={`print:hidden border ${isLocked ? "border-red-500/30 bg-red-500/5" : lock.isReleased ? "border-amber-500/30 bg-amber-500/5" : "border-green-600/20 bg-green-600/5"}`}>
          <CardContent className="flex min-w-0 flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              {lock.closedAt ? (
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#c4a84b]" />
              ) : isLocked ? (
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              ) : (
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">
                  {lock.closedAt ? "Pecúlio fechado e autenticado" : isLocked ? "Pecúlio fechado para edição" : lock.isReleased ? "Pecúlio liberado temporariamente" : "Pecúlio aberto para edição"}
                </p>
                <p className="break-words text-xs leading-relaxed text-muted-foreground">
                  Entrada: {lock.entryTime || entryTime} | Fechamento automático: {new Date(lock.lockedAt).toLocaleString("pt-BR")}{lock.unlockedUntil ? ` | Liberado até: ${new Date(lock.unlockedUntil).toLocaleString("pt-BR")}` : ""}
                </p>
                {lock.lateArrivalUntil && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Chegada tardia sem falta até {new Date(lock.lateArrivalUntil).toLocaleString("pt-BR")}. No horário de entrada ou após, registra como falta.
                  </p>
                )}
                {lock.closedAt && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Fechado por {lock.closedByName || "usuário autenticado"} em {new Date(lock.closedAt).toLocaleString("pt-BR")}
                  </p>
                )}
                {lock.releaseReason && <p className="mt-1 text-xs text-muted-foreground">Motivo: {lock.releaseReason}</p>}
              </div>
            </div>
            {isLocked && canRelease && (
              <div className="flex w-full min-w-0 flex-col gap-2 md:w-auto md:min-w-[360px] md:flex-row">
                <Input
                  placeholder="Motivo da liberação"
                  value={releaseReason}
                  onChange={(e) => setReleaseReason(e.target.value)}
                  className="h-11 text-base sm:h-9 sm:text-xs"
                />
                <Button size="sm" className="min-h-10 gap-2 bg-[#c4a84b] font-bold text-black hover:bg-[#b8973e] touch-manipulation" onClick={handleRelease} disabled={releasePeculio.isPending}>
                  <UnlockKeyhole className="h-4 w-4" />
                  Liberar 12h
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}      {/* 2. Matriz de frequência - Desktop View */}
      <Card className="hidden xl:block border-border/50 bg-white dark:bg-zinc-900 print:hidden">
        <CardContent className="p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-[#c4a84b]" />
              <h2 className="text-base font-bold text-foreground">Matriz de Frequência e Alterações</h2>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">Data: {formattedDate}</span>
          </div>

          <div className="w-full overflow-x-auto rounded-md border border-border/60 overscroll-x-contain">
            <Table className="min-w-[1000px]">
              <TableHeader className="bg-muted/40">
                <TableRow className="h-8">
                  <TableHead className="w-[50px] text-center text-xs font-bold py-1">Nº</TableHead>
                  <TableHead className="text-xs font-bold py-1">Aluno</TableHead>
                  {statusList.map((st) => (
                    <TableHead key={st.value} className={`text-center text-xs font-bold py-1 ${st.value === "pronto" ? "w-[72px]" : "w-[56px]"}`}>
                      {st.label}
                    </TableHead>
                  ))}
                  <TableHead className="text-xs font-bold py-1">Situação / Observação</TableHead>
                  <TableHead className="w-[170px] text-xs font-bold py-1">Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const entry = studentStatuses[student.id] || { status: "pronto", observacao: "", arrivalTime: null, justificationNote: "", justificationStatus: null };
                  return (
                    <TableRow key={student.id} className="hover:bg-muted/20 h-9">
                      <TableCell className="text-center text-xs font-semibold py-1 px-2">{student.numerica}</TableCell>
                      <TableCell className="text-xs font-bold py-1 px-2 text-[#1a3a2a] dark:text-green-400">
                        {student.nomeGuerra}
                      </TableCell>
                      {statusList.map((st) => {
                        const isSelected = entry.status === st.value;
                        return (
                          <TableCell key={st.value} className="text-center p-1">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.id, st.value)}
                              disabled={!canEdit}
                              className={`${st.value === "pronto" ? "h-6 min-w-[50px] rounded px-1" : "h-6 w-6 rounded-full"} text-[9px] font-black leading-none transition-colors touch-manipulation ${
                                isSelected ? st.color + " shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              {st.label}
                            </button>
                          </TableCell>
                        );
                      })}
                      <TableCell className="p-1">
                        <Input
                          placeholder="Observação..."
                          value={entry.observacao}
                          onChange={(e) => handleObservacaoChange(student.id, e.target.value)}
                          disabled={!canEdit}
                          className="h-7 text-xs px-2 py-0.5"
                        />
                      </TableCell>
                      <TableCell className="p-1 text-[10px]">
                        {entry.arrivalTime && (
                          <div className="flex items-center gap-1 text-muted-foreground leading-none mb-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(entry.arrivalTime)}
                          </div>
                        )}
                        {entry.justificationStatus && (
                          <div className="rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[9px] text-amber-800 dark:text-amber-200 leading-none mb-1">
                            Justificativa: {entry.justificationStatus === "pending" ? "pendente" : entry.justificationStatus === "approved" ? "acatada" : "negada"}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {lock?.canRegisterArrival && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-6 px-1.5 text-[9px]"
                              onClick={() => handleRegisterArrival(student.id)}
                              disabled={registerArrival.isPending}
                            >
                              Chegada
                            </Button>
                          )}
                          {!canEdit && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-6 px-1.5 text-[9px]"
                              onClick={() => handleRequestJustification(student.id)}
                              disabled={requestJustification.isPending}
                            >
                              Justificar
                            </Button>
                          )}
                          {canRelease && entry.justificationStatus === "pending" && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                className="h-6 bg-[#1a3a2a] px-1.5 text-[9px] text-white"
                                onClick={() => handleReviewJustification(student.id, true)}
                                disabled={reviewJustification.isPending}
                              >
                                Acatar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                className="h-6 px-1.5 text-[9px]"
                                onClick={() => handleReviewJustification(student.id, false)}
                                disabled={reviewJustification.isPending}
                              >
                                Negar
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!students.length && (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center p-4 text-muted-foreground text-xs">
                      Nenhum aluno cadastrado para este Pelotão.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>


      {/* 2. Frequency list - Mobile View */}
      <div className="xl:hidden space-y-2">
        {students.map((student) => {
          const entry = studentStatuses[student.id] || { status: "pronto", observacao: "", arrivalTime: null, justificationNote: "", justificationStatus: null };
          const isExpanded = expandedStudentId === student.id;

          const getStatusBadge = (status: string) => {
            const match = statusList.find(s => s.value === status);
            const label = conditionAbbrs[status] || status.toUpperCase();
            if (status === "pronto") {
              return (
                <span className="shrink-0 rounded bg-green-100 dark:bg-green-950 px-2 py-0.5 text-[10px] font-black text-green-800 dark:text-green-300">
                  {label}
                </span>
              );
            }
            return (
              <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-black ${match ? match.color : "bg-muted text-muted-foreground"}`}>
                {label}
              </span>
            );
          };

          return (
            <Card key={student.id} className="min-w-0 border-border/50 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
              <CardContent className="p-0">
                <div 
                  onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}
                  className="flex min-w-0 items-center justify-between gap-3 p-3 cursor-pointer hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 text-[10px] font-semibold text-muted-foreground bg-muted dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                      Nº {student.numerica}
                    </span>
                    <span className="min-w-0 truncate text-sm font-bold text-[#1a3a2a] dark:text-green-400">
                      {student.nomeGuerra}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(entry.status)}
                    {entry.observacao.trim() && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Possui observação" />
                    )}
                    <span className="text-muted-foreground text-xs font-bold leading-none select-none pl-1">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border/40 p-3.5 space-y-3.5 bg-muted/5">
                    <div>
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Status / Frequência</Label>
                      <div className="mt-1 grid grid-cols-4 gap-1.5">
                        {statusList.map((st) => {
                          const isSelected = entry.status === st.value;
                          return (
                            <button
                              key={st.value}
                              type="button"
                              onClick={() => handleStatusChange(student.id, st.value)}
                              disabled={!canEdit}
                              className={`min-h-9 rounded-lg px-1 py-1 text-xs font-black transition-all touch-manipulation ${
                                isSelected ? st.color + " shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              {st.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Situação / Observação</Label>
                      <Input
                        placeholder="Observação da alteração..."
                        value={entry.observacao}
                        onChange={(e) => handleObservacaoChange(student.id, e.target.value)}
                        disabled={!canEdit}
                        className="mt-1 h-9 text-xs"
                      />
                    </div>
                    {(entry.arrivalTime || entry.justificationStatus || lock?.canRegisterArrival || !canEdit) && (
                      <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs">
                        {entry.arrivalTime && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            Chegada: {formatDateTime(entry.arrivalTime)}
                          </div>
                        )}
                        {entry.justificationStatus && (
                          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-800 dark:text-amber-200">
                            Justificativa: {entry.justificationStatus === "pending" ? "pendente" : entry.justificationStatus === "approved" ? "acatada" : "negada"}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {lock?.canRegisterArrival && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="min-h-8 flex-1 text-xs"
                              onClick={() => handleRegisterArrival(student.id)}
                              disabled={registerArrival.isPending}
                            >
                              Registrar chegada
                            </Button>
                          )}
                          {!canEdit && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="min-h-8 flex-1 text-xs"
                              onClick={() => handleRequestJustification(student.id)}
                              disabled={requestJustification.isPending}
                            >
                              Justificar correção
                            </Button>
                          )}
                          {canRelease && entry.justificationStatus === "pending" && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                className="min-h-8 flex-1 bg-[#1a3a2a] text-xs text-white"
                                onClick={() => handleReviewJustification(student.id, true)}
                                disabled={reviewJustification.isPending}
                              >
                                Acatar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                className="min-h-8 flex-1 text-xs"
                                onClick={() => handleReviewJustification(student.id, false)}
                                disabled={reviewJustification.isPending}
                              >
                                Negar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 3. Header config, signatures, and legend (Web view) */}
      <div className="grid gap-6 print:hidden xl:grid-cols-[1.2fr_0.8fr]">
        {/* Extra instruction details */}
        <Card className="border-border/50 bg-white dark:bg-zinc-900">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2 border-b pb-2">
              <FileText className="h-5 w-5 text-[#c4a84b]" />
              <h2 className="text-lg font-bold text-foreground">Instrução Externa & Assinaturas</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <Label>Local da Instrução</Label>
                <Input value={instrucaoLocal} onChange={(e) => setInstrucaoLocal(e.target.value)} placeholder="Ex.: Stand de Tiro" disabled={!canEdit} className="h-11 text-base sm:h-10 sm:text-sm" />
              </div>
              <div>
                <Label>Disciplina / Instrução</Label>
                <Input value={instrucaoDisciplina} onChange={(e) => setInstrucaoDisciplina(e.target.value)} placeholder="Ex.: Armamento e Tiro" disabled={!canEdit} className="h-11 text-base sm:h-10 sm:text-sm" />
              </div>
              <div className="flex flex-col justify-end md:pb-2">
                <div className="flex min-h-11 items-center gap-2 rounded-md border border-border/50 px-3 py-2 md:border-0 md:px-0 md:py-0">
                  <Switch id="instrucao-externa" checked={instrucaoExterna} onCheckedChange={setInstrucaoExterna} disabled={!canEdit} />
                  <Label htmlFor="instrucao-externa" className="cursor-pointer text-sm leading-snug">Possui Instrução Externa?</Label>
                </div>
              </div>
            </div>

            <div className="grid gap-3 pt-2 md:grid-cols-3">
              <div>
                <Label>Chefe de Turma</Label>
                <Input value={chefeTurma} onChange={(e) => setChefeTurma(e.target.value)} placeholder="Nome do Chefe de Turma" disabled={!canEdit} className="h-11 text-base sm:h-10 sm:text-sm" />
              </div>
              <div>
                <Label>Subchefe de Turma</Label>
                <Input value={subchefeTurma} onChange={(e) => setSubchefeTurma(e.target.value)} placeholder="Nome do Subchefe de Turma" disabled={!canEdit} className="h-11 text-base sm:h-10 sm:text-sm" />
              </div>
              <div>
                <Label>CMT de Pelotão</Label>
                <Input value={cmtPel} onChange={(e) => setCmtPel(e.target.value)} placeholder="Nome do CMT do Pelotão" className="h-11 text-base sm:h-10 sm:text-sm" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legend Card */}
        <Card className="border-border/50 bg-white dark:bg-zinc-900">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-bold text-foreground border-b pb-2">Legenda de Alterações</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {legendDetails.map((item) => (
                <div key={item.abbr} className="flex items-center gap-2 p-1.5 rounded bg-muted/30">
                  <span className="font-bold bg-muted px-2 py-0.5 rounded border text-[10px] w-8 text-center">{item.abbr}</span>
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-white dark:bg-zinc-900 print:hidden">
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#c4a84b]" />
              <h2 className="text-base font-bold text-foreground">Resumo das Alterações</h2>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">Data: {formattedDate}</span>
          </div>

          {changedRows.length ? (
            <div className="grid gap-2 md:grid-cols-2">
              {changedRows.map((item) => (
                <div key={item.student.id} className="flex min-w-0 items-start justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-foreground">
                      Nº {item.student.numerica} - {item.student.nomeGuerra}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.observacao || "Sem observação registrada"}
                    </p>
                    {item.arrivalTime && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        Chegada: {formatDateTime(item.arrivalTime)}
                      </p>
                    )}
                    {item.justificationStatus && (
                      <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-200">
                        Justificativa {item.justificationStatus === "pending" ? "pendente" : item.justificationStatus === "approved" ? "acatada" : "negada"}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-[#1a3a2a]/10 px-2 py-1 text-[11px] font-bold text-[#1a3a2a] dark:text-green-300">
                    {getStatusName(item.status)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border/60 bg-muted/10 px-3 py-3 text-sm text-muted-foreground">
              Nenhuma alteração registrada neste pecúlio.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 4. OFFICIAL PMAM PECÚLIO PRINT VIEW - Hidden by default, visible during window.print() */}
      <div className="hidden print:block peculio-print-container font-serif text-black p-4 space-y-4" style={{ fontSize: "11px" }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { background: white !important; color: black !important; }
            .print\\:hidden, header, nav, footer, aside, .sw-active, button { display: none !important; }
            .peculio-print-container { display: block !important; width: 100%; }
            @page { size: portrait; margin: 1.5cm; }
          }
          .peculio-table th, .peculio-table td { border: 1px solid black !important; padding: 2px 4px !important; text-align: center; }
          .peculio-table td.left-align { text-align: left !important; }
        ` }} />

        {/* Header section matching PDF */}
        <div className="flex flex-col items-center text-center space-y-1">
          <h1 className="text-sm font-black tracking-wider">PMAM</h1>
          <h2 className="text-xs font-black">POLÍCIA MILITAR DO AMAZONAS</h2>
          <h3 className="text-[10px] font-bold">DIRETORIA DE CAPACITAÇÃO E TREINAMENTO</h3>
          <h4 className="text-[10px] font-bold">CENTRO DE FORMAÇÃO E APERFEIÇOAMENTO DE PRAÇAS</h4>
          <div className="w-full border-t border-black my-2"></div>
          
          <div className="flex justify-between w-full font-bold text-xs">
            <span>PECÚLIO {selectedCompanhia}ª CIA/{selectedPeloton}º PEL - CFSD/2026</span>
            <span>DATA: {formattedDate}</span>
          </div>
        </div>

        {/* Attendance Matrix Table */}
        <table className="w-full peculio-table border-collapse mt-4">
          <thead>
            <tr className="font-bold">
              <th className="w-10">ORD</th>
              <th className="w-12">Nº</th>
              <th>NOME COMPLETO</th>
              <th className="w-16">PRONTO</th>
              <th className="w-8">FT</th>
              <th className="w-8">AT</th>
              <th className="w-8">DD</th>
              <th className="w-8">DI</th>
              <th className="w-8">DM</th>
              <th className="w-8">DA</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => {
              const entry = studentStatuses[student.id] || { status: "pronto", observacao: "" };
              return (
                <tr key={student.id}>
                  <td>{idx + 1}</td>
                  <td>{student.numerica}</td>
                  <td className="left-align font-semibold uppercase">{student.nomeGuerra}</td>
                  <td>{entry.status === "pronto" ? "X" : ""}</td>
                  <td>{entry.status === "falta" ? "X" : ""}</td>
                  <td>{entry.status === "atraso" ? "X" : ""}</td>
                  <td>{entry.status === "diverso_destino" ? "X" : ""}</td>
                  <td>{entry.status === "destino_ignorado" ? "X" : ""}</td>
                  <td>{entry.status === "dispensa_medica" ? "X" : ""}</td>
                  <td>{entry.status === "dispensa_administrativa" ? "X" : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Legend and Instruction Box */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="border border-black p-2 space-y-1">
            <h5 className="font-bold uppercase border-b border-black pb-1 mb-1">Legenda das Alterações</h5>
            <div className="grid grid-cols-2 gap-x-2 text-[9px]">
              <div><strong>FT</strong> - FALTA</div>
              <div><strong>AT</strong> - ATRASO</div>
              <div><strong>DD</strong> - DIVERSO DESTINO</div>
              <div><strong>DI</strong> - DESTINO IGNORADO</div>
              <div><strong>DM</strong> - DISPENSA MÉDICA</div>
              <div><strong>DA</strong> - DISPENSA ADMINISTRATIVA</div>
            </div>
          </div>

          <div className="border border-black p-2 flex flex-col justify-between">
            <h5 className="font-bold uppercase border-b border-black pb-1 mb-1 text-center">Instrução Externa</h5>
            <div className="grid grid-cols-2 gap-2 text-[9px]">
              <div><strong>Local:</strong> {instrucaoLocal || "________________"}</div>
              <div><strong>Disciplina:</strong> {instrucaoDisciplina || "________________"}</div>
            </div>
            <div className="flex items-center gap-4 text-[9px] mt-2">
              <span><strong>Externa?</strong></span>
              <span>[ {instrucaoExterna ? "X" : " "} ] SIM</span>
              <span>[ {!instrucaoExterna ? "X" : " "} ] NÃO</span>
            </div>
          </div>
        </div>

        {/* Descriptions / Details of changes (Page 2 layout elements inside print view) */}
        <div className="page-break-before border border-black p-2 mt-4">
          <h5 className="font-bold uppercase border-b border-black pb-1 mb-2 text-center">Descrição das Alterações</h5>
          <div className="space-y-1">
            {students.filter(s => {
              const entry = studentStatuses[s.id];
              return entry && (entry.status !== "pronto" || entry.observacao);
            }).map((student, idx) => {
              const entry = studentStatuses[student.id];
              return (
                <div key={student.id} className="text-[10px] uppercase border-b border-dashed border-gray-300 pb-1">
                  <strong>{idx + 1}. Nº {student.numerica} - {student.nomeGuerra}:</strong> {conditionAbbrs[entry?.status || "pronto"]} {entry?.observacao ? ` - ${entry.observacao}` : ""}
                </div>
              );
            })}
            {!students.some(s => {
              const entry = studentStatuses[s.id];
              return entry && (entry.status !== "pronto" || entry.observacao);
            }) && (
              <div className="text-center text-gray-500 italic p-4 text-[10px]">Sem alterações registradas.</div>
            )}
          </div>
        </div>

        {/* Signatures section matching PDF */}
        <div className="grid grid-cols-3 gap-6 text-center pt-12">
          <div className="flex flex-col items-center">
            <div className="w-40 border-b border-black"></div>
            <span className="text-[9px] font-bold uppercase mt-1">Chefe de Turma</span>
            <span className="text-[8px] text-gray-500 italic">{chefeTurma || "Assinatura"}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-40 border-b border-black"></div>
            <span className="text-[9px] font-bold uppercase mt-1">Subchefe de Turma</span>
            <span className="text-[8px] text-gray-500 italic">{subchefeTurma || "Assinatura"}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-40 border-b border-black"></div>
            <span className="text-[9px] font-bold uppercase mt-1">CMT de Pel</span>
            <span className="text-[8px] text-gray-500 italic">{cmtPel || "Assinatura"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
