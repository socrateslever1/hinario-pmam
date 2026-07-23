import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Music, Award, LayoutGrid, FileText, Users } from "lucide-react";

const BRASAO_URL = "/logo/IMG_7728.PNG";

export default function About() {
  return (
    <div className="mobile-safe-bottom min-h-screen flex flex-col bg-[#f5f2e8] md:bg-background">
      <Navbar />

      <section className="bg-card border-b border-border/40 px-4 pb-7 pt-6 md:px-0 md:py-12">
        <div className="container text-center">
          <Shield className="mx-auto mb-3 h-10 w-10 text-[#c4a84b]" />
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a3a2a]" style={{ fontFamily: "Merriweather, serif" }}>
            Sobre o QG Digital
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Plataforma Militar para gestão, formação, comunicação, documentos, disciplina e rotina institucional.
          </p>
        </div>
        <div className="checkerboard-pattern w-full mt-8 hidden md:block" />
      </section>

      <section className="bg-transparent px-4 py-6 md:bg-background md:px-0 md:py-12">
        <div className="container max-w-6xl">
          <div className="flex flex-col gap-6 p-5 text-foreground md:mb-12 md:flex-row md:items-start md:gap-8 md:p-0">
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <img src={BRASAO_URL} alt="Brasão PMAM" className="w-40 h-40 object-contain" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1a3a2a] md:text-foreground mb-4" style={{ fontFamily: "Merriweather, serif" }}>
                QG Digital — Plataforma Militar
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                O QG Digital organiza setores, funções e níveis de acesso em um único ambiente. Cada usuário visualiza apenas os recursos correspondentes à sua função e ao seu escopo.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Alunos, comandantes e administradores encontram ferramentas de formação, acompanhamento acadêmico, comunicação, documentos, escalas, efetivo e rotina operacional.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                O Hinário permanece como módulo interno dedicado aos hinos, canções, orações e tradições militares da PMAM.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card className="border-border/50"><CardContent className="p-6"><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-lg bg-[#1a3a2a]/10 flex items-center justify-center"><LayoutGrid className="h-5 w-5 text-[#1a3a2a]" /></div><h3 className="font-bold text-foreground">Setores Digitais</h3></div><p className="text-sm text-muted-foreground leading-relaxed">Sala de aula, escalas, efetivo, documentos, comunicação, disciplina e demais módulos organizados conforme a estrutura institucional.</p></CardContent></Card>
            <Card className="border-border/50"><CardContent className="p-6"><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-lg bg-[#2d5a27]/10 flex items-center justify-center"><Users className="h-5 w-5 text-[#2d5a27]" /></div><h3 className="font-bold text-foreground">Acesso por Função</h3></div><p className="text-sm text-muted-foreground leading-relaxed">As permissões acompanham a função, a hierarquia e o escopo do usuário, evitando acesso indevido a outros setores, companhias ou pelotões.</p></CardContent></Card>
            <Card className="border-border/50"><CardContent className="p-6"><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-lg bg-[#c4a84b]/10 flex items-center justify-center"><FileText className="h-5 w-5 text-[#c4a84b]" /></div><h3 className="font-bold text-foreground">Gestão e Formação</h3></div><p className="text-sm text-muted-foreground leading-relaxed">Informações acadêmicas, administrativas e operacionais reunidas para reduzir dispersão, retrabalho e falhas de comunicação.</p></CardContent></Card>
            <Card className="border-border/50"><CardContent className="p-6"><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-lg bg-[#8b4513]/10 flex items-center justify-center"><Music className="h-5 w-5 text-[#8b4513]" /></div><h3 className="font-bold text-foreground">Módulo Hinário</h3></div><p className="text-sm text-muted-foreground leading-relaxed">O catálogo de hinos, canções de armas, canções da PMAM e orações continua disponível como parte da plataforma.</p></CardContent></Card>
          </div>

          <Card className="border-[#c4a84b]/30 bg-[#c4a84b]/5"><CardContent className="p-6 text-center"><Award className="h-8 w-8 text-[#c4a84b] mx-auto mb-3" /><h3 className="font-bold text-foreground mb-2">Identidade institucional</h3><p className="text-sm text-muted-foreground">QG Digital — Plataforma Militar</p><p className="text-sm text-muted-foreground mt-1">Polícia Militar do Estado do Amazonas</p><p className="text-sm text-muted-foreground mt-1">Centro de Formação e Aperfeiçoamento de Praças — CFAP</p></CardContent></Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}