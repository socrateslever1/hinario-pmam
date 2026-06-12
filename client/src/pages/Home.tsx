import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlogFeed from "@/components/BlogFeed";
import { ServiceBoardPreview } from "@/components/ServiceBoardPreview";
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

const BRASAO_URL = "/IMG_7727.webp";

const categories = [
  { key: "nacional", label: "Hinos Nacionais", icon: Star, count: 5, desc: "Hinos da pátria e do estado" },
  { key: "militar", label: "Canções Militares", icon: Shield, count: 2, desc: "Canções do Exército Brasileiro" },
  { key: "pmam", label: "Canções da PMAM", icon: Music, count: 10, desc: "Canções da corporação" },
  { key: "arma", label: "Canções de Armas", icon: Target, count: 5, desc: "Infantaria, Cavalaria e mais" },
  { key: "oracao", label: "Orações", icon: BookOpen, count: 4, desc: "Orações dos guerreiros" },
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
  militar: "Canção Militar",
  pmam: "Canção PMAM",
  arma: "Canção de Arma",
  oracao: "Oração",
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
    if (Math.abs(delta) > 42) {
      goToSlide(activeSlide + (delta > 0 ? 1 : -1));
    }
    setTouchStartX(null);
  };

  return (
    <section className="px-4 py-6 md:py-8 text-[#f8f7f0]">
      <div className="mx-auto max-w-6xl">
        <div
          className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#092719]/95 p-6 md:p-10 shadow-[0_22px_60px_rgba(0,0,0,.35)] min-h-[340px] md:min-h-[400px] flex flex-col justify-between"
          onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
          onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
        >
          {/* Background Decorative Blurs */}
          <div className="absolute -right-10 -top-12 h-64 w-64 rounded-full bg-[#145c3a]/40 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 left-8 h-60 w-60 rounded-full bg-[#d6b64c]/10 blur-3xl pointer-events-none" />

          {/* Main Content Layout */}
          <div className="relative grid grid-cols-1 md:grid-cols-[1.25fr_0.75fr] items-center gap-6 z-10 flex-1">
            <div className="py-2 md:py-4 flex flex-col justify-center items-start">
              {/* Badge */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                <SlideIcon className="h-3.5 w-3.5 text-[#f0bd3a]" />
                {slide.badge}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.05] tracking-tight text-white max-w-xl font-serif" style={{ fontFamily: 'Merriweather, serif' }}>
                {slide.title} <span className="text-[#f0bd3a] block mt-1">{slide.highlight}</span>
              </h1>

              {/* Description */}
              <p className="mt-4 text-xs md:text-sm font-normal leading-relaxed text-white/70 max-w-md md:max-w-lg">
                {slide.text}
              </p>

              {/* Action Button */}
              <Link href={slide.href}>
                <Button className="mt-6 h-11 md:h-12 rounded-xl bg-[#f0bd3a] px-6 text-sm font-black text-[#062417] shadow-lg shadow-black/25 hover:bg-[#d6b64c] transition-all flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  {slide.action}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Shield Logo container */}
            <div className="absolute right-[-20px] md:right-0 top-1/2 -translate-y-1/2 md:relative md:top-auto md:translate-y-0 flex items-center justify-end pointer-events-none select-none">
              <img
                src={BRASAO_URL}
                alt="Brasão PMAM"
                className="w-48 h-48 md:w-[24rem] md:h-[24rem] object-contain opacity-[0.22] md:opacity-[0.25] drop-shadow-[0_24px_32px_rgba(0,0,0,.42)]"
              />
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="mt-4 flex justify-center gap-2 z-10">
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
        </div>
      </div>
    </section>
  );
}

