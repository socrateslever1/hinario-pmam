import { useEffect, useMemo, useState } from "react";
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
  Menu,
  Moon,
  Music,
  Search,
  Shield,
  Star,
  Sun,
  User,
  Users,
} from "lucide-react";
import {
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
  { href: "/hinos", label: "Hinos", icon: Music },
  { href: "/charlie-mike", label: "Charlie Mike", icon: ListMusic },
  { href: "/cfap-2026", label: "CFAP 2026", icon: Shield },
  { href: "/documentos", label: "Meus Documentos", icon: FileText },
  { href: "/sobre", label: "Portfólio", icon: Info },
];

const publicLinks = [
  { href: "/", label: "Início", icon: Shield },
  { href: "/hinos", label: "Hinos", icon: Music },
  { href: "/charlie-mike", label: "Charlie Mike", icon: ListMusic },
  { href: "/cfap-2026", label: "CFAP 2026", icon: Shield },
  { href: "/sobre", label: "Portfólio", icon: Info },
];

const commandLinks = [
  { href: "/", label: "Início", icon: Shield },
  { href: "/sala-de-aula", label: "Sala de Aula", icon: LayoutGrid },
  { href: "/sala-de-aula/peculio", label: "Pecúlio", icon: ClipboardList },
  { href: "/sala-de-aula/efetivo", label: "Efetivo", icon: Users },
  { href: "/sala-administrativa", label: "Administrar", icon: ClipboardList },
  { href: "/sobre", label: "Portfólio", icon: Info },
];

function Brand() {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2 no-underline">
      <img src={LOGO_URL} alt="Brasão PMAM" className="h-9 w-9 shrink-0 object-contain drop-shadow md:h-10 md:w-10" />
      <div className="min-w-0">
        <p className="truncate text-[12px] font-black uppercase leading-tight tracking-[0.08em] text-[#1a3a2a] dark:text-[#c4a84b] md:text-sm" style={{ fontFamily: "Merriweather, serif" }}>
          QG DIGITAL
        </p>
        <p className="truncate text-[8px] font-semibold uppercase leading-tight tracking-[0.08em] text-muted-foreground md:text-xs">
          Plataforma Militar
        </p>
      </div>
    </Link>
  );
}

