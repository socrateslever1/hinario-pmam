import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  User, Lock, Camera, Loader2, Shield, Building, Award, Users 
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador Global (Admin)",
  master: "Xerife Master",
  comandante_corpo: "Comandante do Corpo de Alunos (CAL)",
  subcomandante_corpo: "Subcomandante do Corpo de Alunos",
  comandante_cfap: "Comandante CFAP",
  subcomandante_cfap: "Subcomandante CFAP",
  comandante_cia: "Comandante de Companhia",
  comandante_pel: "Comandante de Pelotão",
};

type UserProfileTabProps = {
  showDirectory?: boolean;
};

export function UserProfileTab({ showDirectory = true }: UserProfileTabProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || "");

  // Carregar diretório do comando
  const { data: commandUsers, isLoading: isLoadingDirectory } = trpc.auth.listCommandDirectory.useQuery(undefined, {
    enabled: showDirectory,
  });

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado!");
      void utils.auth.me.invalidate();
      void utils.auth.listCommandDirectory.invalidate();
    },
    onError: (err) => {
      toast.error(`Erro ao atualizar foto: ${err.message}`);
    }
  });

  useEffect(() => {
    setDisplayName(user?.name || "");
  }, [user?.name]);

  const changePasswordMutation = trpc.access.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
    },
    onError: (err) => {
      toast.error(`Erro ao alterar senha: ${err.message}`);
      setIsChangingPassword(false);
    }
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida.");
      return;
    }

    // Limite de 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A foto deve ter no máximo 5MB.");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Falha no upload do servidor");
      }

      const result = await response.json();
      if (result.url) {
        await updateProfileMutation.mutateAsync({ fotoUrl: result.url });
      } else {
        throw new Error("URL de resposta inválida");
      }
    } catch (error: any) {
      console.error("Erro no upload da foto:", error);
      toast.error(`Erro no upload: ${error.message || "Erro inesperado"}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos da alteração de senha.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas novas não conferem.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    try {
      setIsChangingPassword(true);
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
    } catch (e) {
      // toast.error já é disparado no onError da mutation
    }
  };

  const getRoleDisplay = (role: string) => {
    return ROLE_LABELS[role] || role || "Usuário do Posto de Comando";
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleProfileSave = async () => {
    const name = displayName.trim();
    if (name.length < 2) {
      toast.error("Informe um nome com pelo menos 2 caracteres.");
      return;
    }

    await updateProfileMutation.mutateAsync({ name });
  };

  return (
    <Tabs defaultValue="my_profile" className="space-y-6">
      {showDirectory && (
      <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted p-1 rounded-xl">
        <TabsTrigger value="my_profile" className="gap-2">
          <User className="h-4 w-4" />
          Meu Perfil
        </TabsTrigger>
        <TabsTrigger value="command_staff" className="gap-2">
          <Users className="h-4 w-4" />
          Membros do Comando
        </TabsTrigger>
      </TabsList>
      )}

      {/* ABA MEU PERFIL */}
      <TabsContent value="my_profile" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          {/* CARD DE FOTO E RESUMO */}
          <Card className="border-border/50 bg-white shadow-md dark:bg-zinc-900 md:col-span-1 py-0">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              {/* Avatar com upload */}
              <div className="relative group cursor-pointer mb-4" onClick={triggerFileInput}>
                <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-[#c4a84b]/60 bg-muted flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105">
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 text-[#c4a84b] animate-spin" />
                  ) : user?.fotoUrl ? (
                    <img 
                      src={user.fotoUrl} 
                      alt="Foto do Comandante" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-16 w-16 text-muted-foreground" />
                  )}
                </div>
                {/* Overlay de hover */}
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>

              <h2 className="text-xl font-bold text-foreground leading-tight font-serif" style={{ fontFamily: "Merriweather, serif" }}>
                {user?.name || "Usuário"}
              </h2>
              <p className="text-sm font-semibold text-[#c4a84b] mt-1">
                {getRoleDisplay(user?.role || "")}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Clique na imagem para enviar uma foto
              </p>
            </CardContent>
          </Card>

          {/* CARD DE DETALHES E ALTERAÇÃO DE SENHA */}
          <div className="md:col-span-2 space-y-6">
            {/* Informações detalhadas */}
            <Card className="border-border/50 bg-white shadow-md dark:bg-zinc-900 py-0">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-sm font-black uppercase tracking-wider text-[#1a3a2a] dark:text-[#c4a84b]">
                  Informações da Conta
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2 rounded-lg border bg-muted/5 p-3 sm:col-span-2">
                  <Label htmlFor="profile-display-name" className="text-[10px] uppercase font-bold text-muted-foreground">
                    Nome exibido
                  </Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="profile-display-name"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="Como seu nome deve aparecer"
                      className="h-9 text-sm"
                    />
                    <Button
                      type="button"
                      onClick={handleProfileSave}
                      disabled={updateProfileMutation.isPending || displayName.trim() === (user?.name || "").trim()}
                      className="bg-[#1a3a2a] text-white hover:bg-[#10281d]"
                    >
                      Salvar
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border bg-muted/5 p-3">
                  <Shield className="h-5 w-5 text-[#c4a84b] shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Nome de Usuário (login)</p>
                    <p className="text-sm font-semibold text-foreground">{user?.email || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border bg-muted/5 p-3">
                  <Award className="h-5 w-5 text-[#c4a84b] shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Função Hierárquica</p>
                    <p className="text-sm font-semibold text-foreground truncate">{getRoleDisplay(user?.role || "")}</p>
                  </div>
                </div>

                {((user as any)?.companhiaId || (user as any)?.pelotaoId) && (
                  <div className="flex items-center gap-3 rounded-lg border bg-muted/5 p-3 sm:col-span-2">
                    <Building className="h-5 w-5 text-[#c4a84b] shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Escopo de Atuação</p>
                      <p className="text-sm font-semibold text-foreground">
                        {(user as any)?.companhiaId ? `${(user as any).companhiaId}ª Companhia` : ""}
                        {(user as any)?.pelotaoId ? ` / ${(user as any).pelotaoId}º Pelotão` : ""}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alteração de senha */}
            <Card className="border-border/50 bg-white shadow-md dark:bg-zinc-900 py-0">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#1a3a2a] dark:text-[#c4a84b]">
                  <Lock className="h-4 w-4 text-[#c4a84b]" />
                  Segurança - Troca de Senha
                </CardTitle>
                <CardDescription className="text-xs">
                  Atualize sua senha provisória ou defina uma nova credencial pessoal
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label htmlFor="profile-curr-pass" className="text-xs font-semibold">Senha Atual</Label>
                      <Input 
                        id="profile-curr-pass"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Sua senha atual"
                        className="h-9 text-sm"
                        disabled={isChangingPassword}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="profile-new-pass" className="text-xs font-semibold">Nova Senha</Label>
                      <Input 
                        id="profile-new-pass"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 caracteres"
                        className="h-9 text-sm"
                        disabled={isChangingPassword}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="profile-conf-pass" className="text-xs font-semibold">Confirmar Senha</Label>
                      <Input 
                        id="profile-conf-pass"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirme a nova senha"
                        className="h-9 text-sm"
                        disabled={isChangingPassword}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button 
                      type="submit" 
                      className="bg-[#1a3a2a] text-white hover:bg-[#1a3a2a]/95 text-xs font-bold"
                      disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Alterando...
                        </>
                      ) : (
                        "Salvar Nova Senha"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      {/* ABA DIRETÓRIO DO COMANDO */}
      {showDirectory && (
      <TabsContent value="command_staff">
        <Card className="border-border/50 bg-white shadow-md dark:bg-zinc-900 py-0">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-[#1a3a2a] dark:text-[#c4a84b]">
              Corpo de Oficiais e Comandantes
            </CardTitle>
            <CardDescription className="text-xs">
              Membros cadastrados no comando do CAL, CFAP, Companhias e Pelotões do Hinário PMAM
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            {isLoadingDirectory ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-[#c4a84b] animate-spin" />
              </div>
            ) : !commandUsers || commandUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum membro do comando cadastrado.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {commandUsers.map((member) => (
                  <Card key={member.id} className="border-border/40 hover:border-[#c4a84b]/60 transition-all overflow-hidden bg-muted/5 hover:shadow-md py-0">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-[#c4a84b]/40 bg-muted shrink-0 flex items-center justify-center shadow">
                        {member.fotoUrl ? (
                          <img 
                            src={member.fotoUrl} 
                            alt={member.name || "Comandante"} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-foreground truncate">
                          {member.name || "Sem Nome"}
                        </h4>
                        <p className="text-xs font-semibold text-[#c4a84b] truncate mt-0.5">
                          {ROLE_LABELS[member.role || ""] || member.role || "Comando"}
                        </p>
                        {((member as any).companhiaId || (member as any).pelotaoId) && (
                          <p className="text-[10px] text-muted-foreground mt-1 truncate">
                            {(member as any).companhiaId ? `${(member as any).companhiaId}ª Cia` : ""}
                            {(member as any).pelotaoId ? ` / ${(member as any).pelotaoId}º Pel` : ""}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      )}
    </Tabs>
  );
}
