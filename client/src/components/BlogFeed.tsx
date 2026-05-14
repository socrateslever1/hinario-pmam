import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Calendar, ChevronRight, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function BlogFeed() {
  const { data: posts, isLoading } = trpc.blog.list.useQuery();

  if (isLoading) {
    return (
      <section className="py-12 bg-background">
        <div className="container">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-[#c4a84b]" />
          </div>
        </div>
      </section>
    );
  }

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-background">
      <div className="container">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-muted rounded-full px-4 py-1.5 mb-4">
            <Calendar className="h-4 w-4 text-[#c4a84b]" />
            <span className="text-sm font-semibold uppercase tracking-widest text-[#1a3a2a]">
              Notícias & Avisos
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground" style={{ fontFamily: 'Merriweather, serif' }}>
            Comunicados Recentes
          </h2>
          <div className="w-20 h-1 bg-[#c4a84b] mt-6 rounded-full" />
        </div>

        {/* Scrollable Blog Feed */}
        <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-6 min-w-min">
            {posts.map((post) => (
              <div key={post.id} className="flex-shrink-0 w-80">
                <Card className="overflow-hidden border-border/50 hover:border-[#c4a84b]/50 h-full shadow-sm bg-white hover:shadow-md transition-all duration-300">
                  {/* Image */}
                  {post.imageUrl && (
                    <div className="h-48 w-full overflow-hidden bg-muted">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <CardContent className="p-6">
                    {/* Date */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Calendar className="h-4 w-4 text-[#c4a84b]" />
                      <time dateTime={post.createdAt.toISOString()}>
                        {formatDistanceToNow(new Date(post.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </time>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-foreground mb-3 line-clamp-2">
                      {post.title}
                    </h3>

                    {/* Preview */}
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {post.content.replace(/<[^>]*>/g, "").substring(0, 150)}...
                    </p>

                    {/* Read More Button */}
                    <Link href={`/blog/${post.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-[#c4a84b]/30 text-[#c4a84b] hover:bg-[#c4a84b]/10 gap-2"
                      >
                        Ler Mais
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Hint for Mobile */}
        <div className="md:hidden mt-4 text-center text-sm text-muted-foreground">
          ← Deslize para ver mais →
        </div>
      </div>
    </section>
  );
}
