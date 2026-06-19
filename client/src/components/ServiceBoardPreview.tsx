import { CalendarDays, ChevronRight, Shield, Sparkles, Users } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function getMonday(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
}

function currentWeekday() {
  const day = new Date().getDay();
  return day >= 1 && day <= 5 ? day : 1;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function ServiceBoardPreview() {
  const weekStart = getMonday();
  const { data: board, isLoading } = trpc.serviceScale.published.useQuery({ weekStart });
  const items = board ?? [];

  if (!isLoading && items.length === 0) {
    return null;
  }

  return (
    <section className="bg-background px-4 py-4 md:px-0 md:py-7">
      <div className="container">
        <div className="mb-3 flex items-center justify-between gap-3 md:mb-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#1a3a2a]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#1a3a2a]">
              <CalendarDays className="h-3.5 w-3.5 text-[#c4a84b]" />
              Quadro de Serviço
            </div>
            <h2 className="text-xl font-black text-foreground md:text-3xl" style={{ fontFamily: "Merriweather, serif" }}>
              Escala da Semana
            </h2>
          </div>
          <Link href="/quadro-de-servico">
            <Button variant="ghost" className="gap-1 text-[#1a3a2a]">
              Ver quadro
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
          <div className="flex min-w-min gap-3 md:grid md:grid-cols-2 lg:grid-cols-3">
            {(isLoading ? Array.from({ length: 3 }) : items.slice(0, 6)).map((item: any, index) => {
              const todayCleaning = item?.week?.cleaning?.find((day: any) => day.weekday === currentWeekday());
              return (
                <Card key={item ? `${item.companhia}-${item.peloton}` : index} className="w-72 shrink-0 overflow-hidden border-border/50 bg-white shadow-sm md:w-auto">
                  <div className="h-1.5 bg-gradient-to-r from-[#1a3a2a] via-[#2d5a27] to-[#c4a84b]" />
                  <CardContent className="p-4">
                    {item ? (
                      <>
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-[#c4a84b]" />
                            <p className="font-black text-[#1a3a2a]">
                              {item.companhia}ª Cia / {item.peloton}º Pelotão
                            </p>
                          </div>
                          <span className="rounded-full bg-green-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                            Publicado
                          </span>
                        </div>
                        <div className="grid gap-2 text-sm">
                          {item.week?.dutyDate && (
                            <p><span className="font-bold text-muted-foreground">Serviço de Dia:</span> <span className="font-semibold text-green-700 dark:text-green-400">{formatDate(item.week.dutyDate)}</span></p>
                          )}
                          <p><span className="font-bold text-muted-foreground">Xerife:</span> {item.week?.xerifeName || "Não definido"}</p>
                          <p><span className="font-bold text-muted-foreground">Sub-xerife:</span> {item.week?.subXerifeName || "Não definido"}</p>
                          <p><span className="font-bold text-muted-foreground">Homem-Hora:</span> {item.roles?.homemHoraName || "Não definido"}</p>
                          <p><span className="font-bold text-muted-foreground">Aluno de Ligação:</span> {item.roles?.alunoLigacaoName || "Não definido"}</p>
                        </div>
                        <div className="mt-3 rounded-lg bg-[#f5f2e8] p-3">
                          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1a3a2a]">
                            <Users className="h-3.5 w-3.5 text-[#c4a84b]" />
                            Faxina de hoje
                          </div>
                          <p className="text-sm font-semibold text-foreground">
                            {todayCleaning?.studentNames?.length ? todayCleaning.studentNames.join(", ") : "Sem escala para hoje"}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-48 items-center justify-center text-muted-foreground">
                        <Sparkles className="h-5 w-5 animate-pulse" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
