import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Music, Target, BookOpen, Shield, ChevronRight, Star } from "lucide-react";
import { trpc } from "@/lib/trpc";

const BRASAO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028422427/oYQqDtLooPR5vbQ65ChDb9/pmam-brasao_d5ee8977.png";

const categories = [
  { key: "nacional", label: "Hinos Nacionais", icon: Star, count: 5, desc: "Hinos da pátria e do estado" },
  { key: "militar", label: "Canções Militares", icon: Shield, count: 2, desc: "Canções do Exército Brasileiro" },
  { key: "pmam", label: "Canções da PMAM", icon: Music, count: 10, desc: "Canções da corporação" },
  { key: "arma", label: "Canções de Armas", icon: Target, count: 5, desc: "Infantaria, Cavalaria e mais" },
  { key: "oracao", label: "Orações", icon: BookOpen, count: 4, desc: "Orações dos guerreiros" },
];

export default function Home() {
  const { data: hymns } = trpc.hymns.list.useQuery();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="military-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#c4a84b] rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#2d5a27] rounded-full blur-[150px]" />
        </div>
        <div className="container relative py-20 md:py-28">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
                <Shield className="h-4 w-4 text-[#c4a84b]" />
                <span className="text-sm text-white/80">Polícia Militar do Amazonas</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight" style={{ fontFamily: 'Merriweather, serif' }}>
                Hinos e Canções{" "}
                <span className="gold-gradient-text">Militares</span>
              </h1>
              <p className="mt-6 text-lg text-white/70 max-w-xl leading-relaxed">
                Preservando a tradição, a honra e os valores da Polícia Militar do Amazonas
                através dos hinos e canções que formam a identidade da corporação desde 1837.
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
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-[#c4a84b]/20 rounded-full blur-2xl" />
                <img
                  src={BRASAO_URL}
                  alt="Brasão da PMAM"
                  className="relative w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="checkerboard-pattern w-full" />
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Merriweather, serif' }}>
              Missão do Hinário
            </h2>
            <div className="w-20 h-1 bg-[#c4a84b] mx-auto mt-4 rounded-full" />
            <p className="mt-6 text-muted-foreground leading-relaxed text-lg">
              O Hinário da Polícia Militar do Amazonas tem como missão preservar, divulgar e perpetuar
              os hinos, canções e orações que fazem parte da formação e identidade dos Alunos Soldados
              e Alunos Oficiais. Cada composição carrega valores de honra, disciplina, patriotismo e
              comprometimento com a defesa da sociedade.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-muted/30">
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

      {/* Featured Hymns */}
      <section className="py-16 bg-background">
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
              const hymn = hymns?.find(h => h.number === item.num);
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

      {/* CFAP Banner */}
      <section className="military-gradient py-16">
        <div className="container text-center">
          <Target className="h-12 w-12 text-[#c4a84b] mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'Merriweather, serif' }}>
            CFAP 2026
          </h2>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">
            Página exclusiva para alunos do Curso de Formação e Aperfeiçoamento de Praças.
            Acompanhe missões, comunicados e orientações para o ano letivo de 2026.
          </p>
          <Link href="/cfap-2026">
            <Button size="lg" className="mt-8 bg-[#c4a84b] hover:bg-[#b39740] text-[#1a1a1a] font-semibold gap-2">
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
