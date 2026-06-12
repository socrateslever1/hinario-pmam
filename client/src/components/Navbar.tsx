import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Bell,
  BookOpenCheck,
  FileText,
  GraduationCap,
  Info,
  ListMusic,
  Menu,
  Music,
  Search,
  Shield,
  Star,
  Target,
  Sun,
  Moon,
  User,
} from "lucide-react";
import {
  clearStudentSession,
  getStudentSession,
  STUDENT_SESSION_CHANGED,
  type StudentSession,
} from "@/lib/studentSession";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";


const LOGO_URL = "/logo/IMG_7728.PNG";

const navLinks = [
  { href: "/", label: "Página Inicial", icon: Shield },
  { href: "/hinos", label: "Hinos", icon: Music },
  { href: "/charlie-mike", label: "Charlie Mike", icon: ListMusic },
  { href: "/drill", label: "Ordem Unida", icon: Target },
  { href: "/estudos", label: "Centro de Estudos", icon: BookOpenCheck },
  { href: "/cfap-2026", label: "CFAP 2026", icon: Target },
  { href: "/documentos", label: "Documentos", icon: FileText },
  { href: "/sobre", label: "Sobre", icon: Info },
];

function isStudentArea(location: string) {
  return (
    location.startsWith("/entrar") ||
    location.startsWith("/notas-do-curso") ||
    location.startsWith("/grades")
  );
}

