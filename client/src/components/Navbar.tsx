import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  BookOpenCheck,
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
  Target,
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

const defaultLinks = [
  { href: "/", label: "Página Inicial", icon: Shield },
  { href: "/hinos", label: "Hinos", icon: Music },
  { href: "/charlie-mike", label: "Charlie Mike", icon: ListMusic },
  { href: "/drill", label: "Ordem Unida", icon: Target },
  { href: "/estudos", label: "Centro de Estudos", icon: BookOpenCheck },
  { href: "/cfap-2026", label: "CFAP 2026", icon: Target },
  { href: "/documentos", label: "Documentos", icon: FileText },
  { href: "/sobre", label: "Sobre", icon: Info },
];

const commandRoles = new Set([
  "comandante_corpo",
  "subcomandante_corpo",
  "sub_comandante_corpo",
  "comandante_cfap",
  "subcomandante_cfap",
  "sub_comandante_cfap",
  "comandante_cia",
  "comandante_pel",
]);

function ProfileAvatar({ src, alt }: { src?: string | null; alt: string }) {
  return (
    <span className="flex size-8 shrink-0 overflow-hidden rounded-full border border-[#c4a84b]/40 bg-[#1a3a2a]/10 dark:bg-zinc-800">
      {src ? (
        <img src={src} alt={alt} draggable={false} className="block h-full w-full object-cover object-center" />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          <User className="h-3.5 w-3.5 text-[#c4a84b]" />
        </span>
      )}
    </span>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2 no-underline">
      <img src={LOGO_URL} alt="Brasão PMAM" className="h-9 w-9 shrink-0 object-contain drop-shadow md:h-10 md:w-10" />
      <div className="min-w-0">
        <p className="truncate text-[12px] font-black uppercase leading-tight tracking-[0.08em] text-[#1a3a2a] dark:text-[#c4a84b] md:text-sm" style={{ fontFamily: "Merriweather, serif" }}>
          MEU QUARTEL
        </p>
        <p className="truncate text-[8px] font-semibold uppercase leading-tight tracking-[0.08em] text-muted-foreground md:text-xs">
          Plataforma Digital PMAM
        </p>
      </div>
    </Link>
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
    const syncStudent = () => setStudent(getStudentSession());
    window.addEventListener(STUDENT_SESSION_CHANGED, syncStudent);
    window.addEventListener("storage", syncStudent);
    return () => {
      window.removeEventListener(STUDENT_SESSION_CHANGED, syncStudent);
      window.removeEventListener("storage", syncStudent);
    };
  }, []);

  const isCommander = Boolean(!student && user?.role && commandRoles.has(user.role));
  const links = isCommander
    ? [
        { href: "/", label: "Página Inicial", icon: Shield },
        { href: "/sala-de-aula", label: "Sala de Aula", icon: LayoutGrid },
        { href: "/sala-de-aula/peculio", label: "Pecúlio", icon: ClipboardList },
        { href: "/sala-de-aula/efetivo", label: "Efetivo", icon: Users },
        { href: "/documentos", label: "Documentos", icon: FileText },
        { href: "/sobre", label: "Sobre", icon: Info },
      ]
    : defaultLinks;

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    window.location.href = "/";
  };

  const isActive = (href: string) => location === href || (href !== "/" && location.startsWith(href));

  const accountBlock = (compact = false) => {
    if (student) {
      return (
        <>
          <Link href="/notas-do-curso" onClick={() => compact && setOpen(false)}>
            <Button variant="ghost" size={compact ? "default" : "sm"} className={compact ? "w-full justify-start gap-3" : "gap-2"}>
              <GraduationCap className="h-4 w-4" />
              Notas do Curso
            </Button>
          </Link>
          <Link href="/perfil-aluno" onClick={() => compact && setOpen(false)} className={compact ? "flex w-full items-center gap-2 rounded-md px-3 py-2 hover:bg-muted" : "flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"}>
            <ProfileAvatar src={profileQuery.data?.fotoUrl} alt="Foto do aluno" />
            <span className="min-w-0 truncate text-xs font-black text-[#1a3a2a] dark:text-primary">{student.nomeGuerra}</span>
          </Link>
          <Button variant="ghost" size={compact ? "default" : "sm"} className={compact ? "w-full justify-start" : ""} onClick={handleLogout}>
            Sair
          </Button>
        </>
      );
    }

    if (user) {
      return (
        <>
          <Link href="/perfil" onClick={() => compact && setOpen(false)} className={compact ? "flex w-full items-center gap-2 rounded-md px-3 py-2 hover:bg-muted" : "flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"}>
            <ProfileAvatar src={user.fotoUrl} alt="Foto do usuário" />
            <span className="min-w-0 truncate text-xs font-black text-[#1a3a2a] dark:text-[#c4a84b]">{user.name || "Usuário"}</span>
          </Link>
          <Button variant="ghost" size={compact ? "default" : "sm"} className={compact ? "w-full justify-start" : ""} onClick={handleLogout}>
            Sair
          </Button>
        </>
      );
    }

    return (
      <Link href="/entrar" onClick={() => compact && setOpen(false)}>
        <Button variant="ghost" size={compact ? "default" : "sm"} className={compact ? "w-full justify-start gap-3" : "gap-2"}>
          <GraduationCap className="h-4 w-4" />
          Acesso do Aluno
        </Button>
      </Link>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/40 bg-white/95 px-3 pb-2 pt-[calc(env(safe-area-inset-top)+0.45rem)] text-foreground backdrop-blur-xl dark:bg-[#0c0c0e]/95 md:hidden">
        <div className="flex items-center justify-between gap-2">
          <Brand />
          <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-border/20 bg-muted/60 px-1 py-0.5 dark:bg-zinc-800/40">
            <Button size="icon-sm" variant="ghost" className="rounded-full" onClick={toggleTheme} aria-label="Alternar tema">
              {theme === "dark" ? <Sun className="h-3.5 w-3.5 text-[#c4a84b]" /> : <Moon className="h-3.5 w-3.5 text-[#c4a84b]" />}
            </Button>
            <Link href="/hinos" aria-label="Buscar hinos">
              <Button size="icon-sm" variant="ghost" className="rounded-full">
                <Search className="h-3.5 w-3.5 text-[#c4a84b]" />
              </Button>
            </Link>
            <NotificationBell />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button size="icon-sm" variant="ghost" className="rounded-full" aria-label="Abrir menu">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-white dark:bg-[#15151a] dark:text-foreground">
                <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
                <div className="mt-8 flex flex-col gap-2">
                  <div className="mb-5"><Brand /></div>
                  {links.map((link) => (
                    <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                      <Button variant={isActive(link.href) ? "default" : "ghost"} className={`w-full justify-start gap-3 ${isActive(link.href) ? "bg-[#1a3a2a] text-white" : ""}`}>
                        <link.icon className="h-4 w-4" />
                        {link.label}
                      </Button>
                    </Link>
                  ))}
                  <div className="my-2 border-t" />
                  {accountBlock(true)}
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
      </header>

      <header className="sticky top-0 z-50 hidden w-full border-b border-border/40 bg-white/95 backdrop-blur dark:bg-[#0c0c0e]/95 md:block">
        <div className="checkerboard-pattern w-full" />
        <div className="container mx-auto flex h-16 items-center justify-between gap-5 px-4">
          <Brand />
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex items-center rounded-full border border-border/20 bg-muted/60 px-1.5 py-0.5 dark:bg-zinc-800/40">
              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full" onClick={toggleTheme} aria-label="Alternar tema">
                {theme === "dark" ? <Sun className="h-4 w-4 text-[#c4a84b]" /> : <Moon className="h-4 w-4 text-[#c4a84b]" />}
              </Button>
              <Link href="/hinos" aria-label="Buscar hinos">
                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full">
                  <Search className="h-4 w-4 text-[#c4a84b]" />
                </Button>
              </Link>
              <NotificationBell />
            </div>
            <div className="hidden items-center gap-2 xl:flex">
              {accountBlock(false)}
              <Link href="/xerife">
                <Button variant={location.startsWith("/xerife") ? "default" : "ghost"} size="sm" className="gap-2 text-[#c4a84b]">
                  <Star className="h-4 w-4" />
                  Posto de Comando
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="hidden justify-center border-t border-border/40 bg-muted/10 py-2 dark:bg-[#1a1a24]/50 xl:flex">
          <nav className="flex w-full max-w-7xl items-center justify-center gap-1.5 overflow-x-auto px-4">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button variant={isActive(link.href) ? "default" : "ghost"} size="sm" className={`gap-1.5 px-3 py-1.5 text-xs font-semibold ${isActive(link.href) ? "bg-[#1a3a2a] text-white hover:bg-[#1a3a2a]/90" : "text-foreground"}`}>
                  <link.icon className="h-3.5 w-3.5" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      </header>
    </>
  );
}