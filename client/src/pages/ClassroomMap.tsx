import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getStudentSession } from "@/lib/studentSession";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft, LayoutGrid, User, Laptop, Crown, Shield,
  CalendarDays, FileText, History, ExternalLink, Star,
  Save, Trash2, Check, UserCog, Users, ClipboardList,
  Minus, Plus, Inbox, Send, Upload, X, Award, Pencil, UserPlus,
  Search, BadgeCheck
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { PeculioTab } from "@/components/admin/PeculioTab";
import { PeculioOverview } from "@/components/admin/PeculioOverview";
import { ClassroomCargosTab } from "@/components/admin/ClassroomCargosTab";
import { toast } from "sonner";

const conditionLabels: Record<string, string> = {
  pronto: "Pronto (PRONTO)",
  falta: "Falta (FT)",
  atraso: "Atraso (AT)",
  diverso_destino: "Diverso Destino (DD)",
  destino_ignorado: "Destino Ignorado (DI)",
  dispensa_medica: "Dispensa Médica (DM)",
  dispensa_administrativa: "Dispensa Administrativa (DA)",
};

const conditionShorts: Record<string, string> = {
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

const getSeatConditionStyle = (cond = "pronto") => {
  switch (cond) {
    case "pronto":
      return "bg-[#1a3a2a]/5 border-[#1a3a2a]/20 dark:bg-green-950/20 dark:border-green-800/40 shadow-sm";
    case "falta":
      return "bg-red-500/5 border-dashed border-red-500/50 opacity-70 shadow-sm";
    case "atraso":
      return "bg-amber-500/5 border-dashed border-amber-500/50 opacity-80 shadow-sm";
    case "diverso_destino":
      return "bg-blue-500/5 border-dashed border-blue-500/50 opacity-85 shadow-sm";
    case "destino_ignorado":
      return "bg-gray-500/5 border-dashed border-gray-500/50 opacity-60 shadow-sm";
    case "dispensa_medica":
      return "bg-orange-500/5 border-dashed border-orange-500/50 opacity-75 shadow-sm";
    case "dispensa_administrativa":
      return "bg-purple-500/5 border-dashed border-purple-500/50 opacity-75 shadow-sm";
    default:
      return "bg-zinc-50/50 border-dashed border-zinc-200 dark:bg-zinc-950/50 dark:border-zinc-800";
  }
};

const weekdays = [
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
];

function cleanNumerica(value: string) {
  return value.replace(/\D/g, "").slice(0, 4);
}

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

const TRANSGRESSIONS_LIST = [
  "Atraso para formaturas ou instruções",
  "Fardamento incorreto ou desalinhado",
  "Falta de zelo ou dano ao material de instrução",
  "Postura inadequada ou desatenção em instrução",
  "Conversas paralelas durante a instrução",
  "Utilização de celular sem autorização",
  "Dormir durante a instrução ou serviço",
  "Faltar com a verdade ou omitir fatos",
  "Descumprimento de ordens ou prescrições dos manuais",
  "Falta de asseio pessoal ou de higiene",
];

const ELOGIOS_LIST = [
  "Destaque intelectual em avaliações ou trabalhos",
  "Destaque em instrução de Ordem Unida ou Treinamento",
  "Espírito de corpo exemplar e cooperação ativa",
  "Honestidade ou ato de probidade militar exemplar",
  "Presteza e dedicação excepcional no serviço",
  "Iniciativa positiva na resolução de problemas do pelotão",
  "Asseio impecável e alinhamento de fardamento exemplar",
  "Desempenho exemplar como Xerife ou função de liderança",
  "Conduta exemplar dentro e fora das dependências",
];

export default function ClassroomMap() {
  const studentSession = getStudentSession();
  const { data: access } = trpc.serviceScale.myAccess.useQuery();
  const utils = trpc.useUtils();
  const [location, setLocation] = useLocation();

  const subview = location.split("/")[2] || "map"; // map, peculio, efetivo, escala, aditamentos, historico

  const [companhia, setCompanhia] = useState(() => localStorage.getItem("selected_companhia") || "4");
  const [peloton, setPeloton] = useState(() => localStorage.getItem("selected_peloton") || "1");

  useEffect(() => {
    localStorage.setItem("selected_companhia", companhia);
  }, [companhia]);

  useEffect(() => {
    localStorage.setItem("selected_peloton", peloton);
  }, [peloton]);
  const [capacity, setCapacity] = useState(51);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("none");

  // Options states
  const [weekStart, setWeekStart] = useState(getMonday());
  const [homemHoraId, setHomemHoraId] = useState("");
  const [alunoLigacaoId, setAlunoLigacaoId] = useState("");
  const [p5FilmmakerId, setP5FilmmakerId] = useState("");
  const [xerifeId, setXerifeId] = useState("");
  const [subXerifeId, setSubXerifeId] = useState("");
  const [dutyDate, setDutyDate] = useState("");
  const [aditamentoText, setAditamentoText] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [cleaningByDay, setCleaningByDay] = useState<Record<number, string[]>>({});

  // Aditamentos states
  const [aditTitulo, setAditTitulo] = useState("");
  const [aditConteudo, setAditConteudo] = useState("");
  const [aditData, setAditData] = useState(new Date().toISOString().slice(0, 10));
  const [aditPdfUrl, setAditPdfUrl] = useState("");
  const [isUploadingAditamento, setIsUploadingAditamento] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticeStudentId, setNoticeStudentId] = useState("all");
  
  // FO (Fatos Observados) Modal States
  const [foModalOpen, setFoModalOpen] = useState(false);
  const [foSelectedStudentIds, setFoSelectedStudentIds] = useState<number[]>([]);
  const [foType, setFoType] = useState<"positive" | "negative">("negative");
  const [foReason, setFoReason] = useState("");
  const [foCustomReason, setFoCustomReason] = useState("");
  const [foDetails, setFoDetails] = useState("");
  const [foIsAllSelected, setFoIsAllSelected] = useState(false);
  const [operationalStudent, setOperationalStudent] = useState<any | null>(null);

  const [newStudentForm, setNewStudentForm] = useState({ numerica: "", nomeGuerra: "", senha: "" });
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editStudentForm, setEditStudentForm] = useState({
    numerica: "",
    nomeGuerra: "",
    nomeCompleto: "",
    companhia: "",
    peloton: "",
    deskNumber: "",
  });

  // Sync initial scope from logged-in session or assignment
  useEffect(() => {
    if (access === undefined) {
      return;
    }
    if (access?.isGeneral) {
      return;
    }
    if (studentSession) {
      setCompanhia(String(studentSession.companhia));
      setPeloton(String(studentSession.peloton));
    } else if (access?.scope) {
      if (access.scope.companhia) setCompanhia(String(access.scope.companhia));
      if (access.scope.peloton) setPeloton(String(access.scope.peloton));
    }
  }, [access, studentSession]);

  const selectedCompanhia = Number(companhia);
  const selectedPeloton = Number(peloton);

  // Queries
  const platoonPublicQuery = trpc.serviceScale.getPlatoonPublic.useQuery(
    { companhia: selectedCompanhia, peloton: selectedPeloton, weekStart },
    { enabled: Boolean(selectedCompanhia && selectedPeloton) }
  );

  const isXerifeGeral = Boolean(access?.isGeneral);
  const currentRoles = platoonPublicQuery.data?.roles;
  const isCurrentStudentActiveXerife = Boolean(studentSession && currentRoles &&
    (studentSession.id === currentRoles.xerifeId || studentSession.id === currentRoles.subXerifeId));
  const isAdminOrXerifeAdmin = isXerifeGeral ||
    Boolean(access?.assignment &&
      (access.assignment.level === "principal" ||
        (access.assignment.level === "companhia" && access.assignment.companhia === selectedCompanhia) ||
        (access.assignment.level === "pelotao" &&
          access.assignment.companhia === selectedCompanhia &&
          access.assignment.peloton === selectedPeloton))) ||
    isCurrentStudentActiveXerife;

  const capacityQuery = trpc.serviceScale.getPlatoonCapacity.useQuery(
    { companhia: selectedCompanhia, peloton: selectedPeloton },
    { enabled: Boolean(selectedCompanhia && selectedPeloton) }
  );

  const aditamentosQuery = trpc.serviceScale.listAditamentos.useQuery(
    { companhia: selectedCompanhia, peloton: selectedPeloton },
    { enabled: Boolean(selectedCompanhia && selectedPeloton) }
  );

  const activeXerifesQuery = trpc.serviceScale.getAllActiveXerifes.useQuery();

  const xerifeHistoryQuery = trpc.serviceScale.getXerifeHistory.useQuery(
    { companhia: selectedCompanhia, peloton: selectedPeloton },
    { enabled: Boolean(selectedCompanhia && selectedPeloton) }
  );

  const pendingObservationsQuery = trpc.serviceScale.pendingStudentObservations.useQuery(
    { companhia: selectedCompanhia, peloton: selectedPeloton },
    { enabled: Boolean(access?.isGeneral && selectedCompanhia && selectedPeloton) }
  );

  const foReasonsQuery = trpc.serviceScale.foReasons.useQuery(undefined, {
    enabled: Boolean(isAdminOrXerifeAdmin),
  });

  const pendingFoReasonsQuery = trpc.serviceScale.pendingFoReasons.useQuery(undefined, {
    enabled: Boolean(access?.isGeneral),
  });

  const studentObservationsQuery = trpc.serviceScale.studentObservations.useQuery(
    { studentId: operationalStudent?.id ?? 0 },
    { enabled: Boolean(operationalStudent?.id && isAdminOrXerifeAdmin) }
  );

  // Sync capacity from DB
  useEffect(() => {
    if (capacityQuery.data?.capacity) {
      setCapacity(capacityQuery.data.capacity);
    }
  }, [capacityQuery.data]);

  const students = platoonPublicQuery.data?.students ?? [];
  const activeRoles = platoonPublicQuery.data?.roles;
  const weeklyScale = platoonPublicQuery.data?.week;

  // Filtrar alunos por nome, número ou pelotão
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const query = searchQuery.toLowerCase();
    return students.filter((student: any) => 
      student.nomeGuerra.toLowerCase().includes(query) ||
      student.numerica.includes(query) ||
      (student.nomeCompleto && student.nomeCompleto.toLowerCase().includes(query)) ||
      String(student.peloton).includes(query)
    );
  }, [students, searchQuery]);

  // Sync roles and scale parameters
  useEffect(() => {
    const roles = platoonPublicQuery.data?.roles;
    const week = platoonPublicQuery.data?.week;

    setHomemHoraId(roles?.homemHoraId ? String(roles.homemHoraId) : "");
    setAlunoLigacaoId(roles?.alunoLigacaoId ? String(roles.alunoLigacaoId) : "");
    setP5FilmmakerId(roles?.p5FilmmakerId ? String(roles.p5FilmmakerId) : "");
    setAditamentoText(week?.aditamento || roles?.aditamento || "");
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
  }, [platoonPublicQuery.data]);

  // Mutations (only work when admin user cookie is active)
  const updateStudentDesk = trpc.serviceScale.updateStudentDeskNumber.useMutation({
    onSuccess: async () => {
      toast.success("Carteira atualizada com sucesso");
      setAssignmentModalOpen(false);
      setSelectedStudentId("none");
      await platoonPublicQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const requestSeatChange = trpc.serviceScale.requestSeatChange.useMutation({
    onSuccess: () => toast.success("Pedido enviado ao Xerife. Aguarde autorização."),
    onError: (err) => toast.error(err.message),
  });

  const decideSeatRequest = trpc.serviceScale.decideSeatChangeRequest.useMutation({
    onSuccess: async () => {
      toast.success("Pedido atualizado");
      await Promise.all([seatRequestsQuery.refetch(), platoonPublicQuery.refetch()]);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateCapacity = trpc.serviceScale.updatePlatoonCapacity.useMutation({
    onSuccess: async () => {
      toast.success("Capacidade do pelotão atualizada");
      await capacityQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateStudentCondition = trpc.serviceScale.updateStudentCondition.useMutation({
    onSuccess: async () => {
      toast.success("Condição do aluno atualizada");
      await platoonPublicQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const promoteStudentMutation = trpc.serviceScale.promoteStudent.useMutation({
    onSuccess: async () => {
      toast.success("Promoção realizada com sucesso!");
      await Promise.all([
        platoonPublicQuery.refetch(),
        xerifeHistoryQuery.refetch(),
        utils.serviceScale.myAccess.invalidate(),
      ]);
    },
    onError: (err) => toast.error(err.message),
  });

  const saveRoles = trpc.serviceScale.saveRoles.useMutation({
    onSuccess: async () => {
      toast.success("Funções fixas salvas");
      await platoonPublicQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const saveWeeklyScale = trpc.serviceScale.saveWeeklyScale.useMutation({
    onSuccess: async () => {
      toast.success("Escala semanal salva");
      await Promise.all([
        platoonPublicQuery.refetch(),
        utils.serviceScale.published.invalidate(),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  const saveAditamento = trpc.serviceScale.saveAditamento.useMutation({
    onSuccess: async () => {
      toast.success("Aditamento publicado com sucesso!");
      setAditTitulo("");
      setAditConteudo("");
      setAditPdfUrl("");
      await aditamentosQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadAditamentoFile = trpc.serviceScale.uploadAditamentoFile.useMutation();

  const createNotice = trpc.serviceScale.createNotice.useMutation({
    onSuccess: () => {
      toast.success("Aviso enviado");
      setNoticeTitle("");
      setNoticeMessage("");
      setNoticeStudentId("all");
    },
    onError: (err) => toast.error(err.message),
  });

  const addStudentObservation = trpc.serviceScale.addStudentObservation.useMutation({
<<<<<<< Updated upstream
    onSuccess: () => {
      toast.success("Anotação registrada");
=======
    onSuccess: async () => {
      toast.success("Anotação registrada");
      await pendingObservationsQuery.refetch();
>>>>>>> Stashed changes
    },
    onError: (err) => toast.error(err.message),
  });

  const validateStudentObservation = trpc.serviceScale.validateStudentObservation.useMutation({
    onSuccess: async () => {
      toast.success("FO validada");
      await pendingObservationsQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const suggestFoReason = trpc.serviceScale.suggestFoReason.useMutation({
    onSuccess: async (result) => {
      if (result.status === "approved") {
        toast.success("Novo fato incluído na lista oficial.");
      } else {
        toast.success("Novo fato enviado para validação do Xerife Master.");
      }
      await Promise.all([
        foReasonsQuery.refetch(),
        access?.isGeneral ? pendingFoReasonsQuery.refetch() : Promise.resolve(),
      ]);
    },
    onError: (err) => toast.error(err.message),
  });

  const validateFoReason = trpc.serviceScale.validateFoReason.useMutation({
    onSuccess: async () => {
      toast.success("Lista de fatos atualizada.");
      await Promise.all([foReasonsQuery.refetch(), pendingFoReasonsQuery.refetch()]);
    },
    onError: (err) => toast.error(err.message),
  });

  const createRosterStudent = trpc.serviceScale.createRosterStudent.useMutation({
    onSuccess: async () => {
      toast.success("Aluno adicionado ao efetivo");
      setNewStudentForm({ numerica: "", nomeGuerra: "", senha: "" });
      await platoonPublicQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateRosterStudent = trpc.serviceScale.updateRosterStudent.useMutation({
    onSuccess: async () => {
      toast.success("Dados do aluno atualizados");
      setEditingStudent(null);
      await Promise.all([platoonPublicQuery.refetch(), activeXerifesQuery.refetch()]);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteRosterStudent = trpc.serviceScale.deleteRosterStudent.useMutation({
    onSuccess: async () => {
      toast.success("Aluno removido do efetivo");
      await platoonPublicQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const createStudentHighlight = trpc.serviceScale.createStudentHighlight.useMutation({
    onSuccess: () => toast.success("Aluno promovido para destaque da tela inicial"),
    onError: (err) => toast.error(err.message),
  });

  const deleteAditamento = trpc.serviceScale.deleteAditamento.useMutation({
    onSuccess: async () => {
      toast.success("Aditamento excluído");
      await aditamentosQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const canChangeClassroomScope = isXerifeGeral;

  const seatRequestsQuery = trpc.serviceScale.seatChangeRequests.useQuery(
    { companhia: selectedCompanhia, peloton: selectedPeloton, status: "pending" },
    { enabled: Boolean(isAdminOrXerifeAdmin && selectedCompanhia && selectedPeloton) }
  );

  // Classroom seat generation
  const startNumber = selectedCompanhia * 1000 + selectedPeloton * 100;
  const makeSeatColumn = (first: number, last: number) =>
    Array.from({ length: Math.max(0, Math.min(last, capacity) - first + 1) }, (_, i) => startNumber + first + i);
  const col1 = makeSeatColumn(1, 11); // 01 to 11
  const col2 = makeSeatColumn(12, 21); // 12 to 21
  const col3 = makeSeatColumn(22, 31); // 22 to 31
  const col4 = makeSeatColumn(32, 41); // 32 to 41
  const col5RegularLength = Math.max(0, capacity - 41);
  const col5Regular = Array.from({ length: col5RegularLength }, (_, i) => startNumber + i + 42); // 42 onwards

  // Lists definitions
  const unassignedStudents = students.filter((s: any) => !s.deskNumber && s.id !== activeRoles?.xerifeId && s.id !== activeRoles?.subXerifeId);

  // Seat rendering helpers
  const renderSeatCard = (seatNumber: number) => {
    const occupant = students.find((s: any) => s.deskNumber === seatNumber && s.id !== activeRoles?.xerifeId && s.id !== activeRoles?.subXerifeId);
    const isOccupied = !!occupant;
    const cond = occupant?.condition || "pronto";
    const isAbsent = cond !== "pronto";

    return (
      <div
        key={seatNumber}
        onClick={() => handleSeatClick(seatNumber)}
        className={`relative flex flex-col items-center justify-between rounded-md border p-1 text-center transition-all duration-200 ${isOccupied
            ? getSeatConditionStyle(cond)
            : "bg-zinc-50/50 border-dashed border-zinc-200 dark:bg-zinc-950/50 dark:border-zinc-800"
          } ${isAdminOrXerifeAdmin ? "cursor-pointer hover:shadow-md hover:scale-[1.02]" : ""}`}
        style={{ minHeight: "64px" }}
      >
        <div className="absolute left-1 top-1 flex items-center justify-center">
          <span className="text-[8px] font-black text-muted-foreground/60">
            {seatNumber}
          </span>
        </div>

        {isOccupied ? (
          <div className="flex h-full w-full flex-col items-center justify-center pt-1.5">
            {occupant.fotoUrl ? (
              <img
                src={occupant.fotoUrl}
                alt={occupant.nomeGuerra}
                className={`mb-0.5 h-6 w-6 rounded-full border object-cover shadow-sm ${isAbsent ? "border-red-400" : "border-[#c4a84b]/60"
                  }`}
              />
            ) : (
              <div className={`mb-0.5 flex h-6 w-6 items-center justify-center rounded-full border text-[7px] font-bold ${isAbsent ? "bg-red-500/10 text-red-500 border-red-400" : "bg-[#c4a84b]/10 text-[#c4a84b] border-[#c4a84b]/60"
                }`}>
                {occupant.nomeGuerra.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className={`w-full truncate px-0.5 text-[8px] font-bold ${isAbsent ? "text-red-500 dark:text-red-400" : "text-[#1a3a2a] dark:text-green-400"
              }`}>
              {occupant.nomeGuerra}
            </span>
            <span className="text-[7px] text-muted-foreground">
              {occupant.numerica} {isAbsent && `[${conditionShorts[cond]}]`}
            </span>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center pt-1.5 text-muted-foreground/30">
            <User className="mb-0.5 h-3.5 w-3.5 stroke-[1.5] opacity-20" />
            <span className="text-[7px] font-semibold uppercase tracking-wider">Vazia</span>
          </div>
        )}
      </div>
    );
  };

  const renderSpecialSeatCard = (role: 'xerife' | 'sub_xerife') => {
    const studentId = role === 'xerife' ? activeRoles?.xerifeId : activeRoles?.subXerifeId;
    const occupant = studentId ? students.find((s: any) => s.id === studentId) : null;
    const isOccupied = !!occupant;
    const cond = occupant?.condition || "pronto";
    const isAbsent = cond !== "pronto";

    const roleTitle = role === 'xerife' ? "Xerife" : "Sub-Xerife";
    const borderClass = role === 'xerife'
      ? "border-yellow-500 bg-yellow-500/5 dark:bg-yellow-950/10 shadow-sm"
      : "border-slate-400 bg-slate-400/5 dark:bg-slate-900/10 shadow-sm";

    return (
      <div
        key={role}
        onClick={() => {
          if (isAdminOrXerifeAdmin) {
            if (occupant) {
              setOperationalStudent(occupant);
            } else {
              toast.info(`Defina o ${roleTitle} em Efetivo do Pelotão.`);
              setLocation("/sala-de-aula/efetivo");
            }
          }
        }}
        className={`relative flex flex-col items-center justify-between rounded-md border p-1 text-center transition-all duration-200 ${isOccupied
            ? (isAbsent ? getSeatConditionStyle(cond) + " border-solid" : borderClass)
            : "bg-zinc-100/50 border-dashed border-zinc-350 dark:bg-zinc-900/50 dark:border-zinc-800"
          } ${isAdminOrXerifeAdmin ? "cursor-pointer hover:shadow-md hover:scale-[1.02]" : ""}`}
        style={{ minHeight: "64px" }}
      >
        <div className="absolute left-1 top-1 flex items-center gap-1">
          {role === 'xerife' ? (
            <Crown className="h-2.5 w-2.5 animate-pulse fill-current text-yellow-500" />
          ) : (
            <Shield className="h-2.5 w-2.5 text-slate-400" />
          )}
          <span className="text-[6px] font-black uppercase tracking-wider text-muted-foreground/80">
            {roleTitle}
          </span>
        </div>

        {isOccupied ? (
          <div className="flex h-full w-full flex-col items-center justify-center pt-1.5">
            {occupant.fotoUrl ? (
              <img
                src={occupant.fotoUrl}
                alt={occupant.nomeGuerra}
                className={`mb-0.5 h-6 w-6 rounded-full border object-cover shadow-sm ${isAbsent ? "border-red-400" : (role === 'xerife' ? "border-yellow-500" : "border-slate-400")
                  }`}
              />
            ) : (
              <div className={`mb-0.5 flex h-6 w-6 items-center justify-center rounded-full border text-[7px] font-bold ${isAbsent
                  ? "bg-red-500/10 text-red-500 border-red-400"
                  : (role === 'xerife' ? "bg-yellow-500/10 text-yellow-600 border-yellow-500" : "bg-slate-500/10 text-slate-600 border-slate-400")
                }`}>
                {occupant.nomeGuerra.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className={`w-full truncate px-0.5 text-[8px] font-bold ${isAbsent ? "text-red-500 dark:text-red-400" : "text-[#1a3a2a] dark:text-green-400"
              }`}>
              {occupant.nomeGuerra}
            </span>
            <span className="text-[7px] text-muted-foreground">
              {occupant.numerica} {isAbsent && `[${conditionShorts[cond]}]`}
            </span>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center pt-1.5 text-muted-foreground/30">
            {role === 'xerife' ? (
              <Crown className="mb-0.5 h-3.5 w-3.5 stroke-[1.5] text-yellow-500 opacity-30" />
            ) : (
              <Shield className="mb-0.5 h-3.5 w-3.5 stroke-[1.5] text-slate-400 opacity-30" />
            )}
            <span className="text-[7px] font-semibold uppercase tracking-wider">Vazia</span>
          </div>
        )}
      </div>
    );
  };

  // Handlers
  const handleSeatClick = (seatNumber: number) => {
    if (!isAdminOrXerifeAdmin) {
      if (!studentSession) {
        toast.info("Entre como aluno para solicitar troca de carteira.");
        return;
      }
      requestSeatChange.mutate({
        studentId: studentSession.id,
        sessionToken: studentSession.sessionToken,
        requestedDeskNumber: seatNumber,
      });
      return;
    }
    const occupant = students.find((s: any) => s.deskNumber === seatNumber);
    if (occupant) {
      setOperationalStudent(occupant);
      return;
    }
    setSelectedSeat(seatNumber);

    // If we already pre-selected a student from the unassigned list
    if (selectedStudentId !== "none" && !students.find(s => s.id === Number(selectedStudentId))?.deskNumber) {
      // Keep it pre-selected
    } else {
      setSelectedStudentId("none");
    }
    setAssignmentModalOpen(true);
  };

  const handleAssignSeat = () => {
    if (!selectedSeat) return;
    if (selectedStudentId === "none") {
      toast.error("Selecione um aluno para ocupar a carteira.");
      return;
    }
    updateStudentDesk.mutate({
      studentId: Number(selectedStudentId),
      deskNumber: selectedSeat,
    });
  };

  const handleAdjustCapacity = (amount: number) => {
    const nextCapacity = capacity + amount;
    if (nextCapacity < 10 || nextCapacity > 120) return;
    setCapacity(nextCapacity);
    updateCapacity.mutate({
      companhia: selectedCompanhia,
      peloton: selectedPeloton,
      capacity: nextCapacity,
    });
  };

  const handlePromoteStudent = (studentId: number, role: 'xerife' | 'sub_xerife', nomeGuerra: string) => {
    const roleLabel = role === 'xerife' ? 'Xerife' : 'Sub-Xerife';
    if (confirm(`Deseja promover ${nomeGuerra} a ${roleLabel} do Pelotão? Esta ação revogará o acesso do ${roleLabel} atual, arquivará seu histórico e concederá acesso administrativo a ${nomeGuerra}.`)) {
      promoteStudentMutation.mutate({
        studentId,
        role,
        companhia: selectedCompanhia,
        peloton: selectedPeloton,
      });
    }
  };

  const handleConditionChange = (studentId: number, condition: string) => {
    updateStudentCondition.mutate({
      studentId,
      condition: condition as any,
    });
  };

  const toggleCleaningStudent = (weekday: number, studentId: string) => {
    setCleaningByDay((current) => {
      const currentIds = current[weekday] ?? [];
      const nextIds = currentIds.includes(studentId)
        ? currentIds.filter((id) => id !== studentId)
        : [...currentIds, studentId];
      return { ...current, [weekday]: nextIds };
    });
  };

  const handleSaveRoles = () => {
    saveRoles.mutate({
      companhia: selectedCompanhia,
      peloton: selectedPeloton,
      homemHoraId: homemHoraId ? Number(homemHoraId) : null,
      alunoLigacaoId: alunoLigacaoId ? Number(alunoLigacaoId) : null,
      p5FilmmakerId: p5FilmmakerId ? Number(p5FilmmakerId) : null,
      aditamento: aditamentoText || null,
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
      aditamento: aditamentoText || null,
      isPublished: publish,
      cleaning: weekdays.map((day, index) => ({
        weekday: day.value,
        serviceDate: addDays(weekStart, index),
        studentIds: (cleaningByDay[day.value] ?? []).map(Number).filter(Boolean),
      })),
    });
  };

  const handleSaveAditamento = () => {
    if (!aditTitulo.trim()) {
      toast.error("O título é obrigatório");
      return;
    }
    if (!aditData) {
      toast.error("A data é obrigatória");
      return;
    }
    saveAditamento.mutate({
      companhia: selectedCompanhia,
      peloton: selectedPeloton,
      titulo: aditTitulo,
      conteudo: aditConteudo || null,
      data: aditData,
      pdfUrl: aditPdfUrl || null,
    });
  };

  const handleAditamentoFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingAditamento(true);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const result = await uploadAditamentoFile.mutateAsync({
        companhia: selectedCompanhia,
        peloton: selectedPeloton,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        base64Data,
      });
      setAditPdfUrl(result.url);
      toast.success("Arquivo do aditamento enviado");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao enviar arquivo");
    } finally {
      setIsUploadingAditamento(false);
      event.currentTarget.value = "";
    }
  };

  const handleSendNotice = () => {
    if (!noticeTitle.trim() || !noticeMessage.trim()) {
      toast.error("Informe título e mensagem do aviso.");
      return;
    }
    createNotice.mutate({
      companhia: selectedCompanhia,
      peloton: selectedPeloton,
      studentId: noticeStudentId === "all" ? null : Number(noticeStudentId),
      title: noticeTitle,
      message: noticeMessage,
      priority: "important",
    });
  };

  const openLaunchFOModal = (student?: any, initialType: "positive" | "negative" = "negative") => {
    setFoType(initialType);
    setFoReason("");
    setFoCustomReason("");
    setFoDetails("");
    setFoIsAllSelected(false);
    if (student) {
      setFoSelectedStudentIds([student.id]);
    } else {
      setFoSelectedStudentIds([]);
    }
    setFoModalOpen(true);
  };

  const handleLaunchFO = async () => {
    let idsToSend = [...foSelectedStudentIds];
    if (foIsAllSelected && isXerifeGeral) {
      idsToSend = students.map((s: any) => s.id);
    }

    if (idsToSend.length === 0) {
      toast.error("Selecione pelo menos um aluno");
      return;
    }

    if (!foReason) {
      toast.error("Selecione o fato observado (elogio ou transgressão)");
      return;
    }

    let selectedReason = foReason;
    if (foReason === "outro") {
      if (foCustomReason.trim().length < 3) {
        toast.error("Informe o novo elogio ou transgressão");
        return;
      }
      selectedReason = foCustomReason.trim();
    }
    const finalNote = foDetails.trim()
      ? `${selectedReason} - Detalhes: ${foDetails.trim()}`
      : selectedReason;

    try {
      toast.loading("Registrando Fato Observado...", { id: "fo-launch" });

      if (foReason === "outro") {
        await suggestFoReason.mutateAsync({
          type: foType,
          label: selectedReason,
        });
      }
      
      // Envia as mutações em lote usando Promise.all
      await Promise.all(
        idsToSend.map((studentId) =>
          addStudentObservation.mutateAsync({
            studentId,
            type: foType,
            note: finalNote,
          })
        )
      );

      toast.success("Fato Observado registrado com sucesso!", { id: "fo-launch" });
      setFoModalOpen(false);
      setFoCustomReason("");
      await Promise.all([
        pendingObservationsQuery.refetch(),
        operationalStudent?.id ? studentObservationsQuery.refetch() : Promise.resolve(),
      ]);
    } catch (err: any) {
      toast.error(`Erro ao lançar FO: ${err.message}`, { id: "fo-launch" });
    }
  };

  const handleCreateHighlight = (student: any) => {
    const title = prompt(`Título do destaque para ${student.nomeGuerra}:`, "Aluno destaque");
    if (!title?.trim()) return;
    const description = prompt("Descrição curta do destaque:", "");
    createStudentHighlight.mutate({
      studentId: student.id,
      title: title.trim(),
      description: description?.trim() || null,
    });
  };

  const openEditStudent = (student: any) => {
    setEditingStudent(student);
    setEditStudentForm({
      numerica: student.numerica || "",
      nomeGuerra: student.nomeGuerra || "",
      nomeCompleto: student.nomeCompleto || "",
      companhia: String(student.companhia || selectedCompanhia),
      peloton: String(student.peloton || selectedPeloton),
      deskNumber: student.deskNumber ? String(student.deskNumber) : "",
    });
  };

  const handleCreateRosterStudent = () => {
    createRosterStudent.mutate({
      numerica: cleanNumerica(newStudentForm.numerica),
      nomeGuerra: newStudentForm.nomeGuerra.trim(),
      senha: newStudentForm.senha,
    });
  };

  const handleUpdateRosterStudent = () => {
    if (!editingStudent) return;
    updateRosterStudent.mutate({
      studentId: editingStudent.id,
      numerica: cleanNumerica(editStudentForm.numerica),
      nomeGuerra: editStudentForm.nomeGuerra.trim(),
      nomeCompleto: editStudentForm.nomeCompleto.trim(),
      companhia: Number(editStudentForm.companhia),
      peloton: Number(editStudentForm.peloton),
      deskNumber: editStudentForm.deskNumber ? Number(editStudentForm.deskNumber) : null,
    });
  };

  const handleDeleteRosterStudent = (student: any) => {
    const confirmed = window.confirm(`Remover ${student.nomeGuerra} do efetivo? Esta ação remove o cadastro do aluno e seus dados vinculados.`);
    if (!confirmed) return;
    deleteRosterStudent.mutate({ studentId: student.id });
  };

  const roleOptions = useMemo(() => students.map((student: any) => ({
    value: String(student.id),
    label: `${student.numerica} - ${student.nomeGuerra}`,
  })), [students]);

  // View Navigation links
  const menuOptions = [
    { title: "Frequência (Pecúlio)", mobileTitle: "Frequência", desc: "Lançar e auditar faltas ou dispensas", mobileDesc: "Pecúlio diário", icon: ClipboardList, path: "/sala-de-aula/peculio", adminOnly: true },
    { title: "Funções e Cargos", mobileTitle: "Funções", desc: "Criar funções, nomear membros e tesouraria", mobileDesc: "Cargos e tesouraria", icon: Users, path: "/sala-de-aula/cargos", adminOnly: true },
    { title: "Efetivo do Pelotão", mobileTitle: "Efetivo", desc: "Ver condições e promover lideranças", mobileDesc: "Alunos e liderança", icon: Users, path: "/sala-de-aula/efetivo", adminOnly: true },
    { title: "Escalas de Limpeza", mobileTitle: "Limpeza", desc: "Visualizar e gerenciar faxina semanal", mobileDesc: "Faxina semanal", icon: CalendarDays, path: "/sala-de-aula/escala", adminOnly: false },
    { title: "Aditamentos Vigentes", mobileTitle: "Aditamentos", desc: "Acessar informativos e PDFs oficiais", mobileDesc: "PDFs oficiais", icon: FileText, path: "/sala-de-aula/aditamentos", adminOnly: false },
    { title: "Histórico de Xerifado", mobileTitle: "Histórico", desc: "Arquivo histórico de promoções", mobileDesc: "Promoções", icon: History, path: "/sala-de-aula/historico", adminOnly: false }
  ];

  const filteredMenuOptions = menuOptions.filter(opt => !opt.adminOnly || isAdminOrXerifeAdmin);

  // Proteção: Redirecionar para login se não estiver autenticado
  if (!studentSession && !access?.isGeneral && !isAdminOrXerifeAdmin) {
    return (
      <div className="min-h-screen bg-[#f5f2e8] text-foreground dark:bg-[#0c0c0e]">
        <Navbar />
        <main className="container mx-auto px-4 py-6 pb-24 max-w-6xl">
          <Card className="max-w-md mx-auto mt-12 border-[#c4a84b]/30 bg-white dark:bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-center text-[#1a3a2a] dark:text-[#c4a84b]">Acesso Restrito</CardTitle>
              <CardDescription className="text-center">Você precisa fazer login para acessar a Sala de Aula</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">Faça login como aluno para continuar.</p>
              <div className="flex flex-col gap-2">
                <Link href="/entrar">
                  <Button className="w-full bg-[#1a3a2a] text-white hover:bg-[#1a3a2a]/90">Entrar como Aluno</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f2e8] text-foreground dark:bg-[#0c0c0e]">
      <Navbar />

      <main className="container mx-auto px-4 py-6 pb-24 max-w-6xl">

        {/* Render nested views */}
        {subview === "map" ? (
          /* ================= MAIN CLASSROOM VIEW ================= */
          <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2.5">
                <Link href={studentSession ? "/notas-do-curso" : "/"}>
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full border border-border bg-white dark:bg-zinc-900">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="flex min-w-0 items-center gap-2">
                  <LayoutGrid className="h-5 w-5 shrink-0 text-[#c4a84b] sm:h-6 sm:w-6" />
                  <h1 className="min-w-0 text-xl font-black uppercase leading-tight tracking-wide text-[#1a3a2a] dark:text-[#c4a84b] sm:text-2xl sm:tracking-wider">
                    <span className="whitespace-nowrap">Sala de Aula</span>
                    {isAdminOrXerifeAdmin && (
                      <span className="ml-1 align-baseline font-sans text-[11px] font-medium lowercase tracking-normal text-muted-foreground sm:text-xs">
                        (painel do xerife)
                      </span>
                    )}
                  </h1>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                <Select value={companhia} onValueChange={setCompanhia} disabled={!canChangeClassroomScope}>
                  <SelectTrigger className="h-9 w-full min-w-0 bg-white text-sm font-semibold dark:bg-zinc-900 sm:w-[150px] border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((item) => <SelectItem key={item} value={String(item)}>{item}ª Companhia</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={peloton} onValueChange={setPeloton} disabled={!canChangeClassroomScope}>
                  <SelectTrigger className="h-9 w-full min-w-0 bg-white text-sm font-semibold dark:bg-zinc-900 sm:w-[128px] border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2].map((item) => <SelectItem key={item} value={String(item)}>{item}º Pelotão</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Banner for student xerife */}
            {isCurrentStudentActiveXerife && !isAdminOrXerifeAdmin && (
              <Card className="border-[#c4a84b] bg-[#c4a84b]/10 text-foreground">
                <CardContent className="flex items-center justify-between p-4 flex-col sm:flex-row gap-3">
                  <div className="flex items-center gap-3">
                    <Crown className="h-6 w-6 text-[#c4a84b] fill-current shrink-0" />
                    <div>
                      <p className="text-sm font-bold">Atenção, Xerife/Sub-Xerife!</p>
                      <p className="text-xs text-muted-foreground">Você possui atribuição de liderança. Entre na Área do Xerife para realizar alterações ou gerenciar escalas.</p>
                    </div>
                  </div>
                  <Link href="/xerife">
                    <Button className="bg-[#1a3a2a] text-white hover:bg-[#1a3a2a]/95 text-xs font-bold gap-1.5 shrink-0">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      Acessar Painel de Gestão
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Quick Navigation Menu Cards */}
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
              {filteredMenuOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <Link href={opt.path} key={opt.path}>
                    <Card className="h-[54px] overflow-hidden border-border/50 bg-white py-0 shadow-sm transition-all duration-300 hover:border-[#c4a84b]/50 hover:bg-[#c4a84b]/5 dark:bg-zinc-900 md:h-[56px]">
                      <CardContent className="flex h-full items-center gap-2 px-2 py-1.5 md:px-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#c4a84b]/10 text-[#c4a84b]">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-black leading-tight text-foreground md:hidden">{opt.mobileTitle}</p>
                          <p className="hidden truncate text-xs font-bold leading-tight text-foreground md:block">{opt.title}</p>
                          <p className="mt-0.5 truncate text-[9.5px] leading-tight text-muted-foreground md:hidden">{opt.mobileDesc}</p>
                          <p className="mt-0.5 hidden truncate text-[10px] leading-tight text-muted-foreground md:block">{opt.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Main Grid: Seating Map & Side Column */}
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

              <div className="space-y-6 min-w-0">
                {/* Seating Map Container */}
                <div className="space-y-6 min-w-0">
                  {/* Front indication */}
                  <div className="flex flex-col items-center justify-center border-b pb-5 dark:border-zinc-800">
                    <div className="flex items-center gap-2 rounded-lg bg-zinc-100 px-6 py-2 dark:bg-zinc-800 border border-border/50 shadow-inner w-full max-w-sm justify-center">
                      <Laptop className="h-4 w-4 text-[#c4a84b]" />
                      <span className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                        MESA DO INSTRUTOR / QUADRO (FRENTE)
                      </span>
                    </div>
                  </div>

                  {/* Barra de Pesquisa */}
                  <div className="flex flex-col gap-2.5 bg-white/60 dark:bg-zinc-900/40 border border-border/40 p-3 rounded-lg shadow-sm">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Pesquisar por nome, número ou pelotão..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 border-border/50 bg-white pl-9 text-sm dark:bg-zinc-800"
                      />
                    </div>
                    {searchQuery && (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                          {filteredStudents.length} aluno(s) encontrado(s)
                        </div>
                        <div className="grid max-h-48 gap-1.5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
                          {filteredStudents.slice(0, 12).map((student: any) => (
                            <button
                              key={student.id}
                              type="button"
                              className="flex min-w-0 items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-left transition-colors hover:border-[#c4a84b]/60 hover:bg-[#c4a84b]/5"
                              onClick={() => {
                                if (isAdminOrXerifeAdmin) {
                                  setOperationalStudent(student);
                                } else {
                                  toast.info(student.deskNumber ? `${student.nomeGuerra}: carteira ${student.deskNumber}` : `${student.nomeGuerra}: sem carteira definida`);
                                }
                              }}
                            >
                              {student.fotoUrl ? (
                                <img src={student.fotoUrl} alt="" className="h-8 w-8 shrink-0 rounded-full border object-cover" />
                              ) : (
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a3a2a]/10 text-[10px] font-bold text-[#1a3a2a] dark:text-green-300">
                                  {student.nomeGuerra.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                              <span className="min-w-0">
                                <span className="block truncate text-xs font-bold text-foreground">{student.nomeGuerra}</span>
                                <span className="block text-[10px] text-muted-foreground">{student.numerica} · {student.deskNumber ? `Carteira ${student.deskNumber}` : "Sem carteira"}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Capacity control (Xerife only) */}
                  {isAdminOrXerifeAdmin && (
                    <div className="flex items-center justify-between bg-white/60 dark:bg-zinc-900/40 border border-border/40 p-2.5 rounded-lg max-w-md mx-auto shadow-sm">
                      <span className="text-xs font-bold text-muted-foreground">Ajuste de assentos:</span>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleAdjustCapacity(-1)} disabled={capacity <= 10}><Minus className="h-3.5 w-3.5" /></Button>
                        <span className="text-xs font-bold w-16 text-center">{capacity} cadeiras</span>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleAdjustCapacity(1)} disabled={capacity >= 120}><Plus className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  )}

                  {/* Seating map grid (exactly 5 columns, scrollable in separate container) */}
                  <div className="mb-6 w-full max-w-full min-w-0 overflow-x-auto rounded-xl border border-border/50 bg-white/80 p-3 shadow-md dark:bg-zinc-900/60">
                    <div className="grid min-w-[480px] grid-cols-5 gap-2.5 pb-2">
                      {/* Fileira 1 (01 a 11) */}
                      <div className="flex flex-col gap-2">
                        <div className="text-center font-bold text-[10px] uppercase tracking-wider text-muted-foreground pb-1 border-b dark:border-zinc-800">
                          Fileira 1
                        </div>
                        {col1.map((seatNumber) => renderSeatCard(seatNumber))}
                      </div>

                      {/* Fileira 2 (12 a 21) */}
                      <div className="flex flex-col gap-2">
                        <div className="text-center font-bold text-[10px] uppercase tracking-wider text-muted-foreground pb-1 border-b dark:border-zinc-800">
                          Fileira 2
                        </div>
                        {col2.map((seatNumber) => renderSeatCard(seatNumber))}
                      </div>

                      {/* Fileira 3 (22 a 31) */}
                      <div className="flex flex-col gap-2">
                        <div className="text-center font-bold text-[10px] uppercase tracking-wider text-muted-foreground pb-1 border-b dark:border-zinc-800">
                          Fileira 3
                        </div>
                        {col3.map((seatNumber) => renderSeatCard(seatNumber))}
                      </div>

                      {/* Fileira 4 (32 a 41) */}
                      <div className="flex flex-col gap-2">
                        <div className="text-center font-bold text-[10px] uppercase tracking-wider text-muted-foreground pb-1 border-b dark:border-zinc-800">
                          Fileira 4
                        </div>
                        {col4.map((seatNumber) => renderSeatCard(seatNumber))}
                      </div>

                      {/* Fileira 5 (Xerife, Sub-xerife, 42 a 51+) */}
                      <div className="flex flex-col gap-2">
                        <div className="text-center font-bold text-[10px] uppercase tracking-wider text-muted-foreground pb-1 border-b dark:border-zinc-800">
                          Fileira 5
                        </div>
                        {renderSpecialSeatCard("xerife")}
                        {renderSpecialSeatCard("sub_xerife")}
                        {col5Regular.map((seatNumber) => renderSeatCard(seatNumber))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 border-t dark:border-zinc-800 text-center">
                    <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-muted-foreground/35">FUNDO DA SALA</span>
                  </div>
                </div>

                {/* Unassigned Students List */}
                <Card className="border-border/50 bg-white dark:bg-zinc-900 shadow-md">
                  <CardHeader className="pb-2 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <User className="h-4 w-4 text-red-500 animate-pulse" />
                      Alunos Fora de Assento ({unassignedStudents.length})
                    </CardTitle>
                    <CardDescription className="text-[10px]">Alunos que não estão sentados em nenhuma cadeira</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="flex flex-wrap gap-1.5 max-h-[150px] overflow-y-auto">
                      {unassignedStudents.map((s: any) => (
                        <Badge
                          key={s.id}
                          variant="outline"
                          className={`text-xs px-2 py-1 flex items-center gap-1 cursor-pointer hover:bg-muted/80 ${selectedStudentId === String(s.id)
                              ? "bg-yellow-500/20 border-yellow-500 text-yellow-700"
                              : "border-border text-muted-foreground"
                            }`}
                          onClick={() => {
                            if (isAdminOrXerifeAdmin) {
                              setSelectedStudentId(String(s.id));
                              toast.info(`Aluno ${s.nomeGuerra} selecionado! Agora clique em uma cadeira no mapa para alocá-lo.`);
                            }
                          }}
                        >
                          {s.numerica} - {s.nomeGuerra}
                        </Badge>
                      ))}
                      {unassignedStudents.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2 w-full">Todos os alunos estão sentados.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Platoon Board Column */}
              <div className="space-y-6">
                <Card className="border-border/50 bg-white dark:bg-zinc-900 shadow-md">
                  <CardHeader className="pb-3 border-b bg-muted/20">
                    <CardTitle className="text-sm font-black uppercase tracking-wider text-[#1a3a2a] dark:text-[#c4a84b] flex items-center gap-2">
                      <Star className="h-4 w-4 fill-current text-[#c4a84b]" />
                      Quadro do Pelotão
                    </CardTitle>
                    <CardDescription className="text-[10px]">Representação atual de liderança</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {/* active Xerife */}
                    <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 flex items-center gap-3">
                      <div className="relative shrink-0">
                        {students.find((s: any) => s.id === activeRoles?.xerifeId)?.fotoUrl ? (
                          <img
                            src={students.find((s: any) => s.id === activeRoles?.xerifeId)?.fotoUrl}
                            alt="Xerife"
                            className="h-11 w-11 rounded-full object-cover border-2 border-[#c4a84b]"
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-full bg-[#c4a84b]/10 flex items-center justify-center border-2 border-[#c4a84b]">
                            <Crown className="h-5 w-5 text-[#c4a84b] fill-current" />
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 bg-[#c4a84b] text-[#1a1a1a] rounded-full p-0.5"><Star className="h-2.5 w-2.5 fill-current" /></span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-black tracking-widest text-[#b39740]">Xerife</span>
                        <p className="text-xs font-bold text-foreground truncate max-w-[190px]">
                          {activeRoles?.xerifeName || "Não definido"}
                        </p>
                      </div>
                    </div>

                    {/* active Sub-Xerife */}
                    <div className="rounded-xl border border-slate-500/10 bg-slate-500/5 p-3 flex items-center gap-3">
                      <div className="relative shrink-0">
                        {students.find((s: any) => s.id === activeRoles?.subXerifeId)?.fotoUrl ? (
                          <img
                            src={students.find((s: any) => s.id === activeRoles?.subXerifeId)?.fotoUrl}
                            alt="Sub-Xerife"
                            className="h-11 w-11 rounded-full object-cover border-2 border-slate-400"
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-full bg-slate-500/10 flex items-center justify-center border-2 border-slate-400">
                            <Shield className="h-5 w-5 text-slate-505" />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-black tracking-widest text-slate-500">Sub-Xerife</span>
                        <p className="text-xs font-bold text-foreground truncate max-w-[190px]">
                          {activeRoles?.subXerifeName || "Não definido"}
                        </p>
                      </div>
                    </div>

                    {/* other active roles */}
                    <div className="space-y-2 pt-2 border-t text-xs">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground font-medium">Homem-Hora:</span>
                        <span className="font-bold text-foreground">{activeRoles?.homemHoraName || "Não definido"}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground font-medium">Aluno de Ligação:</span>
                        <span className="font-bold text-foreground">{activeRoles?.alunoLigacaoName || "Não definido"}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground font-medium">P5 (Filmmaker):</span>
                        <span className="font-bold text-foreground">{activeRoles?.p5FilmmakerName || "Não definido"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {!isAdminOrXerifeAdmin && studentSession && (
                  <Card className="border-[#c4a84b]/30 bg-[#fff8e1] shadow-md dark:bg-yellow-950/20">
                    <CardContent className="p-4 text-xs leading-relaxed text-[#1a3a2a] dark:text-yellow-100">
                      <p className="font-bold">Troca de carteira</p>
                      <p className="mt-1 text-muted-foreground">
                        Toque na carteira desejada para enviar um pedido ao Xerife. A troca só acontece após aprovação.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {isAdminOrXerifeAdmin && (
                  <Card className="border-border/50 bg-white shadow-md dark:bg-zinc-900">
                    <CardHeader className="pb-3 border-b bg-muted/20">
                      <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#1a3a2a] dark:text-[#c4a84b]">
                        <Inbox className="h-4 w-4 text-[#c4a84b]" />
                        Pedidos de Carteira
                      </CardTitle>
                      <CardDescription className="text-[10px]">
                        Solicitações pendentes dos alunos
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 p-3">
                      {(seatRequestsQuery.data ?? []).map((request: any) => (
                        <div key={request.id} className="rounded-lg border bg-muted/10 p-3 text-xs">
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-foreground">{request.nomeGuerra || "Aluno"}</p>
                              <p className="text-muted-foreground">
                                {request.numerica} pediu a carteira {request.requestedDeskNumber}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-[10px]">Pendente</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              className="h-8 bg-[#1a3a2a] text-xs text-white"
                              onClick={() => decideSeatRequest.mutate({ id: request.id, status: "approved" })}
                              disabled={decideSeatRequest.isPending}
                            >
                              <Check className="mr-1 h-3.5 w-3.5" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs text-destructive"
                              onClick={() => decideSeatRequest.mutate({ id: request.id, status: "rejected", reason: "Rejeitado pelo Xerife" })}
                              disabled={decideSeatRequest.isPending}
                            >
                              <X className="mr-1 h-3.5 w-3.5" />
                              Rejeitar
                            </Button>
                          </div>
                        </div>
                      ))}
                      {!seatRequestsQuery.data?.length && (
                        <p className="py-4 text-center text-xs text-muted-foreground">Nenhum pedido pendente.</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {isAdminOrXerifeAdmin && (
                  <Card className="border-border/50 bg-white shadow-md dark:bg-zinc-900">
                    <CardHeader className="pb-3 border-b bg-muted/20">
                      <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#1a3a2a] dark:text-[#c4a84b]">
                        <Send className="h-4 w-4 text-[#c4a84b]" />
                        Enviar Aviso
                      </CardTitle>
                      <CardDescription className="text-[10px]">
                        Aviso individual ou para todo o Pelotão
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 p-3">
                      <Select value={noticeStudentId} onValueChange={setNoticeStudentId}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todo o Pelotão</SelectItem>
                          {students.map((student: any) => (
                            <SelectItem key={student.id} value={String(student.id)}>
                              {student.numerica} - {student.nomeGuerra}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={noticeTitle}
                        onChange={(event) => setNoticeTitle(event.target.value)}
                        placeholder="Título do aviso"
                        className="h-9 text-xs"
                      />
                      <textarea
                        value={noticeMessage}
                        onChange={(event) => setNoticeMessage(event.target.value)}
                        placeholder="Mensagem"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <Button className="w-full gap-2 bg-[#1a3a2a] text-white" onClick={handleSendNotice} disabled={createNotice.isPending}>
                        <Send className="h-4 w-4" />
                        {createNotice.isPending ? "Enviando..." : "Enviar Aviso"}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Other platoons active xerifes */}
                <Card className="border-border/50 bg-white dark:bg-zinc-900 shadow-md">
                  <CardHeader className="pb-3 border-b bg-muted/20">
                    <CardTitle className="text-sm font-black uppercase tracking-wider text-[#1a3a2a] dark:text-[#c4a84b]">
                      Xerifado do CFSD (Outros Pel)
                    </CardTitle>
                    <CardDescription className="text-[10px]">Título informativo das outras turmas</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[300px] overflow-y-auto divide-y text-xs">
                      {activeXerifesQuery.data
                        ?.filter((row: any) => !(row.companhia === selectedCompanhia && row.peloton === selectedPeloton))
                        ?.map((row: any) => (
                          <div key={`${row.companhia}-${row.peloton}`} className="p-3 hover:bg-muted/30 transition-colors">
                            <p className="font-bold text-[#1a3a2a] dark:text-green-400">
                              {row.companhia}ª Cia / {row.peloton}º Pel
                            </p>
                            <div className="mt-1 space-y-0.5 text-muted-foreground">
                              <p className="flex items-center gap-1">
                                <Crown className="h-3.5 w-3.5 text-yellow-500 fill-current shrink-0" />
                                Xerife: <span className="font-semibold text-foreground">{row.xerifeName || "Não nomeado"}</span>
                              </p>
                              <p className="flex items-center gap-1">
                                <Shield className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                Sub-Xerife: <span className="font-semibold text-foreground">{row.subXerifeName || "Não nomeado"}</span>
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>

            {isXerifeGeral && (
              <PeculioOverview />
            )}

            {/* Assignment dialog */}
            <Dialog open={assignmentModalOpen} onOpenChange={setAssignmentModalOpen}>
              <DialogContent className="sm:max-w-[400px] bg-white dark:bg-zinc-900 border border-border text-foreground">
                <DialogHeader>
                  <DialogTitle>Ocupar Carteira {selectedSeat}</DialogTitle>
                  <DialogDescription>Selecione o aluno que ocupará esta cadeira.</DialogDescription>
                </DialogHeader>

                <div className="py-4">
                  <Label htmlFor="student-select">Aluno</Label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger id="student-select" className="w-full bg-white dark:bg-zinc-800 mt-2">
                      <SelectValue placeholder="Selecione o aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Desocupada / Vazia</SelectItem>
                      {students.map((student: any) => (
                        <SelectItem key={student.id} value={String(student.id)}>
                          {student.numerica} - {student.nomeGuerra}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => { setAssignmentModalOpen(false); setSelectedStudentId("none"); }}>Cancelar</Button>
                  <Button
                    className="bg-[#1a3a2a] text-white hover:bg-[#1a3a2a]/90"
                    onClick={handleAssignSeat}
                    disabled={updateStudentDesk.isPending}
                  >
                    {updateStudentDesk.isPending ? "Salvando..." : "Confirmar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>



          </div>
        ) : (
          /* ================= SUBVIEW ROUTING SYSTEM ================= */
          <div className="space-y-6">

            {/* Back button header */}
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/sala-de-aula")}
                className="gap-2 bg-white dark:bg-zinc-900 border-border text-foreground font-bold hover:bg-muted/80"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para o Mapa da Sala
              </Button>
            </div>

            {subview === "peculio" && (
              isXerifeGeral ? (
                <PeculioOverview />
              ) : (
                <PeculioTab
                  companhia={companhia}
                  setCompanhia={setCompanhia}
                  peloton={peloton}
                  setPeloton={setPeloton}
                  isAdmin={isAdminOrXerifeAdmin}
                />
              )
            )}

            {subview === "cargos" && (
              /* CARGOS / FUNÇÕES SUBVIEW (XERIFE ONLY) */
              !isAdminOrXerifeAdmin ? (
                <Card className="p-8 text-center max-w-md mx-auto"><CardContent><p className="text-sm font-bold text-red-500">Acesso Restrito ao Xerife.</p></CardContent></Card>
              ) : (
                <ClassroomCargosTab companhia={selectedCompanhia} peloton={selectedPeloton} isAdmin={isAdminOrXerifeAdmin} />
              )
            )}

            {subview === "efetivo" && (
              /* EFETIVO / CONDITIONS / PROMOTIONS SUBVIEW (XERIFE ONLY) */
              !isAdminOrXerifeAdmin ? (
                <Card className="p-8 text-center max-w-md mx-auto"><CardContent><p className="text-sm font-bold text-red-500">Acesso Restrito ao Xerife.</p></CardContent></Card>
              ) : (
                <Card className="border-border/50">
                  <CardContent className="p-5 bg-white dark:bg-zinc-900 rounded-lg">
                    <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-[#c4a84b]" />
                        <div>
                          <h2 className="text-lg font-bold text-foreground">Gerenciamento do Efetivo do Pelotão</h2>
                          <p className="text-xs text-muted-foreground">Controle de condições em sala de aula e nomeação de Xerifes</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-2 md:mt-0 justify-end">
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 bg-amber-600 text-white hover:bg-amber-700 text-xs gap-1.5 font-bold shadow-sm"
                          onClick={() => openLaunchFOModal()}
                        >
                          <ClipboardList className="h-3.5 w-3.5" />
                          Lançar FO Coletivo / Lote
                        </Button>
                        <div className="w-full md:w-48">
                          <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              type="text"
                              placeholder="Buscar no efetivo..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="h-8 bg-white pl-8 text-xs dark:bg-zinc-800"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mb-4 rounded-lg border bg-muted/10 p-3">
                      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                        <UserPlus className="h-4 w-4 text-[#c4a84b]" />
                        Adicionar aluno ao efetivo
                      </div>
                      <div className="grid gap-2 md:grid-cols-[120px_1fr_150px_auto]">
                        <Input
                          value={newStudentForm.numerica}
                          onChange={(event) => setNewStudentForm((current) => ({ ...current, numerica: cleanNumerica(event.target.value) }))}
                          placeholder="Numérica"
                          className="h-9 text-sm"
                        />
                        <Input
                          value={newStudentForm.nomeGuerra}
                          onChange={(event) => setNewStudentForm((current) => ({ ...current, nomeGuerra: event.target.value }))}
                          placeholder="Nome de guerra"
                          className="h-9 text-sm"
                        />
                        <Input
                          type="password"
                          value={newStudentForm.senha}
                          onChange={(event) => setNewStudentForm((current) => ({ ...current, senha: event.target.value }))}
                          placeholder="Senha inicial"
                          className="h-9 text-sm"
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="h-9 bg-[#1a3a2a] text-white"
                          onClick={handleCreateRosterStudent}
                          disabled={createRosterStudent.isPending}
                        >
                          <Plus className="h-4 w-4" />
                          Adicionar
                        </Button>
                      </div>
                    </div>

                    {access?.isGeneral && pendingObservationsQuery.data?.length ? (
                      <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-200">
                          <Inbox className="h-4 w-4" />
                          FO pendente de validação
                        </div>
                        <div className="space-y-2">
                          {pendingObservationsQuery.data.map((item: any) => (
                            <div key={item.id} className="flex flex-col gap-2 rounded-md border bg-background/80 p-2 text-xs md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="font-bold">
                                  {item.type === "positive" ? "FO+" : "FO-"} - {item.numerica} {item.nome_guerra}
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{item.note}</p>
                                <p className="mt-1 text-[10px] text-muted-foreground">Lançada por {item.created_by_name || "xerife"}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-8 bg-[#1a3a2a] text-white"
                                  onClick={() => validateStudentObservation.mutate({ id: item.id, status: "approved" })}
                                  disabled={validateStudentObservation.isPending}
                                >
                                  Aprovar
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  className="h-8"
                                  onClick={() => validateStudentObservation.mutate({ id: item.id, status: "rejected" })}
                                  disabled={validateStudentObservation.isPending}
                                >
                                  Rejeitar
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {access?.isGeneral && pendingFoReasonsQuery.data?.length ? (
                      <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-800 dark:text-blue-200">
                          <BadgeCheck className="h-4 w-4" />
                          Novos fatos aguardando inclusão na lista
                        </div>
                        <div className="space-y-2">
                          {pendingFoReasonsQuery.data.map((item: any) => (
                            <div key={item.id} className="flex flex-col gap-2 rounded-md border bg-background/80 p-2 text-xs md:flex-row md:items-center md:justify-between">
                              <div className="min-w-0">
                                <p className={`font-black ${item.type === "positive" ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                                  {item.type === "positive" ? "FO+ · Elogio" : "FO- · Transgressão"}
                                </p>
                                <p className="mt-1 break-words font-semibold text-foreground">{item.label}</p>
                                <p className="mt-1 text-[10px] text-muted-foreground">Sugerido por {item.created_by_name || "xerife"}</p>
                              </div>
                              <div className="flex shrink-0 gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-8 bg-[#1a3a2a] text-white"
                                  onClick={() => validateFoReason.mutate({ id: item.id, status: "approved" })}
                                  disabled={validateFoReason.isPending}
                                >
                                  Incluir na lista
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  className="h-8"
                                  onClick={() => validateFoReason.mutate({ id: item.id, status: "rejected" })}
                                  disabled={validateFoReason.isPending}
                                >
                                  Rejeitar
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredStudents.map((student: any) => (
                        <div key={student.id} className="flex flex-col justify-between rounded-lg border bg-white p-3 text-sm dark:bg-zinc-900">
                          <button
                            type="button"
                            className="flex w-full items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-[#c4a84b]"
                            onClick={() => setOperationalStudent(student)}
                          >
                            {student.fotoUrl ? (
                              <img
                                src={student.fotoUrl}
                                alt={`Foto de ${student.nomeGuerra}`}
                                className="h-12 w-12 shrink-0 rounded-md border border-[#c4a84b]/40 object-cover"
                              />
                            ) : (
                              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-[#1a3a2a]/10 text-sm font-black text-[#1a3a2a] dark:text-green-300">
                                {student.nomeGuerra.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                            <span className="min-w-0 flex-1 space-y-1">
                              <span className="flex items-start justify-between gap-2">
                                <span className="block truncate font-bold text-[#1a3a2a] dark:text-green-400">{student.nomeGuerra}</span>
                                <Badge className={`shrink-0 border px-2 py-0.5 text-[10px] font-semibold ${getConditionBadgeStyle(student.condition)}`}>
                                  {conditionLabels[student.condition || "pronto"]}
                                </Badge>
                              </span>
                              <span className="block text-xs text-muted-foreground">{student.numerica} - {student.companhia}ª Cia / {student.peloton}º Pel</span>
                              <span className="block text-[10px] font-semibold text-[#b39740]">Abrir ficha operacional</span>
                            </span>
                          </button>

                          <div className="mt-2 flex justify-end gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[10px]"
                              onClick={() => openEditStudent(student)}
                            >
                              <Pencil className="mr-1 h-3 w-3" />
                              Editar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[10px] text-red-500 hover:text-red-600"
                              onClick={() => handleDeleteRosterStudent(student)}
                              disabled={deleteRosterStudent.isPending}
                            >
                              <Trash2 className="mr-1 h-3 w-3" />
                              Remover
                            </Button>
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
                                  <SelectItem key={val} value={val} className="text-xs">{lbl}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="mt-3 border-t pt-2.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="w-full h-8 text-[11px] border-amber-500/30 text-amber-700 hover:bg-amber-500/10 hover:text-amber-800 dark:border-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/5 dark:hover:text-amber-300"
                              onClick={() => openLaunchFOModal(student)}
                            >
                              <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                              Registrar Fato Observado (FO)
                            </Button>
                          </div>

                          <div className="mt-3 flex items-center justify-between border-t pt-2 gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              className="flex-1 text-[10px] h-7 border-yellow-500/30 text-[#b39740] hover:bg-yellow-500/10 gap-1 px-1"
                              onClick={() => handlePromoteStudent(student.id, 'xerife', student.nomeGuerra)}
                              disabled={promoteStudentMutation.isPending}
                            >
                              <Crown className="h-3 w-3 fill-current text-[#b39740]" />
                              Xerife
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              className="flex-1 text-[10px] h-7 border-slate-500/30 text-slate-500 hover:bg-slate-500/10 gap-1 px-1 dark:text-slate-400"
                              onClick={() => handlePromoteStudent(student.id, 'sub_xerife', student.nomeGuerra)}
                              disabled={promoteStudentMutation.isPending}
                            >
                              <Shield className="h-3 w-3" />
                              Sub-Xerife
                            </Button>
                          </div>
                          {access?.isGeneral && (
                            <Button
                              type="button"
                              size="sm"
                              className="mt-2 h-8 w-full gap-1 bg-[#c4a84b] text-[11px] font-black text-[#1a1a1a] hover:bg-[#b39740]"
                              onClick={() => handleCreateHighlight(student)}
                              disabled={createStudentHighlight.isPending}
                            >
                              <Award className="h-3.5 w-3.5" />
                              Promover Destaque
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            )}

            {subview === "escala" && (
              /* SCALES SUBVIEW */
              <div className="space-y-6">
                {isAdminOrXerifeAdmin ? (
                  /* Write Mode for Xerifes */
                  <>
                    <Card className="border-border/50 bg-white dark:bg-zinc-900 rounded-lg p-5 space-y-4">
                      <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                          <UserCog className="h-5 w-5 text-[#c4a84b]" />
                          <h2 className="text-lg font-bold text-foreground">Configurar Funções Fixas do Pelotão</h2>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
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
                          <Label>P5 (Filmmaker)</Label>
                          <Select value={p5FilmmakerId || "none"} onValueChange={(value) => setP5FilmmakerId(value === "none" ? "" : value)}>
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
                      </div>
                      <div className="pt-2">
                        <Button className="bg-[#1a3a2a] text-white gap-2 w-full sm:w-auto" onClick={handleSaveRoles} disabled={saveRoles.isPending}>
                          <Save className="h-4 w-4" /> Salvar Funções
                        </Button>
                      </div>
                    </Card>

                    <Card className="border-border/50 bg-white dark:bg-zinc-900 rounded-lg p-5 space-y-4">
                      <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-5 w-5 text-[#c4a84b]" />
                          <h2 className="text-lg font-bold text-foreground">Escala Semanal de Faxina</h2>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <Label>Data de Serviço (Opcional)</Label>
                          <Input type="date" value={dutyDate} onChange={(e) => setDutyDate(e.target.value)} />
                        </div>
                        <div>
                          <Label>Xerife da Semana</Label>
                          <Select value={xerifeId || "none"} onValueChange={(value) => setXerifeId(value === "none" ? "" : value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não definido</SelectItem>
                              {roleOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Sub-xerife da Semana</Label>
                          <Select value={subXerifeId || "none"} onValueChange={(value) => setSubXerifeId(value === "none" ? "" : value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não definido</SelectItem>
                              {roleOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        {weekdays.map((day, index) => {
                          const selectedIds = cleaningByDay[day.value] ?? [];
                          const selectedNames = students
                            .filter((s: any) => selectedIds.includes(String(s.id)))
                            .map((s: any) => s.nomeGuerra)
                            .join(", ");

                          return (
                            <div key={day.value} className="rounded-lg border p-3 bg-muted/10">
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <p className="text-xs font-bold text-[#1a3a2a] dark:text-green-400">{day.label}</p>
                                <span className="text-[10px] text-muted-foreground">{new Date(`${addDays(weekStart, index)}T00:00:00`).toLocaleDateString("pt-BR")}</span>
                              </div>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-between text-left font-normal text-xs h-9 bg-white dark:bg-zinc-900">
                                    <span className="truncate">{selectedIds.length > 0 ? `${selectedIds.length} selecionado(s): ${selectedNames}` : "Selecionar alunos..."}</span>
                                    <span className="text-muted-foreground ml-2 text-[10px]">▼</span>
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-2 max-h-[300px] overflow-y-auto bg-white dark:bg-zinc-900 border" align="start">
                                  <div className="space-y-1.5">
                                    {students.map((student: any) => {
                                      const studentIdStr = String(student.id);
                                      const isChecked = selectedIds.includes(studentIdStr);
                                      return (
                                        <div key={student.id} className="flex items-center space-x-2 rounded px-2 py-1 hover:bg-muted cursor-pointer" onClick={() => toggleCleaningStudent(day.value, studentIdStr)}>
                                          <Checkbox checked={isChecked} id={`cleaning-${day.value}-${student.id}`} className="border-[#c4a84b] data-[state=checked]:bg-[#c4a84b] data-[state=checked]:text-[#1a1a1a]" />
                                          <label htmlFor={`cleaning-${day.value}-${student.id}`} className="text-xs font-medium cursor-pointer flex-1">{student.numerica} - {student.nomeGuerra}</label>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          );
                        })}
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 pt-2">
                        <Button variant="outline" className="gap-2" onClick={() => handleSaveWeek(false)} disabled={saveWeeklyScale.isPending}><Save className="h-4 w-4" /> Salvar Rascunho</Button>
                        <Button className="gap-2 bg-[#c4a84b] text-[#1a1a1a] hover:bg-[#b39740]" onClick={() => handleSaveWeek(true)} disabled={saveWeeklyScale.isPending}><Check className="h-4 w-4" /> Publicar Escala</Button>
                      </div>
                    </Card>
                  </>
                ) : (
                  /* Read Only Mode for Students */
                  <Card className="border-border/50 bg-white dark:bg-zinc-900 rounded-lg">
                    <CardHeader className="pb-3 border-b">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-[#c4a84b]" />
                        Escala Semanal de Limpeza (Faxina)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      {weekdays.map((day, index) => {
                        const cleaningDay = weeklyScale?.cleaning?.find((c: any) => c.weekday === day.value);
                        const names = cleaningDay?.studentNames?.join(", ") || "Ninguém escalado";
                        return (
                          <div key={day.value} className="text-sm border-b pb-3 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between font-bold text-[#1a3a2a] dark:text-green-400 mb-1">
                              <span>{day.label}</span>
                              <span className="text-xs text-muted-foreground font-normal">
                                {new Date(`${addDays(weekStart, index)}T00:00:00`).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                            <p className="text-muted-foreground">{names}</p>
                          </div>
                        );
                      })}
                      {!weeklyScale && (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma escala semanal publicada para este pelotão.</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {subview === "aditamentos" && (
              /* ADITAMENTOS SUBVIEW */
              <div className="grid gap-6 md:grid-cols-2">
                {/* Upload Form (Xerife Only) */}
                {isAdminOrXerifeAdmin && (
                  <Card className="border-border/50 bg-white dark:bg-zinc-900 h-fit">
                    <CardHeader className="pb-3 border-b">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#c4a84b]" /> Novo Aditamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <Label>Data</Label>
                        <Input type="date" value={aditData} onChange={(e) => setAditData(e.target.value)} />
                      </div>
                      <div>
                        <Label>Título</Label>
                        <Input value={aditTitulo} onChange={(e) => setAditTitulo(e.target.value)} placeholder="Ex: Aditamento nº 025/2026" />
                      </div>
                      <div>
                        <Label>Conteúdo / Resumo</Label>
                        <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-[#c4a84b] focus-visible:ring-offset-2" value={aditConteudo} onChange={(e) => setAditConteudo(e.target.value)} placeholder="Ex: Detalhes das atividades da semana..." />
                      </div>
                      <div>
                        <Label>Arquivo do Aditamento</Label>
                        <div className="mt-1 flex items-center gap-2">
                          <Input
                            type="file"
                            accept="application/pdf,image/*"
                            onChange={handleAditamentoFileUpload}
                            disabled={isUploadingAditamento}
                          />
                          <Button type="button" variant="outline" size="icon" disabled={isUploadingAditamento}>
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                        {aditPdfUrl && (
                          <p className="mt-1 truncate text-[10px] font-semibold text-[#1a3a2a]">
                            Arquivo enviado e vinculado ao aditamento.
                          </p>
                        )}
                      </div>
                      <Button className="w-full gap-2 bg-[#1a3a2a] text-white" onClick={handleSaveAditamento} disabled={saveAditamento.isPending}>
                        <Save className="h-4 w-4" /> Publicar Aditamento
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Published List (Everyone) */}
                <Card className={`border-border/50 bg-white dark:bg-zinc-900 ${!isAdminOrXerifeAdmin ? "col-span-2" : ""}`}>
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#c4a84b]" /> Banco de Aditamentos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                    {aditamentosQuery.data?.map((adit: any) => (
                      <div key={adit.id} className="flex flex-col gap-2 rounded-lg border p-4 bg-muted/5">
                        <div className="flex items-center justify-between gap-2 border-b pb-2">
                          <div>
                            <p className="text-sm font-bold text-foreground">{adit.titulo}</p>
                            <p className="text-[10px] text-muted-foreground">Data: {new Date(`${adit.data}T00:00:00`).toLocaleDateString("pt-BR")}</p>
                          </div>
                          {isAdminOrXerifeAdmin && (
                            <Button size="sm" variant="ghost" className="gap-1 text-destructive hover:bg-destructive/10" onClick={() => deleteAditamento.mutate({ id: adit.id })} disabled={deleteAditamento.isPending}>
                              <Trash2 className="h-3.5 w-3.5" /> Excluir
                            </Button>
                          )}
                        </div>
                        {adit.conteudo && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{adit.conteudo}</p>}
                        {adit.pdfUrl && (
                          <a href={adit.pdfUrl} target="_blank" rel="noreferrer" className="text-xs text-[#c4a84b] hover:underline flex items-center gap-1 font-semibold mt-1">
                            Visualizar PDF original
                          </a>
                        )}
                      </div>
                    ))}
                    {(!aditamentosQuery.data || aditamentosQuery.data.length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-8">Nenhum aditamento publicado para este pelotão.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {subview === "historico" && (
              /* HISTORICO SUBVIEW (EVERYONE) */
              <Card className="border-border/50 bg-white dark:bg-zinc-900 rounded-lg">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <History className="h-5 w-5 text-[#c4a84b]" />
                    <h2 className="text-lg font-bold text-foreground">Histórico de Xerifes e Sub-Xerifes</h2>
                  </div>
                  <div className="space-y-3">
                    {xerifeHistoryQuery.data?.map((item: any) => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 text-sm gap-2">
                        <div>
                          <p className="font-bold text-foreground flex items-center gap-1.5">
                            {item.role === 'xerife' ? (
                              <Crown className="h-4 w-4 text-yellow-500 fill-current" />
                            ) : (
                              <Shield className="h-4 w-4 text-slate-400" />
                            )}
                            {item.nomeGuerra} <span className="text-xs text-muted-foreground font-normal">({item.numerica})</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.role === 'xerife' ? 'Promovido a Xerife' : 'Promovido a Sub-Xerife'}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          <p>Promoção: {new Date(item.promotedAt).toLocaleDateString("pt-BR")} às {new Date(item.promotedAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}</p>
                          <p>Fim do Turno: {new Date(item.archivedAt).toLocaleDateString("pt-BR")} às {new Date(item.archivedAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    ))}
                    {(!xerifeHistoryQuery.data || xerifeHistoryQuery.data.length === 0) && (
                      <p className="text-sm text-muted-foreground text-center p-4">
                        Nenhum histórico de promoções gravado para este pelotão.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        )}

        {/* Student operational record */}
        <Dialog open={Boolean(operationalStudent)} onOpenChange={(open) => !open && setOperationalStudent(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto border border-border bg-white text-foreground dark:bg-zinc-900 sm:max-w-[680px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-[#c4a84b]" />
                Ficha Operacional do Aluno
              </DialogTitle>
              <DialogDescription>Cadastro, situação e histórico de fatos observados.</DialogDescription>
            </DialogHeader>

            {operationalStudent && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-lg border bg-muted/10 p-3">
                  {operationalStudent.fotoUrl ? (
                    <img
                      src={operationalStudent.fotoUrl}
                      alt={`Foto de ${operationalStudent.nomeGuerra}`}
                      className="h-20 w-20 shrink-0 rounded-md border border-[#c4a84b]/50 object-cover"
                    />
                  ) : (
                    <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border bg-[#1a3a2a]/10 text-xl font-black text-[#1a3a2a] dark:text-green-300">
                      {operationalStudent.nomeGuerra.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-lg font-black text-[#1a3a2a] dark:text-green-300">{operationalStudent.nomeGuerra}</p>
                    {operationalStudent.nomeCompleto && operationalStudent.nomeCompleto !== operationalStudent.nomeGuerra && (
                      <p className="break-words text-xs text-muted-foreground">{operationalStudent.nomeCompleto}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">Nº {operationalStudent.numerica}</Badge>
                      <Badge variant="outline">{operationalStudent.companhia}ª Cia / {operationalStudent.peloton}º Pel</Badge>
                      <Badge variant="outline">{operationalStudent.deskNumber ? `Carteira ${operationalStudent.deskNumber}` : "Sem carteira"}</Badge>
                      <Badge className={`border ${getConditionBadgeStyle(operationalStudent.condition)}`}>
                        {conditionLabels[operationalStudent.condition || "pronto"]}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <Button
                    type="button"
                    className="bg-green-700 text-white hover:bg-green-800"
                    onClick={() => {
                      const student = operationalStudent;
                      setOperationalStudent(null);
                      openLaunchFOModal(student, "positive");
                    }}
                  >
                    FO+ Elogio
                  </Button>
                  <Button
                    type="button"
                    className="bg-red-700 text-white hover:bg-red-800"
                    onClick={() => {
                      const student = operationalStudent;
                      setOperationalStudent(null);
                      openLaunchFOModal(student, "negative");
                    }}
                  >
                    FO- Transgressão
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="col-span-2 sm:col-span-1"
                    onClick={() => {
                      const student = operationalStudent;
                      setOperationalStudent(null);
                      openEditStudent(student);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Editar cadastro
                  </Button>
                </div>

                <div className="rounded-lg border">
                  <div className="flex items-center justify-between border-b bg-muted/20 px-3 py-2">
                    <p className="text-sm font-black">Histórico de FO</p>
                    <Badge variant="outline">{studentObservationsQuery.data?.length ?? 0} registro(s)</Badge>
                  </div>
                  <div className="max-h-72 space-y-2 overflow-y-auto p-3">
                    {studentObservationsQuery.isLoading && (
                      <p className="py-4 text-center text-xs text-muted-foreground">Carregando histórico...</p>
                    )}
                    {studentObservationsQuery.data?.map((item: any) => (
                      <div key={item.id} className="rounded-md border bg-background p-2.5 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className={`font-black ${item.type === "positive" ? "text-green-700 dark:text-green-300" : item.type === "negative" ? "text-red-700 dark:text-red-300" : "text-foreground"}`}>
                            {item.type === "positive" ? "FO+ · Elogio" : item.type === "negative" ? "FO- · Transgressão" : "Observação"}
                          </p>
                          <Badge variant="outline" className="text-[9px]">
                            {item.validation_status === "approved" ? "Validado" : item.validation_status === "rejected" ? "Rejeitado" : "Aguardando validação"}
                          </Badge>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap break-words text-foreground">{item.note}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {new Date(item.created_at).toLocaleString("pt-BR")} · Por {item.created_by_name || "xerife"}
                        </p>
                      </div>
                    ))}
                    {!studentObservationsQuery.isLoading && !studentObservationsQuery.data?.length && (
                      <p className="py-4 text-center text-xs text-muted-foreground">Nenhum fato observado registrado.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Student Dialog global */}
        <Dialog open={Boolean(editingStudent)} onOpenChange={(open) => !open && setEditingStudent(null)}>
          <DialogContent className="sm:max-w-[450px] bg-white dark:bg-zinc-900 border border-border text-foreground">
            <DialogHeader>
              <DialogTitle>Editar Cadastro do Aluno</DialogTitle>
              <DialogDescription>Atualize as informações cadastrais do aluno no efetivo.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-numerica">Numérica</Label>
                  <Input
                    id="edit-numerica"
                    value={editStudentForm.numerica}
                    onChange={(e) => setEditStudentForm(curr => ({ ...curr, numerica: cleanNumerica(e.target.value) }))}
                    className="mt-1 bg-white dark:bg-zinc-800"
                    maxLength={4}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-nome-guerra">Nome de Guerra</Label>
                  <Input
                    id="edit-nome-guerra"
                    value={editStudentForm.nomeGuerra}
                    onChange={(e) => setEditStudentForm(curr => ({ ...curr, nomeGuerra: e.target.value }))}
                    className="mt-1 bg-white dark:bg-zinc-800"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-nome-completo">Nome Completo</Label>
                <Input
                  id="edit-nome-completo"
                  value={editStudentForm.nomeCompleto}
                  onChange={(e) => setEditStudentForm(curr => ({ ...curr, nomeCompleto: e.target.value }))}
                  className="mt-1 bg-white dark:bg-zinc-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="edit-companhia">Companhia</Label>
                  <select
                    id="edit-companhia"
                    value={editStudentForm.companhia}
                    onChange={(e) => setEditStudentForm(curr => ({ ...curr, companhia: e.target.value }))}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {[1, 2, 3, 4, 5].map((c) => (
                      <option key={c} value={String(c)}>{c}ª Cia</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit-peloton">Pelotão</Label>
                  <select
                    id="edit-peloton"
                    value={editStudentForm.peloton}
                    onChange={(e) => setEditStudentForm(curr => ({ ...curr, peloton: e.target.value }))}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {[1, 2].map((p) => (
                      <option key={p} value={String(p)}>{p}º Pel</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit-desk">Carteira</Label>
                  <Input
                    id="edit-desk"
                    value={editStudentForm.deskNumber}
                    onChange={(e) => setEditStudentForm(curr => ({ ...curr, deskNumber: e.target.value.replace(/\D/g, "") }))}
                    placeholder="Ex: 45"
                    className="mt-1 bg-white dark:bg-zinc-800"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
              <Button
                type="button"
                variant="destructive"
                className="w-full sm:w-auto"
                onClick={() => {
                  if (window.confirm(`ATENÇÃO: Deseja realmente REMOVER ${editingStudent.nomeGuerra} do efetivo?\nEsta ação é irreversível e excluirá todo o cadastro do aluno, histórico de notas e frequências!`)) {
                    deleteRosterStudent.mutate({ studentId: editingStudent.id });
                  }
                }}
                disabled={deleteRosterStudent.isPending}
              >
                Excluir Aluno
              </Button>
              <div className="flex gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setEditingStudent(null)} className="mr-2">Cancelar</Button>
                <Button
                  className="bg-[#1a3a2a] text-white hover:bg-[#1a3a2a]/90"
                  onClick={handleUpdateRosterStudent}
                  disabled={updateRosterStudent.isPending}
                >
                  {updateRosterStudent.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* FO (Fatos Observados) Dialog global */}
        <Dialog open={foModalOpen} onOpenChange={setFoModalOpen}>
          <DialogContent className="sm:max-w-[500px] bg-white dark:bg-zinc-900 border border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-[#c4a84b]" />
                Lançar Fato Observado (FO)
              </DialogTitle>
              <DialogDescription>
                Selecione o tipo de fato, escolha os alunos e detalhe o ocorrido de acordo com o manual.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {/* Tipo de FO: Positivo (+) ou Negativo (-) */}
              <div>
                <Label>Tipo de Fato</Label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <Button
                    type="button"
                    variant={foType === "positive" ? "default" : "outline"}
                    className={foType === "positive" ? "bg-green-700 text-white hover:bg-green-800" : ""}
                    onClick={() => {
                      setFoType("positive");
                      setFoReason("");
                      setFoCustomReason("");
                    }}
                  >
                    FO+ (Elogio)
                  </Button>
                  <Button
                    type="button"
                    variant={foType === "negative" ? "default" : "outline"}
                    className={foType === "negative" ? "bg-red-700 text-white hover:bg-red-800" : ""}
                    onClick={() => {
                      setFoType("negative");
                      setFoReason("");
                      setFoCustomReason("");
                    }}
                  >
                    FO- (Transgressão)
                  </Button>
                </div>
              </div>

              {/* Seleção de Alunos */}
              <div>
                <Label>Alunos Selecionados</Label>
                {foSelectedStudentIds.length === 1 && !foIsAllSelected ? (
                  // Caso aberto individualmente para um único aluno
                  <div className="mt-1.5 p-2 bg-muted/30 rounded border text-xs font-semibold flex justify-between items-center">
                    <span>
                      {students.find((s: any) => s.id === foSelectedStudentIds[0])?.numerica} - {students.find((s: any) => s.id === foSelectedStudentIds[0])?.nomeGuerra}
                    </span>
                    <span className="text-[10px] text-muted-foreground">(Lançamento Individual)</span>
                  </div>
                ) : (
                  // Lançamento Coletivo ou em Massa
                  <div className="mt-1.5 space-y-2">
                    {isXerifeGeral && (
                      <div className="flex items-center space-x-2 border-b pb-2 mb-2">
                        <Checkbox
                          id="select-all-students"
                          checked={foIsAllSelected}
                          onCheckedChange={(checked) => {
                            setFoIsAllSelected(Boolean(checked));
                            if (checked) {
                              setFoSelectedStudentIds(students.map((s: any) => s.id));
                            } else {
                              setFoSelectedStudentIds([]);
                            }
                          }}
                        />
                        <Label htmlFor="select-all-students" className="text-xs font-bold text-red-600 dark:text-red-400 cursor-pointer">
                          Marcar toda a turma (Fato Coletivo - Apenas Xerife Master)
                        </Label>
                      </div>
                    )}

                    <div className="max-h-36 overflow-y-auto border rounded p-2 bg-muted/5 space-y-1.5">
                      {students.map((student: any) => {
                        const isChecked = foSelectedStudentIds.includes(student.id);
                        return (
                          <div key={student.id} className="flex items-center space-x-2 text-xs">
                            <Checkbox
                              id={`fo-student-${student.id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                setFoIsAllSelected(false);
                                if (checked) {
                                  setFoSelectedStudentIds((curr) => [...curr, student.id]);
                                } else {
                                  setFoSelectedStudentIds((curr) => curr.filter((id) => id !== student.id));
                                }
                              }}
                            />
                            <Label htmlFor={`fo-student-${student.id}`} className="cursor-pointer">
                              {student.numerica} - {student.nomeGuerra}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {foSelectedStudentIds.length} aluno(s) selecionado(s) para este fato.
                    </div>
                  </div>
                )}
              </div>

              {/* Fato / Causa (Dropdown) */}
              <div>
                <Label htmlFor="fo-reason-select">Fato Observado (Manual do Aluno)</Label>
                <select
                  id="fo-reason-select"
                  value={foReason}
                  onChange={(e) => setFoReason(e.target.value)}
                  className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">-- Selecione o fato --</option>
                  {(foType === "positive" ? ELOGIOS_LIST : TRANSGRESSIONS_LIST).map((reason, idx) => (
                    <option key={idx} value={reason}>{reason}</option>
                  ))}
                  {foReasonsQuery.data
                    ?.filter((item: any) => item.type === foType)
                    .map((item: any) => (
                      <option key={`custom-${item.id}`} value={item.label}>{item.label}</option>
                    ))}
                  <option value="outro">Outro / Especificar</option>
                </select>
              </div>

              {foReason === "outro" && (
                <div>
                  <Label htmlFor="fo-custom-reason">
                    {foType === "positive" ? "Novo elogio" : "Nova transgressão"}
                  </Label>
                  <Input
                    id="fo-custom-reason"
                    value={foCustomReason}
                    onChange={(event) => setFoCustomReason(event.target.value)}
                    maxLength={500}
                    placeholder={foType === "positive" ? "Escreva o elogio que deverá entrar na lista" : "Escreva a transgressão que deverá entrar na lista"}
                    className="mt-1.5 h-10 text-sm"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {isXerifeGeral
                      ? "Como Xerife Master, a nova opção será incluída imediatamente."
                      : "A nova opção entrará na lista após validação do Xerife Master."}
                  </p>
                </div>
              )}

              {/* Detalhes / Especificação */}
              <div>
                <Label htmlFor="fo-details-textarea">
                  Detalhes Complementares (Opcional)
                </Label>
                <textarea
                  id="fo-details-textarea"
                  value={foDetails}
                  onChange={(e) => setFoDetails(e.target.value)}
                  placeholder="Detalhe o ocorrido: data, hora, local e circunstâncias adicionais..."
                  className="mt-1.5 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setFoModalOpen(false)}>Cancelar</Button>
              <Button
                className="bg-[#1a3a2a] text-white hover:bg-[#1a3a2a]/90"
                onClick={handleLaunchFO}
                disabled={addStudentObservation.isPending}
              >
                {addStudentObservation.isPending ? "Registrando..." : "Registrar Fato"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}
