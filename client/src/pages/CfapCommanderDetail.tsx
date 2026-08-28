import { Link, useParams } from "wouter";
import { ArrowRight, BookOpen, CalendarDays, ChevronLeft, ChevronRight, ExternalLink, Film, Medal, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CommanderPortrait } from "@/components/CommanderPortrait";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CFAP_HISTORY_SOURCE, getCfapCommander, mergeCfapCommanders } from "@/data/cfapHistory";
import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

function getVideoEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
    if (url.hostname.endsWith("youtube.com")) {
      const id = url.searchParams.get("v") || url.pathname.split("/").filter(Boolean).at(-1);
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (url.hostname.endsWith("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean).at(-1);
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export default function CfapCommanderDetail() {
  const params = useParams<{ slug: string }>();
  const historyQuery = trpc.cfapHistory.list.useQuery(undefined, { retry: false });
  const commanders = useMemo(() => mergeCfapCommanders(historyQuery.data ?? []), [historyQuery.data]);
  const commander = getCfapCommander(params.slug, commanders);

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
              <ChevronLeft className="mr-2 h-4 w-4" /> Voltar à Galeria
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const index = commanders.findIndex((item) => item.slug === commander.slug);
  const previous = index > 0 ? commanders[index - 1] : undefined;
  const next = index >= 0 && index < commanders.length - 1 ? commanders[index + 1] : undefined;
  const hasSpecificHistory = Boolean(commander.highlights?.length);

  return (
    <div className="mobile-safe-bottom min-h-screen bg-[#061019] text-white">
      <Navbar />

      <main>
        <section className="border-b border-[#c4a84b]/15 bg-[#071711] px-4 py-5">
          <div className="container mx-auto max-w-6xl">
            <Link href="/historia-cfap" className="inline-flex items-center gap-3 rounded-full border border-[#c4a84b]/25 bg-[#c4a84b]/5 py-2 pl-2 pr-4 text-xs font-black uppercase tracking-[.12em] text-[#e4ca70] no-underline transition hover:border-[#c4a84b]/55 hover:bg-[#c4a84b]/10">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#c4a84b]/30 bg-[#102a1d]"><ChevronLeft className="h-4 w-4" /></span> Galeria dos Comandantes
            </Link>
          </div>
        </section>

        <section className="relative overflow-hidden px-4 py-8 md:py-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(196,168,75,.12),transparent_30%),radial-gradient(circle_at_90%_20%,rgba(20,87,54,.22),transparent_35%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[.035] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:42px_42px]" />
          {Boolean(commander.videos?.length) && (() => {
            const featured = commander.videos![0];
            const embedUrl = getVideoEmbedUrl(featured.url);
            return (
              <div className="container relative mx-auto mb-8 max-w-6xl overflow-hidden rounded-3xl border border-[#c4a84b]/25 bg-[#07110d] shadow-2xl shadow-black/35">
                <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4"><span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#c4a84b]/25 bg-[#c4a84b]/10 text-[#dfc462]"><Film className="h-4 w-4" /></span><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#d6bd66]">Memória audiovisual</p><h2 className="text-sm font-black text-white">{featured.title}</h2></div></div>
                {embedUrl ? <iframe src={embedUrl} title={featured.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="aspect-video max-h-[560px] w-full border-0 bg-black" /> : <a href={featured.url} rel="noreferrer" className="flex items-center justify-between p-6 text-sm font-bold text-white no-underline"><span>Abrir registro audiovisual</span><ExternalLink className="h-4 w-4 text-[#d6bd66]" /></a>}
              </div>
            );
          })()}
          <div className="container mx-auto grid max-w-6xl gap-8 md:grid-cols-[minmax(260px,380px)_1fr] md:items-start">
            <div>
              <div className="relative rounded-[2rem] border border-[#c4a84b]/45 bg-gradient-to-b from-[#d8bd61] via-[#715d22] to-[#d8bd61] p-[2px] shadow-[0_24px_70px_rgba(0,0,0,.45)]">
                <div className="relative rounded-[1.9rem] border-[7px] border-[#10281d] bg-[#07110d] p-3">
                  <div className="absolute left-1/2 top-0 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#c4a84b]/60 bg-[#0b2117] p-2 shadow-xl">
                    <img src="/documents/images/brasao_cfap.png" alt="Emblema do CFAP" className="h-full w-full object-contain" />
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-[#c4a84b]/25 bg-white">
                    <CommanderPortrait portraitIndex={commander.portraitIndex} portraitUrl={commander.portraitUrl} name={commander.name} />
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-2 border-t border-[#c4a84b]/20 pt-3 text-[9px] font-black uppercase tracking-[.22em] text-[#d6bd66]"><Medal className="h-3.5 w-3.5" /> Centro de Formação e Aperfeiçoamento de Praças</div>
                </div>
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

              <Card className="mt-7 overflow-hidden border-[#c4a84b]/20 bg-[#091812]/95 text-white shadow-xl shadow-black/20">
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#c4a84b]/25 bg-[#c4a84b]/10 p-2 text-[#d6bd66]">
                      <img src="/documents/images/brasao_cfap.png" alt="" className="h-full w-full object-contain" />
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
                      {commander.rank} {commander.name} integrou a sucessão de comando do CFAP no período indicado. A ficha preserva somente informações históricas confirmadas, sem atribuir realizações pessoais não documentadas.
                    </div>
                  )}
                  {commander.biography && (
                    <p className="mt-6 border-t border-[#c4a84b]/15 pt-6 font-serif text-[17px] leading-8 text-white/78 first-letter:float-left first-letter:mr-2 first-letter:text-5xl first-letter:font-black first-letter:leading-[.8] first-letter:text-[#d6bd66]">
                      {commander.biography}
                    </p>
                  )}
                </CardContent>
              </Card>

              {Boolean(commander.videos && commander.videos.length > 1) && (
                <Card className="mt-4 border-white/10 bg-[#081722] text-white">
                  <CardContent className="p-5 md:p-6">
                    <div className="mb-4 flex items-center gap-2 text-[#d6bd66]"><Film className="h-5 w-5" /><h2 className="font-black">Acervo audiovisual</h2></div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {commander.videos?.slice(1).map((video) => {
                        const embedUrl = getVideoEmbedUrl(video.url);
                        return embedUrl ? (
                          <div key={`${video.title}-${video.url}`} className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
                            <iframe src={embedUrl} title={video.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="aspect-video w-full border-0" />
                            <p className="px-3 py-2 text-xs font-bold text-white/75">{video.title}</p>
                          </div>
                        ) : (
                          <a key={`${video.title}-${video.url}`} href={video.url} rel="noreferrer" className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm font-bold text-white no-underline hover:border-[#c4a84b]/45">
                            <span>{video.title}</span><ExternalLink className="h-4 w-4 text-[#d6bd66]" />
                          </a>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="mt-4 border-[#c4a84b]/20 bg-[#0a281c] text-white">
                <CardContent className="p-5 md:p-6">
                  <div className="flex gap-3">
                    <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-[#d6bd66]" />
                    <div>
                      <h2 className="font-black">Base histórica</h2>
                      <p className="mt-2 text-xs leading-relaxed text-white/55">
                        {CFAP_HISTORY_SOURCE.title}. {CFAP_HISTORY_SOURCE.publication}. A ficha conserva as datas e os registros históricos documentados sobre cada gestão.
                      </p>
                      {Boolean(commander.sources?.length) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {commander.sources?.map((source) => (
                            <a key={source.url} href={source.url} rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-[#c4a84b]/25 px-3 py-1.5 text-[11px] font-bold text-[#e5c65d] no-underline">
                              {source.title}<ExternalLink className="h-3 w-3" />
                            </a>
                          ))}
                        </div>
                      )}
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
