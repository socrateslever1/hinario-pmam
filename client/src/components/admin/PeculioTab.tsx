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

  const getStatusName = (status: string) => statusNames[status as keyof typeof statusNames] ?? status;
  const formatDateTime = (value?: string | null) => value ? new Date(value).toLocaleString("pt-BR") : "";

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* 1. Header controls - Screen only */}
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
            </div>
            <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2">
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
          </div>

          {/* Lock status */}
          {isLocked && (
            <div className="flex items-center gap-2 rounded bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
              <Lock className="h-4 w-4" />
              <span>Pecúlio fechado em {lock?.closedAt ? new Date(lock.closedAt).toLocaleString("pt-BR") : "data desconhecida"}</span>
              {canRelease && (
                <div className="ml-auto flex gap-2">
                  <Input
                    type="text"
                    placeholder="Motivo da liberação"
                    value={releaseReason}
                    onChange={(e) => setReleaseReason(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Button onClick={handleRelease} size="sm" variant="secondary">
                    Liberar
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Save/Close buttons */}
          <div className="flex gap-2 flex-wrap">
            {canEdit && (
              <>
                <Button onClick={handleSave} disabled={savePeculio.isPending} className="gap-2">
                  <Save className="h-4 w-4" /> Salvar
                </Button>
                <Button onClick={handleClose} disabled={closePeculio.isPending} variant="secondary" className="gap-2">
                  <ShieldCheck className="h-4 w-4" /> Fechar e Autenticar
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Print Header - Print only */}
      <div className="hidden print:block space-y-2 pb-4 border-b-2 border-black">
        <div className="flex justify-between items-start gap-4">
          <div className="text-center flex-1">
            <div className="text-xs font-bold">PMAM</div>
            <div className="text-xs">POLÍCIA MILITAR DO AMAZONAS</div>
            <div className="text-xs">DIRETORIA DE CAPACITAÇÃO E TREINAMENTO</div>
            <div className="text-xs">CENTRO DE FORMAÇÃO E APERFEIÇOAMENTO DE PRAÇAS</div>
          </div>
          <div className="text-xs text-right">
            <div className="font-bold">PECÚLIO {selectedCompanhia}ª CIA/{selectedPeloton}º PEL - CFSD/2026</div>
            <div>DATA: {formattedDate}</div>
          </div>
        </div>
      </div>

      {/* 3. Compact Table for Print */}
      <div className="overflow-x-auto">
        <Table className="text-xs print:text-[10px]">
          <TableHeader className="print:bg-gray-200">
            <TableRow className="print:border-black print:border">
              <TableHead className="w-8 print:p-1 print:text-center print:border print:border-black">ORD</TableHead>
              <TableHead className="w-12 print:p-1 print:text-center print:border print:border-black">Nº</TableHead>
              <TableHead className="print:p-1 print:border print:border-black">NOME COMPLETO</TableHead>
              <TableHead className="w-12 print:p-1 print:text-center print:border print:border-black">PRONTO</TableHead>
              <TableHead className="w-8 print:p-1 print:text-center print:border print:border-black">FT</TableHead>
              <TableHead className="w-8 print:p-1 print:text-center print:border print:border-black">AT</TableHead>
              <TableHead className="w-8 print:p-1 print:text-center print:border print:border-black">DD</TableHead>
              <TableHead className="w-8 print:p-1 print:text-center print:border print:border-black">DI</TableHead>
              <TableHead className="w-8 print:p-1 print:text-center print:border print:border-black">DM</TableHead>
              <TableHead className="w-8 print:p-1 print:text-center print:border print:border-black">DA</TableHead>
              {canEdit && <TableHead className="print:hidden">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student, idx) => {
              const entry = studentStatuses[student.id] || { status: "pronto", observacao: "", arrivalTime: null };
              return (
                <TableRow key={student.id} className="print:border-black print:border">
                  <TableCell className="print:p-1 print:text-center print:border print:border-black">{idx + 1}</TableCell>
                  <TableCell className="print:p-1 print:text-center print:border print:border-black">{student.numerica}</TableCell>
                  <TableCell className="print:p-1 print:border print:border-black">{student.nomeGuerra}</TableCell>
                  {statusList.map((status) => (
                    <TableCell
                      key={status.value}
                      className="print:p-1 print:text-center print:border print:border-black text-center"
                    >
                      {canEdit ? (
                        <button
                          onClick={() => handleStatusChange(student.id, status.value)}
                          className={`w-full h-6 text-xs rounded ${
                            entry.status === status.value
                              ? status.color
                              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          } print:bg-white print:border print:border-black`}
                        >
                          {status.label === "PRONTO" ? "✓" : status.label}
                        </button>
                      ) : (
                        <div className="text-xs">
                          {entry.status === status.value && (status.label === "PRONTO" ? "✓" : status.label)}
                        </div>
                      )}
                    </TableCell>
                  ))}
                  {canEdit && (
                    <TableCell className="print:hidden">
                      <div className="flex gap-1">
                        <Button
                          onClick={() => handleRegisterArrival(student.id)}
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs"
                        >
                          <Clock className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* 4. Legend */}
      <div className="mt-4 print:mt-2 space-y-2">
        <div className="text-xs font-bold print:text-[10px]">LEGENDA DAS ALTERAÇÕES:</div>
        <div className="grid grid-cols-2 gap-2 text-xs print:text-[10px] print:grid-cols-3">
          {legendDetails.map((item) => (
            <div key={item.abbr}>
              <span className="font-bold">{item.abbr}</span> - {item.name}
            </div>
          ))}
        </div>
      </div>

      {/* 5. Signatures - Print only */}
      <div className="hidden print:block space-y-8 mt-8 text-center text-xs">
        <div>
          <div className="border-t border-black w-32 mx-auto"></div>
          <div className="font-bold">CHEFE DE TURMA</div>
        </div>
        <div>
          <div className="border-t border-black w-32 mx-auto"></div>
          <div className="font-bold">SUBCHEFE DE TURMA</div>
        </div>
        <div>
          <div className="border-t border-black w-32 mx-auto"></div>
          <div className="font-bold">CMT DE PEL</div>
        </div>
      </div>
    </div>
  );
}
