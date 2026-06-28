import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Camera, KeyRound, Loader2, LogIn, Save, Shield, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { getStudentSession } from "@/lib/studentSession";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador Global",
  master: "Xerife Master",
  comandante_corpo: "Comandante do Corpo de Alunos",
  subcomandante_corpo: "Subcomandante do Corpo de Alunos",
  comandante_cfap: "Comandante CFAP",
  subcomandante_cfap: "Subcomandante CFAP",
  comandante_cia: "Comandante de Companhia",
  comandante_pel: "Comandante de Pelotão",
};

type CommandProfile = {
  nomeCompleto: string;
  nomeGuerra: string;
  rg: string;
  cpf: string;
  telefone: string;
  emailContato: string;
  setor: string;
  funcao: string;
  observacoes: string;
};

const emptyProfile: CommandProfile = {
  nomeCompleto: "",
  nomeGuerra: "",
  rg: "",
  cpf: "",
  telefone: "",
  emailContato: "",
  setor: "",
  funcao: "",
  observacoes: "",
};

function profileKey(userId?: number | null) {
  return userId ? `pmam-command-profile-v1:${userId}` : "";
}

function loadLocalProfile(userId?: number | null): CommandProfile {
  if (typeof window === "undefined" || !userId) return emptyProfile;
  try {
    const raw = window.localStorage.getItem(profileKey(userId));
    return raw ? { ...emptyProfile, ...JSON.parse(raw) } : emptyProfile;
  } catch {
    return emptyProfile;
  }
}

function saveLocalProfile(userId: number, profile: CommandProfile) {
  window.localStorage.setItem(profileKey(userId), JSON.stringify(profile));
}

