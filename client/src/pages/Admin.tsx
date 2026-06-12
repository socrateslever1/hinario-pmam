import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Star, Music, Target, Plus, Pencil, Trash2,
  LogIn, ArrowLeft, Youtube, FileText, Shield, LogOut,
  Clock, Search, Users, GraduationCap, Settings, ClipboardList
} from "lucide-react";
import { buildLyricsSyncLines, hasLyricsSyncData } from "@/lib/lyricsSync";
import { useIsMobile } from "@/hooks/useMobile";
import { BlogManagementPanel } from "@/components/BlogManagementPanel";

// Importando os subcomponentes modulares
import { DrillForm } from "@/components/admin/DrillForm";
import { HymnForm } from "@/components/admin/HymnForm";
import { MissionForm } from "@/components/admin/MissionForm";
import { SettingsTab } from "@/components/admin/SettingsTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { GradeAdminTab } from "@/components/admin/GradeAdminTab";
import { ServiceScaleTab } from "@/components/admin/ServiceScaleTab";

export default function Admin() {
  const isMobile = useIsMobile();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  
  const [hymnDialogOpen, setHymnDialogOpen] = useState(false);
  const [missionDialogOpen, setMissionDialogOpen] = useState(false);
  const [editingHymn, setEditingHymn] = useState<any>(null);
  const [editingMission, setEditingMission] = useState<any>(null);
  const [editingDrill, setEditingDrill] = useState<any>(null);
  const [drillDialogOpen, setDrillDialogOpen] = useState(false);
  const [hymnSearchTerm, setHymnSearchTerm] = useState("");
  const [drillSearchTerm, setDrillSearchTerm] = useState("");

  const isAdminOrMaster = isAuthenticated && (user?.role === "admin" || user?.role === "master");
  const isMaster = isAuthenticated && user?.role === "master";

  const { data: scaleAccess, isLoading: scaleAccessLoading } = trpc.serviceScale.myAccess.useQuery(undefined, {
    enabled: isAuthenticated
  });

  const isXerife = Boolean(scaleAccess?.assignment);
  const isAuthorized = isAdminOrMaster || isXerife;

  const { data: stats } = trpc.admin.stats.useQuery(undefined, { enabled: isAdminOrMaster === true });
  const { data: hymns } = trpc.hymns.listAll.useQuery(undefined, { enabled: isAdminOrMaster === true });
  const { data: missions } = trpc.missions.listAll.useQuery(undefined, { enabled: isAdminOrMaster === true });
  const { data: drills } = trpc.drill.listAll.useQuery(undefined, { enabled: isAdminOrMaster === true });

  const utils = trpc.useUtils();
  const deleteHymn = trpc.hymns.delete.useMutation({
    onSuccess: async (_data, variables) => {
      toast.success("Hino removido");
      await Promise.all([
        utils.hymns.list.invalidate(),
        utils.hymns.listAll.invalidate(),
        utils.hymns.getById.invalidate({ id: variables.id }),
        utils.admin.invalidate(),
      ]);
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMission = trpc.missions.delete.useMutation({
    onSuccess: () => { toast.success("Missão removida"); utils.missions.invalidate(); utils.admin.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const toggleHymn = trpc.hymns.update.useMutation({
    onSuccess: async (_data, variables) => {
      await Promise.all([
        utils.hymns.list.invalidate(),
        utils.hymns.listAll.invalidate(),
        utils.hymns.getById.invalidate({ id: variables.id }),
      ]);
    },
  });
  const toggleMission = trpc.missions.update.useMutation({ onSuccess: () => { utils.missions.invalidate(); } });
  const deleteDrill = trpc.drill.delete.useMutation({
    onSuccess: () => { toast.success("Ordem Unida removida"); utils.drill.invalidate(); utils.admin.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const toggleDrill = trpc.drill.update.useMutation({ onSuccess: () => { utils.drill.invalidate(); } });

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading || (isAuthenticated && scaleAccessLoading)) {
    return (
      <div className="mobile-safe-bottom min-h-screen flex flex-col bg-[#f5f2e8] md:bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Star className="h-12 w-12 text-[#c4a84b] mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Verificando autenticação...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="mobile-safe-bottom min-h-screen flex flex-col bg-[#f5f2e8] md:bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4 border-border/50 bg-white text-foreground shadow-md">
            <CardContent className="p-8 text-center">
              <Star className="h-16 w-16 text-[#c4a84b] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
                Área do Xerife
              </h2>
              <p className="text-muted-foreground mb-6">
                Esta área é exclusiva para administradores do Hinário PMAM.
                Faça login para acessar o painel de gerenciamento.
              </p>
              <Link href="/login">
                <Button className="bg-[#1a3a2a] text-white gap-2 w-full">
                  <LogIn className="h-4 w-4" />
                  Entrar como Xerife
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" className="mt-3 gap-2 w-full">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao Início
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
    <div className="mobile-safe-bottom min-h-screen flex flex-col bg-[#f5f2e8] md:bg-background">
      <Navbar />

      <section className="bg-white border-b border-border/40 px-4 pb-7 pt-6 md:px-0 md:py-8">
        <div className="container">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-[#c4a84b]" />
              <div>
                <h1 className="text-2xl font-bold text-[#1a3a2a]" style={{ fontFamily: 'Merriweather, serif' }}>
                  Área do Xerife
                </h1>
                <p className="text-muted-foreground text-sm">Bem-vindo, {user?.name || "Xerife"} {isMaster && <Badge className="bg-[#c4a84b] text-[#1a1a1a] ml-2 text-xs">Master</Badge>}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full border-border text-muted-foreground hover:bg-[#1a3a2a]/5 hover:text-foreground gap-2 sm:w-auto" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
        <div className="checkerboard-pattern w-full mt-6 hidden md:block" />
      </section>

      <section className="bg-transparent px-4 py-6 md:bg-background md:px-0 md:py-8">
        <div className="container">
          {/* Stats */}
          {isAdminOrMaster && (
            <div className="mb-6 grid grid-cols-2 gap-3 md:mb-8 md:grid-cols-4 md:gap-4">
              <Card className="border-border/50 bg-white text-foreground shadow-sm">
                <CardContent className="flex min-w-0 items-center gap-3 p-4 md:gap-4 md:p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1a3a2a]/10 md:h-12 md:w-12">
                    <Music className="h-5 w-5 shrink-0 text-[#1a3a2a] md:h-6 md:w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold leading-none text-foreground md:text-2xl">{stats?.totalHymns ?? 0}</p>
                    <p className="truncate text-xs text-muted-foreground md:text-sm">Hinos</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-white text-foreground shadow-sm">
                <CardContent className="flex min-w-0 items-center gap-3 p-4 md:gap-4 md:p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#c4a84b]/10 md:h-12 md:w-12">
                    <Shield className="h-5 w-5 shrink-0 text-[#c4a84b] md:h-6 md:w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold leading-none text-foreground md:text-2xl">{stats?.totalCharlieMike ?? 0}</p>
                    <p className="truncate text-xs text-muted-foreground md:text-sm">Charlie Mike</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-white text-foreground shadow-sm">
                <CardContent className="flex min-w-0 items-center gap-3 p-4 md:gap-4 md:p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#c4a84b]/10 md:h-12 md:w-12">
                    <Target className="h-5 w-5 shrink-0 text-[#c4a84b] md:h-6 md:w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold leading-none text-foreground md:text-2xl">{stats?.totalMissions ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Missões CFAP</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-white text-foreground shadow-sm">
                <CardContent className="flex min-w-0 items-center gap-3 p-4 md:gap-4 md:p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1a2744]/10 md:h-12 md:w-12">
                    <Users className="h-5 w-5 shrink-0 text-[#1a2744] md:h-6 md:w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold leading-none text-foreground md:text-2xl">{stats?.totalUsers ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Usuários</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue={isAdminOrMaster ? "hymns" : "service_scale"}>
            <TabsList className="mb-6 grid h-auto w-full grid-cols-2 gap-2 rounded-xl bg-muted p-1 md:flex md:w-fit md:flex-wrap md:gap-0">
              {isAdminOrMaster && (
                <>
                  <TabsTrigger value="hymns" className="gap-2"><Music className="h-4 w-4" /> Hinos</TabsTrigger>
                  <TabsTrigger value="charlie_mike" className="gap-2"><Shield className="h-4 w-4" /> Charlie Mike</TabsTrigger>
                  <TabsTrigger value="missions" className="gap-2"><Target className="h-4 w-4" /> Missões CFAP</TabsTrigger>
                  <TabsTrigger value="drill" className="gap-2"><Target className="h-4 w-4" /> Ordem Unida</TabsTrigger>
                  <TabsTrigger value="blog" className="gap-2"><FileText className="h-4 w-4" /> Comunicados</TabsTrigger>
                  <TabsTrigger value="grades" className="gap-2"><GraduationCap className="h-4 w-4" /> Notas</TabsTrigger>
                </>
              )}
              <TabsTrigger value="service_scale" className="gap-2"><ClipboardList className="h-4 w-4" /> Efetivo</TabsTrigger>
              {isAdminOrMaster && (
                <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" /> Configurações</TabsTrigger>
              )}
              {isMaster && <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" /> Usuários</TabsTrigger>}
            </TabsList>

            {/* HYMNS TAB */}
            <TabsContent value="hymns">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold text-foreground">Gerenciar Hinos</h2>
                <Dialog open={hymnDialogOpen} onOpenChange={(o) => { setHymnDialogOpen(o); if (!o) setEditingHymn(null); }}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-[#1a3a2a] text-white gap-2 sm:w-auto" onClick={() => setEditingHymn(null)}>
                      <Plus className="h-4 w-4" /> Novo Hino
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] overflow-hidden p-4 sm:max-w-2xl sm:p-6">
                    <DialogHeader>
                      <DialogTitle>{editingHymn ? "Editar Hino" : "Novo Hino"}</DialogTitle>
                      <DialogDescription>Insira as informações básicas, letra e links de mídia do hino.</DialogDescription>
                    </DialogHeader>
                    <HymnForm key={editingHymn?.id ?? "new"} hymn={editingHymn} onSuccess={() => setHymnDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>

              {/* Search Filter for Admin */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-[#1a3a2a]" />
                <Input
                  placeholder="Buscar hino por título, número ou autor..."
                  className="pl-10 border-border/50 focus-visible:ring-[#1a3a2a] transition-all"
                  value={hymnSearchTerm}
                  onChange={(e) => setHymnSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                {hymns
                  ?.filter((hymn: any) => hymn.collection !== "tfm")
                  ?.filter((hymn: any) => {
                    const term = hymnSearchTerm.toLowerCase();
                    return (
                      hymn.title.toLowerCase().includes(term) ||
                      hymn.author?.toLowerCase().includes(term) ||
                      String(hymn.number).includes(term) ||
                      hymn.category.toLowerCase().includes(term)
                    );
                  })
                  ?.map((hymn: any) => (
                  <Card key={hymn.id} className="border-border/50">
                    <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="w-10 h-10 rounded-lg bg-[#1a3a2a] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {String(hymn.number).padStart(2, "0")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm break-words">{hymn.title}</p>
                        <p className="text-xs text-muted-foreground break-words">{hymn.category} {hymn.author ? `• ${hymn.author}` : ""}</p>
                      </div>
                      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
                        {hymn.youtubeUrl && <Youtube className="h-4 w-4 text-red-500" />}
                        {hymn.audioUrl && <Music className="h-4 w-4 text-green-600" />}
                        {hasLyricsSyncData(buildLyricsSyncLines(hymn.lyrics, hymn.lyricsSync)) && (
                          <Target className="h-4 w-4 text-[#c4a84b]" />
                        )}
                        <Switch checked={hymn.isActive} onCheckedChange={(checked) => toggleHymn.mutate({ id: hymn.id, isActive: checked })} />
                        
                        <Button variant="ghost" size="icon" className="text-[#c4a84b]" onClick={() => navigate(`/admin/sync/${hymn.id}`)}>
                          <Clock className="h-4 w-4" />
                        </Button>

                        <Button variant="ghost" size="icon" onClick={() => { setEditingHymn(hymn); setHymnDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive"
                          onClick={() => { if (confirm("Remover este hino?")) deleteHymn.mutate({ id: hymn.id }); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* CHARLIE MIKE TAB */}
            <TabsContent value="charlie_mike">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold text-foreground">Gerenciar Canções Charlie Mike (TFM)</h2>
                <Dialog open={hymnDialogOpen} onOpenChange={(o) => { setHymnDialogOpen(o); if (!o) setEditingHymn(null); }}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-[#1a3a2a] text-white gap-2 sm:w-auto" onClick={() => setEditingHymn({ collection: "tfm" })}>
                      <Plus className="h-4 w-4" /> Nova Canção
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] overflow-hidden p-4 sm:max-w-2xl sm:p-6">
                    <DialogHeader>
                      <DialogTitle>{editingHymn ? (editingHymn.id ? "Editar Canção" : "Nova Canção Charlie Mike") : "Nova Canção"}</DialogTitle>
                      <DialogDescription>Insira as informações básicas, letra e links de mídia da canção militar.</DialogDescription>
                    </DialogHeader>
                    <HymnForm key={editingHymn?.id ?? "new_cm"} hymn={editingHymn} onSuccess={() => setHymnDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>

              {/* Search Filter for Admin */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-[#1a3a2a]" />
                <Input
                  placeholder="Buscar canção por título, número ou autor..."
                  className="pl-10 border-border/50 focus-visible:ring-[#1a3a2a] transition-all"
                  value={hymnSearchTerm}
                  onChange={(e) => setHymnSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                {hymns
                  ?.filter((hymn: any) => hymn.collection === "tfm")
                  ?.filter((hymn: any) => {
                    const term = hymnSearchTerm.toLowerCase();
                    return (
                      hymn.title.toLowerCase().includes(term) ||
                      hymn.author?.toLowerCase().includes(term) ||
                      String(hymn.number).includes(term) ||
                      hymn.category.toLowerCase().includes(term)
                    );
                  })
                  ?.map((hymn: any) => (
                  <Card key={hymn.id} className="border-border/50">
                    <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="w-10 h-10 rounded-lg bg-[#1a3a2a] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {String(hymn.number).padStart(2, "0")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm break-words">{hymn.title}</p>
                        <p className="text-xs text-muted-foreground break-words">{hymn.category} {hymn.author ? `• ${hymn.author}` : ""}</p>
                      </div>
                      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
                        {hymn.youtubeUrl && <Youtube className="h-4 w-4 text-red-500" />}
                        {hymn.audioUrl && <Music className="h-4 w-4 text-green-600" />}
                        {hasLyricsSyncData(buildLyricsSyncLines(hymn.lyrics, hymn.lyricsSync)) && (
                          <Target className="h-4 w-4 text-[#c4a84b]" />
                        )}
                        <Switch checked={hymn.isActive} onCheckedChange={(checked) => toggleHymn.mutate({ id: hymn.id, isActive: checked })} />
                        
                        <Button variant="ghost" size="icon" className="text-[#c4a84b]" onClick={() => navigate(`/admin/sync/${hymn.id}`)}>
                          <Clock className="h-4 w-4" />
                        </Button>

                        <Button variant="ghost" size="icon" onClick={() => { setEditingHymn(hymn); setHymnDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive"
                          onClick={() => { if (confirm("Remover esta canção?")) deleteHymn.mutate({ id: hymn.id }); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* MISSIONS TAB */}
            <TabsContent value="missions">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold text-foreground">Gerenciar Missões CFAP</h2>
                <Dialog open={missionDialogOpen} onOpenChange={(o) => { setMissionDialogOpen(o); if (!o) setEditingMission(null); }}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-[#1a3a2a] text-white gap-2 sm:w-auto" onClick={() => setEditingMission(null)}>
                      <Plus className="h-4 w-4" /> Nova Missão
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] overflow-hidden p-4 sm:max-w-2xl sm:p-6">
                    <DialogHeader>
                      <DialogTitle>{editingMission ? "Editar Missão" : "Nova Missão"}</DialogTitle>
                      <DialogDescription>Crie instruções ou avisos urgentes sobre missões do curso.</DialogDescription>
                    </DialogHeader>
                    <MissionForm mission={editingMission} onSuccess={() => setMissionDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-2">
                {missions?.map((mission: any) => (
                  <Card key={mission.id} className="border-border/50">
                    <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{mission.title}</p>
                        <p className="text-xs text-muted-foreground truncate">Prioridade: {mission.priority}</p>
                      </div>
                      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
                        <Switch checked={mission.isActive} onCheckedChange={(checked) => toggleMission.mutate({ id: mission.id, isActive: checked })} />
                        <Button variant="ghost" size="icon" onClick={() => { setEditingMission(mission); setMissionDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive"
                          onClick={() => { if (confirm("Remover esta missão?")) deleteMission.mutate({ id: mission.id }); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* DRILL (ORDEM UNIDA) TAB */}
            <TabsContent value="drill">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold text-foreground">Gerenciar Ordem Unida</h2>
                <Dialog open={drillDialogOpen} onOpenChange={(o) => { setDrillDialogOpen(o); if (!o) setEditingDrill(null); }}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-[#1a3a2a] text-white gap-2 sm:w-auto" onClick={() => setEditingDrill(null)}>
                      <Plus className="h-4 w-4" /> Novo Movimento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] overflow-hidden p-4 sm:max-w-2xl sm:p-6">
                    <DialogHeader>
                      <DialogTitle>{editingDrill ? "Editar Ordem Unida" : "Nova Instrução de Ordem Unida"}</DialogTitle>
                      <DialogDescription>Crie instruções contendo títulos, categorias, instrutores e recursos de mídia.</DialogDescription>
                    </DialogHeader>
                    <DrillForm key={editingDrill?.id ?? "new"} drill={editingDrill} onSuccess={() => setDrillDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>

              {/* Search Filter for Admin */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-[#1a3a2a]" />
                <Input
                  placeholder="Buscar ordem unida por título, categoria ou instrutor..."
                  className="pl-10 border-border/50 focus-visible:ring-[#1a3a2a] transition-all"
                  value={drillSearchTerm}
                  onChange={(e) => setOriginalDrillSearchTerm(e)}
                />
              </div>

              {drills && (
                <div className="space-y-2">
                  {drills
                    .filter((drill: any) => {
                      const term = drillSearchTerm.toLowerCase();
                      return (
                        drill.title.toLowerCase().includes(term) ||
                        drill.category?.toLowerCase().includes(term) ||
                        drill.instructor?.toLowerCase().includes(term)
                      );
                    })
                    .map((drill: any) => (
                    <Card key={drill.id} className="border-border/50">
                      <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{drill.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{drill.category} {drill.instructor ? `• ${drill.instructor}` : ""}</p>
                        </div>
                        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
                          {drill.videoUrl && <Youtube className="h-4 w-4 text-red-500" />}
                          {drill.pdfUrl && <FileText className="h-4 w-4 text-blue-600" />}
                          {drill.imageUrl && <Music className="h-4 w-4 text-green-600" />}
                          <Switch checked={drill.isActive} onCheckedChange={(checked) => toggleDrill.mutate({ id: drill.id, isActive: checked })} />
                          <Button variant="ghost" size="icon" onClick={() => { setEditingDrill(drill); setDrillDialogOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive"
                            onClick={() => { if (confirm("Remover esta ordem unida?")) deleteDrill.mutate({ id: drill.id }); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* BLOG/COMUNICADOS TAB */}
            <TabsContent value="blog">
              <BlogManagementPanel />
            </TabsContent>

            {/* GRADES TAB */}
            <TabsContent value="grades">
              <GradeAdminTab />
            </TabsContent>

            {/* SERVICE SCALE TAB */}
            <TabsContent value="service_scale">
              <ServiceScaleTab />
            </TabsContent>

            {/* SETTINGS TAB */}
            <TabsContent value="settings">
              <SettingsTab />
            </TabsContent>

            {/* USERS TAB (Master only) */}
            {isMaster && (
              <TabsContent value="users">
                <UsersTab />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );

  function setOriginalDrillSearchTerm(e: React.ChangeEvent<HTMLInputElement>) {
    setDrillSearchTerm(e.target.value);
  }
}
