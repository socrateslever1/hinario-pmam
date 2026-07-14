import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Calendar, ChevronRight, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

import { getStudentSession } from "@/lib/studentSession";

export default function BlogFeed() {
  const student = getStudentSession();
  const { data: posts, isLoading } = trpc.blog.list.useQuery(
    student ? { companhia: student.companhia, peloton: student.peloton } : undefined
  );

  if (isLoading) {
    return (
      <section className="bg-[#062417] py-5 md:bg-background md:py-8">
        <div className="container">
          <div className="flex h-64 items-center justify-center">
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
    <section className="bg-[#062417] px-4 py-5 text-[#f8f7f0] md:bg-background md:px-0 md:py-8 md:text-foreground">
      <div className="container">
        <div className="mb-3 flex items-center justify-between md:mb-5 md:block">
          <div className="mb-4 hidden items-center gap-2 rounded-full bg-muted px-4 py-1.5 md:inline-flex">
            <Calendar className="h-4 w-4 text-[#c4a84b]" />
            <span className="text-sm font-semibold uppercase tracking-widest text-[#1a3a2a]">
              Notícias & Avisos
            </span>
          </div>
          <h2 className="text-xl font-black tracking-normal text-white md:text-4xl md:text-foreground" style={{ fontFamily: "Merriweather, serif" }}>
            Comunicados Recentes
          </h2>
          <Link href="/cfap-2026" className="text-xs font-bold uppercase tracking-[0.14em] text-[#f0bd3a] md:hidden">
            Ver todos
          </Link>
          <div className="mt-4 hidden h-1 w-20 rounded-full bg-[#c4a84b] md:block" />
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
          <div className="flex min-w-min gap-3 md:gap-6">
            {posts.map((post) => (
              <div key={post.id} className="w-[21rem] flex-shrink-0 md:w-80">
                <Card className="h-full overflow-hidden rounded-lg border-white/10 bg-[#0b3323]/78 shadow-lg shadow-black/18 transition-all duration-300 hover:border-[#c4a84b]/50 hover:shadow-md md:rounded-lg md:border-border/50 md:bg-card md:shadow-sm">
                  <div className="flex md:block">
                    <div className="h-auto w-28 shrink-0 overflow-hidden bg-[#145c3a] md:h-48 md:w-full">
                      {post.imageUrl ? (
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full min-h-36 w-full items-center justify-center text-[#f0bd3a]">
                          <Calendar className="h-8 w-8" />
                        </div>
                      )}
                    </div>

                    <CardContent className="min-w-0 flex-1 p-4 md:p-6">
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-white/60 md:mb-3 md:text-sm md:text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 text-[#c4a84b] md:h-4 md:w-4" />
                        <time dateTime={post.createdAt.toISOString()}>
                          {formatDistanceToNow(new Date(post.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </time>
                      </div>

                      <h3 className="mb-2 line-clamp-2 text-sm font-black leading-tight text-white md:mb-3 md:text-lg md:text-foreground">
                        {post.title}
                      </h3>

                      <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-white/62 md:mb-4 md:line-clamp-3 md:text-sm md:text-muted-foreground">
                        {post.content.replace(/<[^>]*>/g, "").substring(0, 150)}...
                      </p>

                      <Link href={`/blog/${post.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg border-[#c4a84b]/30 bg-transparent px-3 text-xs font-black text-[#f0bd3a] hover:bg-[#c4a84b]/10 md:h-9 md:w-full md:text-[#c4a84b]"
                        >
                          Ler Mais
                          <ChevronRight className="ml-1 h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-1 text-center text-xs font-semibold text-white/45 md:hidden">
          Deslize para ver mais
        </div>
      </div>
    </section>
  );
}
