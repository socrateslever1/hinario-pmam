import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link, useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, LogIn, AlertTriangle, Shield } from "lucide-react";
import LyricsMarker from "@/components/LyricsMarker";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SyncStudio() {
  const { id } = useParams<{ id: string }>();
  const hymnId = parseInt(id || "0", 10);
  const [, navigate] = useLocation();

  const { user, isAuthenticated, loading } = useAuth();
  const isAdminOrMaster = isAuthenticated && (user?.role === "admin" || user?.role === "master");

  const { data: hymn, isLoading: isLoadingHymn } = trpc.hymns.getById.useQuery(
    { id: hymnId },
    { enabled: isAdminOrMaster && hymnId > 0 }
  );

  if (loading || (isAdminOrMaster && isLoadingHymn)) {
    return (
      <div className="flex min-h-screen flex-col bg-[#111] text-white overflow-hidden">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Clock className="mx-auto mb-4 h-12 w-12 animate-pulse text-[#c4a84b]" />
            <p className="text-white/60">Carregando estúdio...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdminOrMaster) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <Shield className="mx-auto mb-4 h-16 w-16 text-[#c4a84b]" />
              <h2 className="mb-2 text-2xl font-bold text-foreground" style={{ fontFamily: "Merriweather, serif" }}>
                Acesso Restrito
              </h2>
              <p className="mb-6 text-muted-foreground">
                O Estúdio de Sincronização é exclusivo para Administradores da corporação.
              </p>
              <Link href="/login">
                <Button className="w-full gap-2 bg-[#1a3a2a] text-white hover:bg-[#10241b]">
                  <LogIn className="h-4 w-4" /> Entrar como Xerife
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!hymn) {
    return (
      <div className="flex min-h-screen flex-col bg-[#111] text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md text-center">
            <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h2 className="mb-2 text-2xl font-bold text-white" style={{ fontFamily: "Merriweather, serif" }}>
              Hino não encontrado
            </h2>
            <p className="text-white/60 mb-6">O arquivo de áudio ou mídia solicitada não consta nos registros de estúdio.</p>
            <Link href="/xerife">
              <Button className="w-full gap-2 bg-[#c4a84b] text-[#111] hover:bg-[#a68d3a]">
                <ArrowLeft className="h-4 w-4" /> Voltar ao Painel
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-[#0a0a0a] text-white overflow-hidden">
      {/* Studio Header (Replaces normal Navbar for a cleaner embedded look) */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#111] px-4 py-3 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/xerife">
            <Button variant="ghost" size="icon" className="hover:bg-white/10 text-white/70 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-bold text-white sm:text-lg lg:text-xl truncate max-w-[200px] sm:max-w-md">
              Sincronização: {hymn.title}
            </h1>
            <p className="text-xs text-white/50">{hymn.category}</p>
          </div>
        </div>
        <Badge variant="outline" className="border-[#c4a84b] text-[#c4a84b] shrink-0 h-6">
          Modo Estúdio
        </Badge>
      </div>

      {/* Main Studio Workspace */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <LyricsMarker hymn={hymn} onSuccess={() => navigate("/xerife")} />
      </div>
    </div>
  );
}
