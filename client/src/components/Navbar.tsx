import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  ClipboardList,
  FileText,
  GraduationCap,
  Info,
  LayoutGrid,
  ListMusic,
  Medal,
  Menu,
  Moon,
  Music,
  Search,
  Shield,
  Star,
  Sun,
  Target,
  User,
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

const COMMAND_ROLES = new Set([
  "comandante_corpo",
  "subcomandante_corpo",
  "sub_comandante_corpo",
  "comandante_cfap",
  "subcomandante_cfap",
  "sub_comandante_cfap",
  "comandante_cia",
  "comandante_pel",
]);

const studentLinks = [
  { href: "/", label: "Início", icon: Shield },
  { href: "/sala-de-aula", label: "Sala de Aula", icon: LayoutGrid },
  { href: "/documentos", label: "Meus Documentos", icon: FileText },
  { href: "/hinos", label: "Hinos", icon: Music },
  { href: "/charlie-mike", label: "Charlie Mike", icon: ListMusic },
  { href: "/drill", label: "Ordem Unida", icon: Target },
  { href: "/historia-cfap", label: "Memória do CFAP", icon: Medal },
  { href: "/cfap-2026", label: "CFAP 2026", icon: Shield },
  { href: "/sobre", label: "Sobre", icon: Info },
];

const publicLinks = [
  { href: "/", label: "Início", icon: Shield },
  { href: "/hinos", label: "Hinos", icon: Music },
  { href: "/charlie-mike", label: "Charlie Mike", icon: ListMusic },
  { href: "/drill", label: "Ordem Unida", icon: Target },
  { href: "/historia-cfap", label: "Memória do CFAP", icon: Medal },
  { href: "/cfap-2026", label: "CFAP 2026", icon: Shield },
  { href: "/sobre", label: "Sobre", icon: Info },
];

const commandLinks = [
  { href: "/", label: "Início", icon: Shield },
  { href: "/sala-de-aula", label: "Sala de Aula", icon: LayoutGrid },
  { href: "/sala-de-aula/peculio", label: "Pecúlio", icon: ClipboardList },
  { href: "/sala-de-aula/efetivo", label: "Efetivo", icon: Users },
  { href: "/sala-administrativa", label: "Administrar", icon: ClipboardList },
  { href: "/hinos", label: "Hinos", icon: Music },
  { href: "/charlie-mike", label: "Charlie Mike", icon: ListMusic },
  { href: "/drill", label: "Ordem Unida", icon: Target },
  { href: "/historia-cfap", label: "Memória do CFAP", icon: Medal },
  { href: "/cfap-2026", label: "CFAP 2026", icon: Shield },
  { href: "/sobre", label: "Sobre", icon: Info },
];

function ProfileAvatar({ src, alt }: { src?: string | null; alt: string }) {
  return (
    <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#c4a84b]/40 bg-[#1a3a2a]/10 shadow-sm dark:bg-zinc-800">
      <span className="absolute inset-0 flex items-center justify-center">
        <User className="h-4 w-4 text-[#c4a84b]" />
      </span>
      {src ? (
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="relative block h-full w-full object-cover object-center"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : null}
    </span>
  );
}

function ProfileIdentityLink({
  href,
  label,
  photoUrl,
  photoAlt,
  onClick,
  compact = false,
}: {
  href: string;
  label: string;
  photoUrl?: string | null;
  photoAlt: string;
  onClick?: () => void;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`inline-flex min-w-0 items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-bold leading-tight text-[#1a3a2a] transition-colors hover:bg-[#1a3a2a]/10 dark:text-[#c4a84b] dark:hover:bg-white/10 ${
        compact ? "w-full justify-start" : "max-w-[18rem]"
      }`}
      title={label}
    >
      <ProfileAvatar src={photoUrl} alt={photoAlt} />
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2.5 no-underline">
      <img
        src={LOGO_URL}
        alt="Brasão PMAM"
        className="h-10 w-10 shrink-0 object-contain md:h-11 md:w-11"
      />
      <div className="min-w-0">
        <p
          className="truncate text-sm font-black uppercase leading-tight tracking-[0.08em] text-[#1a3a2a] dark:text-[#c4a84b] md:text-base"
          style={{ fontFamily: "Merriweather, serif" }}
        >
          QG DIGITAL
        </p>
        <p className="truncate text-[11px] font-semibold uppercase leading-tight tracking-[0.08em] text-muted-foreground md:text-xs">
          Plataforma Militar
        </p>
      </div>
    </Link>
  );
}

