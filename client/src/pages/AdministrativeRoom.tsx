import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, ArrowLeft, BadgeCheck, CalendarDays, ClipboardList, FileText, History, Inbox, Loader2, Shield, Upload, UserCheck } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { buildAdministrativeFoSummary, getLcHistoryLabel } from "@/lib/foAdministrativeHistory";
import { filterEffectiveStudents } from "@/lib/administrativeEffective";
import { buildStudentObservationRequest } from "@/lib/studentObservation";
import { getFoCodesByType } from "@shared/foCatalog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GENERAL_COMMAND_ROLES = new Set([
  "master",
  "admin",
  "comandante_corpo",
  "subcomandante_corpo",
  "sub_comandante_corpo",
  "comandante_cfap",
  "subcomandante_cfap",
  "sub_comandante_cfap",
]);

const ADMINISTRATIVE_ROOM_ROLES = new Set([
  "master",
  "admin",
  "comandante_corpo",
  "subcomandante_corpo",
  "sub_comandante_corpo",
  "comandante_cfap",
  "subcomandante_cfap",
  "sub_comandante_cfap",
  "comandante_cia",
  "comandante_pel",
]);

function getMonday() {
  const value = new Date();
  const day = value.getDay();
  const diff = value.getDate() - day + (day === 0 ? -6 : 1);
  value.setDate(diff);
  return value.toISOString().slice(0, 10);
}

async function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.onerror = () => reject(reader.error || new Error("Erro ao ler arquivo"));
    reader.readAsDataURL(file);
  });
}