function QuickAccess() {
  return (
    <section className="md:hidden bg-background px-4 py-5 text-foreground">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-black tracking-normal">Acesso Rápido</h2>
        <Link href="/hinos" className="text-xs font-bold uppercase tracking-[0.14em] text-[#1a3a2a]">
          Ver todos
        </Link>
      </div>
      <div className="-mx-4 overflow-x-auto px-4 pb-2">
        <div className="flex min-w-min gap-3">
          {quickAccessItems.map((item) => (
            <Link key={item.label} href={item.href}>
              <div className="bg-white border border-border/50 shadow-sm h-36 w-36 shrink-0 rounded-lg p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#1a3a2a]/10 text-[#1a3a2a] shadow-inner">
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="text-3xl font-black leading-none text-foreground">{item.value}</p>
                <p className="mt-2 text-sm font-black text-[#1a3a2a]">{item.label}</p>
                <p className="mt-1 text-xs leading-snug text-muted-foreground">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const institutionalCopy = {
  eyebrow: "Identidade PMAM",
  title: "Diretrizes Institucionais",
  description: "Princípios morais, éticos e o código de conduta que guiam as ações da Polícia Militar do Amazonas na sociedade.",
  organization: "Polícia Militar do Amazonas",
  oathTitle: "Compromisso de Honra",
};

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
    title: institutionalCopy.oathTitle,
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

function InstitutionalGuidelines() {
  const oath = institutionalGuidelines.find((item) => item.title === institutionalCopy.oathTitle);
  const guidelines = institutionalGuidelines.filter((item) => item.title !== institutionalCopy.oathTitle);

  return (
    <section className="bg-background py-10 md:py-16">
      <div className="container">
        <div className="mb-8 text-center md:mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 md:mb-6">
            <Star className="h-4 w-4 text-[#c4a84b]" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[#1a3a2a] md:text-sm">{institutionalCopy.eyebrow}</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground md:text-4xl" style={{ fontFamily: 'Merriweather, serif' }}>
            {institutionalCopy.title}
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[#c4a84b] md:mt-6 md:w-20" />
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:mt-6 md:text-lg">
            {institutionalCopy.description}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {guidelines.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="h-full overflow-hidden border-border/50 bg-white shadow-sm hover:border-[#c4a84b]/50">
                <div className="h-1.5 bg-gradient-to-r from-[#1a3a2a] via-[#2d5a27] to-[#c4a84b] md:h-2" />
                <CardContent className="p-4 md:p-6">
                  <div className="mb-3 flex items-center gap-3 md:mb-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a3a2a] text-white">
                      <Icon className="h-5 w-5 text-[#c4a84b]" />
                    </div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground md:text-sm">{item.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </CardContent>
              </Card>
            );
          })}

          {oath && (
            <Card className="overflow-hidden border-border/50 bg-white shadow-sm hover:border-[#c4a84b]/50 sm:col-span-2 lg:col-span-4">
              <div className="h-1.5 bg-gradient-to-r from-[#1a3a2a] via-[#2d5a27] to-[#c4a84b] md:h-2" />
              <CardContent className="p-4 md:p-8">
                <div className="mb-4 flex items-center gap-3 md:mb-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a3a2a] text-white">
                    <Shield className="h-5 w-5 text-[#c4a84b]" />
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#c4a84b] md:text-xs">{institutionalCopy.organization}</p>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground md:text-base">{institutionalCopy.oathTitle}</h3>
                  </div>
                </div>
                <p className="whitespace-pre-line rounded-lg border border-[#1a3a2a]/10 bg-[#f5f2e8] p-4 text-center text-sm font-semibold leading-[1.55] text-[#1a3a2a] md:p-6 md:text-base md:leading-[1.75]">
                  &quot;{oath.text}&quot;
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}

function LatestHymns({ hymns }: { hymns: any[] | undefined }) {
  const latest = hymns?.slice(0, 3) ?? [];

  return (
    <section className="md:hidden bg-[#f5f2e8] px-4 py-5 text-foreground">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-black tracking-normal">Últimos Hinos</h2>
        <Link href="/hinos" className="text-xs font-bold uppercase tracking-[0.14em] text-[#1a3a2a]">
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
            <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-white p-3 shadow-sm">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#1a3a2a] to-[#2d5a27] text-sm font-black text-[#c4a84b]">
                {String(hymn.number ?? "").padStart(2, "0")}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-black text-foreground">{hymn.title}</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {categoryLabels[hymn.category] ?? hymn.category ?? "Hino"}
                </p>
              </div>
              <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#c4a84b] text-white hover:bg-[#b39740]" aria-label="Reproduzir">
                <Play className="h-4 w-4 fill-current" />
              </button>
              <Star className="h-4 w-4 shrink-0 text-[#c4a84b]" />
              <MoreHorizontal className="h-5 w-5 shrink-0 text-muted-foreground" />
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
    <div className="mobile-safe-bottom min-h-screen bg-[#f5f2e8] text-foreground">
      <Navbar />
      <HeroSection />
      <div className="md:hidden">
        <BlogFeed />
      </div>
      <QuickAccess />

      <div className="hidden md:block">
        <BlogFeed />
      </div>
      <ServiceBoardPreview />
      <LatestHymns hymns={hymns as any[] | undefined} />

      {/* Institutional Guidelines Section */}
      <InstitutionalGuidelines />

      <section className="py-10 bg-muted/30 md:py-16">
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
                      {cat.count} composições
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 bg-background md:py-16">
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
              { num: 8, title: "Canção da PMAM", cat: "Canção da Corporação" },
              { num: 13, title: "Canção do CFAP", cat: "Formação de Praças" },
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

      <section className="military-gradient py-6 md:py-16">
        <div className="container">
          <div className="flex flex-col gap-4 text-left md:items-center md:text-center">
            <div className="flex items-center gap-3 md:flex-col md:gap-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#c4a84b] md:mx-auto md:mb-4 md:h-12 md:w-12 md:bg-transparent">
                <Target className="h-5 w-5 md:h-12 md:w-12" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white md:text-3xl" style={{ fontFamily: 'Merriweather, serif' }}>
                  CFAP 2026
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/70 md:mt-4">
                  Comunicados, missões e orientações do Curso de Formação e Aperfeiçoamento de Praças.
                </p>
              </div>
            </div>
            <Link href="/cfap-2026">
              <Button size="lg" className="h-10 w-full bg-[#c4a84b] text-sm font-semibold text-[#1a1a1a] hover:bg-[#b39740] md:mt-4 md:h-12 md:w-auto md:gap-2">
                Acessar CFAP 2026
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div>
        <Footer />
      </div>
    </div>
  );
}