export default function Navbar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [student, setStudent] = useState<StudentSession | null>(() => getStudentSession());
  const themeContext = useTheme();
  const { data: user } = trpc.auth.me.useQuery();
  const { logout } = useAuth();

  const profileQuery = trpc.student.getProfile.useQuery(
    { id: student?.id ?? 0, sessionToken: student?.sessionToken ?? "" },
    { enabled: !!student }
  );

  useEffect(() => {
    const sync = () => setStudent(getStudentSession());
    window.addEventListener(STUDENT_SESSION_CHANGED, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STUDENT_SESSION_CHANGED, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isCommand = Boolean(!student && user?.role && COMMAND_ROLES.has(user.role));
  const links = isCommand ? commandLinks : student ? studentLinks : publicLinks;
  const active = (href: string) => location === href || (href !== "/" && location.startsWith(href));

  const toggleTheme = typeof themeContext?.toggleTheme === "function" ? themeContext.toggleTheme : undefined;
  const theme = themeContext?.theme;

  const handleStudentLogout = () => {
    setOpen(false);
    clearStudentSession();
    window.location.href = "/";
  };

  const handleLogout = async () => {
    setOpen(false);
    if (typeof logout === "function") await logout();
    window.location.href = "/";
  };

  const studentPhoto = profileQuery.data?.fotoUrl || null;
  const studentName = profileQuery.data?.nomeGuerra || student?.nomeGuerra || "Aluno";
  const userPhoto = (user as any)?.fotoUrl || null;
  const userName = user?.name || "Comandante";

  const menu = (
    <div className="flex flex-col gap-1.5">
      {links.map((item) => (
        <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
          <Button
            variant={active(item.href) ? "default" : "ghost"}
            className={`w-full justify-start gap-3 text-sm ${
              active(item.href)
                ? "bg-[#1a3a2a] text-white hover:bg-[#234b36] hover:text-white"
                : "text-[#26332b] hover:bg-[#1a3a2a]/10 hover:text-[#1a3a2a] dark:text-white/85 dark:hover:bg-white/10 dark:hover:text-white"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Button>
        </Link>
      ))}

      {isCommand && (
        <Link href="/documentos" onClick={() => setOpen(false)}>
          <Button variant="ghost" className="w-full justify-start gap-3 text-sm">
            <FileText className="h-4 w-4" />
            Documentos Recebidos
          </Button>
        </Link>
      )}

      <Link href="/hinos" onClick={() => setOpen(false)}>
        <Button variant="ghost" className="w-full justify-start gap-3 text-sm md:hidden">
          <Search className="h-4 w-4 text-[#c4a84b]" />
          Buscar no acervo
        </Button>
      </Link>

      {toggleTheme && (
        <Button variant="ghost" className="w-full justify-start gap-3 text-sm md:hidden" onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="h-4 w-4 text-[#c4a84b]" /> : <Moon className="h-4 w-4 text-[#c4a84b]" />}
          {theme === "dark" ? "Usar tema claro" : "Usar tema escuro"}
        </Button>
      )}

      {!student && (
        <Link href="/xerife" onClick={() => setOpen(false)}>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sm text-[#8a6900] hover:bg-[#c4a84b]/10 hover:text-[#6f5500] dark:text-[#d6bd66] dark:hover:text-[#ecd77f]"
          >
            <Star className="h-4 w-4" />
            Posto de Comando
          </Button>
        </Link>
      )}

      <div className="my-2 border-t border-border/40 pt-2">
        {student ? (
          <div className="flex flex-col gap-1.5">
            <Link href="/notas-do-curso" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-3 text-sm">
                <GraduationCap className="h-4 w-4 text-[#c4a84b]" />
                Notas do Curso
              </Button>
            </Link>
            <ProfileIdentityLink
              href="/perfil-aluno"
              label={studentName}
              photoUrl={studentPhoto}
              photoAlt="Foto do Aluno"
              compact
              onClick={() => setOpen(false)}
            />
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sm text-red-600 hover:bg-red-500/10 dark:text-red-400"
              onClick={handleStudentLogout}
            >
              Sair da sessão do aluno
            </Button>
          </div>
        ) : user ? (
          <div className="flex flex-col gap-1.5">
            <ProfileIdentityLink
              href="/perfil"
              label={userName}
              photoUrl={userPhoto}
              photoAlt="Foto do Comando"
              compact
              onClick={() => setOpen(false)}
            />
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sm text-red-600 hover:bg-red-500/10 dark:text-red-400"
              onClick={handleLogout}
            >
              Sair
            </Button>
          </div>
        ) : (
          <Link href="/entrar" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full justify-start gap-3 text-sm">
              <GraduationCap className="h-4 w-4 text-[#c4a84b]" />
              Acesso do Aluno
            </Button>
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#1a3a2a]/20 bg-[#f8f4e8]/95 px-3 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur-xl dark:border-border/40 dark:bg-[#0c0c0e]/95 md:hidden">
        <div className="flex min-h-12 items-center justify-between gap-2">
          <Brand />
          <div className="flex shrink-0 items-center gap-1">
            {student ? (
              <Link href="/perfil-aluno" title={studentName} className="rounded-full p-0.5">
                <ProfileAvatar src={studentPhoto} alt="Foto do Aluno" />
              </Link>
            ) : user ? (
              <Link href="/perfil" title={userName} className="rounded-full p-0.5">
                <ProfileAvatar src={userPhoto} alt="Foto do Comando" />
              </Link>
            ) : null}

            <NotificationBell />

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full"
                  aria-label="Abrir menu"
                  onClick={() => window.dispatchEvent(new Event("open-menu-and-acessos"))}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[min(21rem,88vw)] bg-[#f8f4e8] px-4 text-[#17251d] dark:bg-[#15151a] dark:text-foreground"
              >
                <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
                <div className="mt-7">
                  <Brand />
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    Formação, rotina, gestão e memória institucional em um só ambiente.
                  </p>
                  <div className="mt-5">{menu}</div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <header className="sticky top-0 z-50 hidden w-full border-b border-[#1a3a2a]/20 bg-[#f8f4e8]/95 backdrop-blur dark:border-border/40 dark:bg-[#0c0c0e]/95 md:block">
        <div className="checkerboard-pattern w-full" />
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
          <Brand />
          <div className="flex items-center gap-3">
            {student ? (
              <div className="flex items-center gap-2">
                <Link href="/notas-do-curso">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-[#1a3a2a]/30 text-xs text-[#1a3a2a] hover:bg-[#1a3a2a]/10 dark:border-white/20 dark:text-white"
                  >
                    <GraduationCap className="h-4 w-4 text-[#c4a84b]" />
                    Notas do Curso
                  </Button>
                </Link>
                <ProfileIdentityLink href="/perfil-aluno" label={studentName} photoUrl={studentPhoto} photoAlt="Foto do Aluno" />
                <Button variant="ghost" size="sm" className="text-xs text-red-600 dark:text-red-400" onClick={handleStudentLogout}>
                  Sair
                </Button>
              </div>
            ) : user ? (
              <div className="flex items-center gap-2">
                <ProfileIdentityLink href="/perfil" label={userName} photoUrl={userPhoto} photoAlt="Foto do Comando" />
                <Button variant="ghost" size="sm" className="text-xs text-red-600 dark:text-red-400" onClick={handleLogout}>
                  Sair
                </Button>
              </div>
            ) : (
              <Link href="/entrar">
                <Button size="sm" className="gap-1.5 border border-[#c4a84b]/40 bg-[#1a3a2a] text-xs font-bold text-[#f0bd3a] shadow-sm hover:bg-[#234b36]">
                  <GraduationCap className="h-4 w-4" />
                  Acesso do Aluno
                </Button>
              </Link>
            )}
            {toggleTheme && (
              <Button size="icon" variant="ghost" className="rounded-full" onClick={toggleTheme} aria-label="Alternar tema">
                {theme === "dark" ? <Sun className="h-4 w-4 text-[#c4a84b]" /> : <Moon className="h-4 w-4 text-[#c4a84b]" />}
              </Button>
            )}
            <NotificationBell />
          </div>
        </div>
        <div className="flex justify-center border-t border-[#1a3a2a]/15 bg-[#dfe5da] py-2 dark:border-border/40 dark:bg-white/[0.025]">
          <nav className="flex w-full max-w-7xl flex-wrap items-center justify-center gap-1.5 px-4">
            {links.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={active(item.href) ? "default" : "ghost"}
                  size="sm"
                  className={`gap-1.5 text-xs ${
                    active(item.href)
                      ? "bg-[#1a3a2a] text-white hover:bg-[#234b36] hover:text-white"
                      : "text-[#26332b] hover:bg-[#1a3a2a]/10 hover:text-[#1a3a2a] dark:text-white/85 dark:hover:bg-white/10 dark:hover:text-white"
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Button>
              </Link>
            ))}
            {!student && (
              <Link href="/xerife">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-[#8a6900] hover:bg-[#c4a84b]/10 hover:text-[#6f5500] dark:text-[#d6bd66] dark:hover:text-[#ecd77f]"
                >
                  <Star className="h-3.5 w-3.5" />
                  Posto de Comando
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
