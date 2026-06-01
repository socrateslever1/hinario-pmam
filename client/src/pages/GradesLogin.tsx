import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, BookOpen } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function GradesLogin() {
  const [, setLocation] = useLocation();
  const [studentNumber, setStudentNumber] = useState('');
  const [cpf, setCpf] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const gradesLoginMutation = trpc.grades.login.useMutation();

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleStudentNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setStudentNumber(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (studentNumber.length !== 4) {
      setError('Número deve ter 4 dígitos');
      return;
    }

    const num = parseInt(studentNumber);
    if (num < 1111 || num > 5252) {
      setError('Número deve estar entre 1111 e 5252');
      return;
    }

    if (cpf.replace(/\D/g, '').length !== 11) {
      setError('CPF deve ter 11 dígitos');
      return;
    }

    setIsLoading(true);
    try {
      const result = await gradesLoginMutation.mutateAsync({
        studentNumber,
        cpf,
      });

      sessionStorage.setItem('gradeStudentId', result.student.id.toString());
      sessionStorage.setItem('gradeStudentNumber', result.student.studentNumber);

      toast.success(
        result.isNewStudent
          ? 'Conta criada com sucesso!'
          : 'Login realizado com sucesso!'
      );

      setLocation('/grades');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
      toast.error('Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a3a2a] to-[#0f2418] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-[#c4a84b] rounded-full p-3">
              <BookOpen className="w-6 h-6 text-[#1a3a2a]" />
            </div>
          </div>
          <CardTitle className="text-2xl">Gerenciador de Notas</CardTitle>
          <CardDescription>
            Acesse suas notas e disciplinas com número e CPF
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Número de Aluno</label>
              <Input
                type="text"
                placeholder="Ex: 1234"
                value={studentNumber}
                onChange={handleStudentNumberChange}
                maxLength={4}
                disabled={isLoading}
                className="text-center text-lg tracking-widest"
              />
              <p className="text-xs text-muted-foreground">Entre 1111 e 5252</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">CPF</label>
              <Input
                type="text"
                placeholder="Ex: 123.456.789-10"
                value={cpf}
                onChange={handleCPFChange}
                maxLength={14}
                disabled={isLoading}
                className="text-center"
              />
              <p className="text-xs text-muted-foreground">Formato: XXX.XXX.XXX-XX</p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || studentNumber.length !== 4 || cpf.replace(/\D/g, '').length !== 11}
              className="w-full bg-[#c4a84b] hover:bg-[#c4a84b]/90 text-[#1a3a2a] font-bold"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Primeira vez?</strong> Ao entrar com seu número e CPF, sua conta será criada automaticamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
