import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, BookOpen, CalendarDays, History, Search, Shield, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CommanderPortrait } from "@/components/CommanderPortrait";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CFAP_HISTORY_SOURCE, CFAP_TIMELINE } from "@/data/cfapHistory";
import { mergeCfapCommanders } from "@/data/cfapHistory";
import { trpc } from "@/lib/trpc";

export default function CfapHistory() {
  const [query, setQuery] = useState("");
  const historyQuery = trpc.cfapHistory.list.useQuery(undefined, { retry: false });
  const commanders = useMemo(() => mergeCfapCommanders(historyQuery.data ?? []), [historyQuery.data]);

  const filteredCommanders = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    if (!normalized) return commanders;

    return commanders.filter((commander) =>
      [commander.name, commander.rank, ...commander.periods]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(normalized),
    );
  }, [commanders, query]);

  return (
    <div className="mobile-safe-bottom min-h-screen bg-[#061019] text-white">
      <Navbar />

      <main>
        <section className="relative overflow-hidden border-b border-white/10 px-4 py-10 md:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(196,168,75,.18),transparent_38%),linear-gradient(135deg,#061019_0%,#0b3323_55%,#061019_100%)]" />
          <div className="container relative mx-auto max-w-6xl">
            <div className="max-w-4xl">
              <Badge className="mb-4 border-[#c4a84b]/30 bg-[#c4a84b]/10 text-[#e5c65d]">
                Memória Institucional
              </Badge>
              <h1 className="font-serif text-4xl font-black leading-tight md:text-6xl">
                História do CFAP
              </h1>
              <p className="mt-3 text-xl font-black text-[#d6bd66] md:text-2xl">
                Galeria Digital dos Comandantes
              </p>
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/72 md:text-lg">
                Uma linha do tempo da formação das praças da Polícia Militar do Amazonas, desde as raízes históricas da instrução militar até o CFAP contemporâneo, reunida com a sucessão documental de seus comandantes.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
                <History className="h-5 w-5 text-[#d6bd66]" />
                <p className="mt-3 text-2xl font-black">1917–2024</p>
                <p className="text-xs text-white/55">linha histórica documentada</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
                <Users className="h-5 w-5 text-[#d6bd66]" />
                <p className="mt-3 text-2xl font-black">{commanders.length}</p>
                <p className="text-xs text-white/55">comandantes únicos catalogados</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
                <BookOpen className="h-5 w-5 text-[#d6bd66]" />
                <p className="mt-3 text-2xl font-black">Fonte documental</p>
                <p className="text-xs text-white/55">artigo histórico e galeria fotográfica</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-10 md:py-14">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-7">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d6bd66]">Cronologia</p>
              <h2 className="mt-2 text-3xl font-black md:text-4xl">Marcos do CFAP</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/58 md:text-base">
                A síntese abaixo preserva a sequência apresentada no estudo histórico, destacando criação, sedes, reorganizações do ensino e reativação da unidade.
              </p>
            </div>

            <div className="relative ml-3 border-l border-[#c4a84b]/30 pl-7 md:ml-5 md:pl-10">
              {CFAP_TIMELINE.map((item) => (
                <article key={`${item.year}-${item.title}`} className="relative pb-8 last:pb-0">
                  <span className="absolute -left-[2.15rem] top-1.5 h-3 w-3 rounded-full border-2 border-[#d6bd66] bg-[#061019] md:-left-[2.83rem]" />
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-[#c4a84b]/35 bg-[#c4a84b]/5 text-[#e5c65d]">
                      {item.year}
                    </Badge>
                    <h3 className="text-lg font-black">{item.title}</h3>
                  </div>
                  <p className="mt-2 max-w-4xl text-sm leading-relaxed text-white/62">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#081722] px-4 py-10 md:py-14">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d6bd66]">Galeria dos Comandantes</p>
                <h2 className="mt-2 text-3xl font-black md:text-4xl">Quem conduziu esta Casa de Ensino</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/58 md:text-base">
                  Toque ou clique em qualquer retrato para abrir o registro individual da gestão.
                </p>
              </div>
              <div className="relative w-full md:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar comandante ou período"
                  className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/35"
                />
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {filteredCommanders.map((commander) => (
                <Link
                  key={commander.slug}
                  href={`/historia-cfap/comandantes/${commander.slug}`}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] no-underline shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#c4a84b]/50 hover:shadow-[#c4a84b]/10"
                >
                  <div className="relative overflow-hidden bg-white">
                    <CommanderPortrait
                      portraitIndex={commander.portraitIndex}
                      portraitUrl={commander.portraitUrl}
                      name={commander.name}
                      className="transition-transform duration-500 group-hover:scale-[1.035]"
                    />
                    {commander.inMemoriam && (
                      <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white">
                        In memoriam
                      </span>
                    )}
                  </div>
                  <div className="p-3.5 md:p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#d6bd66]">{commander.rank}</p>
                    <h3 className="mt-1 line-clamp-2 text-sm font-black leading-tight text-white md:text-base">{commander.name}</h3>
                    <div className="mt-2 space-y-0.5 text-[10px] leading-snug text-white/50 md:text-[11px]">
                      {commander.periods.map((period) => <p key={period}>{period}</p>)}
                    </div>
                    <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#d6bd66]">
                      Ver histórico <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {filteredCommanders.length === 0 && (
              <div className="mt-8 rounded-2xl border border-dashed border-white/15 px-4 py-10 text-center text-sm text-white/50">
                Nenhum comandante encontrado para essa busca.
              </div>
            )}

            <div className="mt-7 rounded-2xl border border-[#c4a84b]/20 bg-[#c4a84b]/5 p-4 text-xs leading-relaxed text-white/55">
              <strong className="text-[#e5c65d]">Nota de preservação:</strong> a relação publicada apresenta alguns períodos sobrepostos e registros de mais de uma passagem pelo comando. A Galeria Digital preserva esses dados documentais e reúne numa única ficha as gestões repetidas da mesma pessoa, sem criar datas ou correções não sustentadas pelas fontes.
            </div>
          </div>
        </section>

        <section className="px-4 py-10 md:py-14">
          <div className="container mx-auto max-w-6xl">
            <Card className="border-[#c4a84b]/25 bg-[#0a281c] text-white">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#c4a84b]/25 bg-[#c4a84b]/10 text-[#d6bd66] sm:flex">
                    <CalendarDays className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d6bd66]">Fonte principal</p>
                    <h2 className="mt-2 text-xl font-black">{CFAP_HISTORY_SOURCE.title}</h2>
                    <p className="mt-2 text-sm text-white/60">{CFAP_HISTORY_SOURCE.publication}</p>
                    <p className="mt-3 text-xs leading-relaxed text-white/48">
                      Autores: {CFAP_HISTORY_SOURCE.authors.join("; ")}.
                    </p>
                    <p className="mt-4 text-xs leading-relaxed text-white/48">
                      Os retratos e períodos exibidos na galeria foram organizados a partir do arquivo fotográfico de comandantes fornecido para esta digitalização, confrontado com a relação publicada no artigo histórico.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
