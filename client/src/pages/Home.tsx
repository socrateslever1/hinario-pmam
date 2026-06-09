import { useState, useEffect } from "react";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Music, Radio, BookOpen, FileText, User, ChevronRight, ChevronLeft, Play, MoreVertical, Search, Bell } from "lucide-react";
import { trpc } from "@/lib/trpc";

const BRASAO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028422427/oYQqDtLooPR5vbQ65ChDb9/pmam-brasao_d5ee8977.png";

// Navbar Component
function Navbar() {
  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="container flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-3">
          <img src={BRASAO_URL} alt="PMAM" className="h-10 w-10" />
          <h1 className="text-lg font-bold text-[#1a3a2a]">HINÁRIO PMAM</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Search className="h-5 w-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#c4a84b] rounded-full" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Carousel Component
function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  
  const slides = [
    {
      title: "Hinos e Canções",
      subtitle: "Militares",
      desc: "Preservando a tradição, a honra e os valores da Polícia Militar do Amazonas através dos hinos e canções que formam a identidade da corporação desde 1837.",
      button: "Explorar Hinos",
      link: "/hinos"
    },
    {
      title: "Charlie Mike",
      subtitle: "Código Fonético",
      desc: "O alfabeto fonético militar utilizado para comunicações claras e precisas nas operações da Polícia Militar do Amazonas.",
      button: "Ver Charlie Mike",
      link: "/charlie-mike"
    },
    {
      title: "CFAP 2026",
      subtitle: "Formação",
      desc: "Página exclusiva para alunos do Curso de Formação e Aperfeiçoamento de Praças com missões e comunicados.",
      button: "Acessar CFAP",
      link: "/cfap-2026"
    }
  ];

  const next = () => setCurrent((current + 1) % slides.length);
  const prev = () => setCurrent((current - 1 + slides.length) % slides.length);

  return (
    <div className="military-gradient relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c4a84b] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#2d5a27] rounded-full blur-[150px]" />
      </div>

      <div className="container relative py-12 md:py-16">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Brasão */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-[#c4a84b]/20 rounded-full blur-2xl" />
              <img
                src={BRASAO_URL}
                alt="Brasão da PMAM"
                className="relative w-40 h-40 md:w-48 md:h-48 object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Texto */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight" style={{ fontFamily: 'Merriweather, serif' }}>
              {slides[current].title}{" "}
              <span className="gold-gradient-text">{slides[current].subtitle}</span>
            </h1>
            <p className="mt-6 text-lg text-white/70 max-w-xl leading-relaxed">
              {slides[current].desc}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link href={slides[current].link}>
                <Button size="lg" className="bg-[#c4a84b] hover:bg-[#b39740] text-[#1a1a1a] font-semibold gap-2 w-full sm:w-auto">
                  <Music className="h-5 w-5" />
                  {slides[current].button}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Carousel Controls */}
        <div className="flex justify-center gap-2 mt-12">
          <button
            onClick={prev}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === current ? "bg-[#c4a84b] w-8" : "bg-white/50"
              }`}
            />
          ))}
          <button
            onClick={next}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="checkerboard-pattern w-full" />
    </div>
  );
}

// Featured Section
function FeaturedSection() {
  const features = [
    { icon: Music, label: "Hinos", count: "24", desc: "Hinos oficiais da PMAM", link: "/hinos" },
    { icon: Radio, label: "Charlie Mike", count: "01", desc: "Código fonético militar", link: "/charlie-mike" },
    { icon: FileText, label: "Notas", count: "12", desc: "Documentos e normas", link: "/notas-do-curso" },
    { icon: BookOpen, label: "Estudos", count: "08", desc: "História e doutrina", link: "/estudos" },
  ];

  return (
    <section className="py-12 bg-background">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Merriweather, serif' }}>
            Em destaque
          </h2>
          <Link href="/hinos">
            <span className="text-[#c4a84b] font-semibold flex items-center gap-1 cursor-pointer hover:gap-2 transition-all">
              Ver todos <ChevronRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Link key={i} href={feature.link}>
                <Card className="cursor-pointer border-border/50 hover:border-[#c4a84b]/50 hover:shadow-md transition-all h-full">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-[#1a3a2a]/10 flex items-center justify-center mx-auto mb-3">
                      <Icon className="h-6 w-6 text-[#1a3a2a]" />
                    </div>
                    <p className="text-2xl font-bold text-[#c4a84b]">{feature.count}</p>
                    <h3 className="font-semibold text-foreground text-sm mt-1">{feature.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{feature.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Recent Hymns Section
function RecentHymnsSection() {
  const { data: hymns } = trpc.hymns.list.useQuery();
  const recentHymns = hymns?.slice(0, 5) ?? [];

  return (
    <section className="py-12 bg-muted/30">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Merriweather, serif' }}>
            Últimos hinos
          </h2>
          <Link href="/hinos">
            <span className="text-[#c4a84b] font-semibold flex items-center gap-1 cursor-pointer hover:gap-2 transition-all">
              Ver todos <ChevronRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
        <div className="space-y-3 overflow-y-auto max-h-96">
          {recentHymns.map((hymn: any) => (
            <Link key={hymn.id} href={`/hino/${hymn.id}`}>
              <Card className="cursor-pointer border-border/50 hover:border-[#c4a84b]/50 hover:shadow-md transition-all">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#1a3a2a] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {String(hymn.number).padStart(2, "0")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{hymn.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{hymn.description}</p>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0">
                    <Play className="h-4 w-4 text-[#1a3a2a]" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0">
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                  </button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <HeroCarousel />
      <FeaturedSection />
      <RecentHymnsSection />
      <Footer />
    </div>
  );
}
