import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { AlertCircle, BookOpen, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { getCompanhiaLabel, getPelotonLabel, validateNumerica } from "@shared/studentValidation";
import Navbar from "@/components/Navbar";
import { saveStudentSession, clearStudentSession } from "@/lib/studentSession";
import { notifySessionChange } from "@/components/BottomNavigation";

function cleanNumerica(value: string) {
  return value.replace(/\D/g, "").slice(0, 4);
}

export default function GradesLogin() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("login");
  const [error, setError] = useState("");
  const [loginData, setLoginData] = useState({ numerica: "", senha: "" });
  const [registerData, setRegisterData] = useState({
    nomeGuerra: "",
    numerica: "",
    senha: "",
    confirmarSenha: "",
  });

  const loginMutation = trpc.student.login.useMutation();
  const registerMutation = trpc.student.register.useMutation();

  const numericaInfo = useMemo(
    () => validateNumerica(registerData.numerica),
    [registerData.numerica]
  );

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      const student = await loginMutation.mutateAsync(loginData);
      saveStudentSession(student);
      notifySessionChange();
      toast.success("Login realizado com sucesso");
      setLocation("/notas-do-curso");
    } catch (err: any) {
      setError(err.message || "Erro ao entrar");
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      const student = await registerMutation.mutateAsync(registerData);
      saveStudentSession(student);
      notifySessionChange();
      toast.success("Conta criada com sucesso");
      setLocation("/notas-do-curso");
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta");
    }
  };

  const isBusy = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="mobile-safe-bottom min-h-screen bg-[#f5f2e8]">
      <Navbar />
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md border-[#c4a84b]/30">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-[#c4a84b] rounded-full p-3">
              <BookOpen className="w-6 h-6 text-[#1a3a2a]" />
            </div>
          </div>
          <CardTitle className="text-2xl">Acesso do Aluno</CardTitle>
          <CardDescription>Use sua numérica para entrar nas áreas restritas</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="gap-2">
                <LogIn className="h-4 w-4" />
                Entrar
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Criar conta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="pt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-numerica">Numérica</Label>
                  <Input
                    id="login-numerica"
                    inputMode="numeric"
                    placeholder="1111"
                    value={loginData.numerica}
                    onChange={(event) =>
                      setLoginData({ ...loginData, numerica: cleanNumerica(event.target.value) })
                    }
                    className="text-center text-lg tracking-widest"
                    disabled={isBusy}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-senha">Senha</Label>
                  <Input
                    id="login-senha"
                    type="password"
                    value={loginData.senha}
                    onChange={(event) => setLoginData({ ...loginData, senha: event.target.value })}
                    disabled={isBusy}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-[#1a3a2a] hover:bg-[#214936]" disabled={isBusy}>
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="pt-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome-guerra">Nome de guerra</Label>
                  <Input
                    id="nome-guerra"
                    value={registerData.nomeGuerra}
                    onChange={(event) =>
                      setRegisterData({ ...registerData, nomeGuerra: event.target.value })
                    }
                    disabled={isBusy}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-numerica">Numérica</Label>
                  <Input
                    id="register-numerica"
                    inputMode="numeric"
                    placeholder="1111"
                    value={registerData.numerica}
                    onChange={(event) =>
                      setRegisterData({
                        ...registerData,
                        numerica: cleanNumerica(event.target.value),
                      })
                    }
                    className="text-center text-lg tracking-widest"
                    disabled={isBusy}
                    required
                  />
                  {registerData.numerica.length === 4 && (
                    <p className={numericaInfo.isValid ? "text-xs text-muted-foreground" : "text-xs text-red-600"}>
                      {numericaInfo.isValid
                        ? `${getCompanhiaLabel(numericaInfo.companhia)} - ${getPelotonLabel(numericaInfo.peloton)}`
                        : numericaInfo.error}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Companhia</Label>
                    <Input value={numericaInfo.isValid ? `${numericaInfo.companhia}ª` : ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Pelotão</Label>
                    <Input value={numericaInfo.isValid ? `${numericaInfo.peloton}º` : ""} disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-senha">Senha</Label>
                  <Input
                    id="register-senha"
                    type="password"
                    value={registerData.senha}
                    onChange={(event) =>
                      setRegisterData({ ...registerData, senha: event.target.value })
                    }
                    disabled={isBusy}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmar-senha">Confirmar senha</Label>
                  <Input
                    id="confirmar-senha"
                    type="password"
                    value={registerData.confirmarSenha}
                    onChange={(event) =>
                      setRegisterData({ ...registerData, confirmarSenha: event.target.value })
                    }
                    disabled={isBusy}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-[#1a3a2a] hover:bg-[#214936]" disabled={isBusy}>
                  Criar conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </main>
    </div>
  );
}
