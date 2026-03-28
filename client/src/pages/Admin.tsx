import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Shield, Music, Target, BarChart3, Plus, Pencil, Trash2,
  LogIn, ArrowLeft, Upload, Youtube, Save, AlertTriangle
} from "lucide-react";

const categoryOptions = [
  { value: "nacional", label: "Hino Nacional" },
  { value: "militar", label: "Canção Militar" },
  { value: "pmam", label: "Canção PMAM" },
  { value: "arma", label: "Canção de Arma" },
  { value: "oracao", label: "Oração" },
];

const priorityOptions = [
  { value: "normal", label: "Normal" },
  { value: "urgente", label: "Urgente" },
  { value: "critica", label: "Crítica" },
];

function HymnForm({ hymn, onSuccess }: { hymn?: any; onSuccess: () => void }) {
  const [form, setForm] = useState({
    number: hymn?.number ?? 0,
    title: hymn?.title ?? "",
    subtitle: hymn?.subtitle ?? "",
    author: hymn?.author ?? "",
    composer: hymn?.composer ?? "",
    category: hymn?.category ?? "pmam",
    lyrics: hymn?.lyrics ?? "",
    description: hymn?.description ?? "",
    youtubeUrl: hymn?.youtubeUrl ?? "",
    audioUrl: hymn?.audioUrl ?? "",
  });

  const utils = trpc.useUtils();
  const createMut = trpc.hymns.create.useMutation({
    onSuccess: () => { toast.success("Hino criado!"); utils.hymns.invalidate(); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.hymns.update.useMutation({
    onSuccess: () => { toast.success("Hino atualizado!"); utils.hymns.invalidate(); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.lyrics) { toast.error("Título e letra são obrigatórios"); return; }
    const data = {
      ...form,
      subtitle: form.subtitle || undefined,
      author: form.author || undefined,
      composer: form.composer || undefined,
      description: form.description || undefined,
      youtubeUrl: form.youtubeUrl || undefined,
      audioUrl: form.audioUrl || undefined,
      category: form.category as any,
    };
    if (hymn) {
      updateMut.mutate({ id: hymn.id, ...data });
    } else {
      createMut.mutate(data);
    }
  };

  const uploading = createMut.isPending || updateMut.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Número</Label>
          <Input type="number" value={form.number} onChange={e => setForm(f => ({ ...f, number: parseInt(e.target.value) || 0 }))} />
        </div>
        <div>
          <Label>Categoria</Label>
          <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categoryOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Título *</Label>
        <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
      </div>
      <div>
        <Label>Subtítulo</Label>
        <Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Autor / Letrista</Label>
          <Input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} />
        </div>
        <div>
          <Label>Compositor</Label>
          <Input value={form.composer} onChange={e => setForm(f => ({ ...f, composer: e.target.value }))} />
        </div>
      </div>
      <div>
        <Label>Descrição</Label>
        <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
      </div>
      <div>
        <Label>Letra *</Label>
        <Textarea value={form.lyrics} onChange={e => setForm(f => ({ ...f, lyrics: e.target.value }))} rows={10} required className="font-mono text-sm" />
      </div>
      <div>
        <Label className="flex items-center gap-2"><Youtube className="h-4 w-4 text-red-500" /> URL do YouTube</Label>
        <Input value={form.youtubeUrl} onChange={e => setForm(f => ({ ...f, youtubeUrl: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
      </div>
      <div>
        <Label className="flex items-center gap-2"><Music className="h-4 w-4" /> URL do Áudio (MP3)</Label>
        <Input value={form.audioUrl} onChange={e => setForm(f => ({ ...f, audioUrl: e.target.value }))} placeholder="https://..." />
      </div>
      <Button type="submit" className="w-full bg-[#1a3a2a] text-white gap-2" disabled={uploading}>
        <Save className="h-4 w-4" />
        {uploading ? "Salvando..." : hymn ? "Atualizar Hino" : "Criar Hino"}
      </Button>
    </form>
  );
}

function MissionForm({ mission, onSuccess }: { mission?: any; onSuccess: () => void }) {
  const [form, setForm] = useState({
    title: mission?.title ?? "",
    content: mission?.content ?? "",
    priority: mission?.priority ?? "normal",
  });

  const utils = trpc.useUtils();
  const createMut = trpc.missions.create.useMutation({
    onSuccess: () => { toast.success("Missão publicada!"); utils.missions.invalidate(); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.missions.update.useMutation({
    onSuccess: () => { toast.success("Missão atualizada!"); utils.missions.invalidate(); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) { toast.error("Título e conteúdo são obrigatórios"); return; }
    if (mission) {
      updateMut.mutate({ id: mission.id, ...form, priority: form.priority as any });
    } else {
      createMut.mutate({ ...form, priority: form.priority as any });
    }
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Título *</Label>
        <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
      </div>
      <div>
        <Label>Prioridade</Label>
        <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {priorityOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Conteúdo *</Label>
        <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={8} required />
      </div>
      <Button type="submit" className="w-full bg-[#1a3a2a] text-white gap-2" disabled={saving}>
        <Save className="h-4 w-4" />
        {saving ? "Salvando..." : mission ? "Atualizar Missão" : "Publicar Missão"}
      </Button>
    </form>
  );
}

function AudioUploader({ hymnId, onSuccess }: { hymnId: number; onSuccess: () => void }) {
  const [uploading, setUploading] = useState(false);
  const uploadMut = trpc.admin.uploadAudio.useMutation({
    onSuccess: () => { toast.success("Áudio enviado!"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { toast.error("Arquivo muito grande (máx 15MB)"); return; }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        uploadMut.mutate({ hymnId, fileName: file.name, fileBase64: base64, contentType: file.type });
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Erro ao ler arquivo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Label className="flex items-center gap-2 mb-2"><Upload className="h-4 w-4" /> Upload de Áudio (MP3)</Label>
      <Input type="file" accept="audio/*" onChange={handleFile} disabled={uploading || uploadMut.isPending} />
      {(uploading || uploadMut.isPending) && <p className="text-xs text-muted-foreground mt-1">Enviando...</p>}
    </div>
  );
}

export default function Admin() {
  const { user, isAuthenticated, loading } = useAuth();
  const [hymnDialogOpen, setHymnDialogOpen] = useState(false);
  const [missionDialogOpen, setMissionDialogOpen] = useState(false);
  const [editingHymn, setEditingHymn] = useState<any>(null);
  const [editingMission, setEditingMission] = useState<any>(null);

  const { data: stats } = trpc.admin.stats.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: hymns } = trpc.hymns.listAll.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: missions } = trpc.missions.listAll.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });

  const utils = trpc.useUtils();
  const deleteHymn = trpc.hymns.delete.useMutation({
    onSuccess: () => { toast.success("Hino removido"); utils.hymns.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMission = trpc.missions.delete.useMutation({
    onSuccess: () => { toast.success("Missão removida"); utils.missions.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const toggleHymn = trpc.hymns.update.useMutation({
    onSuccess: () => { utils.hymns.invalidate(); },
  });
  const toggleMission = trpc.missions.update.useMutation({
    onSuccess: () => { utils.missions.invalidate(); },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Verificando autenticação...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-8 text-center">
              <Shield className="h-16 w-16 text-[#1a3a2a] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
                Área Restrita
              </h2>
              <p className="text-muted-foreground mb-6">
                Esta área é exclusiva para administradores do Hinário PMAM.
                Faça login para acessar o painel de gerenciamento.
              </p>
              <a href={getLoginUrl()}>
                <Button className="bg-[#1a3a2a] text-white gap-2 w-full">
                  <LogIn className="h-4 w-4" />
                  Entrar como Administrador
                </Button>
              </a>
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
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <section className="military-gradient py-8">
        <div className="container">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-[#c4a84b]" />
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Merriweather, serif' }}>
                Painel Administrativo
              </h1>
              <p className="text-white/60 text-sm">Bem-vindo, {user?.name || "Administrador"}</p>
            </div>
          </div>
        </div>
        <div className="checkerboard-pattern w-full mt-6" />
      </section>

      <section className="py-8 bg-background">
        <div className="container">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="border-border/50">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#1a3a2a]/10 flex items-center justify-center">
                  <Music className="h-6 w-6 text-[#1a3a2a]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.totalHymns ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Hinos</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#c4a84b]/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-[#c4a84b]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.totalMissions ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Missões CFAP</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#1a2744]/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-[#1a2744]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.totalUsers ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Usuários</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="hymns">
            <TabsList className="mb-6">
              <TabsTrigger value="hymns" className="gap-2"><Music className="h-4 w-4" /> Hinos</TabsTrigger>
              <TabsTrigger value="missions" className="gap-2"><Target className="h-4 w-4" /> Missões CFAP</TabsTrigger>
            </TabsList>

            {/* HYMNS TAB */}
            <TabsContent value="hymns">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Gerenciar Hinos</h2>
                <Dialog open={hymnDialogOpen} onOpenChange={(o) => { setHymnDialogOpen(o); if (!o) setEditingHymn(null); }}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#1a3a2a] text-white gap-2" onClick={() => setEditingHymn(null)}>
                      <Plus className="h-4 w-4" /> Novo Hino
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingHymn ? "Editar Hino" : "Novo Hino"}</DialogTitle>
                    </DialogHeader>
                    <HymnForm hymn={editingHymn} onSuccess={() => setHymnDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-2">
                {hymns?.map((hymn) => (
                  <Card key={hymn.id} className="border-border/50">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#1a3a2a] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {String(hymn.number).padStart(2, "0")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{hymn.title}</p>
                        <p className="text-xs text-muted-foreground">{hymn.category} {hymn.author ? `• ${hymn.author}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Switch
                          checked={hymn.isActive}
                          onCheckedChange={(checked) => toggleHymn.mutate({ id: hymn.id, isActive: checked })}
                        />
                        <Button variant="ghost" size="icon" onClick={() => { setEditingHymn(hymn); setHymnDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => { if (confirm("Remover este hino?")) deleteHymn.mutate({ id: hymn.id }); }}
                        >
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Gerenciar Missões CFAP</h2>
                <Dialog open={missionDialogOpen} onOpenChange={(o) => { setMissionDialogOpen(o); if (!o) setEditingMission(null); }}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#c4a84b] text-[#1a1a1a] gap-2" onClick={() => setEditingMission(null)}>
                      <Plus className="h-4 w-4" /> Nova Missão
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingMission ? "Editar Missão" : "Nova Missão CFAP"}</DialogTitle>
                    </DialogHeader>
                    <MissionForm mission={editingMission} onSuccess={() => setMissionDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>

              {!missions || missions.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="p-12 text-center">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma missão publicada ainda.</p>
                    <p className="text-sm text-muted-foreground mt-1">Clique em "Nova Missão" para criar a primeira.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {missions.map((mission) => (
                    <Card key={mission.id} className="border-border/50">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground text-sm truncate">{mission.title}</p>
                            <Badge variant={mission.priority === "critica" ? "destructive" : "secondary"} className="text-xs">
                              {mission.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">{mission.content.substring(0, 100)}...</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Switch
                            checked={mission.isActive}
                            onCheckedChange={(checked) => toggleMission.mutate({ id: mission.id, isActive: checked })}
                          />
                          <Button variant="ghost" size="icon" onClick={() => { setEditingMission(mission); setMissionDialogOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => { if (confirm("Remover esta missão?")) deleteMission.mutate({ id: mission.id }); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
