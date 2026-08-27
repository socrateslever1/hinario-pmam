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
import { saveEmailSession } from "@/lib/emailSession";

const BRASAO_URL = "/logo/IMG_7728.PNG";
const REMEMBER_ME_KEY = "qg-digital-remember-me";
const LEGACY_REMEMBER_ME_KEY = "hinario-remember-me";
const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000;

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_ME_KEY) || localStorage.getItem(LEGACY_REMEMBER_ME_KEY);
    if (!saved) return;

    try {
      const { email: savedEmail, expiresAt } = JSON.parse(saved);
      if (expiresAt > Date.now()) {
        setEmail(savedEmail);
        setRememberMe(true);
        localStorage.setItem(REMEMBER_ME_KEY, saved);
        localStorage.removeItem(LEGACY_REMEMBER_ME_KEY);
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
        localStorage.removeItem(LEGACY_REMEMBER_ME_KEY);
      }
    } catch {
      localStorage.removeItem(REMEMBER_ME_KEY);
      localStorage.removeItem(LEGACY_REMEMBER_ME_KEY);
    }
  }, []);

  const utils = trpc.useUtils();
  const loginMut = trpc.auth.loginEmail.useMutation({
    onSuccess: async (result) => {
      toast.success("Login realizado com sucesso!");

      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify({
          email,
          expiresAt: Date.now() + REMEMBER_ME_DURATION,
        }));
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
        localStorage.removeItem(LEGACY_REMEMBER_ME_KEY);
      }
      saveEmailSession(result.sessionToken, rememberMe);

      const optimisticUser: User = {
        id: result.user.id,
        openId: `session-${result.user.id}`,
        name: result.user.name,
        email: result.user.email,
        password: null,
        loginMethod: "email",
        role: result.user.role,
        forcePasswordChange: (result.user as any).forcePasswordChange,
        fotoUrl: (result.user as any).fotoUrl ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };
      utils.auth.me.setData(undefined, optimisticUser);
      localStorage.setItem("auth-user-info", JSON.stringify(optimisticUser));

      try {
        const verifiedUser = await utils.auth.me.fetch();
        if (!verifiedUser) {
          utils.auth.me.setData(undefined, optimisticUser);
        } else {
          utils.auth.me.setData(undefined, verifiedUser);
          localStorage.setItem("auth-user-info", JSON.stringify(verifiedUser));
        }
      } catch {
        utils.auth.me.setData(undefined, optimisticUser);
      }

      const role = result.user.role;
      if ((result.user as any).forcePasswordChange) {
        navigate("/alterar-senha");
      } else if (role === "student") {
        navigate("/notas-do-curso");
      } else if (
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
      ) {
        navigate("/xerife");
      } else {
        navigate("/");
      }
    },
    onError: (e) => {
      toast.error(e.message || "Usuário ou senha inválidos");
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
    <div className="mobile-safe-bottom flex min-h-screen flex-col bg-[#f5f2e8] dark:bg-[#020a0f] md:bg-background dark:md:bg-[#020a0f]">
      <div className="checkerboard-pattern w-full" />
      <div className="border-b border-border/40 bg-card py-6">
        <div className="container text-center">
          <img src={BRASAO_URL} alt="Brasão PMAM" className="mx-auto mb-3 h-16 w-16 object-contain" />
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6900]">QG Digital</p>
          <h1 className="mt-1 text-[28px] font-bold leading-tight text-[#1a3a2a] md:text-3xl" style={{ fontFamily: "Merriweather, serif" }}>
            Posto de Comando
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Plataforma Militar — acesso administrativo e de comando</p>
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center px-4 py-6 sm:items-center sm:py-10 md:py-12">
        <Card className="w-full max-w-md border-border/50 shadow-lg">
          <CardContent className="p-5 sm:p-6 md:p-8">
            <div className="mb-7 text-center md:mb-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#1a3a2a]">
                <Shield className="h-8 w-8 text-[#c4a84b]" />
              </div>
              <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Merriweather, serif" }}>
                Acesso Restrito
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Informe suas credenciais para acessar os recursos correspondentes à sua função.
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
                  placeholder="Ex.: cmt.pel1 ou 0000"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4a84b] md:h-8 md:w-8"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex min-h-11 items-center space-x-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember-me" className="cursor-pointer text-sm font-normal">
                  Lembrar de mim por 30 dias
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#1a3a2a] font-semibold text-white hover:bg-[#1a3a2a]/90"
                disabled={loginMut.isPending}
              >
                <LogIn className="h-4 w-4" />
                {loginMut.isPending ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/">
                <Button variant="ghost" className="gap-2 text-muted-foreground">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao QG Digital
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
