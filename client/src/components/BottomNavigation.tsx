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

function normalizeImageUrl(src?: string | null) {
  const value = src?.trim();
  if (!value) return null;
  if (/^(data:|blob:|https?:\/\/)/i.test(value)) return value;

  const normalized = value.replace(/\\/g, "/");
  const publicIndex = normalized.lastIndexOf("/client/public/");
  if (publicIndex >= 0) {
    return encodeURI(normalized.slice(publicIndex + "/client/public".length));
  }

  const uploadsIndex = normalized.lastIndexOf("/uploads/");
  if (uploadsIndex >= 0) {
    return encodeURI(normalized.slice(uploadsIndex));
  }

  if (/^[a-z]:\//i.test(normalized)) return null;
  return encodeURI(normalized.startsWith("/") ? normalized : `/${normalized}`);
}

function UserAvatar({ src, alt }: { src?: string | null; alt: string }) {
  const imageUrl = normalizeImageUrl(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [imageUrl]);

  return (
    <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[#f0bd3a]/60 bg-[#1a3a2a] shadow-inner">
      <span className="absolute inset-0 flex h-full w-full items-center justify-center">
        <User className="h-4 w-4 text-[#f0bd3a]" />
      </span>
      {imageUrl && !failed ? (
        <img
          src={imageUrl}
          alt={alt}
          draggable={false}
          className="relative block h-full w-full object-cover object-center"
          onError={() => setFailed(true)}
        />
      ) : null}
    </span>
  );
}

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const [studentSession, setStudentSession] = useState<StudentSession | null>(() => getStudentSession());
  const [moreOpen, setMoreOpen] = useState(false);
  const { user, logout } = useAuth();

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
        "oficial_dia",
        "fiscal_dia",
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

  const navPaths = new Set(navItems.map((item) => item.path).filter((p) => p !== "__more"));

  const allGridItems = isComandante
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

  const gridItems = allGridItems.filter((item) => !navPaths.has(item.path) && item.path !== "/entrar" && item.path !== "/xerife");

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
      <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] md:hidden" aria-label="Navegação principal">
        <div className="bottom-nav-glass mx-auto flex max-w-md items-stretch justify-around gap-1 rounded-2xl px-1.5 py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={`${item.label}-${item.path}`}
                type="button"
                onClick={() => (item.path === "__more" ? setMoreOpen(true) : goTo(item.path))}
                className={`relative flex min-h-12 min-w-[3.65rem] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-extrabold leading-none transition-all duration-300 ${
                  active ? "text-[#f0bd3a]" : "text-white/70 hover:text-white"
                }`}
                title={item.label}
                aria-current={active ? "page" : undefined}
                aria-label={item.path === "__more" ? "Abrir mais opções" : item.label}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                    active
                      ? "bg-[#1a3a2a] text-[#f0bd3a] shadow-[0_0_0_1px_rgba(240,189,58,.22)]"
                      : "bg-transparent"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0 stroke-[2.25]" />
                </span>
                <span className="max-w-full truncate">{item.label}</span>
                {active && (
                  <span className="absolute -bottom-0.5 h-1 w-5 rounded-full bg-[#f0bd3a] shadow-[0_0_8px_#f0bd3a]" />
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
          className="mx-auto max-w-md rounded-t-[28px] border-t border-[#c4a84b]/35 bg-gradient-to-b from-[#082419] via-[#051b12] to-[#020e09] px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-2.5 text-white backdrop-blur-2xl md:hidden shadow-[0_-14px_45px_rgba(0,0,0,0.7)] animate-in fade-in-50 slide-in-from-bottom-10 duration-300"
        >
          {/* Top Notch Indicator */}
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/20" />

          <SheetHeader className="flex flex-row items-center justify-between border-b border-white/[0.08] px-1 pb-3 pt-0 text-left">
            <SheetTitle className="font-serif text-[17px] font-black tracking-tight text-white">
              Menu & Acessos
            </SheetTitle>
          </SheetHeader>

          <div className="max-h-[68vh] space-y-3.5 overflow-y-auto py-3 pr-0.5 scrollbar-none">
            {/* Botões de Acesso Rápido Principais (Sempre visíveis no topo) */}
            {!isStudent && !user && (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => goTo("/entrar")}
                className="group flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-[#f0bd3a]/60 bg-[#0f3523]/90 px-3 text-center text-sm font-extrabold text-[#f0bd3a] shadow-[0_2px_12px_rgba(240,189,58,0.15)] transition-all hover:bg-[#164730] hover:border-[#f0bd3a] active:scale-[0.98]"
              >
                <GraduationCap className="h-4 w-4 text-[#f0bd3a] transition-transform group-hover:scale-110" />
                <span>Acesso Aluno</span>
              </button>
              <button
                type="button"
                onClick={() => goTo("/xerife")}
                className="group flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.05] px-3 text-center text-sm font-bold text-white/95 shadow-sm transition-all hover:border-[#c4a84b]/50 hover:bg-white/10 active:scale-[0.98]"
              >
                <Star className="h-4 w-4 text-[#c4a84b] transition-transform group-hover:scale-110" />
                <span>Posto Comando</span>
              </button>
            </div>
            )}

            {/* Grade de 3 Colunas */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {gridItems.map((item) => {
                const Icon = item.icon;
                const active = location === item.path || location.startsWith(`${item.path}/`);
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => goTo(item.path)}
                    className={`group relative flex min-h-[82px] flex-col items-center justify-center gap-2 rounded-2xl border p-2.5 text-center transition-all duration-200 active:scale-95 ${
                      active
                        ? "border-[#f0bd3a]/70 bg-gradient-to-b from-[#164830] to-[#0e3020] text-[#f0bd3a] shadow-[0_4px_16px_rgba(240,189,58,0.2)] ring-1 ring-[#f0bd3a]/30"
                        : "border-white/[0.08] bg-[#0c251a]/60 text-white/85 hover:border-[#c4a84b]/40 hover:bg-[#123626]/80 hover:text-white shadow-sm"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 ${
                        active
                          ? "border-[#f0bd3a]/50 bg-[#0d2a1c] text-[#f0bd3a] shadow-inner"
                          : "border-[#c4a84b]/25 bg-[#123323] text-[#c4a84b] group-hover:border-[#f0bd3a]/50 group-hover:text-[#f0bd3a] group-hover:scale-105"
                      }`}
                    >
                      <Icon className="h-4 w-4 stroke-[2.2]" />
                    </span>
                    <span className="line-clamp-2 text-[11px] font-bold leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Rodapé de Identificação da Sessão (quando logado) */}
            {(isStudent || user) && (
              <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => goTo(isStudent ? "/perfil-aluno" : "/perfil")}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                >
                  <UserAvatar
                    src={isStudent ? studentPhoto : userPhoto}
                    alt={isStudent ? studentName : userName}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[#f0bd3a]">{isStudent ? studentName : userName}</p>
                    <p className="text-[10px] text-white/60">{isStudent ? "Aluno CFAP" : "Comando"} • Ver perfil</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={isStudent ? handleStudentLogout : handleUserLogout}
                  className="flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-500/15 px-2.5 py-1.5 text-xs font-bold text-red-200 transition-colors hover:bg-red-500/25 active:scale-95"
                  title="Sair da sessão"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
