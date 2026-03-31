import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, AlertTriangle, AlertCircle, Bell, Calendar, Shield } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const priorityConfig: Record<string, { label: string; color: string; icon: any }> = {
  normal: { label: "Normal", color: "bg-[#1a3a2a] text-white", icon: Bell },
  urgente: { label: "Urgente", color: "bg-[#c4a84b] text-[#1a1a1a]", icon: AlertTriangle },
  critica: { label: "Crítica", color: "bg-red-600 text-white", icon: AlertCircle },
};

export default function Cfap2026() {
  const { data: missions, isLoading } = trpc.missions.list.useQuery();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Header */}
      <section className="military-gradient py-12">
        <div className="container text-center">
          <div className="inline-flex items-center gap-2 bg-[#c4a84b]/20 rounded-full px-4 py-1.5 mb-4">
            <Shield className="h-4 w-4 text-[#c4a84b]" />
            <span className="text-sm text-[#c4a84b] font-medium">Área Exclusiva</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Merriweather, serif' }}>
            CFAP 2026
          </h1>
          <p className="mt-3 text-white/60 max-w-2xl mx-auto">
            Centro de Formação e Aperfeiçoamento de Praças — Missões, comunicados e orientações
            para os alunos do curso de formação da Polícia Militar do Amazonas.
          </p>
        </div>
        <div className="checkerboard-pattern w-full mt-8" />
      </section>

      <section className="py-10 bg-background">
        <div className="container max-w-4xl">
          {/* Info Banner */}
          <Card className="mb-8 border-[#c4a84b]/30 bg-[#c4a84b]/5">
            <CardContent className="p-6 flex items-start gap-4">
              <Target className="h-8 w-8 text-[#c4a84b] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-foreground">Atenção, Alunos do CFAP!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Esta página contém as missões e comunicados oficiais para o Curso de Formação 2026.
                  Verifique regularmente para se manter atualizado sobre novas publicações e orientações.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Missions List */}
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2" style={{ fontFamily: 'Merriweather, serif' }}>
            <Bell className="h-5 w-5 text-[#c4a84b]" />
            Missões e Comunicados
          </h2>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : !missions || missions.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground">Nenhuma missão publicada</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Ainda não há missões ou comunicados publicados para o CFAP 2026.
                  Volte em breve para atualizações.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {missions.map((mission: any) => {
                const pCfg = priorityConfig[mission.priority] || priorityConfig.normal;
                const PriorityIcon = pCfg.icon;
                return (
                  <Card key={mission.id} className="border-border/50 hover:border-[#c4a84b]/30 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <PriorityIcon className="h-5 w-5 flex-shrink-0" style={{ color: mission.priority === "critica" ? "#dc2626" : mission.priority === "urgente" ? "#c4a84b" : "#1a3a2a" }} />
                          <h3 className="font-bold text-foreground text-lg">{mission.title}</h3>
                        </div>
                        <Badge className={`${pCfg.color} flex-shrink-0`}>
                          {pCfg.label}
                        </Badge>
                      </div>
                      <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                        {mission.content}
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {mission.createdAt ? format(new Date(mission.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }) : "Data não disponível"}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