export default function UserProfilePage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const studentSession = getStudentSession();

  const [profile, setProfile] = useState<CommandProfile>(emptyProfile);
  const [photoUrl, setPhotoUrl] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      void utils.auth.me.invalidate();
    },
  });
  const changePassword = trpc.access.changePassword.useMutation();

  useEffect(() => {
    if (!loading && studentSession) {
      setLocation("/perfil-aluno");
    }
  }, [loading, user, studentSession, setLocation]);

  useEffect(() => {
    if (!user?.id) return;
    const local = loadLocalProfile(user.id);
    setProfile({
      ...local,
      nomeCompleto: local.nomeCompleto || user.name || "",
      emailContato: local.emailContato || user.email || "",
      funcao: local.funcao || ROLE_LABELS[user.role || ""] || user.role || "",
    });
    setPhotoUrl(user.fotoUrl || "");
  }, [user?.id, user?.name, user?.email, user?.role, user?.fotoUrl]);

  const updateField = (field: keyof CommandProfile, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A foto deve ter no máximo 5MB.");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Falha no upload da foto.");
      const result = await response.json();
      if (!result.url) throw new Error("Servidor não retornou a URL da foto.");
      setPhotoUrl(result.url);
      await updateProfile.mutateAsync({ fotoUrl: result.url });
      toast.success("Foto atualizada.");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao enviar foto.");
    } finally {
      setIsUploading(false);
      event.currentTarget.value = "";
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.id) return;

    if (profile.nomeCompleto.trim().length < 2) {
      toast.error("Informe o nome completo.");
      return;
    }

    try {
      saveLocalProfile(user.id, profile);
      await updateProfile.mutateAsync({
        name: profile.nomeGuerra.trim() || profile.nomeCompleto.trim(),
        fotoUrl: photoUrl || null,
      });

      if (senhaAtual || senhaNova || confirmarSenha) {
        if (!senhaAtual || !senhaNova || !confirmarSenha) {
          toast.error("Preencha todos os campos para alterar a senha.");
          return;
        }
        if (senhaNova.length < 6) {
          toast.error("A nova senha deve ter pelo menos 6 caracteres.");
          return;
        }
        if (senhaNova !== confirmarSenha) {
          toast.error("As senhas novas não coincidem.");
          return;
        }
        await changePassword.mutateAsync({ currentPassword: senhaAtual, newPassword: senhaNova });
        setSenhaAtual("");
        setSenhaNova("");
        setConfirmarSenha("");
      }

      toast.success("Ficha de cadastro atualizada.");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao salvar ficha.");
    }
  };

  if (loading) {
    return (
      <div className="mobile-safe-bottom flex min-h-screen flex-col bg-[#f5f2e8] dark:bg-[#050d12]">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1a3a2a] dark:text-[#c4a84b]" />
        </div>
      </div>
    );
  }

  if (!user) {
    if (studentSession) return null;
    return (
      <div className="mobile-safe-bottom flex min-h-screen flex-col bg-[#f5f2e8] dark:bg-[#050d12]">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4 py-10">
          <Card className="w-full max-w-md border-border/50 bg-white text-foreground shadow-md dark:bg-zinc-950">
            <CardContent className="p-8 text-center">
              <User className="mx-auto mb-4 h-14 w-14 text-[#c4a84b]" />
              <h1 className="mb-2 text-2xl font-bold text-[#1a3a2a] dark:text-[#c4a84b]" style={{ fontFamily: "Merriweather, serif" }}>
                Ficha de Cadastro
              </h1>
              <p className="mb-6 text-sm text-muted-foreground">
                Entre pelo Posto de Comando para preencher sua ficha particular.
              </p>
              <Link href="/login">
                <Button className="w-full gap-2 bg-[#1a3a2a] text-white hover:bg-[#10281d]">
                  <LogIn className="h-4 w-4" />
                  Posto de Comando
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const isBusy = updateProfile.isPending || changePassword.isPending || isUploading;

  return (
    <div className="mobile-safe-bottom min-h-screen bg-[#f5f2e8] text-foreground dark:bg-[#050d12]">
      <Navbar />
      <main className="container max-w-5xl px-4 py-6 pb-24 md:py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center md:p-0">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-[#1a3a2a] dark:text-[#c4a84b] md:text-3xl" style={{ fontFamily: "Merriweather, serif" }}>
              <Shield className="h-8 w-8 text-[#c4a84b]" />
              Ficha de Cadastro do Comando
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Dados particulares facultativos, foto funcional e senha de acesso.
            </p>
          </div>
          <div className="rounded-full border border-[#c4a84b]/25 bg-[#c4a84b]/10 px-4 py-2 text-xs font-semibold text-[#1a3a2a] shadow-sm dark:text-[#c4a84b] md:rounded-lg">
            {ROLE_LABELS[user.role || ""] || user.role || "Posto de Comando"}
          </div>
        </div>

        <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="flex flex-col gap-6">
            <Card className="overflow-hidden border-border/50 bg-white text-foreground shadow-sm dark:bg-zinc-950">
              <CardHeader className="border-b bg-muted/20 pb-3 text-center">
                <CardTitle className="text-sm font-bold text-[#1a3a2a] dark:text-[#c4a84b]">Identidade Visual</CardTitle>
                <CardDescription className="text-[10px]">Foto funcional do perfil</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 p-6">
                <div className="group relative flex aspect-[3/4] w-44 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/50 shadow-inner">
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-[#c4a84b]" />
                  ) : photoUrl ? (
                    <img src={photoUrl} alt="Foto do comando" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4 text-center text-muted-foreground">
                      <User className="h-14 w-14 opacity-40" />
                      <span className="text-[10px] font-medium leading-tight">Sem foto cadastrada</span>
                    </div>
                  )}
                  <label htmlFor="command-photo-upload" className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="mb-1 h-6 w-6" />
                    <span className="text-xs font-bold">Enviar Foto</span>
                  </label>
                </div>
                <input id="command-photo-upload" ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-8 w-full gap-2 text-xs">
                  <Camera className="h-3.5 w-3.5" />
                  Selecionar Imagem
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-white text-foreground shadow-sm dark:bg-zinc-950">
              <CardHeader className="border-b bg-muted/20 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-[#1a3a2a] dark:text-[#c4a84b]">
                  <KeyRound className="h-4 w-4 text-[#c4a84b]" />
                  Alterar Senha
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Senha atual</Label>
                  <Input type="password" value={senhaAtual} onChange={(event) => setSenhaAtual(event.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Nova senha</Label>
                  <Input type="password" value={senhaNova} onChange={(event) => setSenhaNova(event.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Confirmar nova senha</Label>
                  <Input type="password" value={confirmarSenha} onChange={(event) => setConfirmarSenha(event.target.value)} className="h-9 text-sm" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50 bg-white text-foreground shadow-sm dark:bg-zinc-950">
            <CardHeader className="border-b bg-muted/20 pb-3">
              <CardTitle className="text-base font-bold text-[#1a3a2a] dark:text-[#c4a84b]">Dados Cadastrais</CardTitle>
              <CardDescription className="text-xs">Preencha somente o que desejar manter no seu perfil particular.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-bold text-[#1a3a2a] dark:text-[#c4a84b]">Nome completo</Label>
                  <Input value={profile.nomeCompleto} onChange={(event) => updateField("nomeCompleto", event.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#1a3a2a] dark:text-[#c4a84b]">Nome de guerra / exibição</Label>
                  <Input value={profile.nomeGuerra} onChange={(event) => updateField("nomeGuerra", event.target.value)} placeholder="Como aparecerá no sistema" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#1a3a2a] dark:text-[#c4a84b]">Função</Label>
                  <Input value={profile.funcao} onChange={(event) => updateField("funcao", event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#1a3a2a] dark:text-[#c4a84b]">RG / CI</Label>
                  <Input value={profile.rg} onChange={(event) => updateField("rg", event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#1a3a2a] dark:text-[#c4a84b]">CPF</Label>
                  <Input value={profile.cpf} onChange={(event) => updateField("cpf", event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#1a3a2a] dark:text-[#c4a84b]">Telefone</Label>
                  <Input value={profile.telefone} onChange={(event) => updateField("telefone", event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#1a3a2a] dark:text-[#c4a84b]">E-mail</Label>
                  <Input type="email" value={profile.emailContato} onChange={(event) => updateField("emailContato", event.target.value)} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-bold text-[#1a3a2a] dark:text-[#c4a84b]">Setor / lotação</Label>
                  <Input value={profile.setor} onChange={(event) => updateField("setor", event.target.value)} placeholder="Ex: Corpo de Alunos, 1ª Cia, CFAP" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-bold text-[#1a3a2a] dark:text-[#c4a84b]">Observações</Label>
                  <Textarea value={profile.observacoes} onChange={(event) => updateField("observacoes", event.target.value)} className="min-h-24" />
                </div>
              </div>

              <div className="flex justify-end border-t pt-4">
                <Button type="submit" disabled={isBusy} className="gap-2 bg-[#1a3a2a] text-white hover:bg-[#10281d]">
                  {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar ficha
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
      <Footer />
    </div>
  );
}
