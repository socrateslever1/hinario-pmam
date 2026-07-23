import {
  BookOpen,
  FileText,
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
} from "lucide-react";
import { useLocation } from "wouter";
import { getStudentSession, STUDENT_SESSION_CHANGED } from "@/lib/studentSession";
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
  const [isStudent, setIsStudent] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { data: user } = trpc.auth.me.useQuery();

  useModalHistory(moreOpen, () => setMoreOpen(false), "moreOptions");

  useEffect(() => {
    const session = getStudentSession();
    setIsStudent(!!session);
  }, [location]);

  useEffect(() => {
    const handleSessionChange = () => {
      const session = getStudentSession();
      setIsStudent(!!session);
    };

    window.addEventListener(STUDENT_SESSION_CHANGED, handleSessionChange);
    window.addEventListener("storage", handleSessionChange);
    return () => {
      window.removeEventListener(STUDENT_SESSION_CHANGED, handleSessionChange);
      window.removeEventListener("storage", handleSessionChange);
    };
  }, []);

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
        { icon: Music, label: "Hinos", path: "/hinos" },
        { icon: BookOpen, label: "Estudos", path: "/estudos" },
        { icon: FileText, label: "Notas", path: isStudent ? "/notas-do-curso" : "/entrar" },
        { icon: MoreHorizontal, label: "Mais", path: "__more" },
      ];

  const moreItems = isComandante
    ? [
        { icon: User, label: "Meu Perfil", path: "/perfil" },
        { icon: ListMusic, label: "Charlie Mike", path: "/charlie-mike" },
        { icon: Target, label: "Ordem Unida", path: "/drill" },
        { icon: Shield, label: "CFAP 2026", path: "/cfap-2026" },
        { icon: FileText, label: "Documentos", path: "/documentos" },
        { icon: Info, label: "Sobre o Meu Quartel", path: "/sobre" },
        { icon: Shield, label: "Posto de Comando", path: "/xerife" },
      ]
    : [
        { icon: User, label: isStudent ? "Perfil do Aluno" : user ? "Meu Perfil" : "Acesso do Aluno", path: isStudent ? "/perfil-aluno" : user ? "/perfil" : "/entrar" },
        { icon: LayoutGrid, label: "Sala de Aula", path: "/sala-de-aula" },
        { icon: ListMusic, label: "Charlie Mike", path: "/charlie-mike" },
        { icon: Target, label: "Ordem Unida", path: "/drill" },
        { icon: Shield, label: "CFAP 2026", path: "/cfap-2026" },
        { icon: FileText, label: "Documentos", path: "/documentos" },
        { icon: Info, label: "Sobre o Meu Quartel", path: "/sobre" },
        { icon: Shield, label: "Posto de Comando", path: "/xerife" },
      ];

  const { logout } = useAuth();

  const isActive = (path: string) => {
    if (path === "__more") {
      return moreItems.some((item) => location === item.path || location.startsWith(`${item.path}/`));
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

  const handleLogout = async () => {
    await logout();
    notifySessionChange();
    setMoreOpen(false);
    setLocation(isStudent ? "/entrar" : "/login");
  };

  return (
    <>
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
                  active
                    ? "text-[#f0bd3a]"
                    : "text-white/60 hover:text-white"
                }`}
                title={item.label}
              >
                <span className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ${
                  active ? "bg-[#1a3a2a] text-[#f0bd3a] shadow-[0_0_0_1px_rgba(240,189,58,.22)]" : "bg-transparent"
                }`}>
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

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto max-w-md rounded-t-2xl border-white/10 bg-[#062417]/85 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 text-white backdrop-blur-xl md:hidden animate-in fade-in-50 slide-in-from-bottom-10 duration-300"
        >
          <SheetHeader className="px-1 pb-2 pt-2 text-left border-b border-white/5">
            <SheetTitle className="text-white font-black text-lg">Mais Opções</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2.5 py-4 max-h-[60vh] overflow-y-auto pr-1">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => goTo(item.path)}
                  className={`flex flex-col items-center justify-center gap-2.5 rounded-2xl border p-4 text-center text-xs font-bold transition-all duration-300 group ${
                    active
                      ? "border-[#f0bd3a]/40 bg-[#145c3a]/50 text-[#f0bd3a] shadow-lg shadow-[#145c3a]/20"
                      : "border-white/5 bg-white/5 text-white/80 hover:bg-white/10 hover:border-[#c4a84b]/20"
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                    active 
                      ? "bg-[#0b3323] text-[#f0bd3a] border border-[#f0bd3a]/30 shadow-[0_0_12px_rgba(240,189,58,0.2)]" 
                      : "bg-[#c4a84b]/10 text-[#c4a84b] border border-[#c4a84b]/20 group-hover:text-[#f0bd3a] group-hover:border-[#f0bd3a]/40"
                  }`}>
                    <Icon className="h-5 w-5 stroke-[2]" />
                  </span>
                  <span className="leading-tight">{item.label}</span>
                </button>
              );
            })}
            {isStudent && (
              <button
                onClick={handleLogout}
                className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-3.5 text-center text-xs font-bold text-red-200 hover:bg-red-500/20 transition-all duration-300 mt-2"
              >
                <LogOut className="h-4 w-4" />
                Sair da sessão do aluno
              </button>
            )}
            {user && !isStudent && (
              <button
                onClick={handleLogout}
                className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-3.5 text-center text-xs font-bold text-red-200 hover:bg-red-500/20 transition-all duration-300 mt-2"
              >
                <LogOut className="h-4 w-4" />
                {isComandante ? "Sair do comando" : "Sair"}
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}