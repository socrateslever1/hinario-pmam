import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { getStudentSession } from "@/lib/studentSession";
import {
  Bell,
  BookOpenCheck,
  BriefcaseBusiness,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutGrid,
  ListMusic,
  Music,
  Scale,
  Shield,
  Target,
  UserCog,
  Users,
  WalletCards,
} from "lucide-react";

const BRASAO_URL = "/logo/IMG_7728.PNG";

const COMMAND_ROLES = new Set([
  "master",
  "admin",
  "comandante_corpo",
  "subcomandante_corpo",
  "sub_comandante_corpo",
  "comandante_cfap",
  "subcomandante_cfap",
  "sub_comandante_cfap",
  "comandante_cia",
  "comandante_pel",
]);

const HIGH_COMMAND_ROLES = new Set([
  "master",
  "admin",
  "comandante_corpo",
  "subcomandante_corpo",
  "sub_comandante_corpo",
  "comandante_cfap",
  "subcomandante_cfap",
  "sub_comandante_cfap",
]);

type Audience = "public" | "student" | "command" | "highCommand";

type PortfolioItem = {
  title: string;
  description: string;
  icon: typeof Shield;
  audience: Audience[];
  status?: "planned" | "hidden";
};

const portfolio: PortfolioItem[] = [
  {
    title: "Sala de Aula Digital",
    description: "Mapa de sala, carteiras, efetivo, condições, funções e rotina do pelotão.",
    icon: LayoutGrid,
    audience: ["student", "command", "highCommand"],
  },
  {
    title: "Escalas e Serviço",
    description: "Escala semanal, quartos de hora, limpeza, serviço e organização operacional.",
    icon: ClipboardList,
    audience: ["student", "command", "highCommand"],
  },
  {
    title: "Notas do Curso",
    description: "Consulta individual de notas, disciplinas, desempenho e classificação acadêmica.",
    icon: GraduationCap,
    audience: ["student", "command", "highCommand"],
  },
  {
    title: "Documentos do Aluno",
    description: "Envio, consulta e acompanhamento de partes e documentos pessoais.",
    icon: FileText,
    audience: ["student"],
  },
  {
    title: "Documentos Recebidos",
    description: "Triagem, análise, aprovação e acompanhamento dos documentos enviados pelos alunos.",
    icon: FileText,
    audience: ["command", "highCommand"],
  },
  {
    title: "FO, LC e Disciplina",
    description: "Registro, provas, acompanhamento, homologação e controle disciplinar conforme a competência.",
    icon: Scale,
    audience: ["command", "highCommand"],
  },
  {
    title: "FATD e Procedimentos",
    description: "Fluxo disciplinar, instrução, decisão, histórico e delegações de competência.",
    icon: BriefcaseBusiness,
    audience: ["highCommand"],
    status: "planned",
  },
  {
    title: "Pecúlio",
    description: "Controle financeiro, lançamentos, fechamento, consulta e prestação de contas.",
    icon: WalletCards,
    audience: ["command", "highCommand"],
  },
  {
    title: "Efetivo",
    description: "Situação do efetivo por companhia, pelotão, condição e destino.",
    icon: Users,
    audience: ["command", "highCommand"],
  },
  {
    title: "Usuários e Acessos",
    description: "Contas, funções, escopos e futura delegação granular de competência.",
    icon: UserCog,
    audience: ["highCommand"],
  },
  {
    title: "Comunicados e Avisos",
    description: "Publicação e recebimento de notícias, orientações e avisos institucionais.",
    icon: Bell,
    audience: ["student", "command", "highCommand"],
  },
  {
    title: "Hinos e Canções",
    description: "Catálogo institucional de hinos, canções militares, orações e tradições.",
    icon: Music,
    audience: ["public", "student", "command", "highCommand"],
  },
  {
    title: "Charlie Mike",
    description: "Áudios e cadências para treinamento e formação militar.",
    icon: ListMusic,
    audience: ["public", "student", "command", "highCommand"],
  },
  {
    title: "CFAP 2026",
    description: "Missões, informações, comunicados e conteúdos ligados ao curso de formação.",
    icon: Shield,
    audience: ["student", "command", "highCommand"],
  },
  {
    title: "Centro de Estudos",
    description: "Módulos, questões e materiais acadêmicos. Temporariamente oculto no painel do aluno.",
    icon: BookOpenCheck,
    audience: ["highCommand"],
    status: "hidden",
  },
  {
    title: "Ordem Unida",
    description: "Simulação e consulta de movimentos. Temporariamente oculta no painel do aluno.",
    icon: Target,
    audience: ["highCommand"],
    status: "hidden",
  },
];