export default function AdministrativeRoom() {
  const utils = trpc.useUtils();
  const { data: access, isLoading: accessLoading } = trpc.serviceScale.myAccess.useQuery();
  const [baixadoStudentId, setBaixadoStudentId] = useState("");
  const [baixadoNote, setBaixadoNote] = useState("");
  const [baixadoHpmHomologated, setBaixadoHpmHomologated] = useState(true);
  const [baixadoKind, setBaixadoKind] = useState("informativo");
  const [baixadoFile, setBaixadoFile] = useState<File | null>(null);
  const [lcForm, setLcForm] = useState<Record<number, { recolhimentoDate: string; recolhimentoTime: string; durationHours: string; procedures: string }>>({});
  const [contestDecisionNotes, setContestDecisionNotes] = useState<Record<number, string>>({});
  const [contestStudentId, setContestStudentId] = useState("");
  const [contestObservationId, setContestObservationId] = useState("");
  const [contestText, setContestText] = useState("");
  const [internalStudentId, setInternalStudentId] = useState("");
  const [internalType, setInternalType] = useState("desistente");
  const [internalTitle, setInternalTitle] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [internalVisibleToStudent, setInternalVisibleToStudent] = useState(true);
  const [aditamentoDate, setAditamentoDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [aditamentoTitle, setAditamentoTitle] = useState("");
  const [aditamentoContent, setAditamentoContent] = useState("");
  const [efetivoSearch, setEfetivoSearch] = useState("");
  const [observationStudentId, setObservationStudentId] = useState("");
  const [observationType, setObservationType] = useState<"positive" | "negative">("positive");
  const [observationCode, setObservationCode] = useState("");
  const [observationNote, setObservationNote] = useState("");
  const [dailyHistoryDate, setDailyHistoryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dailyCompanhia, setDailyCompanhia] = useState("1");
  const [dailyPeloton, setDailyPeloton] = useState("1");
  const [dailyLocation, setDailyLocation] = useState("sala");
  const [dailyFormation, setDailyFormation] = useState("nao_informado");
  const [dailyLunch, setDailyLunch] = useState("nao_informado");
  const [dailySnack, setDailySnack] = useState("nao_informado");
  const [dailyRanch, setDailyRanch] = useState(false);
  const [dailyPunishment, setDailyPunishment] = useState("");
  const [dailyFacts, setDailyFacts] = useState("");
  const [dailyPending, setDailyPending] = useState("");
  const [dailyPendingResolved, setDailyPendingResolved] = useState(false);
  const [ranchWeekdays, setRanchWeekdays] = useState<number[]>([]);
  const [lunchWeekdays, setLunchWeekdays] = useState<number[]>([]);
  const [snackWeekdays, setSnackWeekdays] = useState<number[]>([]);

  const role = String(access?.role || "");
  const canHomologateFoLc = Boolean((access as any)?.canHomologateFoLc);
  const canApproveStudentDocuments = Boolean((access as any)?.canApproveStudentDocuments);
  const canViewAdministrativeRoom = Boolean(access && (ADMINISTRATIVE_ROOM_ROLES.has(role) || access.assignment));
  const canChangeCompanhia = Boolean(access?.isGeneral || GENERAL_COMMAND_ROLES.has(role));
  const canChangePelotao = Boolean(canChangeCompanhia || role === "comandante_cia" || access?.assignment?.level === "companhia");

  const pendingFoQuery = trpc.serviceScale.pendingStudentObservations.useQuery(
    {},
    { enabled: Boolean(canViewAdministrativeRoom) }
  );
  const studentsQuery = trpc.serviceScale.students.useQuery(undefined, {
    enabled: Boolean(canViewAdministrativeRoom),
  });
  const reviewedFoQuery = trpc.serviceScale.reviewedStudentObservations.useQuery(
    {},
    { enabled: Boolean(canViewAdministrativeRoom) }
  );
  const lcCasesQuery = trpc.serviceScale.lcCases.useQuery(
    { status: "active" },
    { enabled: Boolean(canViewAdministrativeRoom) }
  );
  const baixadosQuery = trpc.serviceScale.listBaixados.useQuery(
    {},
    { enabled: Boolean(canViewAdministrativeRoom) }
  );
  const contestedFoQuery = trpc.serviceScale.contestedStudentObservations.useQuery(
    { status: "pending" },
    { enabled: Boolean(canViewAdministrativeRoom) }
  );
  const contestStudentObservationsQuery = trpc.serviceScale.studentObservations.useQuery(
    { studentId: Number(contestStudentId || 0) },
    { enabled: Boolean(canViewAdministrativeRoom && contestStudentId) }
  );
  const selectedObservationStudentId = Number(observationStudentId || 0);
  const selectedStudentObservationsQuery = trpc.serviceScale.studentObservations.useQuery(
    { studentId: selectedObservationStudentId },
    { enabled: Boolean(canViewAdministrativeRoom && selectedObservationStudentId) }
  );
  const partesQuery = trpc.documentosParte.listarPartesPendentes.useQuery(undefined, {
    enabled: Boolean(canApproveStudentDocuments),
  });
  const internalReportsQuery = trpc.serviceScale.listInternalReports.useQuery(
    { status: "active" },
    { enabled: Boolean(canViewAdministrativeRoom) }
  );
  const lcHistoryQuery = trpc.serviceScale.lcCases.useQuery({ status: "all" }, { enabled: Boolean(canViewAdministrativeRoom) });
  const dailyRecordsQuery = trpc.administrativeDaily.list.useQuery({ date: dailyHistoryDate }, { enabled: Boolean(canViewAdministrativeRoom) });
  const dailyPeculioQuery = trpc.administrativeDaily.peculioSummary.useQuery({ date: dailyHistoryDate }, { enabled: Boolean(canViewAdministrativeRoom) });
  const weeklyConfigQuery = trpc.administrativeDaily.weeklyConfig.useQuery(undefined, { enabled: Boolean(canViewAdministrativeRoom) });
  const openDailyPendingsQuery = trpc.administrativeDaily.openPendings.useQuery(undefined, { enabled: Boolean(canViewAdministrativeRoom) });
  const saveDailyRecord = trpc.administrativeDaily.save.useMutation({
    onSuccess: async () => { toast.success("Rotina diária salva."); await Promise.all([dailyRecordsQuery.refetch(), openDailyPendingsQuery.refetch()]); },
    onError: (error) => toast.error(error.message),
  });
  const saveWeeklyConfig = trpc.administrativeDaily.saveWeeklyConfig.useMutation({ onSuccess: async () => { toast.success("Rotina semanal salva."); await weeklyConfigQuery.refetch(); }, onError: (error) => toast.error(error.message) });

  const validateFo = trpc.serviceScale.validateStudentObservation.useMutation({
    onSuccess: async () => {
      toast.success("FO homologado/atualizado");
      await Promise.all([pendingFoQuery.refetch(), reviewedFoQuery.refetch(), lcCasesQuery.refetch()]);
    },
    onError: (error) => toast.error(error.message),
  });
  const decideLc = trpc.serviceScale.decideLcCase.useMutation({
    onSuccess: async (_data, variables) => {
      toast.success(variables.status === "homologated" ? "LC homologada" : "LC arquivada");
      await lcCasesQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const setBaixado = trpc.serviceScale.setStudentBaixado.useMutation({
    onSuccess: async () => {
      toast.success("Indicador de baixado atualizado");
      await Promise.all([baixadosQuery.refetch()]);
    },
    onError: (error) => toast.error(error.message),
  });
  const uploadBaixadoDocument = trpc.serviceScale.uploadBaixadoDocument.useMutation({
    onSuccess: async () => {
      toast.success("Documento anexado");
      setBaixadoFile(null);
      setBaixadoNote("");
      setBaixadoKind("informativo");
      await baixadosQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const decideFoContest = trpc.serviceScale.decideFoContestation.useMutation({
    onSuccess: async (_data, variables) => {
      toast.success(variables.status === "accepted" ? "FO anulado por contestação acolhida." : "Contestação não acolhida.");
      await Promise.all([contestedFoQuery.refetch(), lcCasesQuery.refetch()]);
    },
    onError: (error) => toast.error(error.message),
  });
  const registerFoContestation = trpc.serviceScale.registerFoContestation.useMutation({
    onSuccess: async () => {
      toast.success("Contestação registrada no CAL.");
      setContestObservationId("");
      setContestText("");
      await contestedFoQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const responderParte = trpc.documentosParte.responderParte.useMutation({
    onSuccess: async () => {
      toast.success("Documento atualizado.");
      await partesQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const createInternalReport = trpc.serviceScale.createInternalReport.useMutation({
    onSuccess: async () => {
      toast.success("Informe interno registrado.");
      setInternalTitle("");
      setInternalNote("");
      await internalReportsQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const updateInternalReportStatus = trpc.serviceScale.updateInternalReportStatus.useMutation({
    onSuccess: async () => {
      toast.success("Informe interno atualizado.");
      await internalReportsQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const saveAditamento = trpc.serviceScale.saveAditamento.useMutation({
    onSuccess: () => toast.success("Aditamento gerado e publicado."),
    onError: (error) => toast.error(error.message),
  });
  const addStudentObservation = trpc.serviceScale.addStudentObservation.useMutation({
    onSuccess: async () => {
      toast.success("Anotação FO registrada.");
      setObservationCode("");
      setObservationNote("");
      await Promise.all([
        selectedStudentObservationsQuery.refetch(),
        pendingFoQuery.refetch(),
        reviewedFoQuery.refetch(),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  const students = studentsQuery.data ?? [];
  const filteredStudents = useMemo(() => filterEffectiveStudents(students, efetivoSearch), [students, efetivoSearch]);
  const pendingFoItems = pendingFoQuery.data ?? [];
  const lcItems = lcCasesQuery.data ?? [];
  const baixadoItems = baixadosQuery.data ?? [];
  const contestedFoItems = contestedFoQuery.data ?? [];
  const partesItems = partesQuery.data ?? [];
  const scopedPartesItems = partesItems;
  const internalReportItems = internalReportsQuery.data ?? [];
  const isOnDailyDate = (item: any, ...keys: string[]) => keys.some((key) => {
    const value = item?.[key];
    return value && String(value).slice(0, 10) === dailyHistoryDate;
  });
  const allFoHistoryItems = [...pendingFoItems, ...(reviewedFoQuery.data ?? [])].filter((item: any, index, values) => values.findIndex((other: any) => other.id === item.id) === index);
  const dailyFoItems = allFoHistoryItems.filter((item: any) => isOnDailyDate(item, "created_at", "createdAt", "updated_at", "updatedAt", "validated_at"));
  const dailyLcItems = (lcHistoryQuery.data ?? []).filter((item: any) => isOnDailyDate(item, "createdAt", "updatedAt", "created_at", "updated_at", "recolhimentoDate"));
  const dailyParteItems = scopedPartesItems.filter((item: any) => isOnDailyDate(item, "createdAt", "created_at", "updatedAt", "updated_at"));
  const dailyBaixadoItems = baixadoItems.filter((item: any) => isOnDailyDate(item, "latestDocumentAt", "createdAt", "created_at"));
  const dailyInternalItems = internalReportItems.filter((item: any) => isOnDailyDate(item, "createdAt", "created_at", "updatedAt", "updated_at"));
  const dailyRecords = dailyRecordsQuery.data ?? [];
  const openDailyPendings = openDailyPendingsQuery.data ?? [];
  const dailyPeculios = dailyPeculioQuery.data ?? [];

  useEffect(() => {
    const assignment = (access as any)?.assignment;
    if (assignment?.companhia) setDailyCompanhia(String(assignment.companhia));
    if (assignment?.peloton) setDailyPeloton(String(assignment.peloton));
  }, [access]);

  useEffect(() => {
    const record: any = dailyRecords.find((item: any) => item.companhia === Number(dailyCompanhia) && item.peloton === Number(dailyPeloton));
    setDailyLocation(record?.locationStatus || "sala"); setDailyFormation(record?.formationStatus || "nao_informado");
    setDailyLunch(record?.lunchStatus || "nao_informado"); setDailySnack(record?.snackStatus || "nao_informado"); setDailyRanch(Boolean(record?.ranchAdvance));
    setDailyPunishment(record?.punishmentSummary || ""); setDailyFacts(record?.factsSummary || ""); setDailyPending(record?.pendingSummary || ""); setDailyPendingResolved(Boolean(record?.pendingResolvedAt));
  }, [dailyCompanhia, dailyPeloton, dailyHistoryDate, dailyRecordsQuery.data]);
  useEffect(() => {
    const config: any = (weeklyConfigQuery.data ?? []).find((item: any) => item.companhia === Number(dailyCompanhia) && item.peloton === Number(dailyPeloton));
    setRanchWeekdays(config?.ranchWeekdays ?? []); setLunchWeekdays(config?.lunchWeekdays ?? []); setSnackWeekdays(config?.snackWeekdays ?? []);
  }, [dailyCompanhia, dailyPeloton, weeklyConfigQuery.data]);
  const selectedObservationStudent = students.find((student: any) => Number(student.id) === selectedObservationStudentId) ?? null;
  const selectedStudentObservationItems = selectedStudentObservationsQuery.data ?? [];
  const contestableObservations = (contestStudentObservationsQuery.data ?? []).filter((item: any) =>
    (item.type === "positive" || item.type === "negative") &&
    item.validation_status === "approved" &&
    !item.annulled_at &&
    (!item.contest_status || item.contest_status === "none")
  );

  const createDefaultLcForm = (item: any) => {
    return {
      recolhimentoDate: item.recolhimentoDate || new Date().toISOString().slice(0, 10),
      recolhimentoTime: item.recolhimentoTime || "07:00",
      durationHours: item.durationHours ? String(item.durationHours) : "12",
      procedures: item.procedures || (item.source === "direct" ? "LC direta por transgressão gravosa." : `Aluno cientificado da LC por reincidencia do codigo ${item.foCode || 'N/A'}.`),
    };
  };

  const registerStudentObservation = () => {
    try {
      addStudentObservation.mutate(buildStudentObservationRequest({
        studentId: selectedObservationStudentId,
        type: observationType,
        foCode: observationCode,
        details: observationNote,
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível preparar a anotação.");
    }
  };

  const updateLcField = (id: number, field: "recolhimentoDate" | "recolhimentoTime" | "durationHours" | "procedures", value: string, item: any) => {
    setLcForm((current) => {
      const existing = current[id] || createDefaultLcForm(item);
      return {
        ...current,
        [id]: {
          ...existing,
          [field]: value,
        },
      };
    });
  };

  const homologateLc = (item: any) => {
    const form = lcForm[item.id] ?? createDefaultLcForm(item);
    if (!form.recolhimentoDate || !form.recolhimentoTime || !form.durationHours || !form.procedures.trim()) {
      toast.error("Informe a data de recolhimento, horário, duração e os procedimentos para a LC.");
      return;
    }
    decideLc.mutate({
      id: item.id,
      status: "homologated",
      recolhimentoDate: form.recolhimentoDate,
      recolhimentoTime: form.recolhimentoTime,
      durationHours: Number(form.durationHours),
      procedures: form.procedures.trim(),
    });
  };

  const handleUploadBaixadoDocument = async () => {
    if (!baixadoStudentId) {
      toast.error("Selecione o aluno.");
      return;
    }
    if (!baixadoFile) {
      toast.error("Selecione o atestado ou documento.");
      return;
    }
    const base64Data = await fileToBase64(baixadoFile);
    uploadBaixadoDocument.mutate({
      studentId: Number(baixadoStudentId),
      fileName: baixadoFile.name,
      mimeType: baixadoFile.type || "application/octet-stream",
      base64Data,
      note: baixadoNote || null,
      baixadoKind: baixadoKind as any,
      hpmHomologated: baixadoHpmHomologated,
    });
  };

  const decideContest = (item: any, status: "accepted" | "rejected") => {
    decideFoContest.mutate({
      id: item.id,
      status,
      decisionNote: contestDecisionNotes[item.id]?.trim() || null,
    });
  };

  const handleRegisterCalContest = () => {
    if (!contestObservationId || !contestText.trim()) {
      toast.error("Selecione o FO e informe a contestação apresentada no CAL.");
      return;
    }
    registerFoContestation.mutate({
      id: Number(contestObservationId),
      text: contestText.trim(),
    });
  };

  const handleCreateInternalReport = () => {
    if (!internalStudentId || !internalTitle.trim()) {
      toast.error("Selecione o aluno e informe o título do procedimento interno.");
      return;
    }
    createInternalReport.mutate({
      studentId: Number(internalStudentId),
      type: internalType as any,
      title: internalTitle.trim(),
      note: internalNote.trim() || null,
      visibleToStudent: internalVisibleToStudent,
    });
  };

  const handleParteDecision = (item: any, status: "aceito" | "recusado" | "negociacao") => {
    const note = window.prompt("Despacho/observação do comando:", "");
    responderParte.mutate({
      id: item.id,
      status,
      observacaoXerife: note?.trim() || null,
    });
  };

  const getBaixadoKindLabel = (kind?: string | null) => {
    switch (kind) {
      case "ausente_com_atestado":
        return "Ausente com atestado";
      case "ausente_sem_atestado":
        return "Ausente sem atestado";
      case "presente_sem_atestado":
        return "Presente, fora da tropa";
      default:
        return "Informativo online";
    }
  };

  const getInternalTypeLabel = (type?: string | null) => {
    switch (type) {
      case "desistente":
        return "Desistente";
      case "desertor":
        return "Desertor";
      case "baixado":
        return "Baixado";
      default:
        return "Outro";
    }
  };

  const isDraftDate = (value?: string | Date | null) => {
    if (!value) return false;
    if (value instanceof Date) return value.toISOString().slice(0, 10) === aditamentoDate;
    return String(value).slice(0, 10) === aditamentoDate;
  };

  const generateAditamentoDraft = () => {
    const lines: string[] = [];
    const dayFoItems = pendingFoItems.filter((item: any) => isDraftDate(item.created_at));
    const dayContestItems = contestedFoItems.filter((item: any) => isDraftDate(item.contested_at));
    const dayLcItems = lcItems.filter((item: any) => isDraftDate(item.createdAt) || isDraftDate(item.updatedAt));
    const dayPartesItems = scopedPartesItems.filter((item: any) => isDraftDate(item.createdAt));
    const dayBaixadoItems = baixadoItems.filter((item: any) => isDraftDate(item.latestDocumentAt) || item.documents?.some((doc: any) => isDraftDate(doc.createdAt)));
    const dayInternalReportItems = internalReportItems.filter((item: any) => isDraftDate(item.createdAt));
    lines.push(`ADITAMENTO DIGITAL - COMANDO CAL`);
    lines.push(`Data: ${new Date(`${aditamentoDate}T00:00:00`).toLocaleDateString("pt-BR")}`);
    lines.push("");
    lines.push("1. Fatos Observados e Licença Caçada");
    if (dayFoItems.length || dayContestItems.length || dayLcItems.length) {
      dayFoItems.forEach((item: any) => {
        lines.push(`- FO aguardando homologação: ${item.type === "positive" ? "FO+" : "FO-"} ${item.fo_code || ""} - ${item.numerica} ${item.nome_guerra}.`);
      });
      dayContestItems.forEach((item: any) => {
        lines.push(`- Contestação de FO em análise: ${item.fo_code || item.id} - ${item.numerica} ${item.nome_guerra}.`);
      });
      dayLcItems.forEach((item: any) => {
        lines.push(`- LC pendente: FO ${item.foCode} - ${item.numerica} ${item.nomeGuerra}, saldo ${item.netCount}.`);
      });
    } else {
      lines.push("- Sem FO/LC lançado nesta data para este escopo.");
    }
    lines.push("");
    lines.push("2. Documentos recebidos");
    if (dayPartesItems.length) {
      dayPartesItems.slice(0, 20).forEach((item: any) => {
        lines.push(`- ${item.tipoDocumento === "parte" ? `Parte (${item.tipoParte})` : item.tipoDocumento}: ${item.numerica} ${item.nomeGuerra} - ${item.assunto} [${item.status}].`);
      });
    } else {
      lines.push("- Sem documentos recebidos nesta data para este escopo.");
    }
    lines.push("");
    lines.push("3. Baixados e informes online");
    if (dayBaixadoItems.length || dayInternalReportItems.length) {
      dayBaixadoItems.forEach((item: any) => {
        const latest = item.documents?.[0];
        lines.push(`- ${item.numerica} ${item.nomeGuerra}: BX online (${getBaixadoKindLabel(latest?.baixadoKind)}). Não imprimir no pecúlio.`);
      });
      dayInternalReportItems.forEach((item: any) => {
        lines.push(`- Informe interno CAL x aluno: ${item.numerica} ${item.nomeGuerra} - ${getInternalTypeLabel(item.type)} - ${item.title}.`);
      });
    } else {
      lines.push("- Sem baixados ou informes internos lançados nesta data.");
    }
    setAditamentoTitle(`Aditamento Digital - Comando CAL - ${new Date(`${aditamentoDate}T00:00:00`).toLocaleDateString("pt-BR")}`);
    setAditamentoContent(lines.join("\n"));
  };

  const publishAditamentoDraft = () => {
    if (!aditamentoTitle.trim() || !aditamentoContent.trim()) {
      toast.error("Gere ou escreva o texto do aditamento antes de publicar.");
      return;
    }
    saveAditamento.mutate({
      companhia: 0,
      peloton: 0,
      titulo: aditamentoTitle.trim(),
      conteudo: aditamentoContent.trim(),
      data: aditamentoDate,
      pdfUrl: null,
    });
  };

  if (accessLoading) {
    return (
      <div className="min-h-screen bg-[#f5f2e8] dark:bg-[#020a0f]">
        <Navbar />
        <main className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1a3a2a]" />
        </main>
      </div>
    );
  }

  if (!canViewAdministrativeRoom) {
    return (
      <div className="min-h-screen bg-[#f5f2e8] dark:bg-[#020a0f]">
        <Navbar />
        <main className="container mx-auto max-w-xl px-4 py-10">
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="mx-auto mb-3 h-10 w-10 text-[#c4a84b]" />
              <p className="font-bold text-foreground">Sala Administrativa restrita ao comando e ao xerifado.</p>
              <Link href="/login">
                <Button className="mt-4 bg-[#1a3a2a] text-white">Acessar Comando</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f2e8] text-foreground dark:bg-[#0c0c0e]">
      <Navbar />
      <main className="container mx-auto max-w-6xl px-4 py-6 pb-24">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/xerife">
              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full border bg-white dark:bg-zinc-900 sm:h-9 sm:w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-black text-[#1a3a2a] dark:text-[#c4a84b] sm:text-3xl">Sala Administrativa</h1>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">Área administrativa do comando para validar Fatos Observados, formalizar Licença Cassada (LC) e acompanhar baixados.</p>
            </div>
          </div>
        </div>

        <Card className="mb-5 border-[#1a3a2a]/15 bg-white shadow-sm dark:bg-zinc-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-[#1a3a2a] dark:text-[#c4a84b]"><History className="h-5 w-5" /> Histórico diário administrativo</CardTitle>
            <CardDescription>Extrato dos fatos registrados para a data selecionada. Pendências continuam visíveis até serem solucionadas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="max-w-xs flex-1"><Label htmlFor="daily-history-date">Dia trabalhado</Label><div className="relative mt-1"><CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="daily-history-date" type="date" value={dailyHistoryDate} onChange={(event) => setDailyHistoryDate(event.target.value)} className="pl-9" /></div></div>
              <Button type="button" variant="outline" onClick={() => setDailyHistoryDate(new Date().toISOString().slice(0, 10))}>Hoje</Button>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
              <div className="rounded-lg border bg-amber-500/10 p-3"><p className="text-xl font-black">{dailyFoItems.length}</p><p className="text-xs text-muted-foreground">FO/punições</p></div>
              <div className="rounded-lg border bg-red-500/10 p-3"><p className="text-xl font-black">{dailyLcItems.length}</p><p className="text-xs text-muted-foreground">LC</p></div>
              <div className="rounded-lg border bg-blue-500/10 p-3"><p className="text-xl font-black">{dailyParteItems.length}</p><p className="text-xs text-muted-foreground">Partes/documentos</p></div>
              <div className="rounded-lg border bg-violet-500/10 p-3"><p className="text-xl font-black">{dailyBaixadoItems.length}</p><p className="text-xs text-muted-foreground">Baixados</p></div>
              <div className="rounded-lg border bg-emerald-500/10 p-3"><p className="text-xl font-black">{dailyInternalItems.length}</p><p className="text-xs text-muted-foreground">Informes internos</p></div>
            </div>
            <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              <span className="font-bold text-foreground">Resumo do dia:</span> {dailyFoItems.length + dailyLcItems.length + dailyParteItems.length + dailyBaixadoItems.length + dailyInternalItems.length} ocorrência(s), {dailyRecords.length} rotina(s) e {dailyPeculios.filter((item: any) => item.hasReport).length} Pecúlio(s) registrados.
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {dailyPeculios.filter((item: any) => item.hasReport).map((item: any) => <div key={`${item.companhia}-${item.peloton}`} className="rounded-lg border bg-muted/20 p-3 text-xs"><p className="font-black">{item.companhia}ª Companhia / {item.peloton}º Pelotão</p><p className="mt-1 text-muted-foreground">Pecúlio: {item.closedAt ? "fechado" : "aberto"} · {item.totalAbsences} falta(s) · {item.totalLate} atraso(s) · {item.totalChanges} alteração(ões)</p></div>)}
            </div>
            <div className="grid gap-3 rounded-xl border p-3 md:grid-cols-2 lg:grid-cols-4">
              <label className="text-xs font-bold">Companhia<select value={dailyCompanhia} onChange={(e) => setDailyCompanhia(e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-2">{[1,2,3,4,5].map(n => <option key={n} value={n}>{n}ª Companhia</option>)}</select></label>
              <label className="text-xs font-bold">Pelotão<select value={dailyPeloton} onChange={(e) => setDailyPeloton(e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-2">{[1,2].map(n => <option key={n} value={n}>{n}º Pelotão</option>)}</select></label>
              <label className="text-xs font-bold">Situação<select value={dailyLocation} onChange={(e) => setDailyLocation(e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-2"><option value="sala">Em sala</option><option value="fora_sala">Fora de sala</option><option value="formatura">Em formatura</option><option value="rancho">No rancho</option><option value="dispensado">Dispensado</option></select></label>
              <label className="text-xs font-bold">Formatura<select value={dailyFormation} onChange={(e) => setDailyFormation(e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-2"><option value="nao_informado">Não informado</option><option value="nao_houve">Não houve</option><option value="prevista">Prevista</option><option value="realizada">Realizada</option></select></label>
              <label className="text-xs font-bold">Almoço<select value={dailyLunch} onChange={(e) => setDailyLunch(e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-2"><option value="nao_informado">Não informado</option><option value="aguardando">Aguardando</option><option value="avancou">Avançou</option><option value="concluido">Concluído</option></select></label>
              <label className="text-xs font-bold">Merenda<select value={dailySnack} onChange={(e) => setDailySnack(e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-2"><option value="nao_informado">Não informado</option><option value="aguardando">Aguardando</option><option value="concluido">Concluída</option></select></label>
              <label className="flex items-center gap-2 rounded-md border px-3 text-xs font-bold"><input type="checkbox" checked={dailyRanch} onChange={(e) => setDailyRanch(e.target.checked)} /> Avança para o rancho neste dia</label>
              <label className="flex items-center gap-2 rounded-md border px-3 text-xs font-bold"><input type="checkbox" checked={dailyPendingResolved} onChange={(e) => setDailyPendingResolved(e.target.checked)} /> Pendência sanada</label>
              <textarea value={dailyPunishment} onChange={(e) => setDailyPunishment(e.target.value)} placeholder="Punições do pelotão" className="min-h-20 rounded-md border bg-background p-2 text-sm md:col-span-2" />
              <textarea value={dailyFacts} onChange={(e) => setDailyFacts(e.target.value)} placeholder="Fatos e resumo do dia" className="min-h-20 rounded-md border bg-background p-2 text-sm md:col-span-2" />
              <textarea value={dailyPending} onChange={(e) => setDailyPending(e.target.value)} placeholder="Pendências — permanecem abertas até serem sanadas" className="min-h-20 rounded-md border bg-background p-2 text-sm md:col-span-2 lg:col-span-3" />
              <Button className="self-end bg-[#1a3a2a] text-white" disabled={saveDailyRecord.isPending} onClick={() => saveDailyRecord.mutate({ date: dailyHistoryDate, companhia: Number(dailyCompanhia), peloton: Number(dailyPeloton), locationStatus: dailyLocation as any, formationStatus: dailyFormation as any, lunchStatus: dailyLunch as any, snackStatus: dailySnack as any, ranchAdvance: dailyRanch, punishmentSummary: dailyPunishment || null, factsSummary: dailyFacts || null, pendingSummary: dailyPending || null, pendingResolved: dailyPendingResolved })}>Salvar rotina do dia</Button>
            </div>
            <div className="rounded-xl border p-3">
              <p className="mb-2 text-xs font-black uppercase">Configuração semanal do pelotão</p>
              {[{ label: "Avança ao rancho", values: ranchWeekdays, set: setRanchWeekdays }, { label: "Almoço", values: lunchWeekdays, set: setLunchWeekdays }, { label: "Merenda", values: snackWeekdays, set: setSnackWeekdays }].map((group) => <div key={group.label} className="mb-2 flex flex-wrap items-center gap-1"><span className="w-32 text-xs font-bold">{group.label}</span>{["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day, index) => <button key={day} type="button" onClick={() => group.set(group.values.includes(index) ? group.values.filter((value) => value !== index) : [...group.values, index])} className={`rounded-md border px-2 py-1 text-xs ${group.values.includes(index) ? "bg-[#1a3a2a] text-white" : "bg-background"}`}>{day}</button>)}</div>)}
              <Button size="sm" variant="outline" disabled={saveWeeklyConfig.isPending} onClick={() => saveWeeklyConfig.mutate({ companhia: Number(dailyCompanhia), peloton: Number(dailyPeloton), ranchWeekdays, lunchWeekdays, snackWeekdays })}>Salvar configuração semanal</Button>
            </div>
            {openDailyPendings.length > 0 && <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3"><p className="mb-2 text-xs font-black uppercase text-red-700">Pendências ainda abertas</p>{openDailyPendings.map((item: any) => <button key={item.id} className="mb-1 block w-full rounded-md border bg-background p-2 text-left text-xs" onClick={() => { setDailyHistoryDate(item.date); setDailyCompanhia(String(item.companhia)); setDailyPeloton(String(item.peloton)); }}><b>{item.date} · {item.companhia}ª Cia/{item.peloton}º Pel:</b> {item.pendingSummary}</button>)}</div>}
          </CardContent>
        </Card>

        <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
          <div className="flex min-h-16 items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-2.5 shadow-sm">
            <span className="h-8 w-1 shrink-0 rounded-full bg-amber-500" />
            <div className="min-w-0"><p className="text-xs font-black uppercase leading-tight text-amber-800 dark:text-amber-200">FO pendente</p><p className="mt-0.5 text-xl font-black leading-none">{pendingFoItems.length}</p></div>
          </div>
          <div className="flex min-h-16 items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-2.5 shadow-sm">
            <span className="h-8 w-1 shrink-0 rounded-full bg-red-500" />
            <div className="min-w-0"><p className="text-xs font-black uppercase leading-tight text-red-800 dark:text-red-200">LC a decidir</p><p className="mt-0.5 text-xl font-black leading-none">{lcItems.length}</p></div>
          </div>
          <div className="flex min-h-16 items-center gap-2 rounded-xl border border-blue-500/25 bg-blue-500/10 p-2.5 shadow-sm">
            <span className="h-8 w-1 shrink-0 rounded-full bg-blue-500" />
            <div className="min-w-0"><p className="text-xs font-black uppercase leading-tight text-blue-800 dark:text-blue-200">Baixados</p><p className="mt-0.5 text-xl font-black leading-none">{baixadoItems.length}</p></div>
          </div>
        </div>

        {!canHomologateFoLc && (
          <Card className="mb-5 border-amber-500/30 bg-amber-500/10">
            <CardContent className="flex items-center gap-2 p-3 text-xs font-semibold text-amber-900 dark:text-amber-100">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Este usuário acompanha as pendências, mas a homologação de FO/LC é exclusiva do Comandante do CAL.
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="disciplina" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-white dark:bg-zinc-900 border shadow-sm">
            <TabsTrigger value="disciplina" className="data-[state=active]:bg-[#1a3a2a] data-[state=active]:text-white dark:data-[state=active]:bg-[#c4a84b] dark:data-[state=active]:text-black">Disciplina</TabsTrigger>
            <TabsTrigger value="documentos" className="data-[state=active]:bg-[#1a3a2a] data-[state=active]:text-white dark:data-[state=active]:bg-[#c4a84b] dark:data-[state=active]:text-black">Documentos</TabsTrigger>
            <TabsTrigger value="efetivo" className="data-[state=active]:bg-[#1a3a2a] data-[state=active]:text-white dark:data-[state=active]:bg-[#c4a84b] dark:data-[state=active]:text-black">Efetivo</TabsTrigger>
          </TabsList>

          <TabsContent value="disciplina" className="space-y-5">
            <Card className="border-border/50 bg-white dark:bg-zinc-900">
              <CardHeader className="border-b pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-black">
                  <Inbox className="h-4 w-4 text-[#c4a84b]" />
                  FO para homologação
                </CardTitle>
                <CardDescription>Somente o Comandante do CAL aprova ou rejeita.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-3">
                {pendingFoQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {pendingFoItems.map((item: any) => (
                  <div key={item.id} className="rounded-lg border bg-muted/10 p-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2 font-black">
                      <Badge className={item.type === "positive" ? "bg-green-700 text-white" : "bg-red-700 text-white"}>
                        {item.type === "positive" ? "FO+" : "FO-"}
                      </Badge>
                      {item.fo_code ? <Badge variant="outline">Código {item.fo_code}</Badge> : null}
                      <span>{item.numerica} {item.nome_guerra}</span>
                      <Badge variant="secondary" className="text-[10px] bg-foreground/10">{item.companhia}ª Cia / {item.peloton}º Pel</Badge>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{item.note}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">Lançada por {item.created_by_name || "xerife"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" className="h-8 bg-[#1a3a2a] text-white" disabled={!canHomologateFoLc || validateFo.isPending} onClick={() => validateFo.mutate({ id: item.id, status: "approved" })}>
                        Aprovar FO
                      </Button>
                      <Button size="sm" variant="destructive" className="h-8" disabled={!canHomologateFoLc || validateFo.isPending} onClick={() => validateFo.mutate({ id: item.id, status: "rejected" })}>
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
                {!pendingFoQuery.isLoading && pendingFoItems.length === 0 && (
                  <p className="rounded-md border bg-muted/10 p-4 text-center text-sm text-muted-foreground">Nenhum FO aguardando homologação neste escopo. Consulte abaixo os FOs já decididos.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-emerald-500/25 bg-emerald-500/5">
              <CardHeader className="border-b border-emerald-500/15 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-black text-emerald-900 dark:text-emerald-200">
                  <History className="h-4 w-4" />
                  Histórico permanente de FO
                </CardTitle>
                <CardDescription>O FO permanece registrado mesmo quando origina uma LC homologada ou já arquivada.</CardDescription>
              </CardHeader>
              <CardContent className="max-h-80 space-y-2 overflow-y-auto p-3">
                {reviewedFoQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {reviewedFoQuery.data?.map((item: any) => {
                  const lcLabel = getLcHistoryLabel(item.lc_status);
                  return (
                    <div key={item.id} className="rounded-lg border border-emerald-500/15 bg-background/80 p-2.5 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge className={item.type === "positive" ? "bg-green-700 text-white" : "bg-red-700 text-white"}>{item.type === "positive" ? "FO+" : "FO-"} {item.fo_code || ""}</Badge>
                        <Badge variant="outline" className={item.validation_status === "approved" ? "border-emerald-500/40 text-emerald-800 dark:text-emerald-200" : "border-red-500/40 text-red-800 dark:text-red-200"}>{item.validation_status === "approved" ? "Homologado" : "Rejeitado"}</Badge>
                        {lcLabel && <Badge className="bg-red-700 text-white">{lcLabel}</Badge>}
                        <span className="text-[10px] text-muted-foreground">{item.companhia}ª Cia / {item.peloton}º Pel</span>
                      </div>
                      <p className="mt-1.5 font-black">{buildAdministrativeFoSummary({ type: item.type, foCode: item.fo_code, numerica: item.numerica, nomeGuerra: item.nome_guerra, validationStatus: item.validation_status })}</p>
                      <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-muted-foreground">{item.note}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">Decidido em {new Date(item.validated_at || item.created_at).toLocaleString("pt-BR")}{item.validated_by_name ? ` · Por ${item.validated_by_name}` : ""}</p>
                    </div>
                  );
                })}
                {!reviewedFoQuery.isLoading && !reviewedFoQuery.data?.length && (
                  <p className="rounded-md border bg-background/70 p-4 text-center text-sm text-muted-foreground">Ainda não há FOs homologados ou rejeitados neste escopo.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-red-500/25 bg-red-500/10">
              <CardHeader className="border-b border-red-500/20 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-black text-red-800 dark:text-red-200">
                  <Shield className="h-4 w-4" />
                  LC por reincidência de código
                </CardTitle>
                <CardDescription>Acompanhe, homologue e ajuste os parâmetros de LCs ativas antes de arquivá-las.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-3">
                {lcCasesQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {lcItems.map((item: any) => {
                  const form = lcForm[item.id] ?? createDefaultLcForm(item);
                  return (
                    <div key={item.id} className="rounded-lg border border-red-500/20 bg-background/90 p-2 text-xs space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={item.status === "homologated" ? "bg-green-700 text-white" : "bg-red-700 text-white"}>
                          {item.status === "homologated" ? "LC homologada (Ativa)" : "LC pendente"}
                        </Badge>
                        {item.foCode ? (
                          <Badge variant="outline" className="border-red-300 text-red-700">FO {item.foCode}</Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-300 text-amber-700">LC Direta</Badge>
                        )}
                        <span className="font-black">{item.numerica} {item.nomeGuerra}</span>
                        <Badge variant="secondary" className="text-[10px] bg-red-700/10 text-red-800">{item.companhia}ª Cia / {item.peloton}º Pel</Badge>
                        <span className="text-muted-foreground">{item.foLabel || item.directReason}</span>
                        {item.source !== "direct" && (
                          <span className="text-muted-foreground">· Saldo: {item.netCount} ({item.negativeCount} FO- / {item.positiveCount} FO+)</span>
                        )}
                        {item.startedAt && <Badge className="bg-blue-700 text-white text-[10px]">Apresentou-se {new Date(item.startedAt).toLocaleString("pt-BR", {dateStyle:"short",timeStyle:"short"})}</Badge>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Input type="date" value={form.recolhimentoDate || ""} onChange={(e) => updateLcField(item.id, "recolhimentoDate", e.target.value, item)} disabled={!canHomologateFoLc} className="h-7 w-36 text-xs px-2" title="Data do recolhimento" />
                        <Input type="time" value={form.recolhimentoTime || ""} onChange={(e) => updateLcField(item.id, "recolhimentoTime", e.target.value, item)} disabled={!canHomologateFoLc} className="h-7 w-24 text-xs px-2" title="Hora do recolhimento" />
                        <Input type="number" min={1} max={240} value={form.durationHours || ""} onChange={(e) => updateLcField(item.id, "durationHours", e.target.value, item)} disabled={!canHomologateFoLc} className="h-7 w-20 text-xs px-2" placeholder="Dur.(h)" title="Duração em horas" />
                        <Input value={form.procedures || ""} onChange={(e) => updateLcField(item.id, "procedures", e.target.value, item)} disabled={!canHomologateFoLc} className="h-7 flex-1 min-w-[120px] text-xs px-2" placeholder="Procedimentos ao aluno..." />
                        <Button size="sm" className="h-7 bg-red-700 text-white hover:bg-red-800 text-[11px] px-2" disabled={!canHomologateFoLc || decideLc.isPending} onClick={() => homologateLc(item)}>
                          {item.status === "homologated" ? "Salvar" : "Homologar"}
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-[11px] px-2" disabled={!canHomologateFoLc || decideLc.isPending} onClick={() => {
                          if (confirm(item.status === "homologated" ? "Arquivar esta LC?" : "Arquivar esta LC pendente?")) {
                            decideLc.mutate({ id: item.id, status: "rejected", procedures: item.status === "homologated" ? "LC concluída e arquivada pelo Comandante do CAL." : "LC não homologada pelo Comandante do CAL." });
                          }
                        }}>
                          Arquivar
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {!lcCasesQuery.isLoading && lcItems.length === 0 && (
                  <p className="rounded-md border bg-background/80 p-4 text-center text-sm text-muted-foreground">Nenhuma LC ativa ou pendente neste escopo.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-amber-500/25 bg-white dark:bg-zinc-900">
              <CardHeader className="border-b pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-black">
                  <BadgeCheck className="h-4 w-4 text-amber-600" />
                  Contestações de FO
                </CardTitle>
                <CardDescription>O aluno pode contestar pelo portal ou presencialmente no CAL. Contestação acolhida anula o FO.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-3">
                {contestedFoQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {contestedFoItems.map((item: any) => (
                  <div key={item.id} className="rounded-lg border bg-amber-500/5 p-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2 font-black">
                      <Badge className={item.type === "positive" ? "bg-green-700 text-white" : "bg-red-700 text-white"}>{item.type === "positive" ? "FO+" : "FO-"}</Badge>
                      {item.fo_code ? <Badge variant="outline">Código {item.fo_code}</Badge> : null}
                      <span>{item.numerica} {item.nome_guerra}</span>
                      <Badge variant="secondary" className="text-[10px]">{item.companhia}ª Cia / {item.peloton}º Pel</Badge>
                      <Badge variant="outline">{item.contest_source === "portal" ? "Portal do aluno" : "CAL"}</Badge>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{item.contest_text}</p>
                    <textarea
                      value={contestDecisionNotes[item.id] || ""}
                      onChange={(event) => setContestDecisionNotes((current) => ({ ...current, [item.id]: event.target.value }))}
                      disabled={!canHomologateFoLc}
                      className="mt-2 min-h-[64px] w-full rounded-md border bg-background px-3 py-2 text-xs"
                      placeholder="Fundamentação da decisão..."
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" className="h-8 bg-zinc-800 text-white hover:bg-zinc-900" disabled={!canHomologateFoLc || decideFoContest.isPending} onClick={() => decideContest(item, "accepted")}>
                        Acolher e anular FO
                      </Button>
                      <Button size="sm" variant="outline" className="h-8" disabled={!canHomologateFoLc || decideFoContest.isPending} onClick={() => decideContest(item, "rejected")}>
                        Não acolher
                      </Button>
                    </div>
                  </div>
                ))}
                {!contestedFoQuery.isLoading && contestedFoItems.length === 0 && (
                  <p className="rounded-md border bg-muted/10 p-4 text-center text-sm text-muted-foreground">Nenhuma contestação pendente neste escopo.</p>
                )}

                <div className="rounded-lg border bg-muted/10 p-3">
                  <p className="mb-2 text-xs font-black text-foreground">Registrar contestação apresentada no CAL</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <select value={contestStudentId} onChange={(event) => { setContestStudentId(event.target.value); setContestObservationId(""); }} className="h-9 rounded-md border bg-background px-3 text-sm">
                      <option value="">Aluno...</option>
                      {students.map((student: any) => (
                        <option key={student.id} value={String(student.id)}>{student.numerica} - {student.nomeGuerra}</option>
                      ))}
                    </select>
                    <select value={contestObservationId} onChange={(event) => setContestObservationId(event.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm" disabled={!contestStudentId}>
                      <option value="">FO homologado...</option>
                      {contestableObservations.map((item: any) => (
                        <option key={item.id} value={String(item.id)}>{item.type === "positive" ? "FO+" : "FO-"} {item.fo_code || item.id}</option>
                      ))}
                    </select>
                  </div>
                  <textarea value={contestText} onChange={(event) => setContestText(event.target.value)} className="mt-2 min-h-[72px] w-full rounded-md border bg-background px-3 py-2 text-xs" placeholder="Relato da contestação apresentada presencialmente..." />
                  <Button size="sm" variant="outline" className="mt-2 h-8" disabled={!contestObservationId || !contestText.trim() || registerFoContestation.isPending} onClick={handleRegisterCalContest}>
                    Registrar contestação
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentos" className="space-y-5">
            <Card className="border-blue-500/25 bg-white dark:bg-zinc-900">
              <CardHeader className="border-b pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-black">
                  <FileText className="h-4 w-4 text-blue-700" />
                  Recebimento de documentos
                </CardTitle>
                <CardDescription>Partes e solicitações recebidas pela plataforma.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-3">
                {!canApproveStudentDocuments ? (
                  <p className="rounded-md border bg-muted/10 p-4 text-sm text-muted-foreground">Seu perfil acompanha a sala, mas o recebimento formal de Partes é restrito ao Comando do Corpo de Alunos.</p>
                ) : partesQuery.isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : scopedPartesItems.length ? (
                  scopedPartesItems
                    .slice(0, 12)
                    .map((item: any) => (
                      <div key={item.id} className="rounded-lg border bg-muted/10 p-3 text-xs">
                        <div className="flex flex-wrap items-center gap-2 font-black">
                          <Badge variant="outline">{item.tipoDocumento === "parte" ? `Parte (${item.tipoParte})` : item.tipoDocumento}</Badge>
                          <span>{item.numerica} {item.nomeGuerra}</span>
                          <Badge variant="secondary" className="text-[10px]">{item.companhia}ª Cia / {item.peloton}º Pel</Badge>
                          <Badge>{item.status}</Badge>
                        </div>
                        <p className="mt-1 font-semibold">{item.assunto}</p>
                        {item.status === "enviado" ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" className="h-8" disabled={responderParte.isPending} onClick={() => handleParteDecision(item, "negociacao")}>Solicitar ajuste</Button>
                            <Button size="sm" variant="destructive" className="h-8" disabled={responderParte.isPending} onClick={() => handleParteDecision(item, "recusado")}>Indeferir</Button>
                            <Button size="sm" className="h-8 bg-[#1a3a2a] text-white" disabled={responderParte.isPending} onClick={() => handleParteDecision(item, "aceito")}>Deferir</Button>
                          </div>
                        ) : null}
                      </div>
                    ))
                ) : (
                  <p className="rounded-md border bg-muted/10 p-4 text-center text-sm text-muted-foreground">Nenhum documento recebido neste escopo.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-[#c4a84b]/30 bg-white dark:bg-zinc-900">
              <CardHeader className="border-b pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-black">
                  <FileText className="h-4 w-4 text-[#c4a84b]" />
                  Geração de Aditamento
                </CardTitle>
                <CardDescription>Prévia baseada nos acontecimentos do dia e nos itens incluídos para publicação.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                <div className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
                  <Input type="date" value={aditamentoDate} onChange={(event) => setAditamentoDate(event.target.value)} />
                  <Input value={aditamentoTitle} onChange={(event) => setAditamentoTitle(event.target.value)} placeholder="Título do aditamento" />
                  <Button type="button" variant="outline" onClick={generateAditamentoDraft}>Gerar prévia</Button>
                </div>
                <textarea value={aditamentoContent} onChange={(event) => setAditamentoContent(event.target.value)} className="min-h-[260px] w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="O texto gerado aparecerá aqui para revisão..." />
                <Button className="bg-[#1a3a2a] text-white" disabled={!aditamentoTitle.trim() || !aditamentoContent.trim() || saveAditamento.isPending} onClick={publishAditamentoDraft}>
                  Publicar aditamento digital
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="efetivo" className="space-y-5">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-[#1a3a2a]/20 bg-[#1a3a2a]/5 px-3 py-2.5"><p className="text-[10px] font-black uppercase text-muted-foreground">Efetivo no escopo</p><p className="mt-0.5 text-xl font-black text-[#1a3a2a] dark:text-[#e2ca78]">{studentsQuery.isLoading ? "…" : students.length}</p></div>
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 py-2.5"><p className="text-[10px] font-black uppercase text-muted-foreground">Baixados ativos</p><p className="mt-0.5 text-xl font-black text-blue-800 dark:text-blue-200">{baixadoItems.length}</p></div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5"><p className="text-[10px] font-black uppercase text-muted-foreground">Informes internos</p><p className="mt-0.5 text-xl font-black text-amber-800 dark:text-amber-200">{internalReportItems.length}</p></div>
            </div>

            <Card className="border-[#1a3a2a]/15 bg-white dark:bg-zinc-900">
              <CardContent className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-sm font-black">Localizar aluno</p><p className="text-xs text-muted-foreground">Filtre por numérica, nome de guerra ou nome completo antes de iniciar um procedimento.</p></div>
                <div className="w-full sm:max-w-sm"><Input value={efetivoSearch} onChange={(event) => setEfetivoSearch(event.target.value)} placeholder="Ex.: 4122 ou nome de guerra" /></div>
              </CardContent>
            </Card>

            <Card className="border-[#1a3a2a]/20 bg-white dark:bg-zinc-900">
              <CardHeader className="border-b pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-black">
                  <ClipboardList className="h-4 w-4 text-[#c4a84b]" />
                  Anotações FO+ / FO-
                </CardTitle>
                <CardDescription>Registre e consulte os fatos observados positivos ou negativos do aluno dentro do seu escopo de comando.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="student-observation-student">Aluno</Label>
                    <select
                      id="student-observation-student"
                      value={observationStudentId}
                      onChange={(event) => {
                        setObservationStudentId(event.target.value);
                        setObservationCode("");
                        setObservationNote("");
                      }}
                      className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm"
                    >
                      <option value="">Selecione o aluno...</option>
                      {filteredStudents.map((student: any) => (
                        <option key={student.id} value={String(student.id)}>{student.numerica} - {student.nomeGuerra}</option>
                      ))}
                    </select>
                    {selectedObservationStudent ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">{selectedObservationStudent.companhia}ª Cia / {selectedObservationStudent.peloton}º Pel</p>
                    ) : null}
                  </div>

                  <div>
                    <Label>Tipo</Label>
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={observationType === "positive" ? "default" : "outline"}
                        className={observationType === "positive" ? "bg-green-700 text-white hover:bg-green-800" : ""}
                        onClick={() => { setObservationType("positive"); setObservationCode(""); }}
                      >
                        FO+ (Elogio)
                      </Button>
                      <Button
                        type="button"
                        variant={observationType === "negative" ? "default" : "outline"}
                        className={observationType === "negative" ? "bg-red-700 text-white hover:bg-red-800" : ""}
                        onClick={() => { setObservationType("negative"); setObservationCode(""); }}
                      >
                        FO- (Transgressão)
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="student-observation-code">Código oficial do Manual</Label>
                    <select
                      id="student-observation-code"
                      value={observationCode}
                      onChange={(event) => setObservationCode(event.target.value)}
                      className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm"
                    >
                      <option value="">Selecione o código...</option>
                      {getFoCodesByType(observationType).map((item) => (
                        <option key={`${item.type}-${item.code}`} value={item.code}>{item.code} - {item.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="student-observation-note">Relato do fato observado</Label>
                    <textarea
                      id="student-observation-note"
                      value={observationNote}
                      onChange={(event) => setObservationNote(event.target.value)}
                      className="mt-1.5 min-h-[96px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                      placeholder="Registre data, hora, local e circunstâncias do fato..."
                    />
                  </div>

                  <Button
                    type="button"
                    className="w-full bg-[#1a3a2a] text-white hover:bg-[#12281d]"
                    disabled={!selectedObservationStudentId || addStudentObservation.isPending}
                    onClick={registerStudentObservation}
                  >
                    {addStudentObservation.isPending ? "Registrando..." : "Registrar anotação"}
                  </Button>
                  <p className="text-[10px] leading-relaxed text-muted-foreground">Para anexar foto, vídeo ou documento como prova, utilize o botão flutuante FO.</p>
                </div>

                <div className="rounded-lg border bg-muted/10 p-3">
                  <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Histórico do aluno</p>
                  {!selectedObservationStudentId ? (
                    <p className="mt-3 text-sm text-muted-foreground">Selecione um aluno para consultar suas anotações.</p>
                  ) : selectedStudentObservationsQuery.isLoading ? (
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando histórico...</div>
                  ) : selectedStudentObservationItems.filter((item: any) => item.type === "positive" || item.type === "negative").length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">Nenhum FO+ ou FO- registrado para este aluno.</p>
                  ) : (
                    <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">
                      {selectedStudentObservationItems.filter((item: any) => item.type === "positive" || item.type === "negative").map((item: any) => {
                        const approved = item.validation_status === "approved";
                        const rejected = item.validation_status === "rejected";
                        const createdAt = item.created_at ? new Date(item.created_at) : null;
                        return (
                          <div key={item.id} className="rounded-md border bg-background p-2.5 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <Badge className={item.type === "positive" ? "bg-green-700 text-white" : "bg-red-700 text-white"}>{item.type === "positive" ? "FO+" : "FO-"} {item.fo_code || ""}</Badge>
                              <Badge variant="secondary" className={approved ? "bg-green-100 text-green-800" : rejected ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}>{approved ? "Homologado" : rejected ? "Não homologado" : "Pendente"}</Badge>
                            </div>
                            <p className="mt-2 whitespace-pre-wrap leading-relaxed text-foreground">{item.note}</p>
                            <p className="mt-2 text-[10px] text-muted-foreground">{createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.toLocaleString("pt-BR") : "Data não informada"}{item.created_by_name ? ` · ${item.created_by_name}` : ""}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {studentsQuery.isError && <p className="rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-xs font-semibold text-destructive">Não foi possível carregar o efetivo deste escopo. Tente novamente em instantes.</p>}

            <Card className="border-border/50 bg-white dark:bg-zinc-900">
              <CardHeader className="border-b pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-black">
                  <UserCheck className="h-4 w-4 text-[#c4a84b]" />
                  Indicar baixado
                </CardTitle>
                <CardDescription>Cmt Pel, Cmt Cia e Xerife podem indicar baixados e anexar atestado homologado pelo HPM.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                <div>
                  <Label>Aluno</Label>
                  <select value={baixadoStudentId} onChange={(event) => setBaixadoStudentId(event.target.value)} className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="">Selecione...</option>
                    {filteredStudents.map((student: any) => (
                      <option key={student.id} value={String(student.id)}>{student.numerica} - {student.nomeGuerra}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Documento / Atestado</Label>
                  <Input type="file" accept="application/pdf,image/*" onChange={(event) => setBaixadoFile(event.target.files?.[0] ?? null)} />
                </div>
                <div>
                  <Label>Situação BX online</Label>
                  <select value={baixadoKind} onChange={(event) => setBaixadoKind(event.target.value)} className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="informativo">Informativo online</option>
                    <option value="ausente_com_atestado">Ausente com atestado</option>
                    <option value="ausente_sem_atestado">Ausente sem atestado</option>
                    <option value="presente_sem_atestado">Presente, fora da tropa</option>
                  </select>
                  <p className="mt-1 text-[10px] font-semibold text-muted-foreground">BX não entra no impresso do pecúlio; é controle interno online.</p>
                </div>
                <div>
                  <Label>Observação</Label>
                  <textarea value={baixadoNote} onChange={(event) => setBaixadoNote(event.target.value)} className="mt-1.5 min-h-[72px] w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Ex.: atestado homologado pelo HPM, período, restrições..." />
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold">
                  <input type="checkbox" checked={baixadoHpmHomologated} onChange={(event) => setBaixadoHpmHomologated(event.target.checked)} />
                  Atestado homologado pelo HPM
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button disabled={!baixadoStudentId || setBaixado.isPending} onClick={() => setBaixado.mutate({ studentId: Number(baixadoStudentId), isBaixado: true })} className="bg-[#1a3a2a] text-white">
                    Marcar baixado
                  </Button>
                  <Button variant="outline" disabled={!baixadoStudentId || !baixadoFile || uploadBaixadoDocument.isPending} onClick={handleUploadBaixadoDocument}>
                    <Upload className="mr-1 h-4 w-4" />
                    Anexar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-500/25 bg-white dark:bg-zinc-900">
              <CardHeader className="border-b pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-black">
                  <Shield className="h-4 w-4 text-amber-700" />
                  Informe interno CAL x aluno
                </CardTitle>
                <CardDescription>Desistente, desertor e outros procedimentos internos não entram em impressão pública.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                <select value={internalStudentId} onChange={(event) => setInternalStudentId(event.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="">Aluno...</option>
                  {filteredStudents.map((student: any) => (
                    <option key={student.id} value={String(student.id)}>{student.numerica} - {student.nomeGuerra}</option>
                  ))}
                </select>
                <select value={internalType} onChange={(event) => setInternalType(event.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="desistente">Desistente</option>
                  <option value="desertor">Desertor</option>
                  <option value="baixado">Baixado</option>
                  <option value="outro">Outro</option>
                </select>
                <Input value={internalTitle} onChange={(event) => setInternalTitle(event.target.value)} placeholder="Título do procedimento" />
                <textarea value={internalNote} onChange={(event) => setInternalNote(event.target.value)} className="min-h-[72px] w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Observação interna..." />
                <label className="flex items-center gap-2 text-xs font-semibold">
                  <input type="checkbox" checked={internalVisibleToStudent} onChange={(event) => setInternalVisibleToStudent(event.target.checked)} />
                  Visível ao aluno no portal
                </label>
                <Button className="w-full bg-[#1a3a2a] text-white" disabled={!internalStudentId || !internalTitle.trim() || createInternalReport.isPending} onClick={handleCreateInternalReport}>
                  Registrar informe
                </Button>
                <div className="space-y-2 border-t pt-3">
                  {internalReportItems.slice(0, 8).map((item: any) => (
                    <div key={item.id} className="rounded-md border bg-muted/10 p-2 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-black">{item.numerica} {item.nomeGuerra}</p>
                            <Badge variant="secondary" className="text-[10px]">{item.companhia}ª Cia / {item.peloton}º Pel</Badge>
                          </div>
                          <p className="text-muted-foreground">{getInternalTypeLabel(item.type)} - {item.title}</p>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" disabled={updateInternalReportStatus.isPending} onClick={() => updateInternalReportStatus.mutate({ id: item.id, status: "resolved" })}>
                          Resolver
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-500/25 bg-blue-500/10">
              <CardHeader className="border-b border-blue-500/20 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-black text-blue-800 dark:text-blue-100">
                  <FileText className="h-4 w-4" />
                  Baixados e documentos
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[720px] space-y-3 overflow-y-auto p-3">
                {baixadosQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {baixadoItems.map((item: any) => (
                  <div key={item.studentId} className="rounded-lg border bg-background/90 p-3 text-xs">
                    <div className="flex items-center gap-2">
                      {item.fotoUrl ? (
                        <img src={item.fotoUrl} alt={item.nomeGuerra} className="h-10 w-10 rounded-full border object-cover" />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a3a2a]/10 font-black">{item.nomeGuerra?.slice(0, 2)}</span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-black">{item.numerica} - {item.nomeGuerra}</p>
                        <p className="text-muted-foreground">{item.companhia}ª Cia / {item.peloton}º Pel</p>
                      </div>
                      <Badge className={item.condition === "baixado" ? "ml-auto bg-red-700 text-white" : "ml-auto"}>{item.condition === "baixado" ? "Baixado" : "Doc. enviado"}</Badge>
                    </div>
                    <div className="mt-2 space-y-1">
                      {item.documents?.map((doc: any) => (
                        <a key={doc.id} href={doc.fileUrl} rel="noreferrer" className="block rounded-md border bg-muted/20 px-2 py-1 text-[11px] font-semibold text-[#1a3a2a] hover:underline">
                          {doc.hpmHomologated ? "HPM - " : ""}{doc.fileName} · {getBaixadoKindLabel(doc.baixadoKind)}
                        </a>
                      ))}
                    </div>
                    {item.condition === "baixado" && (
                      <Button size="sm" variant="outline" className="mt-2 h-8 w-full text-xs" disabled={setBaixado.isPending} onClick={() => setBaixado.mutate({ studentId: item.studentId, isBaixado: false })}>
                        Retornar para pronto
                      </Button>
                    )}
                  </div>
                ))}
                {!baixadosQuery.isLoading && baixadoItems.length === 0 && (
                  <p className="rounded-md border bg-background/80 p-4 text-center text-sm text-muted-foreground">Nenhum baixado ou documento enviado.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
