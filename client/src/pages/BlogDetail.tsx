import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function BlogDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const postId = params?.id ? parseInt(params.id) : null;

  const { data: post, isLoading } = trpc.blog.getById.useQuery(
    { id: postId! },
    { enabled: !!postId }
  );

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero with Image */}
      {post.imageUrl && (
        <div className="relative w-full overflow-hidden bg-muted" style={{ maxHeight: '60vw', minHeight: '200px' }}>
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-contain block"
            style={{ maxWidth: '100%', display: 'block' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      {/* Content */}
      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-8 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Home
          </Button>

          <article>
            {/* Title */}
            <h1
              className="text-4xl md:text-5xl font-bold text-foreground mb-6"
              style={{ fontFamily: "Merriweather, serif" }}
            >
              {post.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b border-border">
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

            {/* Body */}
            <div
              className="prose prose-sm md:prose-base max-w-none text-foreground"
              style={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Player YouTube */}
            {post.youtubeUrl && (() => {
              // Extrair o ID do vídeo do YouTube
              const ytMatch = post.youtubeUrl.match(
                /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/
              );
              const videoId = ytMatch?.[1];
              if (!videoId) return null;
              return (
                <div className="mt-8">
                  <div
                    className="relative w-full rounded-lg overflow-hidden"
                    style={{ paddingTop: '56.25%' }}
                  >
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title="Vídeo do YouTube"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full border-0"
                    />
                  </div>
                </div>
              );
            })()}
            <style>{`
              .prose img { max-width: 100% !important; height: auto !important; display: block; border-radius: 0.5rem; margin: 0.75rem auto; }
              .prose blockquote { border-left: 4px solid #c4a84b; padding-left: 1rem; color: #6b7280; font-style: italic; }
              .prose ul { list-style-type: disc; padding-left: 1.5rem; }
              .prose ol { list-style-type: decimal; padding-left: 1.5rem; }
              .prose h2 { font-size: 1.5rem; font-weight: bold; margin: 1rem 0 0.5rem; }
              .prose h3 { font-size: 1.25rem; font-weight: bold; margin: 0.75rem 0 0.5rem; }
              .prose a { color: #c4a84b; text-decoration: underline; }
              .prose pre { background: #1f2937; color: #f3f4f6; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
              .prose code { background: #f3f4f6; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.875rem; }
            `}</style>
          </article>

          {/* Related Posts Section */}
          <div className="mt-16 pt-8 border-t border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6">Mais Comunicados</h2>
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
