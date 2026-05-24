import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Calendar, Heart, MessageCircle, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

/** Gera ou recupera um ID de visitante anônimo persistido no localStorage */
function getVisitorId(): string {
  const key = "pmam_visitor_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

/** Extrai o ID do vídeo de uma URL do YouTube */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export default function BlogDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const postId = params?.id ? parseInt(params.id) : null;
  const visitorId = useRef(getVisitorId());

  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: post, isLoading } = trpc.blog.getById.useQuery(
    { id: postId! },
    { enabled: !!postId }
  );

  const { data: likesData, refetch: refetchLikes } = trpc.blog.getLikes.useQuery(
    { postId: postId!, visitorId: visitorId.current },
    { enabled: !!postId }
  );

  const { data: comments, refetch: refetchComments } = trpc.blog.getComments.useQuery(
    { postId: postId! },
    { enabled: !!postId }
  );

  const toggleLikeMutation = trpc.blog.toggleLike.useMutation({
    onSuccess: () => refetchLikes(),
    onError: () => toast.error("Erro ao registrar curtida"),
  });

  const addCommentMutation = trpc.blog.addComment.useMutation({
    onSuccess: () => {
      setCommentText("");
      setCommentName("");
      refetchComments();
      toast.success("Comentário enviado!");
    },
    onError: () => toast.error("Erro ao enviar comentário"),
  });

  const deleteCommentMutation = trpc.blog.deleteComment.useMutation({
    onSuccess: () => {
      refetchComments();
      toast.success("Comentário removido");
    },
  });

  const handleLike = () => {
    if (!postId) return;
    toggleLikeMutation.mutate({ postId, visitorId: visitorId.current });
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId || !commentName.trim() || !commentText.trim()) return;
    setIsSubmitting(true);
    try {
      await addCommentMutation.mutateAsync({
        postId,
        authorName: commentName.trim(),
        content: commentText.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!postId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Post não encontrado</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#c4a84b]" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Post não encontrado</p>
        </div>
        <Footer />
      </div>
    );
  }

  const youtubeId = post.youtubeUrl ? extractYouTubeId(post.youtubeUrl) : null;
  const liked = likesData?.liked ?? false;
  const likesCount = likesData?.count ?? 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero com imagem de capa — altura fixa, nunca empurra conteúdo */}
      {post.imageUrl && (
        <div className="relative h-64 md:h-80 w-full overflow-hidden bg-muted">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      {/* Conteúdo principal — largura máxima 3xl, padding lateral consistente */}
      <main className="flex-1 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">

          {/* Botão Voltar */}
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Home
          </Button>

          <article>
            {/* Título */}
            <h1
              className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight"
              style={{ fontFamily: "Merriweather, serif" }}
            >
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#c4a84b]" />
                <time dateTime={post.createdAt.toISOString()}>
                  {new Date(post.createdAt).toLocaleDateString("pt-BR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
              <span>
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>

            {/* Corpo do post — overflow controlado, imagens limitadas ao container */}
            <div
              className="prose prose-sm md:prose-base max-w-none text-foreground"
              style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Player YouTube */}
            {youtubeId && (
              <div className="mt-8">
                <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingTop: "56.25%" }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title="Vídeo do YouTube"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-0"
                  />
                </div>
              </div>
            )}

            {/* Estilos do conteúdo do editor */}
            <style>{`
              .prose img { max-width: 100% !important; height: auto !important; border-radius: 0.5rem; margin: 0.75rem 0; }
              .prose blockquote { border-left: 4px solid #c4a84b; padding-left: 1rem; color: #6b7280; font-style: italic; }
              .prose ul { list-style-type: disc; padding-left: 1.5rem; }
              .prose ol { list-style-type: decimal; padding-left: 1.5rem; }
              .prose h2 { font-size: 1.5rem; font-weight: bold; margin: 1rem 0 0.5rem; }
              .prose h3 { font-size: 1.25rem; font-weight: bold; margin: 0.75rem 0 0.5rem; }
              .prose a { color: #c4a84b; text-decoration: underline; }
              .prose pre { background: #1f2937; color: #f3f4f6; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
              .prose code { background: #f3f4f6; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.875rem; }
              /* Imagens com float do editor */
              .prose img[style*="float: left"] { float: left; margin: 0 1rem 0.5rem 0; }
              .prose img[style*="float: right"] { float: right; margin: 0 0 0.5rem 1rem; }
              .prose::after { content: ""; display: table; clear: both; }
            `}</style>
          </article>

          {/* Barra de curtidas */}
          <div className="mt-8 pt-6 border-t border-border flex items-center gap-4">
            <button
              onClick={handleLike}
              disabled={toggleLikeMutation.isPending}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-medium
                ${liked
                  ? "bg-red-50 border-red-300 text-red-600 hover:bg-red-100"
                  : "border-border text-muted-foreground hover:border-red-300 hover:text-red-500"
                }`}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : ""}`} />
              {likesCount > 0 ? `${likesCount} ` : ""}{liked ? "Curtido" : "Curtir"}
            </button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              {comments?.length ?? 0} comentário{(comments?.length ?? 0) !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Seção de comentários */}
          <section className="mt-8 pt-6 border-t border-border">
            <h2 className="text-xl font-bold text-foreground mb-6">Comentários</h2>

            {/* Lista de comentários */}
            {comments && comments.length > 0 ? (
              <div className="space-y-4 mb-8">
                {(comments as any[]).map((c) => (
                  <div key={c.id} className="bg-muted/40 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {c.authorName}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatDistanceToNow(new Date(c.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                          {c.content}
                        </p>
                      </div>
                      {user?.role === "admin" && (
                        <button
                          onClick={() => deleteCommentMutation.mutate({ commentId: c.id })}
                          className="text-muted-foreground hover:text-red-500 transition-colors shrink-0 mt-0.5"
                          title="Remover comentário"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-8">
                Nenhum comentário ainda. Seja o primeiro!
              </p>
            )}

            {/* Formulário de novo comentário */}
            <form onSubmit={handleComment} className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">Deixe seu comentário</h3>
              <input
                type="text"
                placeholder="Seu nome"
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                maxLength={80}
                required
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm
                  placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#c4a84b]/40"
              />
              <textarea
                placeholder="Escreva seu comentário..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={2000}
                required
                rows={4}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm
                  placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#c4a84b]/40 resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{commentText.length}/2000</span>
                <Button
                  type="submit"
                  disabled={isSubmitting || !commentName.trim() || !commentText.trim()}
                  className="bg-[#1a3a2a] text-white hover:bg-[#10281d] gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Enviar
                </Button>
              </div>
            </form>
          </section>

          {/* Mais comunicados — sempre abaixo de tudo */}
          <div className="mt-12 pt-8 border-t border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">Mais Comunicados</h2>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="border-[#c4a84b]/30 text-[#c4a84b] hover:bg-[#c4a84b]/10"
            >
              Ver todos os posts
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
