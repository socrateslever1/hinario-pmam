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
} from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

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
      onSaveVisitorName(authorName.trim());
      await Promise.all([
        utils.missions.list.invalidate(),
        utils.missions.comments.invalidate({ missionId: mission.id }),
      ]);
      toast.success("Comentário enviado.");
    },
    onError: (error) => toast.error(error.message),
  });

  const pCfg = priorityConfig[mission.priority] || priorityConfig.normal;
  const PriorityIcon = pCfg.icon;

  const handleCommentSubmit = () => {
    const cleanName = authorName.trim();
    const cleanComment = commentText.trim();

    if (cleanName.length < 2) {
      toast.error("Informe seu nome ou guerra para comentar.");
      return;
    }

    if (cleanComment.length < 2) {
      toast.error("Escreva um comentário antes de enviar.");
      return;
    }

    addComment.mutate({
      missionId: mission.id,
      authorName: cleanName,
      content: cleanComment,
    });
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
            Comentários são públicos e não exigem login.
          </span>
        </div>

        {showComments && (
          <div className="mt-5 space-y-4 rounded-2xl border bg-slate-50/60 p-4">
            <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_auto]">
              <Input
                value={authorName}
                onChange={(event) => setAuthorName(event.target.value)}
                placeholder="Seu nome ou guerra"
              />
              <Textarea
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Ex.: Positivo, xerife. Ciente da formatura."
                rows={3}
              />
              <Button
                type="button"
                className="self-start bg-[#1a3a2a] text-white hover:bg-[#10281d] md:self-end"
                onClick={handleCommentSubmit}
                disabled={addComment.isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                Enviar
              </Button>
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
                    <p className="whitespace-pre-line text-sm text-muted-foreground">{comment.content}</p>
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

  useEffect(() => {
    setVisitorId(getOrCreateVisitorId());
    if (typeof window !== "undefined") {
      setVisitorName(window.localStorage.getItem(VISITOR_NAME_KEY) || "");
    }
  }, []);

  const { data: missions, isLoading } = trpc.missions.list.useQuery(
    visitorId ? { visitorId } : undefined
  );

  const handleSaveVisitorName = (name: string) => {
    const cleanName = name.trim();
    setVisitorName(cleanName);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(VISITOR_NAME_KEY, cleanName);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <section className="military-gradient py-12">
        <div className="container text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#c4a84b]/20 px-4 py-1.5">
            <Shield className="h-4 w-4 text-[#c4a84b]" />
            <span className="text-sm font-medium text-[#c4a84b]">Área Exclusiva</span>
          </div>
          <h1
            className="text-3xl font-bold text-white md:text-4xl"
            style={{ fontFamily: "Merriweather, serif" }}
          >
            CFAP 2026
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-white/60">
            Centro de Formação e Aperfeiçoamento de Praças — Missões, comunicados e orientações
            para os alunos do curso de formação da Polícia Militar do Amazonas.
          </p>
        </div>
        <div className="checkerboard-pattern w-full mt-8" />
      </section>

      <section className="bg-background py-10">
        <div className="container max-w-4xl">
          <Card className="mb-8 border-[#c4a84b]/30 bg-[#c4a84b]/5">
            <CardContent className="flex items-start gap-4 p-6">
              <Shield className="mt-1 h-8 w-8 flex-shrink-0 text-[#c4a84b]" />
              <div className="space-y-2">
                <h3 className="font-bold text-foreground">Atenção, Alunos do CFAP</h3>
                <p className="text-sm text-muted-foreground">
                  Agora cada comunicado pode receber confirmação pública de leitura no botão
                  <strong> Ciente</strong> e comentários sem login para tirar dúvidas rápidas ou
                  reforçar o recebimento da orientação.
                </p>
              </div>
            </CardContent>
          </Card>

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
        </div>
      </section>

      <Footer />
    </div>
  );
}
