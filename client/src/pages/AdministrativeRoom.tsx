import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, ArrowLeft, BadgeCheck, FileText, Inbox, Loader2, Shield, Upload, UserCheck } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
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
  const partesQuery = trpc.documentosParte.listarPartesPendentes.useQuery(undefined, {
    enabled: Boolean(canApproveStudentDocuments),
  });
  const internalReportsQuery = trpc.serviceScale.listInternalReports.useQuery(
    { status: "active" },
    { enabled: Boolean(canViewAdministrativeRoom) }
  );

  const validateFo = trpc.serviceScale.validateStudentObservation.useMutation({
    onSuccess: async () => {
      toast.success("FO homologado/atualizado");
      await Promise.all([pendingFoQuery.refetch(), lcCasesQuery.refetch()]);
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

  const students = useMemo(() => [], []);
  const pendingFoItems = pendingFoQuery.data ?? [];
  const lcItems = lcCasesQuery.data ?? [];
  const baixadoItems = baixadosQuery.data ?? [];
  const contestedFoItems = contestedFoQuery.data ?? [];
  const partesItems = partesQuery.data ?? [];
  const scopedPartesItems = partesItems;
  const internalReportItems = internalReportsQuery.data ?? [];
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
      <div className="min-h-screen bg-[#f5f2e8]">
        <Navbar />
        <main className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1a3a2a]" />
        </main>
      </div>
    );
  }

  if (!canViewAdministrativeRoom) {
    return (
      <div className="min-h-screen bg-[#f5f2e8]">
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
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border bg-white dark:bg-zinc-900">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-black text-[#1a3a2a] dark:text-[#c4a84b]">Sala Administrativa</h1>
              <p className="text-xs text-muted-foreground">Área administrativa do comando para validar Fatos Observados, formalizar Licença Caçada e acompanhar baixados.</p>
            </div>
          </div>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <Card className="border-amber-500/25 bg-amber-500/10">
            <CardContent className="p-4">
              <p className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-200">FO pendente</p>
              <p className="mt-1 text-3xl font-black">{pendingFoItems.length}</p>
            </CardContent>
          </Card>
          <Card className="border-red-500/25 bg-red-500/10">
            <CardContent className="p-4">
              <p className="text-[10px] font-black uppercase text-red-700 dark:text-red-200">LC a decidir</p>
              <p className="mt-1 text-3xl font-black">{lcItems.length}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-500/25 bg-blue-500/10">
            <CardContent className="p-4">
              <p className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-200">Baixados/atestados</p>
              <p className="mt-1 text-3xl font-black">{baixadoItems.length}</p>
            </CardContent>
          </Card>
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
                  <p className="rounded-md border bg-muted/10 p-4 text-center text-sm text-muted-foreground">Nenhum FO pendente neste escopo.</p>
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
                    {students.map((student: any) => (
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
                  {students.map((student: any) => (
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
                        <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noreferrer" className="block rounded-md border bg-muted/20 px-2 py-1 text-[11px] font-semibold text-[#1a3a2a] hover:underline">
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
