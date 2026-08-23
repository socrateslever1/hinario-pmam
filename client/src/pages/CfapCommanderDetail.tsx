import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, ChevronLeft, ChevronRight, Shield, UserRound } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CommanderPortrait } from "@/components/CommanderPortrait";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CFAP_COMMANDERS, CFAP_HISTORY_SOURCE, getCfapCommander } from "@/data/cfapHistory";

export default function CfapCommanderDetail() {
  const params = useParams<{ slug: string }>();
  const commander = getCfapCommander(params.slug);

  if (!commander) {
    return (
      <div className="mobile-safe-bottom min-h-screen bg-[#061019] text-white">
        <Navbar />
        <main className="container mx-auto max-w-4xl px-4 py-16 text-center">
          <Shield className="mx-auto h-12 w-12 text-[#d6bd66]" />
          <h1 className="mt-4 text-3xl font-black">Registro não encontrado</h1>
          <p className="mt-2 text-white/55">Esse comandante não consta na Galeria Digital disponível.</p>
          <Link href="/historia-cfap">
            <Button className="mt-6 bg-[#c4a84b] text-[#111] hover:bg-[#d6bd66]">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar à Galeria
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const index = CFAP_COMMANDERS.findIndex((item) => item.slug === commander.slug);
  const previous = index > 0 ? CFAP_COMMANDERS[index - 1] : undefined;
  const next = index >= 0 && index < CFAP_COMMANDERS.length - 1 ? CFAP_COMMANDERS[index + 1] : undefined;
  const hasSpecificHistory = Boolean(commander.highlights?.length);

  return (
    <div className="mobile-safe-bottom min-h-screen bg-[#061019] text-white">
      <Navbar />

      <main>
        <section className="border-b border-white/10 px-4 py-7 md:py-10">
          <div className="container mx-auto max-w-6xl">
            <Link href="/historia-cfap" className="inline-flex items-center gap-2 text-sm font-bold text-[#d6bd66] no-underline hover:text-[#ead78f]">
              <ArrowLeft className="h-4 w-4" /> Galeria dos Comandantes
            </Link>
          </div>
        </section>

        <section className="px-4 py-8 md:py-14">
          <div className="container mx-auto grid max-w-6xl gap-8 md:grid-cols-[minmax(260px,380px)_1fr] md:items-start">
            <div>
              <div className="overflow-hidden rounded-3xl border border-[#c4a84b]/25 bg-white shadow-2xl shadow-black/25">
                <CommanderPortrait portraitIndex={commander.portraitIndex} name={commander.name} />
              </div>
              {commander.portraitIndex === undefined && (
                <p className="mt-3 text-center text-[11px] leading-relaxed text-white/42">
                  O arquivo fotográfico fornecido não continha retrato identificado para este registro.
                </p>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-[#c4a84b]/30 bg-[#c4a84b]/10 text-[#e5c65d]">Galeria dos Comandantes</Badge>
                {commander.inMemoriam && (
                  <Badge variant="outline" className="border-white/20 text-white/65">In memoriam</Badge>
                )}
              </div>

              <p className="mt-5 text-sm font-black uppercase tracking-[0.16em] text-[#d6bd66]">{commander.rank}</p>
              <h1 className="mt-2 font-serif text-4xl font-black leading-tight md:text-5xl">{commander.name}</h1>

              <div className="mt-6 flex flex-col gap-2">
                {commander.periods.map((period) => (
                  <div key={period} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm">
                    <CalendarDays className="h-4 w-4 shrink-0 text-[#d6bd66]" />
                    <span className="font-bold text-white/78">{period}</span>
                  </div>
                ))}
              </div>

              <Card className="mt-7 border-white/10 bg-white/[0.045] text-white">
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c4a84b]/10 text-[#d6bd66]">
                      <UserRound className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#d6bd66]">Registro da gestão</p>
                      <h2 className="text-xl font-black">Histórico documentado</h2>
                    </div>
                  </div>

                  {hasSpecificHistory ? (
                    <ul className="mt-5 space-y-3">
                      {commander.highlights?.map((highlight) => (
                        <li key={highlight} className="flex gap-3 text-sm leading-relaxed text-white/65">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d6bd66]" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-5 rounded-xl border border-dashed border-white/15 bg-black/10 p-4 text-sm leading-relaxed text-white/58">
                      A relação histórica publicada registra {commander.rank} {commander.name} no período acima. O artigo-base não individualiza outros atos administrativos ou feitos específicos desta gestão; por isso, a Galeria Digital não acrescenta biografia ou realizações sem respaldo documental.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-4 border-[#c4a84b]/20 bg-[#0a281c] text-white">
                <CardContent className="p-5 md:p-6">
                  <div className="flex gap-3">
                    <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-[#d6bd66]" />
                    <div>
                      <h2 className="font-black">Base histórica</h2>
                      <p className="mt-2 text-xs leading-relaxed text-white/55">
                        {CFAP_HISTORY_SOURCE.title}. {CFAP_HISTORY_SOURCE.publication}. A ficha conserva as datas documentadas na relação de comandantes e os registros individualizados expressamente descritos no artigo.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Link href="/historia-cfap" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#d6bd66] no-underline">
                <BookOpen className="h-4 w-4" /> Abrir a história geral do CFAP <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 bg-[#081722] px-4 py-6">
          <div className="container mx-auto grid max-w-6xl gap-3 sm:grid-cols-2">
            {previous ? (
              <Link href={`/historia-cfap/comandantes/${previous.slug}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 no-underline transition hover:border-[#c4a84b]/40">
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#d6bd66]"><ChevronLeft className="h-3.5 w-3.5" /> Anterior</span>
                <p className="mt-1 text-sm font-black text-white">{previous.name}</p>
              </Link>
            ) : <div />}
            {next && (
              <Link href={`/historia-cfap/comandantes/${next.slug}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-right no-underline transition hover:border-[#c4a84b]/40">
                <span className="flex items-center justify-end gap-1 text-[10px] font-black uppercase tracking-wider text-[#d6bd66]">Próximo <ChevronRight className="h-3.5 w-3.5" /></span>
                <p className="mt-1 text-sm font-black text-white">{next.name}</p>
              </Link>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
