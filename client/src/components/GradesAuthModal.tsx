import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface GradesAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (studentId: number) => void;
}

export function GradesAuthModal({ open, onOpenChange, onSuccess }: GradesAuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginNumber, setLoginNumber] = useState("");
  const [loginCpf, setLoginCpf] = useState("");

  // Register form
  const [registerNumber, setRegisterNumber] = useState("");
  const [registerCpf, setRegisterCpf] = useState("");
  const [registerName, setRegisterName] = useState("");

  const loginMutation = trpc.grades.login.useMutation();
  const registerMutation = trpc.grades.register.useMutation();

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);
  };

  const validateNumber = (num: string) => {
    const n = parseInt(num);
    return n >= 1111 && n <= 5252;
  };

  const validateCPF = (cpf: string) => {
    return cpf.replace(/\D/g, "").length === 11;
  };

  const handleLogin = async () => {
    if (!loginNumber || !loginCpf) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (!validateNumber(loginNumber)) {
      toast.error("Número deve estar entre 1111 e 5252");
      return;
    }

    if (!validateCPF(loginCpf)) {
      toast.error("CPF inválido");
      return;
    }

    setLoading(true);
    try {
      const result = await loginMutation.mutateAsync({
        studentNumber: loginNumber,
        cpf: loginCpf,
      });
      sessionStorage.setItem("gradeStudentId", result.id.toString());
      sessionStorage.setItem("gradeStudentNumber", loginNumber);
      toast.success("Login realizado com sucesso!");
      onSuccess(result.id);
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerNumber || !registerCpf || !registerName) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (!validateNumber(registerNumber)) {
      toast.error("Número deve estar entre 1111 e 5252");
      return;
    }

    if (!validateCPF(registerCpf)) {
      toast.error("CPF inválido");
      return;
    }

    setLoading(true);
    try {
      const result = await registerMutation.mutateAsync({
        studentNumber: registerNumber,
        cpf: registerCpf,
        fullName: registerName,
      });
      sessionStorage.setItem("gradeStudentId", result.id.toString());
      sessionStorage.setItem("gradeStudentNumber", registerNumber);
      toast.success("Conta criada com sucesso!");
      onSuccess(result.id);
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gerenciador de Notas</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="register">Criar Conta</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <div>
              <Label htmlFor="login-number">Número de Aluno</Label>
              <Input
                id="login-number"
                placeholder="Ex: 1234"
                value={loginNumber}
                onChange={(e) => setLoginNumber(e.target.value.replace(/\D/g, "").slice(0, 4))}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">Entre 1111 e 5252</p>
            </div>

            <div>
              <Label htmlFor="login-cpf">CPF</Label>
              <Input
                id="login-cpf"
                placeholder="Ex: 123.456.789-10"
                value={loginCpf}
                onChange={(e) => setLoginCpf(formatCPF(e.target.value))}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">Formato: XXX.XXX.XXX-XX</p>
            </div>

            <Button onClick={handleLogin} disabled={loading} className="w-full bg-[#c4a84b] hover:bg-[#b39740] text-[#1a1a1a]">
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <div>
              <Label htmlFor="register-number">Número de Aluno</Label>
              <Input
                id="register-number"
                placeholder="Ex: 1234"
                value={registerNumber}
                onChange={(e) => setRegisterNumber(e.target.value.replace(/\D/g, "").slice(0, 4))}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">Entre 1111 e 5252</p>
            </div>

            <div>
              <Label htmlFor="register-cpf">CPF</Label>
              <Input
                id="register-cpf"
                placeholder="Ex: 123.456.789-10"
                value={registerCpf}
                onChange={(e) => setRegisterCpf(formatCPF(e.target.value))}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">Formato: XXX.XXX.XXX-XX</p>
            </div>

            <div>
              <Label htmlFor="register-name">Nome Completo</Label>
              <Input
                id="register-name"
                placeholder="Ex: João Silva"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button onClick={handleRegister} disabled={loading} className="w-full bg-[#c4a84b] hover:bg-[#b39740] text-[#1a1a1a]">
              {loading ? "Criando..." : "Criar Conta"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
