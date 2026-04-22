import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ArrowLeft, Play, FileText, Image as ImageIcon, Users,
  Clock, Zap, BookOpen, Target, Search, AlertCircle
} from "lucide-react";

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

export default function Drill() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const { data: drills, isLoading } = trpc.drill.list.useQuery();
  
  const categories = useMemo(() => {
    if (!drills) return [];
    const cats = new Set(drills.map((d: any) => d.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [drills]);

  const filteredDrills = useMemo(() => {
    if (!drills) return [];
    return drills.filter((drill: any) => {
      const matchesSearch = searchTerm === "" || 
        drill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drill.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drill.instructor?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !selectedCategory || drill.category === selectedCategory;
      const matchesDifficulty = !selectedDifficulty || drill.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [drills, searchTerm, selectedCategory, selectedDifficulty]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-12 md:py-20 px-4 bg-gradient-to-br from-[#1a3a2a]/5 via-transparent to-[#c4a84b]/5">
        <div className="container max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground" style={{ fontFamily: 'Merriweather, serif' }}>
              Ordem Unida
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Aprenda e domine as técnicas de ordem unida com nossos cursos estruturados, vídeos instrutivos e materiais de apoio.
          </p>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="py-8 px-4 border-b border-border/50">
        <div className="container max-w-6xl mx-auto space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, descrição ou instrutor..."
              className="pl-10 border-border/50 focus-visible:ring-[#1a3a2a]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Categoria:</span>
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className={selectedCategory === null ? "bg-[#1a3a2a] text-white" : ""}
              >
                Todas
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className={selectedCategory === cat ? "bg-[#1a3a2a] text-white" : ""}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Dificuldade:</span>
              <Button
                variant={selectedDifficulty === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDifficulty(null)}
                className={selectedDifficulty === null ? "bg-[#1a3a2a] text-white" : ""}
              >
                Todas
              </Button>
              {["basico", "intermediario", "avancado"].map((diff) => (
                <Button
                  key={diff}
                  variant={selectedDifficulty === diff ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDifficulty(diff)}
                  className={selectedDifficulty === diff ? "bg-[#1a3a2a] text-white" : ""}
                >
                  {difficultyLabels[diff]}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="flex-1 py-12 px-4">
        <div className="container max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Zap className="h-12 w-12 text-[#c4a84b] mx-auto mb-4 animate-pulse" />
                <p className="text-muted-foreground">Carregando ordens unidas...</p>
              </div>
            </div>
          ) : filteredDrills.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma ordem unida encontrada.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDrills.map((drill: any) => (
                <Link key={drill.id} href={`/drill/${drill.id}`}>
                  <Card className="border-border/50 hover:border-[#1a3a2a]/30 transition-all cursor-pointer h-full">
                    {drill.imageUrl && (
                      <div className="relative w-full h-40 bg-muted overflow-hidden rounded-t-lg">
                        <img
                          src={drill.imageUrl}
                          alt={drill.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <CardContent className="p-4 flex flex-col gap-3">
                      <div>
                        <h3 className="font-semibold text-foreground line-clamp-2">{drill.title}</h3>
                        {drill.subtitle && (
                          <p className="text-xs text-muted-foreground mt-1">{drill.subtitle}</p>
                        )}
                      </div>

                      {drill.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{drill.description}</p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {drill.category && (
                          <Badge variant="secondary" className="text-xs">{drill.category}</Badge>
                        )}
                        {drill.difficulty && (
                          <Badge className={`text-xs ${difficultyColors[drill.difficulty] || "bg-gray-100 text-gray-800"}`}>
                            {difficultyLabels[drill.difficulty]}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {drill.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{drill.duration} min</span>
                          </div>
                        )}
                        {drill.instructor && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{drill.instructor}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-2 pt-2 border-t border-border/50">
                        {drill.videoUrl && (
                          <div className="flex items-center gap-1 text-xs text-red-600">
                            <Play className="h-3 w-3" />
                            <span>Vídeo</span>
                          </div>
                        )}
                        {drill.pdfUrl && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <FileText className="h-3 w-3" />
                            <span>PDF</span>
                          </div>
                        )}
                        {drill.imageUrl && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <ImageIcon className="h-3 w-3" />
                            <span>Imagem</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
