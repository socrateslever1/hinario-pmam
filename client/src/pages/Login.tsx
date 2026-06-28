import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useLocation, Link } from "wouter";
import { Shield, LogIn, Eye, EyeOff, ArrowLeft } from "lucide-react";
import type { User } from "@shared/types";

const BRASAO_URL = "/logo/IMG_7728.PNG";

const REMEMBER_ME_KEY = "hinario-remember-me";
const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 dias em ms

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Carregar credenciais salvas ao montar o componente
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_ME_KEY);
    if (saved) {
      try {
        const { email: savedEmail, expiresAt } = JSON.parse(saved);
        if (expiresAt > Date.now()) {
          setEmail(savedEmail);
          setRememberMe(true);
        } else {
          // Expirou, limpar
          localStorage.removeItem(REMEMBER_ME_KEY);
        }
      } catch (e) {
        localStorage.removeItem(REMEMBER_ME_KEY);
      }
    }
  }, []);

  const utils = trpc.useUtils();
  const loginMut = trpc.auth.loginEmail.useMutation({
    onSuccess: (result) => {
      toast.success("Login realizado com sucesso!");
      
      // Salvar credenciais se "Lembrar de mim" foi marcado
      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify({
          email,
          expiresAt: Date.now() + REMEMBER_ME_DURATION,
        }));
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
      }
      
      utils.auth.me.setData(undefined, (current): User => ({
        id: result.user.id,
        openId: current?.openId ?? `session-${result.user.id}`,
        name: result.user.name,
        email: result.user.email,
        password: current?.password ?? null,
        loginMethod: current?.loginMethod ?? "email",
        role: result.user.role,
        forcePasswordChange: (result.user as any).forcePasswordChange,
        fotoUrl: (result.user as any).fotoUrl ?? null,
        createdAt: current?.createdAt ?? new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }));
      void utils.auth.me.invalidate();
      
      // Redirecionar baseado no role e na flag de primeiro acesso
      const role = result.user.role;
      if ((result.user as any).forcePasswordChange) {
        navigate("/alterar-senha");
      } else if (role === 'student') {
        navigate("/notas-do-curso");
      } else if (
        role === 'admin' ||
        role === 'master' ||
        [
          'comandante_corpo',
          'subcomandante_corpo',
          'sub_comandante_corpo',
          'comandante_cfap',
          'subcomandante_cfap',
          'sub_comandante_cfap',
          'comandante_cia',
          'comandante_pel',
        ].includes(role || '')
      ) {
        navigate("/xerife");
      } else {
        navigate("/");
      }
    },
    onError: (e) => {
      toast.error(e.message || "Email ou senha inválidos");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    loginMut.mutate({ email, password, rememberMe });
  };

  return (
    <div className="mobile-safe-bottom min-h-screen flex flex-col bg-[#f5f2e8] md:bg-background">
      {/* Header bar */}
      <div className="checkerboard-pattern w-full" />
      <div className="bg-white border-b border-border/40 py-6">
        <div className="container text-center">
          <img src={BRASAO_URL} alt="Brasão PMAM" className="h-16 w-16 object-contain mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-[#1a3a2a]" style={{ fontFamily: 'Merriweather, serif' }}>
            Posto de Comando
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Painel de Gerenciamento — Hinário PMAM</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full border-border/50 shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-[#1a3a2a] flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-[#c4a84b]" />
              </div>
              <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Merriweather, serif' }}>
                Acesso Restrito
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Informe suas credenciais para acessar o painel de gerenciamento
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Usuário ou Numérica</Label>
                <Input
                  id="email"
                  type="text"
                  inputMode="text"
                  autoComplete="username"
                  placeholder="Ex: cmt.pel1 ou 0000"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer">
                  Lembrar de mim por 30 dias
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-[#1a3a2a] hover:bg-[#1a3a2a]/90 text-white gap-2 font-semibold"
                disabled={loginMut.isPending}
              >
                {loginMut.isPending ? (
                  <>Entrando...</>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao Hinário
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
