import { CalendarDays, Shield, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

function getMonday(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

const dayLabels: Record<number, string> = {
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
};

export default function ServiceBoard() {
  const weekStart = getMonday();
  const { data: board, isLoading } = trpc.serviceScale.published.useQuery({ weekStart });

  return (
    <div className="mobile-safe-bottom min-h-screen bg-[#f5f2e8] text-foreground">
      <Navbar />
      <main className="container px-4 py-6 md:py-10">
        <section className="mb-6 rounded-2xl border border-white/10 bg-[#092719] p-5 text-[#f8f7f0] shadow-[0_18px_50px_rgba(0,0,0,.25)] md:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
            <CalendarDays className="h-3.5 w-3.5 text-[#f0bd3a]" />
            Quadro de Serviço
          </div>
          <h1 className="text-2xl font-black md:text-4xl" style={{ fontFamily: "Merriweather, serif" }}>
            Escalas Publicadas
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
            Consulta global das funções do Pelotão, xerife da semana, sub-xerife e faxina de segunda a sexta.
          </p>
        </section>

        {isLoading ? (
          <Card className="border-border/50 bg-white">
            <CardContent className="p-6 text-sm text-muted-foreground">Carregando quadro publicado...</CardContent>
          </Card>
        ) : !board?.length ? (
          <Card className="border-border/50 bg-white">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Nenhum quadro de serviço publicado para esta semana.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {board.map((item: any) => (
              <Card key={`${item.companhia}-${item.peloton}-${item.week?.weekStart}`} className="overflow-hidden border-border/50 bg-white shadow-sm">
                <div className="h-1.5 bg-gradient-to-r from-[#1a3a2a] via-[#2d5a27] to-[#c4a84b]" />
                <CardContent className="p-5">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-[#c4a84b]" />
                      <h2 className="text-lg font-black text-[#1a3a2a]">
                        {item.companhia}ª Companhia / {item.peloton}º Pelotão
                      </h2>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">
                      Semana de {new Date(`${item.week?.weekStart}T00:00:00`).toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {item.week?.dutyDate && (
                      <div className="col-span-full rounded-lg border border-green-200 bg-green-50/50 p-3 dark:border-green-900/50 dark:bg-green-950/20">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-green-700 dark:text-green-400">Serviço de Dia</p>
                        <p className="mt-1 text-sm font-black text-green-800 dark:text-green-300">
                          {formatDate(item.week.dutyDate)}
                        </p>
                      </div>
                    )}
                    <Info label="Xerife" value={item.week?.xerifeName} />
                    <Info label="Sub-xerife" value={item.week?.subXerifeName} />
                    <Info label="Homem-Hora" value={item.roles?.homemHoraName} />
                    <Info label="Aluno de Ligação" value={item.roles?.alunoLigacaoName} />
                  </div>

                  {item.week?.aditamento && (
                    <div className="mt-4 rounded-lg bg-[#f5f2e8] p-3 text-sm">
                      <span className="font-bold text-[#1a3a2a]">Aditamento: </span>
                      {item.week.aditamento}
                    </div>
                  )}

                  <div className="mt-5">
                    <div className="mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#c4a84b]" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-[#1a3a2a]">Faxina</h3>
                    </div>
                    <div className="space-y-2">
                      {(item.week?.cleaning ?? []).map((day: any) => (
                        <div key={day.weekday} className="flex flex-col gap-1 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-bold text-foreground">{dayLabels[day.weekday] || "Dia"}</p>
                            <p className="text-xs text-muted-foreground">
                              {day.serviceDate ? new Date(`${day.serviceDate}T00:00:00`).toLocaleDateString("pt-BR") : ""}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-[#1a3a2a]">
                            {day.studentNames?.length ? day.studentNames.join(", ") : "Sem escala"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border border-border/60 bg-[#f5f2e8] p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-black text-[#1a3a2a]">{value || "Não definido"}</p>
    </div>
  );
}
