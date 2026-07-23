import { createContext, useContext, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { getStudentSession } from "@/lib/studentSession";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  audience: "all" | "xerifes" | "pelotao" | "tesouraria";
  companhia?: number;
  peloton?: number;
  createdAt: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id" | "createdAt" | "read">) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("pmam-read-notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Get student session
  const studentSession = getStudentSession();
  const isStudent = !!studentSession;

  // Student queries
  const { data: studentReports } = trpc.student.internalReports.useQuery(
    { id: studentSession?.id ?? 0, sessionToken: studentSession?.sessionToken ?? "" },
    { enabled: isStudent, refetchInterval: 30000, retry: false }
  );

  const { data: studentLcCases } = trpc.student.licencaCacadaStatus.useQuery(
    { id: studentSession?.id ?? 0, sessionToken: studentSession?.sessionToken ?? "" },
    { enabled: isStudent, refetchInterval: 30000, retry: false }
  );

  const { data: studentObservations } = trpc.student.observations.useQuery(
    { id: studentSession?.id ?? 0, sessionToken: studentSession?.sessionToken ?? "" },
    { enabled: isStudent, refetchInterval: 30000, retry: false }
  );

  // Command queries
  const { data: me } = trpc.auth.me.useQuery(undefined, {
    enabled: !isStudent,
    retry: false,
  });
  const isCommand = !!me && me.role !== "student";

  const { data: commandReports } = trpc.serviceScale.listInternalReports.useQuery(
    { status: "active" },
    { enabled: isCommand, refetchInterval: 30000, retry: false }
  );

  const { data: pendingObservations } = trpc.serviceScale.pendingStudentObservations.useQuery(
    undefined,
    {
      enabled: isCommand && !!me && ["master", "admin", "comandante_corpo", "subcomandante_corpo", "comandante_cfap", "subcomandante_cfap"].includes(me.role || ''),
      refetchInterval: 30000,
      retry: false
    }
  );

  const { data: contestedObservations } = trpc.serviceScale.contestedStudentObservations.useQuery(
    { status: "pending" },
    {
      enabled: isCommand && !!me && ["master", "admin", "comandante_corpo", "subcomandante_corpo", "comandante_cfap", "subcomandante_cfap"].includes(me.role || ''),
      refetchInterval: 30000,
      retry: false
    }
  );

  const { data: commandLcCases } = trpc.serviceScale.lcCases.useQuery(
    { status: "homologated" },
    { enabled: isCommand, refetchInterval: 30000, retry: false }
  );

  // Map database entries to notifications format
  const dbNotifications: Notification[] = [];

  if (isStudent) {
    if (studentReports) {
      studentReports.forEach((r: any) => {
        const typeMap: Record<string, "info" | "success" | "warning" | "error"> = {
          normal: "info",
          important: "warning",
          urgent: "error",
        };
        dbNotifications.push({
          id: `report-${r.id}`,
          title: `Demanda de Serviço: ${r.title}`,
          message: `${r.note || "Sem observações detalhadas"}`,
          type: typeMap[r.priority] || "warning",
          audience: "all",
          createdAt: new Date(r.createdAt || new Date()),
          read: readIds.includes(`report-${r.id}`),
        });
      });
    }

    if (studentLcCases) {
      studentLcCases.forEach((lc: any) => {
        dbNotifications.push({
          id: `lc-${lc.id}`,
          title: `Licença Caçada (${lc.status === 'pending' ? 'Pendente' : 'Homologada'})`,
          message: `Código FO: ${lc.foCode}. Início: ${lc.recolhimentoDate ? new Date(lc.recolhimentoDate).toLocaleDateString() : 'N/A'}. Duração: ${lc.durationHours}h.`,
          type: "error",
          audience: "all",
          createdAt: new Date(lc.updatedAt || new Date()),
          read: readIds.includes(`lc-${lc.id}`),
        });
      });
    }

    if (studentObservations) {
      studentObservations.forEach((obs: any) => {
        dbNotifications.push({
          id: `obs-${obs.id}`,
          title: `Fato Observado (${obs.validation_status === 'approved' ? 'Homologado' : 'Pendente'})`,
          message: `Código: ${obs.fo_code || 'N/A'}. Motivo: ${obs.description || 'N/A'}`,
          type: obs.points > 0 ? "success" : "warning",
          audience: "all",
          createdAt: new Date(obs.created_at || new Date()),
          read: readIds.includes(`obs-${obs.id}`),
        });
      });
    }
  } else if (isCommand) {
    if (commandReports) {
      commandReports.forEach((r: any) => {
        const typeMap: Record<string, "info" | "success" | "warning" | "error"> = {
          normal: "info",
          important: "warning",
          urgent: "error",
        };
        dbNotifications.push({
          id: `report-${r.id}`,
          title: `Demanda de Serviço Ativa`,
          message: `[Aluno: ${r.nomeGuerra || 'N/A'}] ${r.title}. Prioridade: ${r.priority}`,
          type: typeMap[r.priority] || "warning",
          audience: "xerifes",
          createdAt: new Date(r.createdAt || new Date()),
          read: readIds.includes(`report-${r.id}`),
        });
      });
    }

    if (pendingObservations) {
      pendingObservations.forEach((obs: any) => {
        dbNotifications.push({
          id: `obs-pending-${obs.id}`,
          title: `FO Aguardando Validação`,
          message: `Aluno: ${obs.nome_guerra || 'N/A'} (${obs.numerica}). Código: ${obs.fo_code || 'N/A'}.`,
          type: "info",
          audience: "xerifes",
          createdAt: new Date(obs.created_at || new Date()),
          read: readIds.includes(`obs-pending-${obs.id}`),
        });
      });
    }

    if (contestedObservations) {
      contestedObservations.forEach((obs: any) => {
        dbNotifications.push({
          id: `obs-contested-${obs.id}`,
          title: `FO Contestado pelo Aluno`,
          message: `Aluno: ${obs.nome_guerra || 'N/A'}. Justificativa: ${obs.contest_reason || 'N/A'}.`,
          type: "error",
          audience: "xerifes",
          createdAt: new Date(obs.contest_at || new Date()),
          read: readIds.includes(`obs-contested-${obs.id}`),
        });
      });
    }

    if (commandLcCases) {
      commandLcCases.forEach((lc: any) => {
        const isStarted = !!lc.startedAt;
        dbNotifications.push({
          id: `command-lc-${lc.id}-${isStarted ? 'started' : 'waiting'}`,
          title: isStarted ? `LC em Andamento` : `Aguardando Apresentação de LC`,
          message: `Aluno: ${lc.nomeGuerra || 'N/A'} (${lc.numerica}). ` +
                   (isStarted 
                     ? `Iniciou recolhimento em ${new Date(lc.startedAt).toLocaleDateString("pt-BR")} às ${new Date(lc.startedAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}.`
                     : `Previsão: ${lc.recolhimentoDate ? new Date(`${lc.recolhimentoDate}T00:00:00`).toLocaleDateString("pt-BR") : 'N/A'} às ${lc.recolhimentoTime || 'N/A'}.`),
          type: isStarted ? "info" : "warning",
          audience: "xerifes",
          createdAt: new Date(lc.startedAt || lc.updatedAt || new Date()),
          read: readIds.includes(`command-lc-${lc.id}-${isStarted ? 'started' : 'waiting'}`),
        });
      });
    }
  }

  const [dismissedDbIds, setDismissedDbIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("pmam-dismissed-notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addNotification = useCallback((notification: Omit<Notification, "id" | "createdAt" | "read">) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date(),
      read: false,
    };
    setLocalNotifications((prev) => [newNotification, ...prev].slice(0, 50));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      localStorage.setItem("pmam-read-notifications", JSON.stringify(next));
      return next;
    });
    setLocalNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    // Clear local notifications
    setLocalNotifications([]);
    // Collect all current DB notification IDs and mark them as dismissed
    const currentDbIds = [...dbNotifications.map((n) => n.id)];
    setDismissedDbIds((prev) => {
      const next = Array.from(new Set([...prev, ...currentDbIds]));
      localStorage.setItem("pmam-dismissed-notifications", JSON.stringify(next));
      return next;
    });
    setReadIds((prev) => {
      const next = Array.from(new Set([...prev, ...currentDbIds]));
      localStorage.setItem("pmam-read-notifications", JSON.stringify(next));
      return next;
    });
  }, [dbNotifications]);

  // Filter out dismissed DB notifications
  const visibleDbNotifications = dbNotifications.filter((n) => !dismissedDbIds.includes(n.id));

  const allNotifications = [...localNotifications, ...visibleDbNotifications].map((n) => ({
    ...n,
    read: readIds.includes(n.id) || n.read,
  }));

  allNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const unreadCount = allNotifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications: allNotifications,
        addNotification,
        markAsRead,
        clearNotifications,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications deve ser usado dentro de NotificationProvider");
  }
  return context;
}
