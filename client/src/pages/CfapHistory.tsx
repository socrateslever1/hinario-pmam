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
    <div className="mobile-safe-bottom min-h-screen bg-background text-foreground dark:bg-[#061019] dark:text-white">
      <Navbar />

      <main>
        <section className="relative overflow-hidden border-b border-[#c4a84b]/30 px-4 py-10 text-white md:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(196,168,75,.2),transparent_38%),linear-gradient(135deg,#10281d_0%,#1a3a2a_55%,#244b36_100%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(196,168,75,.18),transparent_38%),linear-gradient(135deg,#061019_0%,#0b3323_55%,#061019_100%)]" />
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
                <p className="text-xs text-white/55">acervo documental e galeria fotográfica</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background px-4 py-10 dark:bg-[#061019] md:py-14">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-7">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#755b08] dark:text-[#d6bd66]">Cronologia</p>
              <h2 className="mt-2 text-3xl font-black md:text-4xl">Marcos do CFAP</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground dark:text-white/58 md:text-base">
                A síntese abaixo preserva a sequência apresentada no estudo histórico, destacando criação, sedes, reorganizações do ensino e reativação da unidade.
              </p>
            </div>

            <div className="relative ml-3 border-l border-[#c4a84b]/30 pl-7 md:ml-5 md:pl-10">
              {CFAP_TIMELINE.map((item) => (
                <article key={`${item.year}-${item.title}`} className="relative pb-8 last:pb-0">
                  <span className="absolute -left-[2.15rem] top-1.5 h-3 w-3 rounded-full border-2 border-[#a98922] bg-background dark:border-[#d6bd66] dark:bg-[#061019] md:-left-[2.83rem]" />
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-[#9a7a19]/35 bg-[#c4a84b]/10 text-[#755b08] dark:border-[#c4a84b]/35 dark:bg-[#c4a84b]/5 dark:text-[#e5c65d]">
                      {item.year}
                    </Badge>
                    <h3 className="text-lg font-black">{item.title}</h3>
                  </div>
                  <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground dark:text-white/62">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-[#1a3a2a]/15 bg-[#dfe5da] px-4 py-10 dark:border-white/10 dark:bg-[#081722] md:py-14">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#755b08] dark:text-[#d6bd66]">Galeria dos Comandantes</p>
                <h2 className="mt-2 text-3xl font-black md:text-4xl">Quem conduziu esta Casa de Ensino</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground dark:text-white/58 md:text-base">
                  Toque ou clique em qualquer retrato para abrir o registro individual da gestão.
                </p>
              </div>
              <div className="relative w-full md:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#526259] dark:text-white/40" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar comandante ou período"
                  className="border-[#1a3a2a]/20 bg-[#fbf8ef] pl-9 text-[#17251d] placeholder:text-[#66736b] dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35"
                />
              </div>
            </div>

            <div className="relative mt-8 rounded-[1.75rem] border border-[#c4a84b]/35 bg-gradient-to-b from-[#10281d] via-[#081a13] to-[#06110d] p-2 shadow-[0_30px_90px_rgba(0,0,0,.38)] sm:p-4 lg:p-6">
              <div className="pointer-events-none absolute inset-1 rounded-[1.5rem] border border-white/[.045]" />
              <div className="relative mb-4 flex items-center justify-center gap-3 border-b border-[#c4a84b]/20 pb-4">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c4a84b]/40" />
                <img src="/documents/images/brasao_cfap.png" alt="Emblema do CFAP" className="h-10 w-10 object-contain sm:h-14 sm:w-14" />
                <div className="text-center"><p className="text-[9px] font-black uppercase tracking-[.22em] text-[#d6bd66] sm:text-[11px]">Quadro de Honra</p><p className="mt-0.5 font-serif text-xs font-black text-white sm:text-base">Comandantes do CFAP</p></div>
                <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c4a84b]/40" />
              </div>
              <div className="relative grid grid-cols-3 gap-1.5 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filteredCommanders.map((commander) => (
                <Link
                  key={commander.slug}
                  href={`/historia-cfap/comandantes/${commander.slug}`}
                  className="group overflow-hidden rounded-lg border border-[#c4a84b]/20 bg-[#0a1712] no-underline shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#d9bd5a]/65 hover:shadow-[#c4a84b]/15 sm:rounded-xl"
                >
                  <div className="relative m-1 overflow-hidden rounded-md border border-[#c4a84b]/25 bg-white sm:m-1.5 sm:rounded-lg">
                    <CommanderPortrait
                      portraitIndex={commander.portraitIndex}
                      portraitUrl={commander.portraitUrl}
                      name={commander.name}
                      sizes="(max-width: 640px) 31vw, (max-width: 1024px) 23vw, (max-width: 1280px) 18vw, 190px"
                      className="scale-[1.002] transition-transform duration-500 group-hover:scale-[1.045]"
                    />
                    {commander.inMemoriam && (
                      <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white">
                        In memoriam
                      </span>
                    )}
                  </div>
                  <div className="px-1.5 pb-2 pt-1 sm:p-3">
                    <p className="truncate text-[7px] font-black uppercase tracking-[0.08em] text-[#d6bd66] sm:text-[9px]">{commander.rank}</p>
                    <h3 className="mt-0.5 line-clamp-2 min-h-[2.1em] text-[9px] font-black leading-[1.05] text-white sm:mt-1 sm:min-h-[2.4em] sm:text-xs">{commander.name}</h3>
                    <div className="mt-1 space-y-0.5 text-[7px] leading-snug text-white/50 sm:mt-2 sm:text-[9px]">
                      {commander.periods.map((period) => <p key={period}>{period}</p>)}
                    </div>
                    <span className="mt-1.5 hidden items-center gap-1 text-[9px] font-black uppercase tracking-wider text-[#d6bd66] sm:inline-flex">
                      Ver histórico <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
              </div>
            </div>

            {filteredCommanders.length === 0 && (
              <div className="mt-8 rounded-2xl border border-dashed border-[#1a3a2a]/25 px-4 py-10 text-center text-sm text-muted-foreground dark:border-white/15 dark:text-white/50">
                Nenhum comandante encontrado para essa busca.
              </div>
            )}

            <div className="mt-7 rounded-2xl border border-[#9a7a19]/25 bg-[#c4a84b]/10 p-4 text-xs leading-relaxed text-[#4e5d54] dark:border-[#c4a84b]/20 dark:bg-[#c4a84b]/5 dark:text-white/55">
              <strong className="text-[#e5c65d]">Nota de preservação:</strong> a relação publicada apresenta alguns períodos sobrepostos e registros de mais de uma passagem pelo comando. A Galeria Digital preserva esses dados documentais e reúne numa única ficha as gestões repetidas da mesma pessoa, sem criar datas ou correções não sustentadas pelas fontes.
            </div>
          </div>
        </section>

        <section className="bg-background px-4 py-10 dark:bg-[#061019] md:py-14">
          <div className="container mx-auto max-w-6xl">
            <Card className="border-[#1a3a2a]/20 bg-card text-card-foreground shadow-sm dark:border-[#c4a84b]/25 dark:bg-[#0a281c] dark:text-white">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#c4a84b]/25 bg-[#c4a84b]/10 text-[#d6bd66] sm:flex">
                    <CalendarDays className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#755b08] dark:text-[#d6bd66]">Fonte principal</p>
                    <h2 className="mt-2 text-xl font-black">{CFAP_HISTORY_SOURCE.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground dark:text-white/60">{CFAP_HISTORY_SOURCE.publication}</p>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground dark:text-white/48">
                      Autores: {CFAP_HISTORY_SOURCE.authors.join("; ")}.
                    </p>
                    <p className="mt-4 text-xs leading-relaxed text-muted-foreground dark:text-white/48">
                      Os retratos e períodos exibidos na galeria foram organizados a partir do arquivo fotográfico de comandantes e da documentação histórica reunida para esta digitalização.
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
