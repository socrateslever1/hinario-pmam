import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle2,
  MessageSquare,
  Send,
  Shield,
  Camera,
  Loader2,
  FileText,
  ExternalLink,
} from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { isValidStudyStudentNumber, getStudyStudentNumberErrorMessage } from "@shared/study";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getStudentSession } from "@/lib/studentSession";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const VISITOR_ID_KEY = "pmam-public-visitor-id";
const VISITOR_NAME_KEY = "pmam-public-comment-name";

const priorityConfig: Record<string, { label: string; color: string; icon: any }> = {
  normal: { label: "Normal", color: "bg-[#1a3a2a] text-white", icon: Bell },
  urgente: { label: "Urgente", color: "bg-[#c4a84b] text-[#1a1a1a]", icon: AlertTriangle },
  critica: { label: "Crítica", color: "bg-red-600 text-white", icon: AlertCircle },
};

function getOrCreateVisitorId() {
  if (typeof window === "undefined") return "";

  const existing = window.localStorage.getItem(VISITOR_ID_KEY);
  if (existing) return existing;

  const nextId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(VISITOR_ID_KEY, nextId);
  return nextId;
}

function MissionCard({
  mission,
  visitorId,
  savedVisitorName,
  onSaveVisitorName,
}: {
  mission: any;
  visitorId: string;
  savedVisitorName: string;
  onSaveVisitorName: (name: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [authorName, setAuthorName] = useState(savedVisitorName);
  const [commentText, setCommentText] = useState("");
  const [commentPhoto, setCommentPhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const utils = trpc.useUtils();
  const commentsQuery = trpc.missions.comments.useQuery(
    { missionId: mission.id },
    { enabled: showComments }
  );

  useEffect(() => {
    setAuthorName(savedVisitorName);
  }, [savedVisitorName]);

  const toggleReaction = trpc.missions.toggleReaction.useMutation({
    onSuccess: () => {
      utils.missions.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const addComment = trpc.missions.addComment.useMutation({
    onSuccess: async () => {
      setCommentText("");
      setCommentPhoto(null);
      onSaveVisitorName(authorName.trim());
      await Promise.all([
        utils.missions.list.invalidate(),
        utils.missions.comments.invalidate({ missionId: mission.id }),
      ]);
      toast.success("Comentário enviado.");
    },
    onError: (error) => toast.error(error.message),
  });

  const handleCommentPhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida.");
      return;
    }

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 350;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75);
          setCommentPhoto(compressedDataUrl);
          toast.success("Foto anexada com sucesso!");
        }
        setIsUploadingPhoto(false);
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  };

  const pCfg = priorityConfig[mission.priority] || priorityConfig.normal;
  const PriorityIcon = pCfg.icon;

  const handleCommentSubmit = () => {
    const cleanName = authorName.trim();
    let cleanComment = commentText.trim();

    if (!isValidStudyStudentNumber(cleanName)) {
      toast.error(getStudyStudentNumberErrorMessage());
      return;
    }

    if (cleanComment.length < 2 && !commentPhoto) {
      toast.error("Escreva um comentário ou anexe uma foto antes de enviar.");
      return;
    }

    if (commentPhoto) {
      cleanComment = `${cleanComment}\n[[PHOTO:${commentPhoto}]]`;
    }

    addComment.mutate({
      missionId: mission.id,
      authorName: cleanName,
      content: cleanComment,
    });
  };

  const renderCommentContent = (content: string) => {
    const photoRegex = /\[\[PHOTO:(data:image\/jpeg;base64,[A-Za-z0-9+/=]+)\]\]/;
    const match = content.match(photoRegex);
    const textPart = content.replace(photoRegex, "").trim();

    return (
      <div className="space-y-2">
        {textPart && <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{textPart}</p>}
        {match && (
          <div className="mt-2 max-w-xs overflow-hidden rounded-lg border bg-muted/20 shadow-sm">
            <img src={match[1]} alt="Anexo de comentário" className="h-auto max-w-full object-contain" />
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border-border/50 transition-colors hover:border-[#c4a84b]/30">
      <CardContent className="p-4 md:p-6">
        <div className="mb-3 flex items-start justify-between gap-3 md:gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <PriorityIcon
              className="mt-0.5 h-5 w-5 flex-shrink-0"
              style={{
                color:
                  mission.priority === "critica"
                    ? "#dc2626"
                    : mission.priority === "urgente"
                      ? "#c4a84b"
                      : "#1a3a2a",
              }}
            />
            <h3 className="text-base font-bold leading-snug text-foreground md:text-lg">{mission.title}</h3>
          </div>
          <Badge className={`${pCfg.color} flex-shrink-0`}>{pCfg.label}</Badge>
        </div>

        <div className="prose prose-sm max-w-none whitespace-pre-line text-muted-foreground">
          {mission.content}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground md:gap-3">
          <span className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            {mission.createdAt
              ? format(new Date(mission.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                locale: ptBR,
              })
              : "Data não disponível"}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
            {mission.likesCount || 0} cientes
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
            {mission.commentsCount || 0} comentários
          </span>
        </div>

        <div className="mt-5 grid gap-2 border-t pt-4 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          <Button
            type="button"
            onClick={() =>
              toggleReaction.mutate({
                missionId: mission.id,
                visitorId,
              })
            }
            disabled={toggleReaction.isPending}
            className={
              mission.visitorReacted
                ? "w-full bg-[#c4a84b] text-[#1a1a1a] hover:bg-[#b89c3e] sm:w-auto"
                : "w-full bg-[#1a3a2a] text-white hover:bg-[#10281d] sm:w-auto"
            }
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {mission.visitorReacted ? "Ciente Registrado" : "Marcar Ciente"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowComments((current) => !current)}
            className="w-full sm:w-auto"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            {showComments ? "Ocultar Comentários" : "Abrir Comentários"}
          </Button>

          <span className="text-xs leading-relaxed text-muted-foreground sm:ml-auto">
            Apenas alunos com número de acesso podem comentar.
          </span>
        </div>

        {showComments && (
          <div className="mt-5 space-y-4 rounded-2xl border bg-slate-50/60 p-3.5 md:p-4">
            <div className="flex flex-col gap-2">
              <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_auto]">
                <Input
                  value={authorName}
                  onChange={(event) => setAuthorName(event.target.value)}
                  placeholder="Seu Nº de Acesso"
                  className="bg-card"
                />
                <Textarea
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="Ex.: Positivo, xerife. Ciente da formatura."
                  rows={3}
                  className="bg-card"
                />
                <div className="flex flex-row justify-end gap-2 md:flex-col">
                  <input
                    id={`comment-photo-upload-${mission.id}`}
                    type="file"
                    accept="image/*"
                    onChange={handleCommentPhotoChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-11 rounded-xl bg-card p-0 text-muted-foreground hover:bg-muted"
                    onClick={() => document.getElementById(`comment-photo-upload-${mission.id}`)?.click()}
                    title="Anexar foto"
                    aria-label="Anexar foto"
                    disabled={isUploadingPhoto}
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#1a3a2a] px-4 text-white hover:bg-[#10281d]"
                    onClick={handleCommentSubmit}
                    disabled={addComment.isPending || isUploadingPhoto}
                  >
                    <Send className="h-4 w-4" />
                    <span className="md:hidden">Enviar</span>
                  </Button>
                </div>
              </div>

              {commentPhoto && (
                <div className="group relative mt-2 inline-block max-w-[140px] overflow-hidden rounded-lg border shadow-inner">
                  <img src={commentPhoto} alt="Miniatura anexo" className="aspect-square h-auto w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setCommentPhoto(null)}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  >
                    Remover
                  </button>
                </div>
              )}
            </div>

            {commentsQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : !commentsQuery.data || commentsQuery.data.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-card px-4 py-6 text-sm text-muted-foreground">
                Ainda não há comentários neste comunicado.
              </div>
            ) : (
              <div className="space-y-3">
                {commentsQuery.data.map((comment) => (
                  <div key={comment.id} className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-black/5">
                    <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <span className="font-semibold text-foreground">{comment.authorName}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                    {renderCommentContent(comment.content)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Cfap2026() {
  const [visitorId, setVisitorId] = useState("");
  const [visitorName, setVisitorName] = useState("");

  const studentSession = getStudentSession();
  const [companhia, setCompanhia] = useState(studentSession?.companhia ? String(studentSession.companhia) : "4");
  const [peloton, setPeloton] = useState(studentSession?.peloton ? String(studentSession.peloton) : "1");

  useEffect(() => {
    setVisitorId(getOrCreateVisitorId());
    if (typeof window !== "undefined") {
      setVisitorName(window.localStorage.getItem(VISITOR_NAME_KEY) || "");
    }
  }, []);

  const selectedCompanhia = Number(companhia);
  const selectedPeloton = Number(peloton);

  const { data: missions, isLoading } = trpc.missions.list.useQuery({
    visitorId: visitorId || undefined,
    companhia: studentSession?.companhia || undefined,
    peloton: studentSession?.peloton || undefined,
  });

  const { data: aditamentos, isLoading: isLoadingAditamentos } = trpc.serviceScale.listAditamentos.useQuery(
    { companhia: selectedCompanhia, peloton: selectedPeloton }
  );

  const handleSaveVisitorName = (name: string) => {
    const cleanName = name.trim();
    setVisitorName(cleanName);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(VISITOR_NAME_KEY, cleanName);
    }
  };

  return (
    <div className="mobile-safe-bottom min-h-screen flex flex-col bg-[#f5f2e8] text-foreground dark:bg-[#020a0f] dark:text-[#f8f7f0] md:bg-background dark:md:bg-[#020a0f]">
      <Navbar />

      <section className="military-page-hero border-b px-4 py-4 md:px-0 md:py-6">
        <div className="container text-center">
          <Shield className="mx-auto mb-2 h-7 w-7 text-[#c4a84b] md:mb-3 md:h-10 md:w-10" />
          <h1
            className="text-[28px] font-bold leading-tight text-[#1a3a2a] dark:text-[#c4a84b] md:text-4xl"
            style={{ fontFamily: "Merriweather, serif" }}
          >
            CFAP 2026
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:mt-3 md:text-base">
            Centro de Formação e Aperfeiçoamento de Praças
            <span className="hidden md:inline"> — Missões, comunicados e orientações para os alunos do curso de formação da Polícia Militar do Amazonas.</span>
          </p>
        </div>
        <div className="checkerboard-pattern mt-5 hidden w-full md:block" />
      </section>

      <section className="bg-transparent px-4 py-4 md:bg-background md:px-0 md:py-10">
        <div className="container max-w-6xl">
          <Card className="mb-4 border-[#c4a84b]/30 bg-[#c4a84b]/10 text-foreground md:mb-8 md:bg-[#c4a84b]/5">
            <CardContent className="flex items-start gap-3 p-4 md:gap-4 md:p-6">
              <Shield className="mt-0.5 h-6 w-6 flex-shrink-0 text-[#c4a84b] md:h-8 md:w-8" />
              <div className="min-w-0 space-y-1 md:space-y-2">
                <h3 className="text-base font-bold leading-tight text-foreground">Informativo CFAP</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Comunicados e aditamentos oficiais do seu pelotão.
                  <span className="hidden md:inline"> Marque <strong>Ciente</strong> nas missões para avisar o xerife que você leu.</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="comunicados" className="w-full">
            <TabsList className="mb-5 grid w-full max-w-md grid-cols-2 rounded-xl bg-zinc-200/50 p-1 dark:bg-zinc-800 md:mb-6">
              <TabsTrigger value="comunicados">Comunicados</TabsTrigger>
              <TabsTrigger value="aditamentos">Aditamentos Oficiais</TabsTrigger>
            </TabsList>

            <TabsContent value="comunicados" className="space-y-6">
              <h2
                className="mb-5 flex items-center gap-2 text-xl font-bold text-foreground md:mb-6"
                style={{ fontFamily: "Merriweather, serif" }}
              >
                <Bell className="h-5 w-5 text-[#c4a84b]" />
                Missões e Comunicados
              </h2>

              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-40 rounded-lg" />
                  ))}
                </div>
              ) : !missions || missions.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="p-8 text-center md:p-12">
                    <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground">Nenhum comunicado publicado</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Ainda não há missões ou comunicados publicados para o CFAP 2026.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {missions.map((mission: any) => (
                    <MissionCard
                      key={mission.id}
                      mission={mission}
                      visitorId={visitorId}
                      savedVisitorName={visitorName}
                      onSaveVisitorName={handleSaveVisitorName}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="aditamentos" className="space-y-6">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2
                  className="flex items-center gap-2 text-xl font-bold text-foreground"
                  style={{ fontFamily: "Merriweather, serif" }}
                >
                  <FileText className="h-5 w-5 text-[#c4a84b]" />
                  Banco de Aditamentos
                </h2>

                <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
                  <Select value={companhia} onValueChange={setCompanhia}>
                    <SelectTrigger className="w-full min-w-0 bg-white dark:bg-zinc-800 sm:w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((item) => (
                        <SelectItem key={item} value={String(item)}>{item}ª Companhia</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={peloton} onValueChange={setPeloton}>
                    <SelectTrigger className="w-full min-w-0 bg-white dark:bg-zinc-800 sm:w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2].map((item) => (
                        <SelectItem key={item} value={String(item)}>{item}º Pelotão</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoadingAditamentos ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-lg" />
                  ))}
                </div>
              ) : !aditamentos || aditamentos.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="rounded-xl bg-white p-8 text-center dark:bg-zinc-900 md:p-12">
                    <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-40" />
                    <h3 className="font-semibold text-foreground">Nenhum aditamento publicado</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Não há aditamentos cadastrados para a {companhia}ª Companhia / {peloton}º Pelotão.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {aditamentos.map((adit: any) => (
                    <Card key={adit.id} className="overflow-hidden border-border bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-zinc-900">
                      <CardContent className="flex flex-col justify-between gap-4 p-4 md:flex-row md:items-start md:p-5">
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-[#c4a84b] text-[#1a1a1a] hover:bg-[#b59a3c]">
                              {format(new Date(`${adit.data}T00:00:00`), "dd/MM/yyyy")}
                            </Badge>
                            <h3 className="text-base font-bold text-[#1a3a2a] dark:text-[#c4a84b]">{adit.titulo}</h3>
                          </div>
                          {adit.conteudo && (
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                              {adit.conteudo}
                            </p>
                          )}
                        </div>
                        {adit.pdfUrl && (
                          <div className="flex flex-shrink-0 items-center">
                            <a
                              href={adit.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1a3a2a] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#153023] dark:bg-zinc-800 dark:hover:bg-zinc-700 md:w-auto"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Abrir PDF Original
                            </a>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
}
