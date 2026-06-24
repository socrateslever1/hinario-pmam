import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';

export function ChangePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const changePasswordMutation = trpc.access.changePassword.useMutation();
  const meQuery = trpc.auth.me.useQuery();

  const handleChangePassword = async () => {
    setError('');
    setSuccess(false);

    if (!newPassword || !confirmPassword) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não conferem');
      return;
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: 'temp', // Senha temporária padrão
        newPassword,
      });

      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');

      // Redirecionar após 2 segundos
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Erro ao alterar senha');
    }
  };

  if (meQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  if (!meQuery.data || !(meQuery.data as any).forcePasswordChange) {
    window.location.href = '/';
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Alterar Senha</CardTitle>
          <p className="text-sm text-gray-600">
            Você precisa alterar sua senha antes de continuar
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Senha alterada com sucesso! Redirecionando...
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Nova Senha</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite sua nova senha"
              disabled={changePasswordMutation.isPending || success}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Confirmar Senha</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme sua nova senha"
              disabled={changePasswordMutation.isPending || success}
            />
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={changePasswordMutation.isPending || success || !newPassword || !confirmPassword}
            className="w-full"
          >
            {changePasswordMutation.isPending ? 'Alterando...' : 'Alterar Senha'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
