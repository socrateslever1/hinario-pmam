import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import {
  Award,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutGrid,
  Medal,
  Music,
  Shield,
  Target,
  Users,
} from "lucide-react";

const BRASAO_URL = "/logo/IMG_7728.PNG";

const capabilityCards = [
  {
    icon: LayoutGrid,
    title: "Rotina e Sala",
    text: "Mapa de sala, funções, efetivo, pecúlio, escalas, quadro de serviço e histórico do pelotão.",
  },
  {
    icon: FileText,
    title: "Documentos",
    text: "Partes, requerimentos, anexos, documentos oficiais e fluxos administrativos em um único ambiente.",
  },
  {
    icon: ClipboardList,
    title: "Gestão Administrativa",
    text: "Pendências, fatos observados, licenças, baixados, rotina diária e acompanhamento por competência.",
  },
  {
    icon: GraduationCap,
    title: "Formação",
    text: "Notas, disciplinas, ranking, comunicados, materiais de estudo e recursos de acompanhamento acadêmico.",
  },
  {
    icon: Target,
    title: "Ordem Unida",
    text: "Conteúdo público de estudo com configurações e sequências pessoais preservadas por usuário.",
  },
  {
    icon: Medal,
    title: "Memória Institucional",
    text: "História do CFAP, galeria de comandantes e acervo voltado à preservação da memória da formação de praças.",
  },
  {
    icon: Music,
    title: "Módulo Hinário",
    text: "Hinos, canções, Charlie Mike e tradições militares integrados como um dos módulos do QG Digital.",
  },
  {
    icon: Users,
    title: "Acesso por Função",
    text: "Experiência adaptada ao aluno, comando e administração conforme papel, companhia, pelotão e escopo de atuação.",
  },
];

const roleGroups = [
  {
    title: "Aluno",
    icon: GraduationCap,
    description: "Acesso rápido ao que impacta diretamente a rotina individual e o curso.",
    items: ["Minha Sala", "Notas e ranking", "Documentos", "Perfil", "Comunicados", "Hinos e Ordem Unida"],
  },
  {
    title: "Comando de Pelotão e Companhia",
    icon: Shield,
    description: "Ferramentas para acompanhar efetivo, rotina, ocorrências e demandas administrativas.",
    items: ["Sala Administrativa", "Efetivo", "FO e LC", "Documentos recebidos", "Escalas", "Pecúlio e histórico"],
  },
  {
    title: "Alto Comando e Administração",
    icon: Award,
    description: "Visão ampliada para gestão, homologação, acompanhamento e organização institucional.",
    items: ["Demandas administrativas", "Indicadores", "Acessos e usuários", "Documentos oficiais", "Conteúdo global", "Memória institucional"],
  },
];

export default function About() {
  return (
    <div className="mobile-safe-bottom flex min-h-screen flex-col bg-[#f5f2e8] text-foreground dark:bg-[#020a0f] dark:text-[#f8f7f0] md:bg-background dark:md:bg-[#020a0f]">
      <Navbar />

      <section className="military-page-hero border-b px-4 py-6 md:px-0 md:py-10">
        <div className="container text-center">
          <Shield className="mx-auto mb-3 h-9 w-9 text-[#c4a84b] md:h-12 md:w-12" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1a3a2a]/60 dark:text-[#c4a84b]">Plataforma Militar</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-[#1a3a2a] md:text-5xl" style={{ fontFamily: "Merriweather, serif" }}>
            QG Digital
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[15px] leading-relaxed text-muted-foreground md:text-lg">
            Formação, rotina, gestão, comunicação, documentos e memória institucional organizados em um único ambiente.
          </p>
        </div>
        <div className="checkerboard-pattern mt-7 hidden w-full md:block" />
      </section>

      <main className="flex-1 px-4 py-6 md:px-0 md:py-12">
        <div className="container max-w-6xl">
          <section className="grid items-center gap-6 rounded-3xl border border-border/50 bg-card p-5 shadow-sm md:grid-cols-[220px_minmax(0,1fr)] md:p-8">
            <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full bg-[#1a3a2a]/5 md:h-48 md:w-48">
              <img src={BRASAO_URL} alt="Brasão PMAM" className="h-36 w-36 object-contain md:h-40 md:w-40" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a6900]">Identidade do produto</p>
              <h2 className="mt-1 text-2xl font-bold text-[#1a3a2a] md:text-3xl" style={{ fontFamily: "Merriweather, serif" }}>
                QG Digital — Plataforma Militar
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground md:text-base">
                O QG Digital organiza recursos operacionais, acadêmicos e administrativos conforme o papel do usuário. A plataforma não se resume ao Hinário: ele é um módulo dentro de um ambiente maior de formação e gestão.
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground md:text-base">
                A navegação e as permissões acompanham a função, a companhia, o pelotão e o escopo de cada perfil para reduzir dispersão, retrabalho e acesso indevido.
              </p>
            </div>
          </section>

          <section className="mt-8 md:mt-12">
            <div className="mb-5 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1a3a2a]/60 dark:text-[#c4a84b]">Capacidades</p>
              <h2 className="mt-1 text-2xl font-bold text-foreground md:text-4xl" style={{ fontFamily: "Merriweather, serif" }}>
                Setores digitais integrados
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {capabilityCards.map((item) => (
                <Card key={item.title} className="h-full border-border/50 bg-card py-0 shadow-sm transition-colors hover:border-[#c4a84b]/45">
                  <CardContent className="p-5">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#1a3a2a]/10">
                      <item.icon className="h-5 w-5 text-[#1a3a2a] dark:text-[#c4a84b]" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="mt-8 md:mt-12">
            <div className="mb-5 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1a3a2a]/60 dark:text-[#c4a84b]">Experiência por função</p>
              <h2 className="mt-1 text-2xl font-bold text-foreground md:text-4xl" style={{ fontFamily: "Merriweather, serif" }}>
                Cada usuário vê o que precisa
              </h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {roleGroups.map((group) => (
                <Card key={group.title} className="overflow-hidden border-border/50 bg-card py-0 shadow-sm">
                  <div className="h-1.5 bg-gradient-to-r from-[#1a3a2a] via-[#2d5a27] to-[#c4a84b]" />
                  <CardContent className="p-5 md:p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1a3a2a]">
                        <group.icon className="h-5 w-5 text-[#c4a84b]" />
                      </div>
                      <h3 className="text-lg font-bold text-[#1a3a2a] dark:text-[#c4a84b]">{group.title}</h3>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{group.description}</p>
                    <div className="mt-4 grid gap-2">
                      {group.items.map((item) => (
                        <div key={item} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm font-medium text-foreground">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#c4a84b]" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Card className="mt-8 border-[#c4a84b]/30 bg-[#c4a84b]/5 md:mt-12">
            <CardContent className="p-6 text-center md:p-8">
              <Award className="mx-auto mb-3 h-9 w-9 text-[#c4a84b]" />
              <h3 className="text-lg font-bold text-foreground">Identidade institucional</h3>
              <p className="mt-2 text-sm text-muted-foreground">QG Digital — Plataforma Militar</p>
              <p className="mt-1 text-sm text-muted-foreground">Polícia Militar do Estado do Amazonas</p>
              <p className="mt-1 text-sm text-muted-foreground">Centro de Formação e Aperfeiçoamento de Praças — CFAP</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