export default function Navbar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [student, setStudent] = useState<StudentSession | null>(() => getStudentSession());
  const { theme, toggleTheme } = useTheme();

  const profileQuery = trpc.student.getProfile.useQuery(
    { id: student?.id ?? 0, sessionToken: student?.sessionToken ?? "" },
    { enabled: !!student }
  );

  useEffect(() => {
    const syncStudent = () => setStudent(getStudentSession());
    window.addEventListener(STUDENT_SESSION_CHANGED, syncStudent);
    window.addEventListener("storage", syncStudent);
    return () => {
      window.removeEventListener(STUDENT_SESSION_CHANGED, syncStudent);
      window.removeEventListener("storage", syncStudent);
    };
  }, []);

  const handleStudentLogout = () => {
    clearStudentSession();
    if (isStudentArea(location)) {
      window.location.href = "/entrar";
    }
  };

  return (
    <>
      {/* Mobile Header (White, Translucent) */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 px-3 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-foreground border-b border-border/40 backdrop-blur-xl dark:bg-[#0c0c0e]/95 dark:text-foreground">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <img src={LOGO_URL} alt="Brasão PMAM" className="h-9 w-9 shrink-0 object-contain drop-shadow" />
            <div className="min-w-0">
              <p 
                className="truncate text-xs font-black uppercase tracking-[0.12em] text-[#1a3a2a] dark:text-[#c4a84b]"
                style={{ fontFamily: "Merriweather, serif" }}
              >
                HINÁRIO PMAM
              </p>
              <p className="truncate text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Polícia Militar
              </p>
            </div>
          </Link>
          <div className="flex items-center bg-muted/60 dark:bg-zinc-800/40 border border-border/20 backdrop-blur-md rounded-full px-1.5 py-0.5 gap-0.5">
            {toggleTheme && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                onClick={toggleTheme}
                aria-label="Alternar tema"
              >
                {theme === "dark" ? <Sun className="h-4 w-4 text-[#c4a84b]" /> : <Moon className="h-4 w-4 text-[#c4a84b]" />}
              </Button>
            )}
            <Link href="/hinos" aria-label="Buscar hinos">
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-foreground hover:bg-black/5 dark:hover:bg-white/5">
                <Search className="h-4 w-4 text-[#c4a84b]" />
              </Button>
            </Link>
            <Link href="/cfap-2026" aria-label="Notificações">
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-foreground hover:bg-black/5 dark:hover:bg-white/5">
                <Bell className="h-4 w-4 text-[#c4a84b]" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Desktop/Tablet Header (White) */}
      <header className="hidden md:block sticky top-0 z-50 w-full border-b border-border/40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-[#0c0c0e]/95">
      <div className="checkerboard-pattern w-full" />
      
      {/* Top Row: Logo & Student Auth Actions */}
      <div className="container mx-auto px-4 flex h-16 items-center justify-between gap-6 overflow-hidden pt-1">
        <Link href="/" className="flex min-w-0 items-center gap-3 overflow-hidden no-underline">
          <img
            src={LOGO_URL}
            alt="Brasão PMAM"
            className="h-10 w-10 shrink-0 object-contain"
          />
          <div className="flex min-w-0 flex-col">
            <span
              className="truncate text-sm font-bold leading-tight text-[#1a3a2a] dark:text-[#c4a84b]"
              style={{ fontFamily: "Merriweather, serif" }}
            >
              HINÁRIO PMAM
            </span>
            <span className="truncate text-xs leading-tight text-muted-foreground whitespace-nowrap">
              Polícia Militar do Amazonas
            </span>
          </div>
        </Link>

        {/* Right side controls (Student Info/Sair & Xerife) & Mobile menu trigger */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted/60 dark:bg-zinc-800/40 border border-border/20 backdrop-blur-md rounded-full px-1.5 py-0.5 gap-0.5">
            {toggleTheme && (
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-full text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                onClick={toggleTheme}
                title="Alternar tema"
                aria-label="Alternar tema"
              >
                {theme === "dark" ? <Sun className="h-4 w-4 text-[#c4a84b]" /> : <Moon className="h-4 w-4 text-[#c4a84b]" />}
              </Button>
            )}
            
            {/* Search and Notifications Icons */}
            <Link href="/hinos" aria-label="Buscar hinos">
              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full text-foreground hover:bg-black/5 dark:hover:bg-white/5">
                <Search className="h-4 w-4 text-[#c4a84b]" />
              </Button>
            </Link>
            <Link href="/cfap-2026" aria-label="Notificações">
              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full text-foreground hover:bg-black/5 dark:hover:bg-white/5">
                <Bell className="h-4 w-4 text-[#c4a84b]" />
              </Button>
            </Link>
          </div>

          {/* Desktop-only Auth controls */}
          <div className="hidden xl:flex items-center gap-2">
            {student ? (
              <>
                <Link href="/notas-do-curso">
                  <Button
                    variant={isStudentArea(location) ? "default" : "ghost"}
                    size="sm"
                    className={`gap-2 ${
                      isStudentArea(location)
                        ? "bg-[#1a3a2a] text-white hover:bg-[#1a3a2a]/90"
                        : "text-foreground"
                    }`}
                  >
                    <GraduationCap className="h-4 w-4" />
                    Notas do Curso
                  </Button>
                </Link>
                <Link href="/perfil-aluno">
                  <Button variant="ghost" size="sm" className="gap-2 max-w-48 truncate text-[#1a3a2a] dark:text-primary font-bold">
                    {profileQuery.data?.fotoUrl ? (
                      <img
                        src={profileQuery.data.fotoUrl}
                        alt="Foto do Aluno"
                        className="h-6 w-6 rounded-full object-cover border border-[#c4a84b]/40"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-[#1a3a2a]/10 dark:bg-zinc-800 flex items-center justify-center border border-border/10">
                        <User className="h-3 w-3 text-[#c4a84b]" />
                      </div>
                    )}
                    <span>{student.nomeGuerra}</span>
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleStudentLogout}>
                  Sair
                </Button>
              </>
            ) : (
              <Link href="/entrar">
                <Button
                  variant={isStudentArea(location) ? "default" : "ghost"}
                  size="sm"
                  className={`gap-2 ${
                    isStudentArea(location)
                      ? "bg-[#1a3a2a] text-white hover:bg-[#1a3a2a]/90"
                      : "text-foreground"
                  }`}
                >
                  <GraduationCap className="h-4 w-4" />
                  Entrar
                </Button>
              </Link>
            )}

            <Link href="/xerife">
              <Button
                variant={location.startsWith("/xerife") ? "default" : "ghost"}
                size="sm"
                className={`gap-2 ${
                  location.startsWith("/xerife")
                    ? "bg-[#c4a84b] text-[#1a1a1a] hover:bg-[#b39740]"
                    : "text-[#c4a84b]"
                }`}
              >
                <Star className="h-4 w-4" />
                Área do Xerife
              </Button>
            </Link>
          </div>

          {/* Mobile Sheet Trigger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 xl:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-white dark:bg-[#15151a] dark:text-foreground">
              <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
              <div className="mt-8 flex flex-col gap-2">
                <div className="mb-6 flex items-center gap-3 px-2">
                  <img src={LOGO_URL} alt="Brasão PMAM" className="h-10 w-10 shrink-0 object-contain" />
                  <div className="min-w-0">
                    <p
                      className="truncate font-bold text-[#1a3a2a] dark:text-[#c4a84b]"
                      style={{ fontFamily: "Merriweather, serif" }}
                    >
                      HINÁRIO PMAM
                    </p>
                    <p className="truncate text-xs text-muted-foreground">Polícia Militar do Amazonas</p>
                  </div>
                </div>

                {toggleTheme && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-foreground dark:hover:bg-muted/10 mb-4"
                    onClick={toggleTheme}
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="h-4 w-4 text-[#c4a84b]" />
                        <span>Modo Claro</span>
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4 text-slate-700" />
                        <span>Modo Escuro</span>
                      </>
                    )}
                  </Button>
                )}

                {navLinks.map((link) => {
                  const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
                  return (
                    <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full justify-start gap-3 ${isActive ? "bg-[#1a3a2a] text-white" : ""}`}
                      >
                        <link.icon className="h-4 w-4" />
                        {link.label}
                      </Button>
                    </Link>
                  );
                })}

                {student ? (
                  <>
                    <Link href="/notas-do-curso" onClick={() => setOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3">
                        <GraduationCap className="h-4 w-4" />
                        Notas do Curso
                      </Button>
                    </Link>
                    <Link href="/perfil-aluno" onClick={() => setOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3 text-[#1a3a2a] dark:text-primary font-bold">
                        {profileQuery.data?.fotoUrl ? (
                          <img
                            src={profileQuery.data.fotoUrl}
                            alt="Foto do Aluno"
                            className="h-6 w-6 rounded-full object-cover border border-[#c4a84b]/40"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-[#1a3a2a]/10 dark:bg-zinc-800 flex items-center justify-center border border-border/10">
                            <User className="h-3 w-3 text-[#c4a84b]" />
                          </div>
                        )}
                        <span>{student.nomeGuerra}</span>
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      onClick={() => {
                        setOpen(false);
                        handleStudentLogout();
                      }}
                    >
                      Sair
                    </Button>
                  </>
                ) : (
                  <Link href="/entrar" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-3">
                      <GraduationCap className="h-4 w-4" />
                      Entrar
                    </Button>
                  </Link>
                )}

                <Link href="/xerife" onClick={() => setOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3 text-[#c4a84b]">
                    <Star className="h-4 w-4" />
                    Área do Xerife
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Bottom Row: Navigation Menu Bar (Desktop Only) */}
      <div className="hidden xl:flex justify-center border-t border-border/40 py-2 bg-muted/10 w-full dark:bg-[#1a1a24]/50">
        <nav className="flex items-center justify-center gap-1.5 w-full max-w-7xl overflow-x-auto px-4">
          {navLinks.map((link) => {
            const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={`gap-1.5 px-3 py-1.5 text-xs font-semibold ${
                    isActive ? "bg-[#1a3a2a] text-white hover:bg-[#1a3a2a]/90" : "text-foreground"
                  }`}
                >
                  <link.icon className="h-3.5 w-3.5" />
                  {link.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
    </>
  );
}
