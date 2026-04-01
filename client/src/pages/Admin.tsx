import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Star, Music, Target, BarChart3, Plus, Pencil, Trash2,
  LogIn, ArrowLeft, Upload, Youtube, Save, Users, Settings,
  Phone, Mail, MapPin, Instagram, Facebook, FileText, Shield, LogOut,
  Clock
} from "lucide-react";
import LyricsMarker from "@/components/LyricsMarker";
import { buildLyricsSyncLines, hasLyricsSyncData } from "@/lib/lyricsSync";
import { useIsMobile } from "@/hooks/useMobile";

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

function getDefaultHymnFormState(hymn?: any) {
  return {
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
  };
}

function HymnForm({ hymn, onSuccess }: { hymn?: any; onSuccess: () => void }) {
  const [form, setForm] = useState(() => getDefaultHymnFormState(hymn));

  const utils = trpc.useUtils();
  const createMut = trpc.hymns.create.useMutation({
    onSuccess: async () => {
      toast.success("Hino criado!");
      await Promise.all([
        utils.hymns.list.invalidate(),
        utils.hymns.listAll.invalidate(),
      ]);
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.hymns.update.useMutation({
    onSuccess: async (_data, variables) => {
      toast.success("Hino atualizado!");
      await Promise.all([
        utils.hymns.list.invalidate(),
        utils.hymns.listAll.invalidate(),
        utils.hymns.getById.invalidate({ id: variables.id }),
        utils.hymns.getByNumber.invalidate({ number: variables.number }),
      ]);
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    setForm(getDefaultHymnFormState(hymn));
  }, [hymn]);

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
    if (hymn) { updateMut.mutate({ id: hymn.id, ...data }); }
    else { createMut.mutate(data); }
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Número</Label><Input type="number" value={form.number} onChange={e => setForm(f => ({ ...f, number: parseInt(e.target.value) || 0 }))} /></div>
        <div><Label>Categoria</Label>
          <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{categoryOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
      <div><Label>Subtítulo</Label><Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Autor / Letrista</Label><Input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} /></div>
        <div><Label>Compositor</Label><Input value={form.composer} onChange={e => setForm(f => ({ ...f, composer: e.target.value }))} /></div>
      </div>
      <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
      <div><Label>Letra *</Label><Textarea value={form.lyrics} onChange={e => setForm(f => ({ ...f, lyrics: e.target.value }))} rows={10} required className="font-mono text-sm" /></div>
      <div><Label className="flex items-center gap-2"><Youtube className="h-4 w-4 text-red-500" /> URL do YouTube</Label>
        <Input value={form.youtubeUrl} onChange={e => setForm(f => ({ ...f, youtubeUrl: e.target.value }))} placeholder="https://youtube.com/watch?v=..." /></div>
      <div><Label className="flex items-center gap-2"><Music className="h-4 w-4" /> URL do Áudio (MP3)</Label>
        <Input value={form.audioUrl} onChange={e => setForm(f => ({ ...f, audioUrl: e.target.value }))} placeholder="https://..." /></div>
      <Button type="submit" className="w-full bg-[#1a3a2a] text-white gap-2" disabled={saving}>
        <Save className="h-4 w-4" />{saving ? "Salvando..." : hymn ? "Atualizar Hino" : "Criar Hino"}
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
    if (mission) { updateMut.mutate({ id: mission.id, ...form, priority: form.priority as any }); }
    else { createMut.mutate({ ...form, priority: form.priority as any }); }
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
      <div><Label>Prioridade</Label>
        <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{priorityOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Conteúdo *</Label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={8} required /></div>
      <Button type="submit" className="w-full bg-[#1a3a2a] text-white gap-2" disabled={saving}>
        <Save className="h-4 w-4" />{saving ? "Salvando..." : mission ? "Atualizar Missão" : "Publicar Missão"}
      </Button>
    </form>
  );
}

function SettingsTab() {
  const { data: settings } = trpc.settings.getAll.useQuery();
  const [form, setForm] = useState({
    footer_phone: "",
    footer_email: "",
    footer_address: "",
    footer_text: "",
    footer_instagram: "",
    footer_facebook: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        footer_phone: settings.footer_phone || "",
        footer_email: settings.footer_email || "",
        footer_address: settings.footer_address || "",
        footer_text: settings.footer_text || "",
        footer_instagram: settings.footer_instagram || "",
        footer_facebook: settings.footer_facebook || "",
      });
    }
  }, [settings]);

  const utils = trpc.useUtils();
  const updateBatch = trpc.settings.updateBatch.useMutation({
    onSuccess: () => { toast.success("Configurações salvas!"); utils.settings.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    const settingsArr = Object.entries(form).map(([key, value]) => ({ key, value: value || "" }));
    updateBatch.mutate({ settings: settingsArr });
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#c4a84b]" /> Informações do Rodapé
          </h3>
          <div className="space-y-4">
            <div><Label className="flex items-center gap-2"><FileText className="h-3 w-3" /> Texto do Rodapé</Label>
              <Input value={form.footer_text} onChange={e => setForm(f => ({ ...f, footer_text: e.target.value }))} placeholder="Hinos e Canções Militares da PMAM" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label className="flex items-center gap-2"><Phone className="h-3 w-3" /> Telefone</Label>
                <Input value={form.footer_phone} onChange={e => setForm(f => ({ ...f, footer_phone: e.target.value }))} placeholder="(92) 3XXX-XXXX" /></div>
              <div><Label className="flex items-center gap-2"><Mail className="h-3 w-3" /> Email</Label>
                <Input value={form.footer_email} onChange={e => setForm(f => ({ ...f, footer_email: e.target.value }))} placeholder="contato@pmam.am.gov.br" /></div>
            </div>
            <div><Label className="flex items-center gap-2"><MapPin className="h-3 w-3" /> Endereço</Label>
              <Input value={form.footer_address} onChange={e => setForm(f => ({ ...f, footer_address: e.target.value }))} placeholder="Manaus - AM" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label className="flex items-center gap-2"><Instagram className="h-3 w-3" /> Instagram (URL)</Label>
                <Input value={form.footer_instagram} onChange={e => setForm(f => ({ ...f, footer_instagram: e.target.value }))} placeholder="https://instagram.com/..." /></div>
              <div><Label className="flex items-center gap-2"><Facebook className="h-3 w-3" /> Facebook (URL)</Label>
                <Input value={form.footer_facebook} onChange={e => setForm(f => ({ ...f, footer_facebook: e.target.value }))} placeholder="https://facebook.com/..." /></div>
            </div>
          </div>
          <Button onClick={handleSave} className="mt-6 bg-[#1a3a2a] text-white gap-2" disabled={updateBatch.isPending}>
            <Save className="h-4 w-4" />{updateBatch.isPending ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function UsersTab() {
  const { data: usersList } = trpc.users.list.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "admin" as "user" | "admin" });

  const utils = trpc.useUtils();
  const createUser = trpc.users.create.useMutation({
    onSuccess: () => { toast.success("Usuário criado!"); utils.users.invalidate(); setDialogOpen(false); setNewUser({ name: "", email: "", password: "", role: "admin" }); },
    onError: (e) => toast.error(e.message),
  });
  const deleteUserMut = trpc.users.delete.useMutation({
    onSuccess: () => { toast.success("Usuário removido!"); utils.users.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const updateRole = trpc.users.updateRole.useMutation({
    onSuccess: () => { toast.success("Papel atualizado!"); utils.users.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Gerenciar Usuários</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#c4a84b] text-[#1a1a1a] gap-2"><Plus className="h-4 w-4" /> Novo Usuário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Novo Usuário</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createUser.mutate(newUser); }} className="space-y-4">
              <div><Label>Nome *</Label><Input value={newUser.name} onChange={e => setNewUser(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><Label>Email *</Label><Input type="email" value={newUser.email} onChange={e => setNewUser(f => ({ ...f, email: e.target.value }))} required /></div>
              <div><Label>Senha *</Label><Input type="password" value={newUser.password} onChange={e => setNewUser(f => ({ ...f, password: e.target.value }))} required minLength={4} /></div>
              <div><Label>Papel</Label>
                <Select value={newUser.role} onValueChange={v => setNewUser(f => ({ ...f, role: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-[#1a3a2a] text-white gap-2" disabled={createUser.isPending}>
                <Save className="h-4 w-4" />{createUser.isPending ? "Criando..." : "Criar Usuário"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {usersList?.map((u: any) => (
          <Card key={u.id} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#1a3a2a] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {(u.name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{u.name || "Sem nome"}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <Badge className={u.role === "master" ? "bg-[#c4a84b] text-[#1a1a1a]" : u.role === "admin" ? "bg-[#1a3a2a] text-white" : "bg-gray-200 text-gray-700"}>
                {u.role === "master" ? "Xerife Master" : u.role === "admin" ? "Administrador" : "Usuário"}
              </Badge>
              {u.role !== "master" && (
                <div className="flex gap-1">
                  <Select value={u.role} onValueChange={v => updateRole.mutate({ id: u.id, role: v as any })}>
                    <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="text-destructive h-8 w-8"
                    onClick={() => { if (confirm("Remover este usuário?")) deleteUserMut.mutate({ id: u.id }); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function Admin() {
  const isMobile = useIsMobile();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [hymnDialogOpen, setHymnDialogOpen] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [missionDialogOpen, setMissionDialogOpen] = useState(false);
  const [editingHymn, setEditingHymn] = useState<any>(null);
  const [syncingHymn, setSyncingHymn] = useState<any>(null);
  const [editingMission, setEditingMission] = useState<any>(null);

  const isAdminOrMaster = isAuthenticated && (user?.role === "admin" || user?.role === "master");
  const isMaster = isAuthenticated && user?.role === "master";

  const { data: stats } = trpc.admin.stats.useQuery(undefined, { enabled: isAdminOrMaster === true });
  const { data: hymns } = trpc.hymns.listAll.useQuery(undefined, { enabled: isAdminOrMaster === true });
  const { data: missions } = trpc.missions.listAll.useQuery(undefined, { enabled: isAdminOrMaster === true });

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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
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

  if (!isAdminOrMaster) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
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
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <section className="military-gradient py-8">
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-[#c4a84b]" />
              <div>
                <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Merriweather, serif' }}>
                  Área do Xerife
                </h1>
                <p className="text-white/60 text-sm">Bem-vindo, {user?.name || "Xerife"} {isMaster && <Badge className="bg-[#c4a84b] text-[#1a1a1a] ml-2 text-xs">Master</Badge>}</p>
              </div>
            </div>
            <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Sair
            </Button>
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
                  <Users className="h-6 w-6 text-[#1a2744]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.totalUsers ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Usuários</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="hymns">
            <TabsList className="mb-6 flex-wrap">
              <TabsTrigger value="hymns" className="gap-2"><Music className="h-4 w-4" /> Hinos</TabsTrigger>
              <TabsTrigger value="missions" className="gap-2"><Target className="h-4 w-4" /> Missões CFAP</TabsTrigger>
              <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" /> Configurações</TabsTrigger>
              {isMaster && <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" /> Usuários</TabsTrigger>}
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
                    <DialogHeader><DialogTitle>{editingHymn ? "Editar Hino" : "Novo Hino"}</DialogTitle></DialogHeader>
                    <HymnForm key={editingHymn?.id ?? "new"} hymn={editingHymn} onSuccess={() => setHymnDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-2">
                {hymns?.map((hymn: any) => (
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
                        {hymn.youtubeUrl && <Youtube className="h-4 w-4 text-red-500" />}
                        {hymn.audioUrl && <Music className="h-4 w-4 text-green-600" />}
                        {hasLyricsSyncData(buildLyricsSyncLines(hymn.lyrics, hymn.lyricsSync)) && (
                          <Target className="h-4 w-4 text-[#c4a84b]" />
                        )}
                        <Switch checked={hymn.isActive} onCheckedChange={(checked) => toggleHymn.mutate({ id: hymn.id, isActive: checked })} />
                        
                        {isMobile ? (
                          <Drawer
                            open={syncDialogOpen && syncingHymn?.id === hymn.id}
                            onOpenChange={(o) => { setSyncDialogOpen(o); if (!o) setSyncingHymn(null); }}
                          >
                            <DrawerTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-[#c4a84b]" onClick={() => { setSyncingHymn(hymn); setSyncDialogOpen(true); }}>
                                <Clock className="h-4 w-4" />
                              </Button>
                            </DrawerTrigger>
                            <DrawerContent className="h-[94vh] max-h-[94vh]">
                              <DrawerHeader className="border-b pb-4 text-left">
                                <DrawerTitle>Sincronizar Letra</DrawerTitle>
                                <p className="text-sm text-muted-foreground">{hymn.title}</p>
                              </DrawerHeader>
                              <div className="min-h-0 flex-1 overflow-hidden px-3 pb-4">
                                <LyricsMarker hymn={hymn} onSuccess={() => setSyncDialogOpen(false)} />
                              </div>
                            </DrawerContent>
                          </Drawer>
                        ) : (
                          <Dialog
                            open={syncDialogOpen && syncingHymn?.id === hymn.id}
                            onOpenChange={(o) => { setSyncDialogOpen(o); if (!o) setSyncingHymn(null); }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-[#c4a84b]" onClick={() => { setSyncingHymn(hymn); setSyncDialogOpen(true); }}>
                                <Clock className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="h-[min(94vh,960px)] max-w-[96vw] w-[min(96vw,1280px)] gap-0 overflow-hidden p-0">
                              <DialogHeader className="border-b px-6 py-5 pr-14">
                                <DialogTitle>Sincronizar Letra</DialogTitle>
                                <p className="text-sm text-muted-foreground">{hymn.title}</p>
                              </DialogHeader>
                              <div className="min-h-0 flex-1 overflow-hidden px-6 py-5">
                                <LyricsMarker hymn={hymn} onSuccess={() => setSyncDialogOpen(false)} />
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

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
                    <DialogHeader><DialogTitle>{editingMission ? "Editar Missão" : "Nova Missão CFAP"}</DialogTitle></DialogHeader>
                    <MissionForm mission={editingMission} onSuccess={() => setMissionDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>
              {!missions || missions.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="p-12 text-center">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma missão publicada ainda.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {missions.map((mission: any) => (
                    <Card key={mission.id} className="border-border/50">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground text-sm truncate">{mission.title}</p>
                            <Badge variant={mission.priority === "critica" ? "destructive" : "secondary"} className="text-xs">{mission.priority}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">{mission.content.substring(0, 100)}...</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
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
              )}
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
}
