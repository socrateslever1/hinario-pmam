import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, BookOpen, Music, Target, Star, Award } from "lucide-react";

const BRASAO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028422427/oYQqDtLooPR5vbQ65ChDb9/pmam-brasao_d5ee8977.png";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Header */}
      <section className="military-gradient py-12">
        <div className="container text-center">
          <BookOpen className="h-10 w-10 text-[#c4a84b] mx-auto mb-3" />
          <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Merriweather, serif' }}>
            Sobre o Hinário
          </h1>
          <p className="mt-3 text-white/60 max-w-2xl mx-auto">
            Conheça a história e a importância dos hinos e canções da Polícia Militar do Amazonas
          </p>
        </div>
        <div className="checkerboard-pattern w-full mt-8" />
      </section>

      <section className="py-12 bg-background">
        <div className="container max-w-4xl">
          {/* Main Content */}
          <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <img src={BRASAO_URL} alt="Brasão PMAM" className="w-40 h-40 object-contain" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4" style={{ fontFamily: 'Merriweather, serif' }}>
                Hinário da PMAM — CFAP e APM
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                O Hinário da Polícia Militar do Amazonas é uma coletânea que reúne os hinos nacionais,
                canções militares, canções da corporação, canções de armas e orações que fazem parte
                da formação e do cotidiano dos Alunos Soldados e Alunos Oficiais.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Cada composição presente neste hinário carrega consigo valores fundamentais como
                honra, disciplina, patriotismo, coragem e comprometimento com a defesa da sociedade.
                A entoação destes hinos fortalece a identidade militar e o senso de pertencimento
                à corporação.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Este material foi desenvolvido para uso no Centro de Formação e Aperfeiçoamento
                de Praças (CFAP) e na Academia de Polícia Militar (APM) Neper Alencar, servindo
                como instrumento de formação e preservação das tradições militares.
              </p>
            </div>
          </div>

          {/* Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#c4a84b]/10 flex items-center justify-center">
                    <Star className="h-5 w-5 text-[#c4a84b]" />
                  </div>
                  <h3 className="font-bold text-foreground">Hinos Nacionais</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Os hinos nacionais representam a soberania do Brasil e do Estado do Amazonas.
                  Incluem o Hino Nacional Brasileiro, Hino à Bandeira Nacional, Hino da Independência,
                  Hino da Proclamação da República e Hino do Amazonas.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#2d5a27]/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-[#2d5a27]" />
                  </div>
                  <h3 className="font-bold text-foreground">Canções Militares</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  As canções militares remetem à bravura e ao espírito de camaradagem das Forças Armadas.
                  Incluem a Canção do Expedicionário e a Canção do Exército Brasileiro (Canção do Soldado).
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#1a3a2a]/10 flex items-center justify-center">
                    <Music className="h-5 w-5 text-[#1a3a2a]" />
                  </div>
                  <h3 className="font-bold text-foreground">Canções da PMAM</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  As canções da corporação expressam o orgulho e o comprometimento dos membros da PMAM.
                  Incluem a Canção da PMAM, do Policial Militar, da APM Neper Alencar, do CFAP,
                  do Soldado da PMAM, entre outras.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#8b4513]/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-[#8b4513]" />
                  </div>
                  <h3 className="font-bold text-foreground">Canções de Armas</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  As canções de armas homenageiam as diferentes especialidades militares: Infantaria,
                  Cavalaria, Paraquedistas, Dragões do Ar e Combatentes de Montanha. Cada uma celebra
                  a bravura específica de sua tropa.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Orações */}
          <Card className="border-border/50 mb-12">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#1a2744]/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-[#1a2744]" />
                </div>
                <h3 className="font-bold text-foreground">Orações dos Guerreiros</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                As orações representam momentos de reflexão espiritual e busca de força para o cumprimento
                da missão. Incluem a Oração do Aluno Soldado da PMAM (Oração do CFAP), Oração do Guerreiro
                da ROCAM, Oração do Guerreiro de Selva e Oração do Guerreiro de Caatinga. Cada oração
                conecta o policial militar à sua vocação de servir e proteger.
              </p>
            </CardContent>
          </Card>

          {/* Credits */}
          <Card className="border-[#c4a84b]/30 bg-[#c4a84b]/5">
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 text-[#c4a84b] mx-auto mb-3" />
              <h3 className="font-bold text-foreground mb-2">Créditos</h3>
              <p className="text-sm text-muted-foreground">
                Hinário da PMAM — Edição 2023
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Polícia Militar do Estado do Amazonas
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Centro de Formação e Aperfeiçoamento de Praças — CFAP
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Academia de Polícia Militar — APM Neper Alencar
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
