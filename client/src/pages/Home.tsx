import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlogFeed from "@/components/BlogFeed";
import { ServiceBoardPreview } from "@/components/ServiceBoardPreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Link } from "wouter";
import {
  Award,
  Bell,
  BookOpen,
  ChevronRight,
  ClipboardList,
  Eye,
  FileText,
  GraduationCap,
  HeartHandshake,
  LayoutGrid,
  ListMusic,
  Medal,
  Music,
  Shield,
  Star,
  Target,
  Users,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getStudentSession } from "@/lib/studentSession";

const BRASAO_URL = "/IMG_7727.webp";

const COMMAND_ROLES = new Set([
  "admin",
  "master",
  "comandante_corpo",
  "subcomandante_corpo",
  "sub_comandante_corpo",
  "comandante_cfap",
  "subcomandante_cfap",
  "sub_comandante_cfap",
  "comandante_cia",
  "comandante_pel",
]);

const categories = [
  { key: "nacional", label: "Hinos Nacionais", icon: Star, desc: "Hinos da pátria e do estado" },
  { key: "militar", label: "Canções Militares", icon: Shield, desc: "Canções militares e de formação" },
  { key: "pmam", label: "Canções da PMAM", icon: Music, desc: "Canções da corporação" },
  { key: "arma", label: "Canções de Armas", icon: Target, desc: "Infantaria, Cavalaria e outras armas" },
  { key: "oracao", label: "Orações", icon: BookOpen, desc: "Orações e tradições militares" },
];

const heroSlides = [
  {
    badge: "QG Digital",
    title: "Sua rotina militar",
    highlight: "em um só ambiente",
    text: "Formação, rotina, gestão, comunicação e memória institucional integradas em uma plataforma pensada para uso diário no celular e na web.",
    href: "/sobre",
    action: "Conhecer a plataforma",
    icon: Shield,
  },
  {
    badge: "Formação CFAP",
    title: "Informação que",
    highlight: "acompanha a tropa",
    text: "Comunicados, aditamentos, rotina de pelotão e recursos de apoio ao Curso de Formação de Soldados.",
    href: "/cfap-2026",
    action: "Acessar CFAP 2026",
    icon: GraduationCap,
  },
  {
    badge: "Acervo público",
    title: "Tradição, estudo e",
    highlight: "memória militar",
    text: "Hinos, Charlie Mike, Ordem Unida e a memória histórica do CFAP permanecem disponíveis em acesso público.",
    href: "/hinos",
    action: "Explorar o acervo",
    icon: Music,
  },
];

