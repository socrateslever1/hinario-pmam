import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlogFeed from "@/components/BlogFeed";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Link } from "wouter";
import {
  Award,
  Bell,
  BookOpen,
  ChevronRight,
  Eye,
  FileText,
  HeartHandshake,
  Medal,
  MoreHorizontal,
  Music,
  Play,
  Search,
  Shield,
  Star,
  Target,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const BRASAO_URL = "/logo/pmam-logo.png";

const categories = [
  { key: "nacional", label: "Hinos Nacionais", icon: Star, count: 5, desc: "Hinos da patria e do estado" },
  { key: "militar", label: "Cancoes Militares", icon: Shield, count: 2, desc: "Cancoes do Exercito Brasileiro" },
  { key: "pmam", label: "Cancoes da PMAM", icon: Music, count: 10, desc: "Cancoes da corporacao" },
  { key: "arma", label: "Cancoes de Armas", icon: Target, count: 5, desc: "Infantaria, Cavalaria e mais" },
  { key: "oracao", label: "Oracoes", icon: BookOpen, count: 4, desc: "Oracoes dos guerreiros" },
];

const quickAccessItems = [
  { icon: Music, value: "24", label: "Hinos", desc: "Catálogo oficial", href: "/hinos" },
  { icon: Target, value: "01", label: "Charlie Mike", desc: "Ritmo de treino", href: "/charlie-mike" },
  { icon: FileText, value: "12", label: "Notas", desc: "Curso e ranking", href: "/notas-do-curso" },
  { icon: BookOpen, value: "08", label: "Estudos", desc: "Módulos CFAP", href: "/estudos" },
  { icon: Medal, value: "05", label: "Medalhas", desc: "Mérito e honra", href: "/sobre" },
  { icon: Star, value: "03", label: "Favoritos", desc: "Itens salvos", href: "/hinos" },
];

const categoryLabels: Record<string, string> = {
  nacional: "Hino Nacional",
  militar: "Cancao Militar",
  pmam: "Cancao PMAM",
  arma: "Cancao de Arma",
  oracao: "Oracao",
};

const heroSlides = [
  {
    badge: "Desde 1837",
    title: "Hinos e Canções",
    highlight: "Militares",
    text: "Preservando a tradição, a honra e os valores da Polícia Militar do Amazonas através dos hinos e canções que formam a identidade da corporação desde 1837.",
    href: "/hinos",
    action: "Explorar Hinos",
    icon: Shield,
  },
  {
    badge: "Formação CFAP",
    title: "Tradição que",
    highlight: "Forma",
    text: "Conteúdos, comunicados e orientações para fortalecer a disciplina, o pertencimento e a rotina dos alunos em formação.",
    href: "/cfap-2026",
    action: "Ver Comunicados",
    icon: Target,
  },
  {
    badge: "Estudo e Mérito",
    title: "Canções, Notas",
    highlight: "e Estudos",
    text: "Acesse hinos, Charlie Mike, biblioteca de estudos, notas do curso e materiais de consulta em uma experiência mobile unificada.",
    href: "/estudos",
    action: "Abrir Estudos",
    icon: BookOpen,
  },
];



function MobileHero() {
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
    if (Math.abs(delta) > 42) {
      goToSlide(activeSlide + (delta > 0 ? 1 : -1));
    }
    setTouchStartX(null);
  };

  return (
    <section className="md:hidden mobile-military-bg px-4 pb-5 pt-2 text-[#f8f7f0]">
      <div
        className="relative overflow-hidden rounded-xl border border-white/12 bg-[#0b3323]/72 p-5 shadow-[0_22px_60px_rgba(0,0,0,.35)]"
        onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
        onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
      >
        <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-[#145c3a]/60 blur-3xl" />
        <div className="absolute -bottom-20 left-8 h-40 w-40 rounded-full bg-[#d6b64c]/15 blur-3xl" />
        <div className="relative grid min-h-[290px] grid-cols-[1.05fr_.95fr] items-center gap-1">
          <div className="z-10 py-3">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
              <SlideIcon className="h-3.5 w-3.5 text-[#f0bd3a]" />
              {slide.badge}
            </div>
            <h1 className="text-[2.35rem] font-black leading-[0.98] tracking-normal text-white">
              {slide.title} <span className="gold-gradient-text block">{slide.highlight}</span>
            </h1>
            <p className="mt-4 max-w-[13rem] text-[13px] font-medium leading-relaxed text-white/72">
              {slide.text}
            </p>
            <Link href={slide.href}>
              <Button className="mt-5 h-11 rounded-lg bg-[#f0bd3a] px-5 text-sm font-black text-[#062417] shadow-lg shadow-black/25 hover:bg-[#d6b64c]">
                {slide.action}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="relative flex h-full items-center justify-end">
            <div className="absolute right-0 top-8 h-36 w-36 rounded-full bg-[#f0bd3a]/12 blur-2xl" />
            <img
              src={BRASAO_URL}
              alt="Brasão PMAM"
              className="relative -mr-4 h-44 w-44 object-contain drop-shadow-[0_24px_32px_rgba(0,0,0,.42)]"
            />
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {heroSlides.map((item, index) => (
          <button
            key={item.badge}
            type="button"
            aria-label={`Ir para destaque ${index + 1}`}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all ${activeSlide === index ? "w-6 bg-[#f0bd3a]" : "w-2 bg-white/30"}`}
          />
        ))}
      </div>
    </section>
  );
}

function QuickAccess() {
  return (
    <section className="md:hidden bg-[#062417] px-4 py-5 text-[#f8f7f0]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-black tracking-normal">Acesso Rápido</h2>
        <Link href="/hinos" className="text-xs font-bold uppercase tracking-[0.14em] text-[#f0bd3a]">
          Ver todos
        </Link>
      </div>
      <div className="-mx-4 overflow-x-auto px-4 pb-2">
        <div className="flex min-w-min gap-3">
          {quickAccessItems.map((item) => (
            <Link key={item.label} href={item.href}>
              <div className="glass-card h-36 w-36 shrink-0 rounded-lg p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#145c3a] text-[#f0bd3a] shadow-inner">
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="text-3xl font-black leading-none text-white">{item.value}</p>
                <p className="mt-2 text-sm font-black text-[#f0bd3a]">{item.label}</p>
                <p className="mt-1 text-xs leading-snug text-white/62">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const institutionalGuidelines = [
  {
    icon: Target,
    title: "Missão",
    text: "Preservar a Ordem Pública e o Meio Ambiente no Estado do Amazonas, mediante um Policiamento Ostensivo de Excelência.",
  },
  {
    icon: Eye,
    title: "Visão",
    text: "Ser referência nacional como Instituição de preservação da Ordem Pública e do Meio Ambiente.",
  },
  {
    icon: Award,
    title: "Princípios",
    text: "Hierarquia, Disciplina e Eficácia.",
  },
  {
    icon: HeartHandshake,
    title: "Valores",
    text: "Devotamento, Civismo, Coragem, Camaradagem, Honestidade, Justiça, Aprimoramento, Verdade e Espírito de preservação do meio ambiente.",
  },
  {
    icon: Shield,
    title: "Compromisso de Honra",
    text: `Ao ingressar!
na Polícia Militar do Amazonas!
Prometo!
regular a minha conduta!
pelos preceitos da moral!
Cumprir!
rigorosamente as ordens!
das autoridades!
a que estiver subordinado!
E dedicar-me!
inteiramente ao serviço policial militar!
à manutenção da ordem pública!
e à segurança da comunidade!
Mesmo!
com o risco da própria vida!`,
  },
];

function MobileInstitutionalGuidelines() {
  const oath = institutionalGuidelines.find((item) => item.title === "Compromisso de Honra");
  const guidelines = institutionalGuidelines.filter((item) => item.title !== "Compromisso de Honra");

  return (
    <section className="md:hidden bg-[#062417] px-4 py-5 text-[#f8f7f0]">
      <div className="mb-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/62">
          <Star className="h-3.5 w-3.5 text-[#f0bd3a]" />
          Identidade PMAM
        </div>
        <h2 className="mt-3 text-xl font-black tracking-normal">Valores da Corporação</h2>
      </div>

      {oath && (
        <article className="rounded-xl border border-[#f0bd3a]/25 bg-[#0b3323]/82 p-4 shadow-[0_18px_40px_rgba(0,0,0,.22)]">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0bd3a] text-[#062417]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/52">Polícia Militar do Amazonas</p>
              <h3 className="text-base font-black text-[#f0bd3a]">Compromisso de Honra</h3>
            </div>
          </div>
          <p className="whitespace-pre-line text-center text-[13px] font-semibold leading-[1.55] text-white/78">
            &quot;{oath.text}&quot;
          </p>
        </article>
      )}

      <div className="mt-3 divide-y divide-white/10 rounded-xl border border-white/10 bg-white/[0.045]">
        {guidelines.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="flex gap-3 p-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#145c3a] text-[#f0bd3a]">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.16em] text-[#f0bd3a]">{item.title}</h3>
                <p className="mt-1 text-[13px] font-medium leading-relaxed text-white/68">{item.text}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function LatestHymns({ hymns }: { hymns: any[] | undefined }) {
  const latest = hymns?.slice(0, 3) ?? [];

  return (
    <section className="md:hidden bg-[#062417] px-4 py-5 text-[#f8f7f0]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-black tracking-normal">Últimos Hinos</h2>
        <Link href="/hinos" className="text-xs font-bold uppercase tracking-[0.14em] text-[#f0bd3a]">
          Ver todos
        </Link>
      </div>
      <div className="space-y-3">
        {(latest.length > 0 ? latest : [
          { id: 1, number: 1, title: "Hino Nacional Brasileiro", category: "nacional" },
          { id: 8, number: 8, title: "Canção da PMAM", category: "pmam" },
          { id: 13, number: 13, title: "Canção do CFAP", category: "militar" },
        ]).map((hymn: any) => (
          <Link key={hymn.id} href={`/hino/${hymn.id}`}>
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0b3323]/78 p-3 shadow-lg shadow-black/18">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#145c3a] to-[#062417] text-sm font-black text-[#f0bd3a]">
                {String(hymn.number ?? "").padStart(2, "0")}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-black text-white">{hymn.title}</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/55">
                  {categoryLabels[hymn.category] ?? hymn.category ?? "Hino"}
                </p>
              </div>
              <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f0bd3a] text-[#062417]" aria-label="Reproduzir">
                <Play className="h-4 w-4 fill-current" />
              </button>
              <Star className="h-4 w-4 shrink-0 text-[#f0bd3a]" />
              <MoreHorizontal className="h-5 w-5 shrink-0 text-white/55" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const { data: hymns } = trpc.hymns.list.useQuery();

  return (
    <div className="mobile-safe-bottom min-h-screen flex flex-col bg-[#062417] md:bg-background">
      <Navbar />
      <MobileHero />
      <div className="md:hidden">
        <BlogFeed />
      </div>
      <QuickAccess />
      <MobileInstitutionalGuidelines />

      {/* Desktop Hero Section */}
      <section className="military-gradient relative hidden overflow-hidden md:block">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#c4a84b] rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#2d5a27] rounded-full blur-[150px]" />
        </div>
        <div className="container relative py-12 md:py-16">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-[#c4a84b]/20 rounded-full blur-2xl" />
              <img
                src={BRASAO_URL}
                alt="Brasao da PMAM"
                className="relative w-40 h-40 md:w-48 md:h-48 object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
                <Shield className="h-4 w-4 text-[#c4a84b]" />
                <span className="text-sm text-white/80">Policia Militar do Amazonas</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight" style={{ fontFamily: 'Merriweather, serif' }}>
                Hinos e Cancoes{" "}
                <span className="gold-gradient-text">Militares</span>
              </h1>
              <p className="mt-6 text-lg text-white/70 max-w-xl leading-relaxed">
                Preservando a tradicao, a honra e os valores da Policia Militar do Amazonas
                atraves dos hinos e cancoes que formam a identidade da corporacao desde 1837.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link href="/hinos">
                  <Button size="lg" className="bg-[#c4a84b] hover:bg-[#b39740] text-[#1a1a1a] font-semibold gap-2 w-full sm:w-auto">
                    <Music className="h-5 w-5" />
                    Explorar Hinos
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/cfap-2026">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2 w-full sm:w-auto bg-transparent">
                    <Target className="h-5 w-5" />
                    CFAP 2026
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="checkerboard-pattern w-full" />
      </section>

      <div className="hidden md:block">
        <BlogFeed />
      </div>
      <LatestHymns hymns={hymns as any[] | undefined} />

      {/* Institutional Guidelines Section */}
      <section className="hidden py-16 bg-background md:block">
        <div className="container">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-muted rounded-full px-4 py-1.5 mb-6">
              <Star className="h-4 w-4 text-[#c4a84b]" />
              <span className="text-sm font-semibold uppercase tracking-widest text-[#1a3a2a]">Identidade PMAM</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground" style={{ fontFamily: 'Merriweather, serif' }}>
              Diretrizes Institucionais
            </h2>
            <div className="w-20 h-1 bg-[#c4a84b] mx-auto mt-6 rounded-full" />
            <p className="mt-6 text-muted-foreground text-lg max-w-2xl mx-auto">
              Principios morais, eticos e o codigo de conduta que guiam as acoes da Policia Militar do Amazonas na sociedade.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-10">
            <Card className="overflow-hidden border-border/50 hover:border-[#c4a84b]/50 h-full shadow-sm bg-white">
              <div className="h-2 bg-gradient-to-r from-[#1a3a2a] via-[#2d5a27] to-[#c4a84b]" />
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#1a3a2a] flex items-center justify-center text-white">
                    <Target className="h-5 w-5 text-[#c4a84b]" />
                  </div>
                  <h3 className="font-semibold text-foreground uppercase tracking-wider text-sm">Missao</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  "Preservar a Ordem Publica e o Meio Ambiente no Estado do Amazonas, mediante um Policiamento Ostensivo de Excelencia."
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border/50 hover:border-[#c4a84b]/50 h-full shadow-sm bg-white">
              <div className="h-2 bg-gradient-to-r from-[#1a3a2a] via-[#2d5a27] to-[#c4a84b]" />
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#1a3a2a] flex items-center justify-center text-white">
                    <Eye className="h-5 w-5 text-[#c4a84b]" />
                  </div>
                  <h3 className="font-semibold text-foreground uppercase tracking-wider text-sm">Visao</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Ser referencia nacional como Instituicao de preservacao da Ordem Publica e do Meio Ambiente.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border/50 hover:border-[#c4a84b]/50 h-full shadow-sm bg-white">
              <div className="h-2 bg-gradient-to-r from-[#1a3a2a] via-[#2d5a27] to-[#c4a84b]" />
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#1a3a2a] flex items-center justify-center text-white">
                    <Award className="h-5 w-5 text-[#c4a84b]" />
                  </div>
                  <h3 className="font-semibold text-foreground uppercase tracking-wider text-sm">Principios</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Hierarquia, Disciplina e Eficacia.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border/50 hover:border-[#c4a84b]/50 h-full shadow-sm bg-white">
              <div className="h-2 bg-gradient-to-r from-[#1a3a2a] via-[#2d5a27] to-[#c4a84b]" />
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#1a3a2a] flex items-center justify-center text-white">
                    <HeartHandshake className="h-5 w-5 text-[#c4a84b]" />
                  </div>
                  <h3 className="font-semibold text-foreground uppercase tracking-wider text-sm">Valores</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Devotamento, Civismo, Coragem, Camaradagem, Honestidade, Justica, Aprimoramento, Verdade, Espirito de preservacao do meio ambiente.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border/50 hover:border-[#c4a84b]/50 h-full shadow-sm bg-white md:col-span-2">
              <div className="h-2 bg-gradient-to-r from-[#1a3a2a] via-[#2d5a27] to-[#c4a84b]" />
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#1a3a2a] flex items-center justify-center text-white">
                    <Shield className="h-5 w-5 text-[#c4a84b]" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold text-[#c4a84b] mb-1">Polícia Militar do Amazonas</p>
                    <h3 className="font-semibold text-foreground uppercase tracking-wider text-base">Compromisso de Honra</h3>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-8 md:gap-16 w-full text-left">
                  {/* Coluna 1 */}
                  <div className="flex flex-col text-sm sm:text-base font-medium italic text-muted-foreground space-y-6">
                    <div>
                      <p className="text-lg sm:text-xl font-bold not-italic text-[#1a3a2a] mb-1">"Ao ingressar!</p>
                      <p>na Polícia Militar do Amazonas!</p>
                    </div>
                    <div>
                      <p className="font-bold not-italic text-[#1a3a2a] mb-1">Prometo!</p>
                      <p>regular a minha conduta!</p>
                      <p>pelos preceitos da moral!</p>
                    </div>
                    <div>
                      <p className="font-bold not-italic text-[#1a3a2a] mb-1">Cumprir!</p>
                      <p>rigorosamente as ordens!</p>
                      <p>das autoridades!</p>
                      <p>a que estiver subordinado!</p>
                    </div>
                  </div>
                  {/* Coluna 2 */}
                  <div className="flex flex-col text-sm sm:text-base font-medium italic text-muted-foreground space-y-6">
                    <div>
                      <p className="font-bold not-italic text-[#1a3a2a] mb-1">E dedicar-me!</p>
                      <p>inteiramente ao serviço policial militar!</p>
                      <p>à manutenção da ordem pública!</p>
                      <p>e à segurança da comunidade!</p>
                    </div>
                    <div className="pt-2">
                      <p className="font-bold not-italic text-[#1a3a2a] text-lg mb-1">Mesmo!</p>
                      <p className="text-xl sm:text-2xl font-bold not-italic text-[#c4a84b]">com o risco da própria vida!"</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="hidden py-16 bg-muted/30 md:block">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Merriweather, serif' }}>
              Categorias
            </h2>
            <div className="w-20 h-1 bg-[#c4a84b] mx-auto mt-4 rounded-full" />
            <p className="mt-4 text-muted-foreground">
              {hymns?.length ?? 26} hinos e canções organizados em 5 categorias
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link key={cat.key} href={`/hinos?categoria=${cat.key}`}>
                <Card className="hymn-card-hover cursor-pointer border-border/50 hover:border-[#c4a84b]/50 h-full">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-[#1a3a2a]/10 flex items-center justify-center mx-auto mb-4">
                      <cat.icon className="h-7 w-7 text-[#1a3a2a]" />
                    </div>
                    <h3 className="font-semibold text-foreground text-sm">{cat.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{cat.desc}</p>
                    <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#c4a84b]">
                      {cat.count} composicoes
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="hidden py-16 bg-background md:block">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Merriweather, serif' }}>
              Hinos em Destaque
            </h2>
            <div className="w-20 h-1 bg-[#c4a84b] mx-auto mt-4 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: 1, title: "Hino Nacional Brasileiro", cat: "Hino Nacional" },
              { num: 8, title: "Cancao da PMAM", cat: "Cancao da Corporacao" },
              { num: 13, title: "Cancao do CFAP", cat: "Formacao de Pracas" },
            ].map((item) => {
              const hymn = hymns?.find((h: any) => h.number === item.num);
              return (
                <Link key={item.num} href={`/hino/${hymn?.id ?? item.num}`}>
                  <Card className="hymn-card-hover cursor-pointer overflow-hidden border-border/50 hover:border-[#c4a84b]/50 h-full">
                    <div className="h-2 bg-gradient-to-r from-[#1a3a2a] via-[#2d5a27] to-[#c4a84b]" />
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[#1a3a2a] flex items-center justify-center text-white font-bold text-sm">
                          {String(item.num).padStart(2, "0")}
                        </div>
                        <div>
                          <p className="text-xs text-[#c4a84b] font-medium uppercase tracking-wider">{item.cat}</p>
                          <h3 className="font-semibold text-foreground">{item.title}</h3>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {hymn?.description ?? "Clique para ver a letra completa e ouvir este hino."}
                      </p>
                      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-[#1a3a2a]">
                        Ver letra completa <ChevronRight className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
          <div className="text-center mt-10">
            <Link href="/hinos">
              <Button size="lg" className="bg-[#1a3a2a] hover:bg-[#1a3a2a]/90 text-white gap-2">
                <Music className="h-5 w-5" />
                Ver Todos os Hinos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="military-gradient hidden py-16 md:block">
        <div className="container text-center">
          <Target className="h-12 w-12 text-[#c4a84b] mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'Merriweather, serif' }}>
            CFAP 2026
          </h2>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">
            Pagina exclusiva para alunos do Curso de Formacao e Aperfeicoamento de Pracas.
            Acompanhe missoes, comunicados e orientacoes para o ano letivo de 2026.
          </p>
          <Link href="/cfap-2026">
            <Button size="lg" className="mt-8 bg-[#c4a84b] hover:bg-[#b39740] text-[#1a1a1a] font-semibold gap-2">
              Acessar CFAP 2026
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
