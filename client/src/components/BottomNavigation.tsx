import {
  FileText,
  Medal,
  Home,
  Info,
  ListMusic,
  LogOut,
  MoreHorizontal,
  Music,
  Shield,
  User,
  Target,
  LayoutGrid,
  ClipboardList,
  GraduationCap,
  Star,
  Users,
} from "lucide-react";
import { useLocation } from "wouter";
import {
  clearStudentSession,
  getStudentSession,
  STUDENT_SESSION_CHANGED,
  type StudentSession,
} from "@/lib/studentSession";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { useModalHistory } from "@/hooks/useModalHistory";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export const notifySessionChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STUDENT_SESSION_CHANGED));
  }
};

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const [studentSession, setStudentSession] = useState<StudentSession | null>(() => getStudentSession());
  const [moreOpen, setMoreOpen] = useState(false);
  const { data: user } = trpc.auth.me.useQuery();
  const { logout } = useAuth();

  const profileQuery = trpc.student.getProfile.useQuery(
    { id: studentSession?.id ?? 0, sessionToken: studentSession?.sessionToken ?? "" },
    { enabled: !!studentSession }
  );

  useModalHistory(moreOpen, () => setMoreOpen(false), "moreOptions");

  useEffect(() => {
    const session = getStudentSession();
    setStudentSession(session);
  }, [location]);

  useEffect(() => {
    const handleSessionChange = () => {
      const session = getStudentSession();
      setStudentSession(session);
    };

    const handleOpenMenu = () => setMoreOpen(true);

    window.addEventListener(STUDENT_SESSION_CHANGED, handleSessionChange);
    window.addEventListener("storage", handleSessionChange);
    window.addEventListener("open-menu-and-acessos", handleOpenMenu);
    return () => {
      window.removeEventListener(STUDENT_SESSION_CHANGED, handleSessionChange);
      window.removeEventListener("storage", handleSessionChange);
      window.removeEventListener("open-menu-and-acessos", handleOpenMenu);
    };
  }, []);

  const isStudent = !!studentSession;
  const isComandante = Boolean(
    !isStudent &&
    user?.role &&
      [
        "comandante_corpo",
        "subcomandante_corpo",
        "sub_comandante_corpo",
        "comandante_cfap",
        "subcomandante_cfap",
        "sub_comandante_cfap",
        "comandante_cia",
        "comandante_pel",
      ].includes(user.role)
  );

  const navItems = isComandante
    ? [
        { icon: Home, label: "Início", path: "/" },
        { icon: LayoutGrid, label: "Sala de Aula", path: "/sala-de-aula" },
        { icon: ClipboardList, label: "Pecúlio", path: "/sala-de-aula/peculio" },
        { icon: ClipboardList, label: "Administrar", path: "/sala-administrativa" },
        { icon: MoreHorizontal, label: "Mais", path: "__more" },
      ]
    : [
        { icon: Home, label: "Início", path: "/" },
        { icon: LayoutGrid, label: "Sala", path: "/sala-de-aula" },
        { icon: Music, label: "Hinos", path: "/hinos" },
        { icon: FileText, label: "Notas", path: isStudent ? "/notas-do-curso" : "/entrar" },
        { icon: MoreHorizontal, label: "Mais", path: "__more" },
      ];

  const gridItems = isComandante
    ? [
        { icon: Home, label: "Início", path: "/" },
        { icon: LayoutGrid, label: "Sala de Aula", path: "/sala-de-aula" },
        { icon: ClipboardList, label: "Pecúlio", path: "/sala-de-aula/peculio" },
        { icon: Users, label: "Efetivo", path: "/sala-de-aula/efetivo" },
        { icon: ClipboardList, label: "Administrar", path: "/sala-administrativa" },
        { icon: Music, label: "Hinos", path: "/hinos" },
        { icon: ListMusic, label: "Charlie Mike", path: "/charlie-mike" },
        { icon: Target, label: "Ordem Unida", path: "/drill" },
        { icon: Medal, label: "Memória do CFAP", path: "/historia-cfap" },
        { icon: Shield, label: "CFAP 2026", path: "/cfap-2026" },
        { icon: FileText, label: "Documentos", path: "/documentos" },
        { icon: Star, label: "Posto Comando", path: "/xerife" },
        { icon: Info, label: "Sobre o QG", path: "/sobre" },
      ]
    : isStudent
    ? [
        { icon: Home, label: "Início", path: "/" },
        { icon: LayoutGrid, label: "Sala de Aula", path: "/sala-de-aula" },
        { icon: Music, label: "Hinos", path: "/hinos" },
        { icon: GraduationCap, label: "Notas do Curso", path: "/notas-do-curso" },
        { icon: ListMusic, label: "Charlie Mike", path: "/charlie-mike" },
        { icon: Target, label: "Ordem Unida", path: "/drill" },
        { icon: Medal, label: "Memória do CFAP", path: "/historia-cfap" },
        { icon: Shield, label: "CFAP 2026", path: "/cfap-2026" },
        { icon: FileText, label: "Meus Documentos", path: "/documentos" },
        { icon: Star, label: "Posto Comando", path: "/xerife" },
        { icon: Info, label: "Sobre o QG", path: "/sobre" },
      ]
    : [
        { icon: Home, label: "Início", path: "/" },
        { icon: LayoutGrid, label: "Sala de Aula", path: "/sala-de-aula" },
        { icon: Music, label: "Hinos", path: "/hinos" },
        { icon: GraduationCap, label: "Acesso Aluno", path: "/entrar" },
        { icon: ListMusic, label: "Charlie Mike", path: "/charlie-mike" },
        { icon: Target, label: "Ordem Unida", path: "/drill" },
        { icon: Medal, label: "Memória do CFAP", path: "/historia-cfap" },
        { icon: Shield, label: "CFAP 2026", path: "/cfap-2026" },
        { icon: FileText, label: "Documentos", path: "/documentos" },
        { icon: Star, label: "Posto Comando", path: "/xerife" },
        { icon: Info, label: "Sobre o QG", path: "/sobre" },
      ];

  const isActive = (path: string) => {
    if (path === "__more") {
      return gridItems.some((item) => location === item.path || location.startsWith(`${item.path}/`));
    }
    if (path === "/") return location === "/";
    if (path === "/entrar") {
      return location.startsWith("/entrar") || location.startsWith("/notas-do-curso") || location.startsWith("/perfil-aluno");
    }
    return location === path || location.startsWith(`${path}/`);
  };

  const goTo = (path: string) => {
    setLocation(path);
    setMoreOpen(false);
  };

  const handleStudentLogout = () => {
    clearStudentSession();
    notifySessionChange();
    setMoreOpen(false);
    setLocation("/entrar");
  };

  const handleUserLogout = async () => {
    await logout();
    notifySessionChange();
    setMoreOpen(false);
    setLocation("/login");
  };

  const studentPhoto = profileQuery.data?.fotoUrl || null;
  const studentName = profileQuery.data?.nomeGuerra || studentSession?.nomeGuerra || "Aluno";
  const userPhoto = (user as any)?.fotoUrl || null;
  const userName = user?.name || "Comandante";

  return (
    <>
      {/* Bottom Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] md:hidden">
        <div className="bottom-nav-glass mx-auto flex max-w-md items-center justify-around gap-1 rounded-2xl px-2 py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={`${item.label}-${item.path}`}
                onClick={() => (item.path === "__more" ? setMoreOpen(true) : goTo(item.path))}
                className={`relative flex min-w-[3.5rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[8.5px] font-black transition-all duration-300 ${
                  active ? "text-[#f0bd3a]" : "text-white/60 hover:text-white"
                }`}
                title={item.label}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ${
                    active
                      ? "bg-[#1a3a2a] text-[#f0bd3a] shadow-[0_0_0_1px_rgba(240,189,58,.22)]"
                      : "bg-transparent"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0 stroke-[2.25]" />
                </span>
                <span className="leading-none">{item.label}</span>
                {active && (
                  <span className="absolute -bottom-0.5 h-1 w-4 rounded-full bg-[#f0bd3a] shadow-[0_0_8px_#f0bd3a]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Drawer: Mais Opções */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto max-w-md rounded-t-2xl border-white/10 bg-[#062417]/95 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 text-white backdrop-blur-xl md:hidden animate-in fade-in-50 slide-in-from-bottom-10 duration-300"
        >
          <SheetHeader className="px-1 pb-2 pt-1 text-left border-b border-white/10 flex flex-row items-center justify-between">
            <SheetTitle className="text-white font-bold text-base">Menu & Acessos</SheetTitle>
          </SheetHeader>

          <div className="max-h-[68vh] overflow-y-auto pr-0.5 py-3 space-y-3">
            
            {/* SEÇÃO SUPERIOR: BOTÕES DE LOGIN / PERFIL DO USUÁRIO */}
            {isStudent ? (
              <div className="rounded-xl border border-[#c4a84b]/30 bg-[#145c3a]/30 p-2.5 flex items-center justify-between gap-2.5">
                <button
                  onClick={() => goTo("/perfil-aluno")}
                  className="flex items-center gap-2.5 min-w-0 text-left flex-1"
                >
                  <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#c4a84b]/50 bg-[#1a3a2a] shadow-inner">
                    {studentPhoto ? (
                      <img src={studentPhoto} alt="Foto" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <User className="h-4 w-4 text-[#c4a84b]" />
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-[#f0bd3a] truncate">{studentName}</p>
                    <p className="text-[10px] text-white/60">Ver Meu Perfil</p>
                  </div>
                </button>
                <button
                  onClick={handleStudentLogout}
                  className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/15 px-2.5 py-1.5 text-[11px] font-bold text-red-200 hover:bg-red-500/25 transition-colors"
                  title="Sair da sessão"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sair
                </button>
              </div>
            ) : user ? (
              <div className="rounded-xl border border-[#c4a84b]/30 bg-[#145c3a]/30 p-2.5 flex items-center justify-between gap-2.5">
                <button
                  onClick={() => goTo("/perfil")}
                  className="flex items-center gap-2.5 min-w-0 text-left flex-1"
                >
                  <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#c4a84b]/50 bg-[#1a3a2a] shadow-inner">
                    {userPhoto ? (
                      <img src={userPhoto} alt="Foto" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <User className="h-4 w-4 text-[#c4a84b]" />
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-[#f0bd3a] truncate">{userName}</p>
                    <p className="text-[10px] text-white/60">Ver Meu Perfil</p>
                  </div>
                </button>
                <button
                  onClick={handleUserLogout}
                  className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/15 px-2.5 py-1.5 text-[11px] font-bold text-red-200 hover:bg-red-500/25 transition-colors"
                  title="Sair da sessão"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sair
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => goTo("/entrar")}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#c4a84b]/40 bg-[#1a3a2a] px-3 py-2.5 text-center text-xs font-bold text-[#f0bd3a] shadow-sm hover:bg-[#234b36] transition-all"
                >
                  <GraduationCap className="h-4 w-4 text-[#c4a84b]" />
                  <span>Acesso Aluno</span>
                </button>
                <button
                  onClick={() => goTo("/xerife")}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#c4a84b]/20 bg-white/5 px-3 py-2.5 text-center text-xs font-bold text-white/90 hover:bg-white/10 hover:border-[#c4a84b]/40 transition-all"
                >
                  <Star className="h-4 w-4 text-[#c4a84b]" />
                  <span>Posto Comando</span>
                </button>
              </div>
            )}

            {/* SEÇÃO INFERIOR: GRADE DE ITENS COMPACTA (3 COLUNAS) */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {gridItems.map((item) => {
                const Icon = item.icon;
                const active = location === item.path || location.startsWith(`${item.path}/`);
                return (
                  <button
                    key={item.path}
                    onClick={() => goTo(item.path)}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2 text-center transition-all duration-200 ${
                      active
                        ? "border-[#f0bd3a]/40 bg-[#145c3a]/50 text-[#f0bd3a] shadow-md shadow-[#145c3a]/20"
                        : "border-white/5 bg-white/5 text-white/80 hover:bg-white/10 hover:border-[#c4a84b]/20"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                        active
                          ? "bg-[#0b3323] text-[#f0bd3a] border border-[#f0bd3a]/30"
                          : "bg-[#c4a84b]/10 text-[#c4a84b] border border-[#c4a84b]/20"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 stroke-[2]" />
                    </span>
                    <span className="text-[10px] font-bold leading-tight line-clamp-2">{item.label}</span>
                  </button>
                );
              })}
            </div>

          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
