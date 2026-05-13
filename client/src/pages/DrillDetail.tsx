import { Link, useRoute } from "wouter";
import ReactPlayer from "react-player";
import { Streamdown } from "streamdown";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { extractYouTubeId, resolvePlayableMediaUrl } from "@/lib/media";
import { ordemUnidaManualHighlights } from "@/lib/studyLibrary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Music,
  PlayCircle,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";

const difficultyLabels: Record<string, string> = {
  basico: "Básico",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

const difficultyClasses: Record<string, string> = {
  basico: "bg-emerald-100 text-emerald-800",
  intermediario: "bg-amber-100 text-amber-800",
  avancado: "bg-red-100 text-red-800",
};

export default function DrillDetail() {
  const [, params] = useRoute("/drill/:id");
  const drillId = params?.id ? Number(params.id) : null;

  const { data: drill, isLoading, isError } = trpc.drill.getById.useQuery(
    { id: drillId ?? 0 },
    { enabled: Boolean(drillId) },
  );

  if (!drillId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
              <p className="text-muted-foreground">Material de ordem unida não encontrado.</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">Carregando material...</div>
        <Footer />
      </div>
    );
  }

  if (isError || !drill) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
              <p className="text-muted-foreground">Não foi possível abrir este material de ordem unida.</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const mediaUrl = resolvePlayableMediaUrl({ youtubeUrl: drill.videoUrl, audioUrl: null });
  const hasVideo = Boolean(mediaUrl);
  const hasImage = Boolean(drill.imageUrl);
  const hasPdf = Boolean(drill.pdfUrl);
  const hasYoutube = Boolean(drill.youtubeUrl);
  const hasCornettaAudio = Boolean(drill.cornettaAudioUrl);
  const youtubeId = extractYouTubeId(drill.videoUrl);
  const youtubeExecutionId = extractYouTubeId(drill.youtubeUrl);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <section className="military-gradient py-12">
        <div className="container text-center">
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
            {drill.category && <Badge className="bg-[#c4a84b] text-[#1a1a1a]">{drill.category}</Badge>}
            {drill.difficulty && (
              <Badge className={difficultyClasses[drill.difficulty] ?? "bg-white text-slate-900"}>
                {difficultyLabels[drill.difficulty] ?? drill.difficulty}
              </Badge>
            )}
            {drill.duration && (
              <Badge variant="outline" className="border-white/20 text-white/80">
                {drill.duration} min
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold text-white md:text-4xl" style={{ fontFamily: "Merriweather, serif" }}>
            {drill.title}
          </h1>
          {drill.subtitle && (
            <p className="mx-auto mt-3 max-w-2xl text-lg text-white/80">
              {drill.subtitle}
            </p>
          )}
          {drill.description && (
            <p className="mx-auto mt-3 max-w-3xl text-sm text-white/60">
              {drill.description}
            </p>
          )}
          <div className="mt-6 flex justify-center gap-4">
            <Link href="/drill">
              <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Ordem Unida
              </Button>
            </Link>
          </div>
        </div>
        <div className="checkerboard-pattern mt-8 w-full" />
      </section>

      <section className="py-10">
        <div className="container space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border/60">
              <CardContent className="flex items-center gap-4 p-5">
                <PlayCircle className="h-10 w-10 text-[#1a3a2a]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Vídeo de estudo</p>
                  <p className="text-2xl font-bold">{hasVideo ? "Pronto" : "Pendente"}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="flex items-center gap-4 p-5">
                <FileText className="h-10 w-10 text-[#1a3a2a]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">PDF</p>
                  <p className="text-2xl font-bold">{hasPdf ? "Vinculado" : "Ausente"}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="flex items-center gap-4 p-5">
                <Users className="h-10 w-10 text-[#1a3a2a]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Contexto</p>
                  <p className="text-2xl font-bold">{drill.instructor ? "Guiado" : "Livre"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <Card className="overflow-hidden border-border/60">
                <CardHeader>
                  <CardTitle style={{ fontFamily: "Merriweather, serif" }}>Painel dinâmico de estudo</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Sempre que houver vídeo, imagem ou PDF, eles aparecem aqui dentro da página para estudo direto.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasVideo ? (
                    <div className="overflow-hidden rounded-3xl border bg-black">
                      <div className="aspect-video w-full">
                        <ReactPlayer
                          src={mediaUrl!}
                          controls
                          width="100%"
                          height="100%"
                          style={{ backgroundColor: "#000" }}
                          config={
                            youtubeId
                              ? { youtube: { playerVars: { rel: 0, modestbranding: 1, playsinline: 1 } } }
                              : undefined
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-3xl border bg-muted/20 p-5 text-sm text-muted-foreground">
                      Nenhum vídeo vinculado neste material de ordem unida ainda.
                    </div>
                  )}

                  {hasImage && (
                    <div className="overflow-hidden rounded-3xl border bg-white">
                      <img
                        src={drill.imageUrl!}
                        alt={drill.title}
                        className="max-h-[520px] w-full object-cover"
                      />
                    </div>
                  )}

                  {hasYoutube && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Execução do Movimento</p>
                      <div className="overflow-hidden rounded-3xl border bg-black">
                        <div className="aspect-video w-full">
                          <ReactPlayer
                            src={drill.youtubeUrl!}
                            controls
                            width="100%"
                            height="100%"
                            style={{ backgroundColor: "#000" }}
                            config={undefined}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {hasCornettaAudio && (
                    <div className="rounded-3xl border bg-muted/10 p-4">
                      <p className="mb-3 text-sm font-medium text-foreground">Toque de Corneta</p>
                      <audio controls className="w-full">
                        <source src={drill.cornettaAudioUrl} />
                        Seu navegador não suporta áudio HTML5.
                      </audio>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {drill.videoUrl && (
                      <a href={drill.videoUrl} target="_blank" rel="noreferrer">
                        <Button className="bg-[#1a3a2a] text-white hover:bg-[#10281d]">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Abrir vídeo original
                        </Button>
                      </a>
                    )}
                    {drill.youtubeUrl && (
                      <a href={drill.youtubeUrl} target="_blank" rel="noreferrer">
                        <Button className="bg-red-600 text-white hover:bg-red-700">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Ver no YouTube
                        </Button>
                      </a>
                    )}
                    {drill.imageUrl && (
                      <a href={drill.imageUrl} target="_blank" rel="noreferrer">
                        <Button variant="outline">
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Abrir imagem
                        </Button>
                      </a>
                    )}
                    {drill.pdfUrl && (
                      <a href={drill.pdfUrl} target="_blank" rel="noreferrer">
                        <Button variant="outline">
                          <FileText className="mr-2 h-4 w-4" />
                          Abrir PDF
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>

              {drill.content && (
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle style={{ fontFamily: "Merriweather, serif" }}>Conteúdo de estudo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <Streamdown>{drill.content}</Streamdown>
                    </div>
                  </CardContent>
                </Card>
              )}

              {hasPdf && (
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle style={{ fontFamily: "Merriweather, serif" }}>PDF de apoio</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Quando o instrutor vincular um PDF, ele pode ser consultado aqui sem sair do material.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <iframe
                      title={`PDF ${drill.title}`}
                      src={`${drill.pdfUrl}#toolbar=1&navpanes=0&view=FitH`}
                      className="h-[72vh] min-h-[420px] w-full rounded-2xl border bg-white"
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 text-[#1a3a2a]">
                    <ShieldCheck className="h-5 w-5" />
                    <CardTitle style={{ fontFamily: "Merriweather, serif" }}>Leitura do manual</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    {ordemUnidaManualHighlights.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-[#c4a84b]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {(drill.prerequisites || drill.learningOutcomes) && (
                <Card>
                  <CardHeader>
                    <CardTitle style={{ fontFamily: "Merriweather, serif" }}>Orientação do material</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-muted-foreground">
                    {drill.prerequisites && (
                      <div>
                        <p className="font-semibold text-foreground">Pré-requisitos</p>
                        <p className="mt-1 whitespace-pre-wrap">{drill.prerequisites}</p>
                      </div>
                    )}
                    {drill.learningOutcomes && (
                      <div>
                        <p className="font-semibold text-foreground">Resultados esperados</p>
                        <p className="mt-1 whitespace-pre-wrap">{drill.learningOutcomes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="border-[#1a3a2a]/15 bg-[#1a3a2a]/5">
                <CardHeader>
                  <CardTitle style={{ fontFamily: "Merriweather, serif" }}>Base pronta para mais estudo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Esta estrutura já suporta vídeo, imagem e PDF. O próximo lote pode ampliar a parte visual da ordem unida com sequências, fotos e demonstrações.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