function Avatar({ src }: { src?: string | null }) {
  return (
    <span className="flex h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[#c4a84b]/40 bg-muted">
      {src ? <img src={src} alt="Perfil" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center"><User className="h-4 w-4 text-[#c4a84b]" /></span>}
    </span>
  );
}

export default function Navbar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [student, setStudent] = useState<StudentSession | null>(() => getStudentSession());
  const { theme, toggleTheme } = useTheme();
  const { data: user } = trpc.auth.me.useQuery();
  const { logout } = useAuth();

  const profileQuery = trpc.student.getProfile.useQuery(
    { id: student?.id ?? 0, sessionToken: student?.sessionToken ?? "" },
    { enabled: Boolean(student) },
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
  const links = useMemo(
    () => (isCommand ? commandLinks : student ? studentLinks : publicLinks),
    [isCommand, student],
  );

  const isActive = (href: string) => location === href || (href !== "/" && location.startsWith(href));

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    window.location.href = "/";
  };

  const account = (
    <div className="flex flex-col gap-2 border-t pt-3 xl:flex-row xl:items-center xl:border-0 xl:pt-0">
      {student ? (
        <>
          <Link href="/notas-do-curso" onClick={() => setOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 xl:w-auto"><GraduationCap className="h-4 w-4" /> Notas</Button>
          </Link>
          <Link href="/perfil-aluno" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
            <Avatar src={profileQuery.data?.fotoUrl} />
            <span className="max-w-40 truncate text-xs font-black">{student.nomeGuerra}</span>
          </Link>
          <Button variant="ghost" size="sm" className="justify-start" onClick={handleLogout}>Sair</Button>
        </>
      ) : user ? (
        <>
          <Link href="/perfil" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
            <Avatar src={user.fotoUrl} />
            <span className="max-w-40 truncate text-xs font-black">{user.name || "Usuário"}</span>
          </Link>
          <Button variant="ghost" size="sm" className="justify-start" onClick={handleLogout}>Sair</Button>
        </>
      ) : (
        <Link href="/entrar" onClick={() => setOpen(false)}>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 xl:w-auto"><GraduationCap className="h-4 w-4" /> Acesso do Aluno</Button>
        </Link>
      )}
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/40 bg-white/95 px-3 pb-2 pt-[calc(env(safe-area-inset-top)+0.45rem)] backdrop-blur-xl dark:bg-[#0c0c0e]/95 md:hidden">
        <div className="flex items-center justify-between gap-2">
          <Brand />
          <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-border/20 bg-muted/60 px-1 py-0.5 dark:bg-zinc-800/40">
            <Button size="icon-sm" variant="ghost" className="rounded-full" onClick={toggleTheme} aria-label="Alternar tema">
              {theme === "dark" ? <Sun className="h-3.5 w-3.5 text-[#c4a84b]" /> : <Moon className="h-3.5 w-3.5 text-[#c4a84b]" />}
            </Button>
            <Link href="/hinos" aria-label="Buscar hinos"><Button size="icon-sm" variant="ghost" className="rounded-full"><Search className="h-3.5 w-3.5 text-[#c4a84b]" /></Button></Link>
            <NotificationBell />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild><Button size="icon-sm" variant="ghost" className="rounded-full" aria-label="Abrir menu"><Menu className="h-4 w-4" /></Button></SheetTrigger>
              <SheetContent side="right" className="w-72 bg-white dark:bg-[#15151a] dark:text-foreground">
                <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
                <div className="mt-8 flex flex-col gap-2">
                  <div className="mb-5"><Brand /></div>
                  {links.map((link) => (
                    <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                      <Button variant={isActive(link.href) ? "default" : "ghost"} className={`w-full justify-start gap-3 ${isActive(link.href) ? "bg-[#1a3a2a] text-white" : ""}`}>
                        <link.icon className="h-4 w-4" />{link.label}
                      </Button>
                    </Link>
                  ))}
                  {isCommand && (
                    <Link href="/documentos" onClick={() => setOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3"><FileText className="h-4 w-4" /> Documentos Recebidos</Button>
                    </Link>
                  )}
                  <Link href="/xerife" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-[#c4a84b]"><Star className="h-4 w-4" /> Posto de Comando</Button>
                  </Link>
                  {account}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <header className="sticky top-0 z-50 hidden w-full border-b border-border/40 bg-white/95 backdrop-blur dark:bg-[#0c0c0e]/95 md:block">
        <div className="checkerboard-pattern w-full" />
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
          <Brand />
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full border border-border/20 bg-muted/60 px-1.5 py-0.5 dark:bg-zinc-800/40">
              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full" onClick={toggleTheme} aria-label="Alternar tema">
                {theme === "dark" ? <Sun className="h-4 w-4 text-[#c4a84b]" /> : <Moon className="h-4 w-4 text-[#c4a84b]" />}
              </Button>
              <Link href="/hinos" aria-label="Buscar hinos"><Button size="icon" variant="ghost" className="h-9 w-9 rounded-full"><Search className="h-4 w-4 text-[#c4a84b]" /></Button></Link>
              <NotificationBell />
            </div>
            <div className="hidden xl:flex">{account}</div>
          </div>
        </div>
        <div className="hidden justify-center border-t border-border/40 bg-muted/10 py-2 dark:bg-[#1a1a24]/50 xl:flex">
          <nav className="flex w-full max-w-7xl items-center justify-center gap-1.5 overflow-x-auto px-4">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button variant={isActive(link.href) ? "default" : "ghost"} size="sm" className={`gap-1.5 px-3 py-1.5 text-xs font-semibold ${isActive(link.href) ? "bg-[#1a3a2a] text-white hover:bg-[#1a3a2a]/90" : ""}`}>
                  <link.icon className="h-3.5 w-3.5" />{link.label}
                </Button>
              </Link>
            ))}
            <Link href="/xerife"><Button variant="ghost" size="sm" className="gap-1.5 text-[#c4a84b]"><Star className="h-3.5 w-3.5" /> Posto de Comando</Button></Link>
          </nav>
        </div>
      </header>
    </>
  );
}