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

      <main className="flex flex-col">
        <section className="order-2 relative overflow-hidden border-b border-[#c4a84b]/30 px-4 py-10 text-white md:py-16">
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

        <section className="order-3 bg-background px-4 py-10 dark:bg-[#061019] md:py-14">
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

        <section className="order-1 border-y border-[#1a3a2a]/15 bg-[#dfe5da] py-10 dark:border-white/10 dark:bg-[#081722] md:py-14">
          <div className="container mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-[1.25rem] border border-[#c4a84b]/35 bg-[radial-gradient(circle_at_top_right,rgba(214,189,102,.18),transparent_36%),linear-gradient(135deg,#153727_0%,#0b251a_58%,#071710_100%)] px-5 py-7 text-white shadow-[0_18px_55px_rgba(8,31,22,.24)] sm:rounded-[1.75rem] sm:px-8 sm:py-9 md:flex md:items-end md:justify-between md:gap-8 lg:px-10">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e5c65d]/75 to-transparent" />
              <div className="relative">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#e5c65d] sm:text-xs">Galeria dos Comandantes</p>
                <h1 className="mt-2 max-w-3xl font-serif text-3xl font-black leading-[1.05] text-[#fffdf5] sm:text-4xl md:text-5xl">Quem conduziu esta Casa de Ensino</h1>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/68 md:text-base">
                  Toque ou clique em qualquer retrato para abrir o registro individual da gestão.
                </p>
              </div>
              <div className="relative mt-6 w-full shrink-0 md:mt-0 md:max-w-sm">
                <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#365244]" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar comandante ou período"
                  className="h-12 border-[#d6bd66]/45 bg-[#fffdf7] pl-11 text-[#17251d] shadow-lg placeholder:text-[#66736b] focus-visible:ring-[#d6bd66]"
                />
              </div>
            </div>

            <div className="relative mt-8 rounded-[1.25rem] border border-[#c4a84b]/35 bg-gradient-to-b from-[#10281d] via-[#081a13] to-[#06110d] p-2 shadow-[0_30px_90px_rgba(0,0,0,.38)] sm:rounded-[1.75rem] sm:p-4 lg:p-6">
              <div className="pointer-events-none absolute inset-1 rounded-[1rem] border border-white/[.045] sm:rounded-[1.5rem]" />
              <div className="relative mb-4 grid min-h-[5.75rem] grid-cols-[4.25rem_minmax(0,1fr)_6.25rem] items-center gap-1 border-b border-[#c4a84b]/25 px-1 pb-4 sm:min-h-[7.5rem] sm:grid-cols-[6.5rem_minmax(0,1fr)_9rem] sm:gap-4 sm:px-3">
                <img
                  src="/documents/images/brasao_cfap.png"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-1/2 h-[5rem] w-[8rem] -translate-x-1/2 -translate-y-[58%] object-contain opacity-[.055] sm:h-[7rem] sm:w-[11rem]"
                />
                <div className="flex h-full items-center justify-start">
                  <img src="/documents/images/pmam-brasao.png" alt="Brasão da Polícia Militar do Amazonas" className="h-[3.75rem] w-[3.75rem] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,.45)] sm:h-[5.5rem] sm:w-[5.5rem]" />
                </div>
                <div className="relative z-10 min-w-0 text-center drop-shadow-[0_2px_5px_rgba(0,0,0,.8)]">
                  <p className="text-[11px] font-black uppercase tracking-[.2em] text-[#e5c65d] sm:text-[13px] sm:tracking-[.24em]">Quadro de Honra</p>
                  <p className="mt-1 font-serif text-base font-black leading-tight text-white sm:text-2xl">Comandantes do CFAP</p>
                </div>
                <div className="flex h-full items-center justify-end">
                  <img src="/documents/images/brasao_cfap.png" alt="Emblema do CFAP" className="h-[4.5rem] w-[6.25rem] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,.45)] sm:h-[6.5rem] sm:w-[9rem]" />
                </div>
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

        <section className="order-4 bg-background px-4 py-10 dark:bg-[#061019] md:py-14">
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
