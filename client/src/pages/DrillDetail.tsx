import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useRoute, Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ArrowLeft, Play, FileText, Image as ImageIcon, Users,
  Clock, Zap, AlertCircle, Download, ExternalLink
} from "lucide-react";
import { Streamdown } from "streamdown";

const difficultyColors: Record<string, string> = {
  basico: "bg-green-100 text-green-800",
  intermediario: "bg-yellow-100 text-yellow-800",
  avancado: "bg-red-100 text-red-800",
};

const difficultyLabels: Record<string, string> = {
  basico: "Básico",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

export default function DrillDetail() {
  const [, params] = useRoute("/drill/:id");
  const drillId = params?.id ? Number(params.id) : null;

  const { data: drill, isLoading, isError } = trpc.drill.getById.useQuery(
    { id: drillId! },
    { enabled: !!drillId }
  );

  if (!drillId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Ordem Unida não encontrada.</p>
              <Link href="/drill">
                <Button className="bg-[#1a3a2a] text-white gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
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
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Zap className="h-12 w-12 text-[#c4a84b] mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !drill) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Erro ao carregar a ordem unida.</p>
              <Link href="/drill">
                <Button className="bg-[#1a3a2a] text-white gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero Section with Image */}
      <section className="relative py-8 md:py-12 px-4">
        <div className="container max-w-4xl mx-auto">
          <Link href="/drill">
            <Button variant="ghost" size="icon" className="mb-4 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          {drill.imageUrl && (
            <div className="relative w-full h-64 md:h-96 bg-muted rounded-lg overflow-hidden mb-6">
              <img
                src={drill.imageUrl}
                alt={drill.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground" style={{ fontFamily: 'Merriweather, serif' }}>
                {drill.title}
              </h1>
              {drill.subtitle && (
                <p className="text-lg text-muted-foreground mt-2">{drill.subtitle}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {drill.category && (
                <Badge variant="secondary">{drill.category}</Badge>
              )}
              {drill.difficulty && (
                <Badge className={difficultyColors[drill.difficulty] || "bg-gray-100 text-gray-800"}>
                  {difficultyLabels[drill.difficulty]}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {drill.duration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{drill.duration} minutos</span>
                </div>
              )}
              {drill.instructor && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{drill.instructor}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="flex-1 py-8 px-4">
        <div className="container max-w-4xl mx-auto">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              {drill.content && <TabsTrigger value="content">Conteúdo</TabsTrigger>}
              {(drill.videoUrl || drill.pdfUrl) && <TabsTrigger value="media">Mídia</TabsTrigger>}
              {(drill.prerequisites || drill.learningOutcomes) && <TabsTrigger value="details">Detalhes</TabsTrigger>}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {drill.description && (
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-foreground mb-3">Descrição</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{drill.description}</p>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {drill.videoUrl && (
                  <Card className="border-border/50">
                    <CardContent className="p-6 text-center">
                      <Play className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <p className="font-medium text-foreground mb-3">Vídeo Disponível</p>
                      <a href={drill.videoUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-2">
                          <ExternalLink className="h-3 w-3" />
                          Assistir
                        </Button>
                      </a>
                    </CardContent>
                  </Card>
                )}

                {drill.pdfUrl && (
                  <Card className="border-border/50">
                    <CardContent className="p-6 text-center">
                      <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="font-medium text-foreground mb-3">Material em PDF</p>
                      <a href={drill.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-2">
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                      </a>
                    </CardContent>
                  </Card>
                )}

                {drill.imageUrl && (
                  <Card className="border-border/50">
                    <CardContent className="p-6 text-center">
                      <ImageIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="font-medium text-foreground mb-3">Imagem</p>
                      <a href={drill.imageUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-2">
                          <ExternalLink className="h-3 w-3" />
                          Ver
                        </Button>
                      </a>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Content Tab */}
            {drill.content && (
              <TabsContent value="content" className="space-y-6">
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <Streamdown>{drill.content}</Streamdown>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Media Tab */}
            {(drill.videoUrl || drill.pdfUrl) && (
              <TabsContent value="media" className="space-y-6">
                {drill.videoUrl && (
                  <Card className="border-border/50">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-foreground mb-4">Vídeo Instrucional</h3>
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <a href={drill.videoUrl} target="_blank" rel="noopener noreferrer">
                          <Button className="bg-[#1a3a2a] text-white gap-2">
                            <Play className="h-4 w-4" />
                            Assistir Vídeo
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {drill.pdfUrl && (
                  <Card className="border-border/50">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-foreground mb-4">Material Didático</h3>
                      <p className="text-muted-foreground mb-4">
                        Baixe o material em PDF para estudo e referência.
                      </p>
                      <a href={drill.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Button className="bg-[#1a3a2a] text-white gap-2">
                          <Download className="h-4 w-4" />
                          Baixar PDF
                        </Button>
                      </a>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}

            {/* Details Tab */}
            {(drill.prerequisites || drill.learningOutcomes) && (
              <TabsContent value="details" className="space-y-6">
                {drill.prerequisites && (
                  <Card className="border-border/50">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-foreground mb-3">Pré-requisitos</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{drill.prerequisites}</p>
                    </CardContent>
                  </Card>
                )}

                {drill.learningOutcomes && (
                  <Card className="border-border/50">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-foreground mb-3">Resultados de Aprendizado</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{drill.learningOutcomes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
}
