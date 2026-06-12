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
  Image as ImageIcon,
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
        const maxDim = 350; // Compact photo dimensions
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            width = maxDim;
          }
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
        {textPart && <p className="whitespace-pre-line text-sm text-muted-foreground">{textPart}</p>}
        {match && (
          <div className="mt-2 overflow-hidden rounded-lg border max-w-xs shadow-sm bg-muted/20">
            <img src={match[1]} alt="Anexo de comentário" className="max-w-full h-auto object-contain" />
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border-border/50 hover:border-[#c4a84b]/30 transition-colors">
      <CardContent className="p-6">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <PriorityIcon
              className="h-5 w-5 flex-shrink-0"
              style={{
                color:
                  mission.priority === "critica"
                    ? "#dc2626"
                    : mission.priority === "urgente"
                      ? "#c4a84b"
                      : "#1a3a2a",
              }}
            />
            <h3 className="text-lg font-bold text-foreground">{mission.title}</h3>
          </div>
          <Badge className={`${pCfg.color} flex-shrink-0`}>{pCfg.label}</Badge>
        </div>

        <div className="prose prose-sm max-w-none whitespace-pre-line text-muted-foreground">
          {mission.content}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            {mission.createdAt
              ? format(new Date(mission.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                  locale: ptBR,
                })
              : "Data não disponível"}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">
            {mission.likesCount || 0} cientes
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">
            {mission.commentsCount || 0} comentários
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t pt-4">
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
                ? "bg-[#c4a84b] text-[#1a1a1a] hover:bg-[#b89c3e]"
                : "bg-[#1a3a2a] text-white hover:bg-[#10281d]"
            }
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {mission.visitorReacted ? "Ciente Registrado" : "Marcar Ciente"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowComments((current) => !current)}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            {showComments ? "Ocultar Comentários" : "Abrir Comentários"}
          </Button>

          <span className="text-xs text-muted-foreground">
            <span className="text-xs uppercase tracking-widest text-muted-foreground/80">
              Apenas alunos com número de acesso podem comentar.
            </span>
          </span>
        </div>

        {showComments && (
          <div className="mt-5 space-y-4 rounded-2xl border bg-slate-50/60 p-4">
            <div className="flex flex-col gap-2">
              <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_auto]">
                <Input
                  value={authorName}
                  onChange={(event) => setAuthorName(event.target.value)}
                  placeholder="Seu Nº de Acesso"
                  className="bg-white"
                />
                <Textarea
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="Ex.: Positivo, xerife. Ciente da formatura."
                  rows={3}
                  className="bg-white"
                />
                <div className="flex flex-row md:flex-col gap-2 justify-end">
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
                    className="bg-white hover:bg-muted text-muted-foreground h-10 w-10 p-0 rounded-xl"
                    onClick={() => document.getElementById(`comment-photo-upload-${mission.id}`)?.click()}
                    title="Anexar foto"
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
                    className="bg-[#1a3a2a] text-white hover:bg-[#10281d] h-10 px-4 rounded-xl flex items-center justify-center gap-1.5"
                    onClick={handleCommentSubmit}
                    disabled={addComment.isPending || isUploadingPhoto}
                  >
                    <Send className="h-4 w-4" />
                    <span className="md:hidden">Enviar</span>
                  </Button>
                </div>
              </div>

              {commentPhoto && (
                <div className="relative inline-block mt-2 max-w-[120px] rounded-lg border overflow-hidden shadow-inner group">
                  <img src={commentPhoto} alt="Miniatura anexo" className="w-full h-auto object-cover aspect-square" />
                  <button
                    type="button"
                    onClick={() => setCommentPhoto(null)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity"
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
              <div className="rounded-xl border border-dashed bg-white px-4 py-6 text-sm text-muted-foreground">
                Ainda não há comentários neste comunicado.
              </div>
            ) : (
              <div className="space-y-3">
                {commentsQuery.data.map((comment) => (
                  <div key={comment.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                    <div className="mb-1 flex items-center justify-between gap-3">
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
  
  // Platoon selection for Aditamentos (defaulting to student session if logged in)
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

  const { data: missions, isLoading } = trpc.missions.list.useQuery(
    visitorId ? { visitorId } : undefined
  );

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
    <div className="mobile-safe-bottom min-h-screen flex flex-col bg-[#f5f2e8] md:bg-background">
      <Navbar />

      <section className="bg-white border-b border-border/40 px-4 pb-7 pt-6 md:px-0 md:py-12 dark:bg-zinc-900">
        <div className="container text-center">
          <Shield className="mx-auto mb-3 h-10 w-10 text-[#c4a84b]" />
          <h1
            className="text-3xl font-bold text-[#1a3a2a] md:text-4xl dark:text-[#c4a84b]"
            style={{ fontFamily: "Merriweather, serif" }}
          >
            CFAP 2026
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Centro de Formação e Aperfeiçoamento de Praças — Missões, comunicados e orientações
            para os alunos do curso de formação da Polícia Militar do Amazonas.
          </p>
        </div>
        <div className="checkerboard-pattern w-full mt-8 hidden md:block" />
      </section>

      <section className="bg-transparent px-4 py-6 md:bg-background md:px-0 md:py-10">
        <div className="container max-w-6xl">
          <Card className="mb-8 border-[#c4a84b]/30 bg-[#c4a84b]/10 text-foreground md:bg-[#c4a84b]/5">
            <CardContent className="flex items-start gap-4 p-6">
              <Shield className="mt-1 h-8 w-8 flex-shrink-0 text-[#c4a84b]" />
              <div className="space-y-2">
                <h3 className="font-bold text-foreground">Informativo CFAP</h3>
                <p className="text-sm text-muted-foreground">
                  Use esta aba para ver comunicados gerais e aditamentos oficiais do seu pelotão.
                  Marque <strong>Ciente</strong> nas missões para avisar o xerife que você leu.
                </p>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="comunicados" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-2 max-w-md bg-zinc-200/50 dark:bg-zinc-800 p-1 rounded-xl">
              <TabsTrigger value="comunicados">Comunicados</TabsTrigger>
              <TabsTrigger value="aditamentos">Aditamentos Oficiais</TabsTrigger>
            </TabsList>

            <TabsContent value="comunicados" className="space-y-6">
              <h2
                className="mb-6 flex items-center gap-2 text-xl font-bold text-foreground"
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
                  <CardContent className="p-12 text-center">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2
                  className="flex items-center gap-2 text-xl font-bold text-foreground"
                  style={{ fontFamily: "Merriweather, serif" }}
                >
                  <FileText className="h-5 w-5 text-[#c4a84b]" />
                  Banco de Aditamentos
                </h2>
                
                {/* Platoon selector */}
                <div className="flex items-center gap-2">
                  <Select value={companhia} onValueChange={setCompanhia}>
                    <SelectTrigger className="w-[140px] bg-white dark:bg-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((item) => (
                        <SelectItem key={item} value={String(item)}>{item}ª Companhia</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={peloton} onValueChange={setPeloton}>
                    <SelectTrigger className="w-[120px] bg-white dark:bg-zinc-800">
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
                  <CardContent className="p-12 text-center bg-white dark:bg-zinc-900 rounded-xl">
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
                    <Card key={adit.id} className="border-border bg-white dark:bg-zinc-900 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-[#c4a84b] text-[#1a1a1a] hover:bg-[#b59a3c]">
                              {format(new Date(`${adit.data}T00:00:00`), "dd/MM/yyyy")}
                            </Badge>
                            <h3 className="font-bold text-[#1a3a2a] dark:text-[#c4a84b] text-base">{adit.titulo}</h3>
                          </div>
                          {adit.conteudo && (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                              {adit.conteudo}
                            </p>
                          )}
                        </div>
                        {adit.pdfUrl && (
                          <div className="flex-shrink-0 flex items-center">
                            <a
                              href={adit.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1a3a2a] text-white hover:bg-[#153023] px-4 py-2 text-xs font-bold transition-colors shadow-sm dark:bg-zinc-800 dark:hover:bg-zinc-700"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
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
