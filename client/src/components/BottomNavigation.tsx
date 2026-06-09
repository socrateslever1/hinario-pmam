import { BookOpen, FileText, Home, ListMusic, LogOut, MoreHorizontal, Music, User } from "lucide-react";
import { useLocation } from "wouter";
import { getStudentSession, clearStudentSession, STUDENT_SESSION_CHANGED } from "@/lib/studentSession";
import { useEffect, useState } from "react";

export const notifySessionChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STUDENT_SESSION_CHANGED));
  }
};

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const [isStudent, setIsStudent] = useState(false);

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

  const navItems = [
    { icon: Home, label: "Início", path: "/" },
    { icon: Music, label: "Hinos", path: "/hinos" },
    { icon: ListMusic, label: "Charlie", path: "/charlie-mike" },
    { icon: BookOpen, label: "Estudos", path: "/estudos" },
    { icon: FileText, label: "Notas", path: isStudent ? "/lançar-notas" : "/entrar" },
    { icon: User, label: "Perfil", path: isStudent ? "/perfil-aluno" : "/entrar" },
    { icon: MoreHorizontal, label: "Mais", path: "/sobre" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    if (path === "/entrar") {
      return location.startsWith("/entrar") || location.startsWith("/notas-do-curso") || location.startsWith("/perfil-aluno");
    }
    return location === path || location.startsWith(`${path}/`);
  };

  const handleLogout = () => {
    clearStudentSession();
    notifySessionChange();
    setLocation("/entrar");
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:hidden">
      <div className="bottom-nav-glass mx-auto flex max-w-md items-center gap-1 overflow-x-auto rounded-[2rem] px-2 py-2.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={`${item.label}-${item.path}`}
              onClick={() => setLocation(item.path)}
              className={`flex min-w-[3.25rem] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-[10px] font-black transition-all ${
                active
                  ? "bg-[#145c3a] text-[#f0bd3a] shadow-lg shadow-black/25"
                  : "text-white/65 hover:bg-white/8 hover:text-white"
              }`}
              title={item.label}
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-full ${active ? "bg-[#062417]/70" : ""}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="leading-none">{item.label}</span>
            </button>
          );
        })}
        {isStudent && (
          <button
            onClick={handleLogout}
            className="flex min-w-[3.25rem] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-[10px] font-black text-red-300 transition-all hover:bg-red-500/10"
            title="Sair"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full">
              <LogOut className="h-4 w-4" />
            </span>
            <span className="leading-none">Sair</span>
          </button>
        )}
      </div>
    </nav>
  );
}
