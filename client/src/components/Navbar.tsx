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
  LayoutGrid,
  ClipboardList,
  Users,
} from "lucide-react";
import {
  clearStudentSession,
  getStudentSession,
  STUDENT_SESSION_CHANGED,
  type StudentSession,
} from "@/lib/studentSession";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/_core/hooks/useAuth";


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

function ProfileAvatar({ src, alt }: { src?: string | null; alt: string }) {
  return (
    <span className="flex size-8 shrink-0 overflow-hidden rounded-full border border-[#c4a84b]/40 bg-[#1a3a2a]/10 dark:bg-zinc-800">
      {src ? (
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="block h-full w-full object-cover object-center"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          <User className="h-3.5 w-3.5 text-[#c4a84b]" />
        </span>
      )}
    </span>
  );
}

function ProfileIdentityLink({
  href,
  label,
  photoUrl,
  photoAlt,
  onClick,
  tone = "student",
  compact = false,
}: {
  href: string;
  label: string;
  photoUrl?: string | null;
  photoAlt: string;
  onClick?: () => void;
  tone?: "student" | "command";
  compact?: boolean;
}) {
  const colorClass = tone === "student"
    ? "text-[#1a3a2a] dark:text-primary"
    : "text-[#1a3a2a] dark:text-[#c4a84b]";

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`inline-flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-xs font-black leading-tight transition-colors hover:bg-accent dark:hover:bg-accent/50 ${colorClass} ${
        compact ? "w-full max-w-full justify-start" : "max-w-[18rem]"
      }`}
      title={label}
    >
      <ProfileAvatar src={photoUrl} alt={photoAlt} />
      <span className="min-w-0 whitespace-normal break-words [overflow-wrap:anywhere]">
        {label}
      </span>
    </Link>
  );
}

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

  const { data: user } = trpc.auth.me.useQuery();
  const { logout: handleCommandLogout } = useAuth();
  const isComandante = Boolean(
    !student &&
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

  const links = isComandante
    ? [
        { href: "/", label: "Página Inicial", icon: Shield },
        { href: "/sala-de-aula", label: "Sala de Aula", icon: LayoutGrid },
        { href: "/sala-de-aula/peculio", label: "Pecúlio", icon: ClipboardList },
        { href: "/sala-de-aula/efetivo", label: "Efetivo", icon: Users },
        { href: "/documentos", label: "Documentos", icon: FileText },
        { href: "/sobre", label: "Sobre", icon: Info },
      ]
    : navLinks;

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

  const handleStudentLogout = async () => {
    await handleCommandLogout();
    window.location.href = "/";
  };

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 bg-white/95 px-2.5 pb-1.5 pt-[calc(env(safe-area-inset-top)+0.4rem)] text-foreground border-b border-border/40 backdrop-blur-xl dark:bg-[#0c0c0e]/95 dark:text-foreground">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="flex min-w-0 items-center gap-1.5">
            <img src={LOGO_URL} alt="Brasão PMAM" className="h-8 w-8 shrink-0 object-contain drop-shadow" />
            <div className="min-w-0">
              <p 
                className="truncate text-[11px] font-black uppercase leading-tight tracking-[0.1em] text-[#1a3a2a] dark:text-[#c4a84b]"
                style={{ fontFamily: "Merriweather, serif" }}
              >
                MEU QUARTEL
              </p>
              <p className="truncate text-[8px] font-semibold uppercase leading-tight tracking-[0.08em] text-muted-foreground">
                Plataforma Digital PMAM
              </p>
            </div>
          </Link>
          <div className="flex shrink-0 items-center bg-muted/60 dark:bg-zinc-800/40 border border-border/20 backdrop-blur-md rounded-full px-1 py-0.5 gap-0.5">
            {toggleTheme && (
              <Button
                size="icon-sm"
                variant="ghost"
                className="rounded-full text-foreground hover:bg-black/5 dark:hover:bg-card/5"
                onClick={toggleTheme}
                aria-label="Alternar tema"
              >
                {theme === "dark" ? <Sun className="h-3.5 w-3.5 text-[#c4a84b]" /> : <Moon className="h-3.5 w-3.5 text-[#c4a84b]" />}
              </Button>
            )}
            <Link href="/hinos" aria-label="Buscar hinos">
              <Button size="icon-sm" variant="ghost" className="rounded-full text-foreground hover:bg-black/5 dark:hover:bg-card/5">
                <Search className="h-3.5 w-3.5 text-[#c4a84b]" />
              </Button>
            </Link>
            <NotificationBell />
          </div>
        </div>
      </header>

      <header className="hidden md:block sticky top-0 z-50 w-full border-b border-border/40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-[#0c0c0e]/95">
      <div className="checkerboard-pattern w-full" />
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
              MEU QUARTEL
            </span>
            <span className="truncate text-xs leading-tight text-muted-foreground whitespace-nowrap">
              Plataforma Digital PMAM
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted/60 dark:bg-zinc-800/40 border border-border/20 backdrop-blur-md rounded-full px-1.5 py-0.5 gap-0.5">
            {toggleTheme && (
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-full text-foreground hover:bg-black/5 dark:hover:bg-card/5"
                onClick={toggleTheme}
                title="Alternar tema"
                aria-label="Alternar tema"
              >
                {theme === "dark" ? <Sun className="h-4 w-4 text-[#c4a84b]" /> : <Moon className="h-4 w-4 text-[#c4a84b]" />}
              </Button>
            )}
            <Link href="/hinos" aria-label="Buscar hinos">
              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full text-foreground hover:bg-black/5 dark:hover:bg-card/5">
                <Search className="h-4 w-4 text-[#c4a84b]" />
              </Button>
            </Link>
            <NotificationBell />
          </div>

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
                <ProfileIdentityLink
                  href="/perfil-aluno"
                  label={student.nomeGuerra}
                  photoUrl={profileQuery.data?.fotoUrl}
                  photoAlt="Foto do Aluno"
                  tone="student"
                />
                <Button variant="ghost" size="sm" onClick={handleStudentLogout}>
                  Sair
                </Button>
              </>
            ) : user ? (
              <>
                <ProfileIdentityLink
                  href="/perfil"
                  label={user.name || "Comandante"}
                  photoUrl={user.fotoUrl}
                  photoAlt="Foto do Comandante"
                  tone="command"
                />
                <Button variant="ghost" size="sm" onClick={handleCommandLogout}>
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
                  Acesso do Aluno
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
                Posto de Comando
              </Button>
            </Link>
          </div>

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
                      MEU QUARTEL
                    </p>
                    <p className="truncate text-xs text-muted-foreground">Plataforma Digital PMAM</p>
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

                {links.map((link) => {
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
                    <ProfileIdentityLink
                      href="/perfil-aluno"
                      label={student.nomeGuerra}
                      photoUrl={profileQuery.data?.fotoUrl}
                      photoAlt="Foto do Aluno"
                      tone="student"
                      compact
                      onClick={() => setOpen(false)}
                    />
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
                ) : user ? (
                  <>
                    <ProfileIdentityLink
                      href="/perfil"
                      label={user.name || "Comandante"}
                      photoUrl={user.fotoUrl}
                      photoAlt="Foto do Comandante"
                      tone="command"
                      compact
                      onClick={() => setOpen(false)}
                    />
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      onClick={() => {
                        setOpen(false);
                        handleCommandLogout();
                      }}
                    >
                      Sair
                    </Button>
                  </>
                ) : (
                  <Link href="/entrar" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-3">
                      <GraduationCap className="h-4 w-4" />
                      Acesso do Aluno
                    </Button>
                  </Link>
                )}

                <Link href="/xerife" onClick={() => setOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3 text-[#c4a84b]">
                    <Star className="h-4 w-4" />
                    Posto de Comando
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="hidden xl:flex justify-center border-t border-border/40 py-2 bg-muted/10 w-full dark:bg-[#1a1a24]/50">
        <nav className="flex items-center justify-center gap-1.5 w-full max-w-7xl overflow-x-auto px-4">
          {links.map((link) => {
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