function HeroSection() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const slide = heroSlides[activeSlide];
  const SlideIcon = slide.icon;

  const goToSlide = (index: number) => {
    setActiveSlide((index + heroSlides.length) % heroSlides.length);
  };

  const handleTouchEnd = (clientX: number) => {
    if (touchStartX === null) return;
    const delta = touchStartX - clientX;
    if (Math.abs(delta) > 42) goToSlide(activeSlide + (delta > 0 ? 1 : -1));
    setTouchStartX(null);
  };

  return (
    <section className="px-4 py-4 text-[#f8f7f0] md:py-7">
      <div className="mx-auto max-w-6xl">
        <div
          className="relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#092719]/95 p-5 shadow-[0_18px_44px_rgba(0,0,0,.32)] md:min-h-[350px] md:p-9"
          onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
          onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
        >
          <div className="pointer-events-none absolute -right-10 -top-12 h-64 w-64 rounded-full bg-[#145c3a]/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-8 h-60 w-60 rounded-full bg-[#d6b64c]/10 blur-3xl" />

          <div className="relative z-10 grid flex-1 grid-cols-1 items-center gap-6 md:grid-cols-[1.25fr_0.75fr]">
            <div className="flex flex-col items-start justify-center py-2 md:py-4">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/75">
                <SlideIcon className="h-4 w-4 text-[#f0bd3a]" />
                {slide.badge}
              </div>
              <h1
                className="max-w-2xl text-[30px] font-extrabold leading-[1.06] tracking-tight text-white md:text-5xl"
                style={{ fontFamily: "Merriweather, serif" }}
              >
                {slide.title}
                <span className="mt-1 block text-[#f0bd3a]">{slide.highlight}</span>
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/72 md:text-base">
                {slide.text}
              </p>
              <Link href={slide.href}>
                <Button className="mt-5 rounded-xl bg-[#f0bd3a] px-5 font-black text-[#062417] shadow-lg shadow-black/25 hover:bg-[#d6b64c]">
                  {slide.action}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="pointer-events-none absolute right-[-18px] top-1/2 flex -translate-y-1/2 items-center justify-end select-none md:relative md:right-0 md:top-auto md:translate-y-0">
              <img
                src={BRASAO_URL}
                alt="Brasão PMAM"
                className="h-44 w-44 object-contain opacity-[0.18] drop-shadow-[0_24px_32px_rgba(0,0,0,.42)] md:h-[21rem] md:w-[21rem] md:opacity-[0.25]"
              />
            </div>
          </div>

          <div className="z-10 mt-4 flex justify-center gap-2">
            {heroSlides.map((item, index) => (
              <button
                key={item.badge}
                type="button"
                aria-label={`Ir para destaque ${index + 1}`}
                onClick={() => goToSlide(index)}
                className={`h-2.5 rounded-full transition-all ${activeSlide === index ? "w-7 bg-[#f0bd3a]" : "w-2.5 bg-white/30"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickAccess() {
  const student = getStudentSession();
  const { data: user } = trpc.auth.me.useQuery();
  const isCommand = Boolean(!student && user?.role && COMMAND_ROLES.has(user.role));

  const publicItems = [
    { icon: Music, label: "Hinos", desc: "Catálogo institucional", href: "/hinos" },
    { icon: ListMusic, label: "Charlie Mike", desc: "Canções de treino", href: "/charlie-mike" },
    { icon: Target, label: "Ordem Unida", desc: "Conteúdo público", href: "/drill" },
    { icon: Medal, label: "Memória CFAP", desc: "História e comandantes", href: "/historia-cfap" },
    { icon: GraduationCap, label: "CFAP 2026", desc: "Comunicados e aditamentos", href: "/cfap-2026" },
    { icon: Users, label: "Acesso do Aluno", desc: "Entrar na área pessoal", href: "/entrar" },
  ];

  const studentItems = [
    { icon: LayoutGrid, label: "Minha Sala", desc: "Pelotão e rotina", href: "/sala-de-aula" },
    { icon: GraduationCap, label: "Notas", desc: "Médias e ranking", href: "/notas-do-curso" },
    { icon: FileText, label: "Documentos", desc: "Partes e requerimentos", href: "/documentos" },
    { icon: Shield, label: "CFAP 2026", desc: "Comunicados oficiais", href: "/cfap-2026" },
    { icon: Target, label: "Ordem Unida", desc: "Painel pessoal de estudo", href: "/drill" },
    { icon: Music, label: "Hinos", desc: "Acervo institucional", href: "/hinos" },
  ];

  const commandItems = [
    { icon: ClipboardList, label: "Sala Administrativa", desc: "Pendências e decisões", href: "/sala-administrativa" },
    { icon: Users, label: "Efetivo", desc: "Controle do pelotão", href: "/sala-de-aula/efetivo" },
    { icon: LayoutGrid, label: "Sala de Aula", desc: "Mapa e funções", href: "/sala-de-aula" },
    { icon: FileText, label: "Documentos", desc: "Recebidos e oficiais", href: "/documentos" },
    { icon: Shield, label: "CFAP 2026", desc: "Comunicados e aditamentos", href: "/cfap-2026" },
    { icon: Medal, label: "Memória CFAP", desc: "História institucional", href: "/historia-cfap" },
  ];

  const items = isCommand ? commandItems : student ? studentItems : publicItems;

  return (
    <section className="bg-background px-4 py-4 md:py-5">
      <div className="mx-auto max-w-6xl">
        <div className="mb-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1a3a2a]/65 dark:text-[#c4a84b]">QG Digital</p>
          <h2 className="mt-1 font-serif text-xl font-black tracking-tight text-foreground md:text-2xl">Acesso rápido</h2>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {items.map((item) => (
            <Link key={item.label} href={item.href} className="h-full">
              <Card className="h-full cursor-pointer rounded-xl border-border/60 bg-card py-0 shadow-xs transition-all hover:-translate-y-0.5 hover:border-[#c4a84b]/60 hover:shadow-md">
                <CardContent className="flex h-full flex-col justify-between p-3">
                  <div>
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a3a2a]/10 text-[#1a3a2a] dark:text-[#c4a84b]">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-black leading-tight text-foreground md:text-[13px]">{item.label}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function StudentNoticePanel() {
  const student = getStudentSession();
  const utils = trpc.useUtils();
  const noticesQuery = trpc.serviceScale.myNotices.useQuery(
    { studentId: student?.id ?? 0, sessionToken: student?.sessionToken ?? "" },
    { enabled: Boolean(student) }
  );
  const markRead = trpc.serviceScale.markNoticeRead.useMutation({
    onSuccess: () => utils.serviceScale.myNotices.invalidate(),
  });

  if (!student || !noticesQuery.data?.length) return null;

  return (
    <section className="bg-[#062417] px-4 py-6 text-[#f8f7f0] md:bg-background md:py-8 md:text-foreground">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-serif text-xl font-black md:text-2xl">
            <Bell className="h-5 w-5 text-[#f0bd3a]" />
            Avisos do Pelotão
          </h2>
          <Link href="/sala-de-aula" className="text-xs font-bold uppercase tracking-[0.14em] text-[#f0bd3a] md:text-[#1a3a2a]">
            Abrir sala
          </Link>
        </div>
        <div className="grid gap-3.5 md:grid-cols-3">
          {noticesQuery.data.map((notice: any) => (
            <Card key={notice.id} className="h-full border-white/10 bg-[#0b3323]/80 py-0 text-white shadow-lg md:border-border/50 md:bg-card md:text-foreground rounded-2xl">
              <CardContent className="flex h-full flex-col justify-between p-4.5">
                <div>
                  <Badge className="mb-3 bg-[#f0bd3a] text-[#062417]">
                    {notice.priority === "urgent" ? "Urgente" : notice.priority === "important" ? "Importante" : "Aviso"}
                  </Badge>
                  <h3 className="line-clamp-2 text-sm font-bold">{notice.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/70 md:text-muted-foreground">{notice.message}</p>
                </div>
                <Button
                  size="sm"
                  className="mt-4 w-full bg-[#f0bd3a] text-xs font-black text-[#062417] hover:bg-[#d6b64c]"
                  disabled={markRead.isPending}
                  onClick={() => markRead.mutate({ studentId: student.id, sessionToken: student.sessionToken, noticeId: notice.id })}
                >
                  Marcar como lido
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function StudentHighlights() {
  const { data: highlights } = trpc.serviceScale.studentHighlights.useQuery();
  if (!highlights?.length) return null;

  return (
    <section className="bg-[#f5f2e8] px-4 py-6 md:py-8 dark:bg-muted/10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#1a3a2a]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#1a3a2a]">
            <Award className="h-4 w-4 text-[#c4a84b]" />
            Destaques
          </div>
          <h2 className="font-serif text-2xl font-black text-foreground md:text-3xl">
            Alunos em Destaque
          </h2>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item: any) => (
            <Card key={item.id} className="h-full overflow-hidden border-border/50 bg-card py-0 shadow-xs rounded-2xl">
              <CardContent className="flex h-full flex-col justify-between p-4.5">
                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#c4a84b] bg-[#1a3a2a]/10">
                      {item.foto_url ? (
                        <img src={item.foto_url} alt={item.nome_guerra} className="h-full w-full object-cover" />
                      ) : (
                        <Medal className="h-6 w-6 text-[#c4a84b]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#1a3a2a] dark:text-[#c4a84b]">{item.nome_guerra}</p>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {item.companhia}ª Cia / {item.peloton}º Pel
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-foreground">{item.title}</p>
                  {item.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.description}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const cfapMission = "Treina e estudar pra servir e proteger";

const honorCommitmentHtml = "<strong>Ao</strong> ingressar na Polícia Militar do Amazonas, <strong>prometo</strong> regular a minha conduta pelos preceitos da moral, <strong>cumprir</strong> rigorosamente as ordens das autoridades a que estiver subordinado e <strong>dedicar-me</strong> inteiramente ao serviço policial militar, à manutenção da ordem pública e à segurança da comunidade, mesmo com o risco da própria vida.";

const institutionalGuidelines = [
  { icon: Target, title: "Missão PMAM", text: "Preservar a Ordem Pública e o Meio Ambiente no Estado do Amazonas, mediante um Policiamento Ostensivo de Excelência." },
  { icon: Eye, title: "Visão", text: "Ser referência nacional como Instituição de preservação da Ordem Pública e do Meio Ambiente." },
  { icon: Award, title: "Princípios", text: "Hierarquia, Disciplina e Eficácia." },
  { icon: HeartHandshake, title: "Valores", text: "Devotamento, Civismo, Coragem, Camaradagem, Honestidade, Justiça, Aprimoramento, Verdade e Espírito de preservação do meio ambiente." },
];

function InstitutionalGuidelines() {
  return (
    <section className="bg-background px-4 py-4 md:py-5">
      <div className="mx-auto max-w-6xl">
        <div className="mb-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1a3a2a]/65 dark:text-[#c4a84b]">Identidade PMAM</p>
          <h2 className="mt-1 font-serif text-xl font-black text-foreground md:text-2xl">
            Diretrizes Institucionais
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Princípios que orientam a atuação e a formação policial militar no Amazonas.
          </p>
        </div>

        <div className="mb-3 grid gap-2.5 lg:grid-cols-[0.82fr_1.18fr]">
          <Card className="rounded-xl border-[#c4a84b]/45 bg-[#092719] py-0 text-white shadow-sm">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f0bd3a] text-[#062417]">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d6bd66]">Missão do CFAP</p>
                <p className="mt-0.5 text-sm font-black leading-snug text-white md:text-base">“{cfapMission}”</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-[#c4a84b]/30 bg-card py-0 shadow-sm">
            <CardContent className="p-3">
              <div className="mb-1.5 flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#c4a84b]" />
                <h3 className="text-xs font-black uppercase tracking-[0.16em] text-foreground">Compromisso de Honra</h3>
              </div>
              <p
                className="text-xs leading-relaxed text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: honorCommitmentHtml }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {institutionalGuidelines.map((item) => (
            <Card key={item.title} className="h-full overflow-hidden rounded-xl border-border/50 bg-card py-0 shadow-xs hover:border-[#c4a84b]/50">
              <div className="h-1 bg-gradient-to-r from-[#1a3a2a] via-[#2d5a27] to-[#c4a84b]" />
              <CardContent className="flex h-full flex-col justify-between p-3">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1a3a2a]">
                      <item.icon className="h-4 w-4 text-[#c4a84b]" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{item.title}</h3>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function HymnCollection({ hymns }: { hymns: any[] | undefined }) {
  const featuredNumbers = [1, 8, 13];
  const featured = featuredNumbers
    .map((number) => hymns?.find((hymn: any) => hymn.number === number))
    .filter(Boolean) as any[];

  return (
    <section className="bg-muted/25 px-4 py-6 md:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1a3a2a]/65 dark:text-[#c4a84b]">Módulo Hinário</p>
          <h2 className="mt-1 font-serif text-2xl font-black text-foreground md:text-3xl">
            Acervo de Hinos e Canções
          </h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {hymns?.length ?? 0} composição(ões) disponíveis no catálogo atual.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => {
            const count = hymns?.filter((hymn: any) => (hymn.category ?? hymn.collection) === category.key).length ?? 0;
            return (
              <Link key={category.key} href={`/hinos?categoria=${category.key}`} className="h-full">
                <Card className="h-full cursor-pointer border-border/50 py-0 transition-all hover:-translate-y-0.5 hover:border-[#c4a84b]/60 hover:shadow-md rounded-2xl">
                  <CardContent className="flex h-full flex-col justify-between p-4.5 text-center">
                    <div>
                      <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#1a3a2a]/10 text-[#1a3a2a] dark:text-[#c4a84b]">
                        <category.icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-sm font-bold leading-tight text-foreground">{category.label}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{category.desc}</p>
                    </div>
                    <p className="mt-3 text-xs font-bold text-[#8a6900] dark:text-[#f0bd3a]">{count} item(ns)</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {featured.length > 0 && (
          <div className="mt-6 grid gap-3.5 md:grid-cols-3">
            {featured.map((hymn: any) => (
              <Link key={hymn.id} href={`/hino/${hymn.id}`} className="h-full">
                <Card className="h-full cursor-pointer overflow-hidden border-border/50 py-0 transition-all hover:-translate-y-0.5 hover:border-[#c4a84b]/60 hover:shadow-md rounded-2xl">
                  <div className="h-1.5 bg-gradient-to-r from-[#1a3a2a] via-[#2d5a27] to-[#c4a84b]" />
                  <CardContent className="flex h-full flex-col justify-between p-4.5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#8a6900] dark:text-[#c4a84b]">Destaque do acervo</p>
                      <h3 className="mt-1 text-base font-bold text-foreground">{hymn.title}</h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {hymn.description || "Abra a composição para consultar letra e mídia disponível."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/hinos">
            <Button className="bg-[#1a3a2a] text-white hover:bg-[#234b36] font-bold gap-2 px-6 shadow-sm">
              <Music className="h-4 w-4" />
              Abrir módulo de Hinos
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { data: hymns } = trpc.hymns.list.useQuery();
  const meQuery = trpc.auth.me.useQuery();

  if (meQuery.data && (meQuery.data as any).forcePasswordChange) {
    window.location.href = "/alterar-senha";
    return null;
  }

  return (
    <div className="mobile-safe-bottom min-h-screen bg-[#f5f2e8] text-foreground dark:bg-[#020a0f]">
      <Navbar />
      <HeroSection />
      <QuickAccess />
      <StudentNoticePanel />
      <BlogFeed />
      <ServiceBoardPreview />
      <StudentHighlights />
      <HymnCollection hymns={hymns as any[] | undefined} />
      <InstitutionalGuidelines />

      <section className="military-gradient py-7 md:py-10">
        <div className="container text-center">
          <Shield className="mx-auto h-10 w-10 text-[#c4a84b]" />
          <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl" style={{ fontFamily: "Merriweather, serif" }}>
            CFAP 2026
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-white/72 md:text-base">
            Comunicados, missões, orientações e aditamentos do Curso de Formação de Soldados.
          </p>
          <Link href="/cfap-2026">
            <Button className="mt-5 bg-[#c4a84b] font-bold text-[#1a1a1a] hover:bg-[#b39740]">
              Acessar CFAP 2026
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
