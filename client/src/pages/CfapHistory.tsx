import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, BookOpen, CalendarDays, History, Search, Shield, Star, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CommanderPortrait } from "@/components/CommanderPortrait";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CFAP_HISTORY_SOURCE, CFAP_TIMELINE, isCurrentCommander } from "@/data/cfapHistory";
import { mergeCfapCommanders } from "@/data/cfapHistory";
import { trpc } from "@/lib/trpc";

function MilitaryCorner({ position }: { position: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const posClasses = {
    "top-left": "top-1 left-1",
    "top-right": "top-1 right-1 rotate-90",
    "bottom-right": "bottom-1 right-1 rotate-180",
    "bottom-left": "bottom-1 left-1 -rotate-90",
  }[position];

  return (
    <div className={`pointer-events-none absolute ${posClasses} z-20 h-6 w-6 sm:h-8 sm:w-8 p-0.5`}>
      <svg viewBox="0 0 24 24" fill="none" className="h-full w-full drop-shadow-[0_0_5px_rgba(240,189,58,0.9)]">
        <path d="M2 14V4C2 2.89543 2.89543 2 4 2H14" stroke="#f0bd3a" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M6 10V6H10" stroke="#c4a84b" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="5" cy="5" r="1.5" fill="#f0bd3a" />
      </svg>
    </div>
  );
}

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

  const currentCommander = useMemo(() => {
    return filteredCommanders.find((c) => isCurrentCommander(c)) ?? null;
  }, [filteredCommanders]);

  const historicalCommanders = useMemo(() => {
    return filteredCommanders.filter((c) => !isCurrentCommander(c));
  }, [filteredCommanders]);

  return (
    <div className="mobile-safe-bottom min-h-screen bg-background text-foreground dark:bg-[#061019] dark:text-white">
      <Navbar />

      <main className="flex flex-col">
        {/* Top Hero Section */}
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

        {/* Galeria dos Comandantes */}
        <section className="order-1 border-y border-[#1a3a2a]/15 bg-[#dfe5da] py-4 dark:border-white/10 dark:bg-[#081722] sm:py-10 md:py-14">
          <div className="container mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[1.25rem] border border-[#c4a84b]/35 bg-[radial-gradient(circle_at_top_right,rgba(214,189,102,.18),transparent_36%),linear-gradient(135deg,#153727_0%,#0b251a_58%,#071710_100%)] px-4 py-5 text-white shadow-[0_18px_55px_rgba(8,31,22,.24)] sm:rounded-[1.75rem] sm:px-8 sm:py-9 md:flex md:items-end md:justify-between md:gap-8 lg:px-10">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e5c65d]/75 to-transparent" />
              <div className="relative">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#e5c65d] sm:text-xs">Galeria dos Comandantes</p>
                <h1 className="mt-2 max-w-3xl font-serif text-3xl font-black leading-[1.05] text-[#fffdf5] sm:text-4xl md:text-5xl">Quem conduziu esta Casa de Ensino</h1>
              </div>
              <div className="relative mt-4 w-full shrink-0 sm:mt-6 md:mt-0 md:max-w-sm">
                <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#365244]" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar comandante ou período"
                  className="h-12 border-[#d6bd66]/45 bg-[#fffdf7] pl-11 text-[#17251d] shadow-lg placeholder:text-[#66736b] focus-visible:ring-[#d6bd66]"
                />
              </div>
            </div>

            <div className="relative mt-3 rounded-[1.25rem] border border-[#c4a84b]/35 bg-gradient-to-b from-[#10281d] via-[#081a13] to-[#06110d] p-3 shadow-[0_30px_90px_rgba(0,0,0,.38)] sm:mt-8 sm:rounded-[1.75rem] sm:p-5 lg:p-7">
              <div className="pointer-events-none absolute inset-1 rounded-[1rem] border border-white/[.045] sm:rounded-[1.5rem]" />
              
              {/* Cabeçalho Fixo do Quadro de Honra */}
              <div className="sticky top-12 sm:top-14 md:top-24 z-30 mb-5 -mx-1 sm:-mx-3 lg:-mx-4 px-2 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border-b border-[#c4a84b]/35 bg-[#091b13]/95 backdrop-blur-xl shadow-2xl shadow-black/60">
                <div className="relative grid min-h-[4.5rem] sm:min-h-[5.5rem] grid-cols-[3.5rem_minmax(0,1fr)_5rem] sm:grid-cols-[5.5rem_minmax(0,1fr)_7.5rem] items-center gap-1 sm:gap-4">
                  <img
                    src="/documents/images/brasao_cfap.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-1/2 h-[4rem] w-[6rem] -translate-x-1/2 -translate-y-[58%] object-contain opacity-[.06] sm:h-[6rem] sm:w-[9rem]"
                  />
                  <div className="flex h-full items-center justify-start">
                    <img src="/documents/images/pmam-brasao.png" alt="Brasão da Polícia Militar do Amazonas" className="h-[3rem] w-[3rem] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,.5)] sm:h-[4.5rem] sm:w-[4.5rem]" />
                  </div>
                  <div className="relative z-10 min-w-0 text-center drop-shadow-[0_2px_5px_rgba(0,0,0,.9)]">
                    <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#e5c65d] sm:text-xs sm:tracking-[.24em]">Quadro de Honra</p>
                    <p className="mt-0.5 font-serif text-sm font-black leading-tight text-white sm:text-xl md:text-2xl">Comandantes do CFAP</p>
                  </div>
                  <div className="flex h-full items-center justify-end">
                    <img src="/documents/images/brasao_cfap.png" alt="Emblema do CFAP" className="h-[3.75rem] w-[5rem] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,.5)] sm:h-[5.5rem] sm:w-[7.5rem]" />
                  </div>
                </div>
              </div>

              {/* DESTAQUE: COMANDANTE ATUAL DO CFAP */}
              {currentCommander && (
                <div className="relative mb-8 overflow-hidden rounded-2xl border-2 border-[#f0bd3a]/40 bg-gradient-to-br from-[#143725]/90 via-[#0a2318]/95 to-[#040e0a] p-4 sm:p-6 shadow-[0_12px_45px_rgba(0,0,0,0.6)]">
                  {/* Badge de Honra Superior */}
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#f0bd3a]/25 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f0bd3a]/50 bg-[#f0bd3a]/15 px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-[0.16em] text-[#f0bd3a]">
                        <Star className="h-3.5 w-3.5 fill-[#f0bd3a]" />
                        Comandante Atual • Em Exercício
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-white/60">
                      CFAP — Polícia Militar do Amazonas
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row items-center md:items-stretch gap-5 sm:gap-7">
                    {/* Retrato Maior com Moldura e Detalhes Militares */}
                    <div className="shrink-0 flex justify-center">
                      <Link
                        href={`/historia-cfap/comandantes/${currentCommander.slug}`}
                        className="group relative block no-underline focus:outline-none"
                      >
                        {/* Moldura Dourada com cantoneiras militares */}
                        <div className="relative p-2 sm:p-2.5 rounded-2xl bg-gradient-to-b from-[#f0bd3a] via-[#a88a38] to-[#423314] shadow-[0_0_35px_rgba(240,189,58,0.3)] transition-transform duration-300 group-hover:scale-[1.02]">
                          <div className="relative overflow-hidden rounded-xl border-2 border-[#f0bd3a]/80 bg-[#061019]">
                            {/* Cantoneiras militares nos 4 cantos */}
                            <MilitaryCorner position="top-left" />
                            <MilitaryCorner position="top-right" />
                            <MilitaryCorner position="bottom-left" />
                            <MilitaryCorner position="bottom-right" />

                            {/* Padrão xadrez militar superior e inferior */}
                            <div className="checkerboard-pattern absolute inset-x-0 top-0 h-1.5 opacity-70 z-10" />
                            <div className="checkerboard-pattern absolute inset-x-0 bottom-0 h-1.5 opacity-70 z-10" />

                            <div className="w-48 h-56 sm:w-56 sm:h-64 md:w-64 md:h-72 overflow-hidden flex items-center justify-center bg-white">
                              <CommanderPortrait
                                portraitIndex={currentCommander.portraitIndex}
                                portraitUrl={currentCommander.portraitUrl}
                                name={currentCommander.name}
                                sizes="(max-width: 640px) 200px, (max-width: 1024px) 260px, 300px"
                                className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                              />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>

                    {/* Informações e Honrarias do Comandante Atual */}
                    <div className="flex-1 flex flex-col justify-between text-center md:text-left">
                      <div>
                        <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black uppercase tracking-[0.14em] text-[#d6bd66]">
                          <Shield className="h-4 w-4 text-[#f0bd3a]" />
                          {currentCommander.rank}
                        </div>
                        <h2 className="mt-1 font-serif text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                          {currentCommander.name}
                        </h2>
                        
                        <div className="mt-2.5 inline-flex items-center gap-2 rounded-lg border border-[#f0bd3a]/30 bg-[#f0bd3a]/10 px-3 py-1 text-xs font-bold text-[#f0bd3a]">
                          <span>Gestão: {currentCommander.periods.join(" • ")}</span>
                        </div>

                        {currentCommander.highlights && currentCommander.highlights.length > 0 && (
                          <div className="mt-4 space-y-1.5 max-w-2xl text-xs sm:text-sm text-white/80 leading-relaxed text-left">
                            {currentCommander.highlights.slice(0, 3).map((hl, idx) => (
                              <p key={idx} className="flex items-start gap-2">
                                <span className="text-[#f0bd3a] font-bold mt-0.5">&bull;</span>
                                <span>{hl}</span>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <Link
                          href={`/historia-cfap/comandantes/${currentCommander.slug}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f0bd3a] to-[#c4a84b] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#061710] shadow-lg shadow-[#f0bd3a]/20 hover:brightness-110 transition-all no-underline"
                        >
                          Ver Histórico Completo & Biografia
                          <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TÍTULO DA GALERIA HISTÓRICA */}
              <div className="relative mb-3 flex items-center justify-between border-t border-white/10 pt-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#e5c65d] sm:text-sm">
                    Galeria Histórica dos Comandantes
                  </h3>
                  <p className="text-[10px] text-white/50">
                    {historicalCommanders.length} comandantes registrados na sucessão institucional
                  </p>
                </div>
              </div>

              {/* GRADE HISTÓRICA DOS DEMAIS COMANDANTES */}
              <div className="relative grid grid-cols-3 gap-1.5 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {historicalCommanders.map((commander) => (
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

        {/* Cronologia dos Marcos do CFAP */}
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
                <article key={item.year} className="relative mb-10 last:mb-0">
                  <span className="absolute -left-[35px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-[#1a3a2a] bg-[#c4a84b] dark:border-[#061019] md:-left-[47px]" />
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-[#1a3a2a]/20 bg-[#1a3a2a]/5 text-xs font-bold text-[#1a3a2a] dark:border-[#c4a84b]/30 dark:bg-[#c4a84b]/10 dark:text-[#d6bd66]">
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

        {/* Fonte Principal */}
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