export default function About() {
  const student = getStudentSession();
  const { data: user } = trpc.auth.me.useQuery();

  const isCommand = Boolean(user?.role && COMMAND_ROLES.has(user.role));
  const isHighCommand = Boolean(user?.role && HIGH_COMMAND_ROLES.has(user.role));

  const audience: Audience = student
    ? "student"
    : isHighCommand
      ? "highCommand"
      : isCommand
        ? "command"
        : "public";

  const visibleItems = portfolio.filter((item) => item.audience.includes(audience));
  const profileLabel = student
    ? "Visão do aluno"
    : isHighCommand
      ? "Visão do Alto Comando"
      : isCommand
        ? "Visão de comando"
        : "Visão pública";

  return (
    <div className="mobile-safe-bottom min-h-screen bg-[#061019] text-white">
      <Navbar />

      <main>
        <section className="border-b border-white/10 px-4 py-10">
          <div className="container mx-auto max-w-6xl">
            <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <Badge className="mb-4 border-[#c4a84b]/30 bg-[#c4a84b]/10 text-[#e5c65d]">
                  {profileLabel}
                </Badge>
                <h1 className="font-serif text-4xl font-black leading-tight md:text-6xl">QG Digital</h1>
                <p className="mt-2 text-xl font-bold text-[#c4a84b]">Plataforma Militar</p>
                <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/70 md:text-lg">
                  Um utilitário institucional que reproduz setores reais de trabalho em ambiente digital. Cada usuário visualiza somente os serviços compatíveis com sua função, seu setor e sua competência.
                </p>
              </div>
              <img
                src={BRASAO_URL}
                alt="Brasão PMAM"
                className="mx-auto h-40 w-40 object-contain opacity-90 md:h-52 md:w-52"
              />
            </div>
          </div>
        </section>

        <section className="px-4 py-10">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-7">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#c4a84b]">
                Portfólio por competência
              </p>
              <h2 className="mt-2 text-3xl font-black">Seus setores e utilitários</h2>
              <p className="mt-2 text-white/60">
                A relação abaixo é filtrada conforme o perfil atualmente autenticado.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} className="border-white/10 bg-white/[0.045] text-white shadow-xl">
                    <CardContent className="p-5">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#c4a84b]/20 bg-[#c4a84b]/10 text-[#e5c65d]">
                          <Icon className="h-5 w-5" />
                        </span>
                        {item.status && (
                          <Badge variant="outline" className="border-white/15 text-[10px] text-white/60">
                            {item.status === "planned" ? "Planejado" : "Oculto temporariamente"}
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-black">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/60">{item.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#0a281c] px-4 py-10">
          <div className="container mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
            <div>
              <p className="text-3xl font-black text-[#e5c65d]">1 plataforma</p>
              <p className="mt-1 text-sm text-white/60">Vários setores digitais integrados.</p>
            </div>
            <div>
              <p className="text-3xl font-black text-[#e5c65d]">Acesso por função</p>
              <p className="mt-1 text-sm text-white/60">Cada perfil vê apenas o que precisa executar.</p>
            </div>
            <div>
              <p className="text-3xl font-black text-[#e5c65d]">Rotina real</p>
              <p className="mt-1 text-sm text-white/60">Processos militares transformados em utilitários práticos.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}