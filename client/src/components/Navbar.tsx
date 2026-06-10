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
} from "lucide-react";
import {
  clearStudentSession,
  getStudentSession,
  STUDENT_SESSION_CHANGED,
  type StudentSession,
} from "@/lib/studentSession";

const LOGO_URL = "/logo/pmam-logo.png";

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
      {/* Mobile Header (Dark Green, Translucent) */}
      <header className="md:hidden sticky top-0 z-40 bg-[#062417]/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-[#f8f7f0] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <img src={LOGO_URL} alt="Brasão PMAM" className="h-10 w-10 shrink-0 object-contain drop-shadow-lg" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-black uppercase tracking-[0.16em] text-[#f8f7f0]">
                HINÁRIO PMAM
              </p>
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
                Polícia Militar do Amazonas
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/hinos" aria-label="Buscar hinos">
              <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full border border-white/10 bg-white/8 text-white hover:bg-white/15">
                <Search className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/cfap-2026" aria-label="Notificações">
              <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full border border-white/10 bg-white/8 text-white hover:bg-white/15">
                <Bell className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Desktop/Tablet Header (White) */}
      <header className="hidden md:block sticky top-0 z-50 w-full border-b border-border/40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="checkerboard-pattern w-full" />
      
      {/* Top Row: Logo & Student Auth Actions */}
      <div className="container flex h-16 items-center justify-between gap-4 overflow-hidden pt-1">
        <Link href="/" className="flex min-w-0 max-w-[calc(100vw-5rem)] items-center gap-2 overflow-hidden no-underline sm:gap-3">
          <img
            src={LOGO_URL}
            alt="Brasão PMAM"
            className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
          />
          <div className="flex min-w-0 max-w-[10rem] flex-col sm:max-w-[13rem]">
            <span
              className="truncate text-sm font-bold leading-tight text-[#1a3a2a]"
              style={{ fontFamily: "Merriweather, serif" }}
            >
              HINÁRIO PMAM
            </span>
            <span className="hidden truncate text-[10px] leading-tight text-muted-foreground sm:block">
              Polícia Militar do Amazonas
            </span>
          </div>
        </Link>

        {/* Right side controls (Student Info/Sair & Xerife) & Mobile menu trigger */}
        <div className="flex items-center gap-2">
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
                  <Button variant="ghost" size="sm" className="max-w-40 truncate text-[#1a3a2a] font-bold">
                    {student.nomeGuerra}
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
            <SheetContent side="right" className="w-72 bg-white">
              <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
              <div className="mt-8 flex flex-col gap-2">
                <div className="mb-6 flex items-center gap-3 px-2">
                  <img src={LOGO_URL} alt="Brasão PMAM" className="h-10 w-10 shrink-0 object-contain" />
                  <div className="min-w-0">
                    <p
                      className="truncate font-bold text-[#1a3a2a]"
                      style={{ fontFamily: "Merriweather, serif" }}
                    >
                      HINÁRIO PMAM
                    </p>
                    <p className="truncate text-xs text-muted-foreground">Polícia Militar do Amazonas</p>
                  </div>
                </div>

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
                      <Button variant="ghost" className="w-full justify-start gap-3 text-[#1a3a2a]">
                        {student.nomeGuerra}
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
      <div className="hidden xl:flex justify-center border-t border-border/40 py-2 bg-muted/10 w-full">
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
