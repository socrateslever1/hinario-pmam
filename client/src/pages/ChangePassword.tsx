import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, KeyRound } from "lucide-react";

export function ChangePassword() {
  const [, navigate] = useLocation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const changePasswordMutation = trpc.access.changePassword.useMutation();
  const meQuery = trpc.auth.me.useQuery();

  const getPostPasswordPath = () => {
    const role = meQuery.data?.role;
    if (role === "student") return "/notas-do-curso";
    if (
      role === "admin" ||
      role === "master" ||
      [
        "comandante_corpo",
        "subcomandante_corpo",
        "sub_comandante_corpo",
        "comandante_cfap",
        "subcomandante_cfap",
        "sub_comandante_cfap",
        "comandante_cia",
        "comandante_pel",
      ].includes(role || "")
    ) return "/xerife";
    return "/perfil";
  };

  const handleChangePassword = async () => {
    setError("");
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Preencha todos os campos.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As novas senhas não conferem.");
      return;
    }

    if (newPassword.length < 6) {
      setError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate(getPostPasswordPath()), 1500);
    } catch (caught: any) {
      setError(caught.message || "Erro ao alterar senha.");
    }
  };

  if (meQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f2e8] dark:bg-[#020a0f]">
        <p className="text-sm font-medium text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!meQuery.data || !(meQuery.data as any).forcePasswordChange) {
    window.location.href = "/";
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#07150f] via-[#0d251a] to-[#111827] p-4">
      <Card className="w-full max-w-md border-white/10 shadow-2xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1a3a2a]">
            <KeyRound className="h-7 w-7 text-[#c4a84b]" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a6900]">QG Digital</p>
            <CardTitle className="mt-1 text-2xl">Alterar senha provisória</CardTitle>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Por segurança, a senha provisória precisa ser substituída antes de acessar a plataforma.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-100">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Senha alterada com sucesso. Redirecionando...</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Senha atual ou provisória</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Digite sua senha atual"
              autoComplete="current-password"
              disabled={changePasswordMutation.isPending || success}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nova senha</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Mínimo de 6 caracteres"
              autoComplete="new-password"
              disabled={changePasswordMutation.isPending || success}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Confirmar nova senha</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repita a nova senha"
              autoComplete="new-password"
              disabled={changePasswordMutation.isPending || success}
            />
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={changePasswordMutation.isPending || success || !currentPassword || !newPassword || !confirmPassword}
            className="w-full bg-[#1a3a2a] font-semibold text-white hover:bg-[#234b36]"
          >
            {changePasswordMutation.isPending ? "Alterando..." : "Alterar senha e continuar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
