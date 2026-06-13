import { useState } from "react";
import { Link } from "wouter";
import { Crown, Shield, Trash2, LayoutGrid, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ServiceScaleTab() {
  const utils = trpc.useUtils();
  const { data: access } = trpc.serviceScale.myAccess.useQuery();
  const { data: users } = trpc.users.list.useQuery(undefined, { enabled: access?.isMaster === true });
  const { data: assignments } = trpc.serviceScale.assignments.useQuery(undefined, { enabled: access?.isMaster === true });

  const [assignmentForm, setAssignmentForm] = useState({
    userId: "",
    level: "pelotao",
    companhia: "1",
    peloton: "1",
  });

  const saveAssignment = trpc.serviceScale.saveAssignment.useMutation({
    onSuccess: async () => {
      toast.success("Xerife configurado com sucesso!");
      setAssignmentForm({ userId: "", level: "pelotao", companhia: "1", peloton: "1" });
      await utils.serviceScale.assignments.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteAssignment = trpc.serviceScale.deleteAssignment.useMutation({
    onSuccess: async () => {
      toast.success("Configuração de acesso removida");
      await utils.serviceScale.assignments.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSaveAssignment = () => {
    if (!assignmentForm.userId) {
      toast.error("Selecione um usuário");
      return;
    }
    saveAssignment.mutate({
      userId: Number(assignmentForm.userId),
      level: assignmentForm.level as "principal" | "companhia" | "pelotao",
      companhia: assignmentForm.level === "principal" ? null : Number(assignmentForm.companhia),
      peloton: assignmentForm.level === "pelotao" ? Number(assignmentForm.peloton) : null,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Sala de Aula Office Access Card */}
      <Card className="border-border/50 bg-white dark:bg-zinc-900 shadow-md">
        <CardHeader className="pb-3 border-b bg-gradient-to-r from-[#1a3a2a]/5 via-transparent to-transparent">
          <CardTitle className="text-lg font-black uppercase tracking-wider text-[#1a3a2a] dark:text-[#c4a84b] flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-[#c4a84b]" />
            Escritório de Trabalho da Sala de Aula
          </CardTitle>
          <CardDescription className="text-xs">
            Acesse o painel unificado e dinâmico da Sala de Aula para gerenciar todas as atividades do seu pelotão.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            As opções de <strong>Mapa de Assentos (5 Fileiras)</strong>, <strong>Frequência (Pecúlio)</strong>, 
            <strong>Efetivo do Pelotão</strong>, <strong>Escalas de Faxina</strong>, <strong>Banco de Aditamentos</strong> 
            e <strong>Histórico de Lideranças</strong> foram unificadas em uma experiência interativa e otimizada 
            para dispositivos móveis.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/sala-de-aula">
              <Button className="bg-[#1a3a2a] hover:bg-[#1a3a2a]/95 text-white gap-2 font-bold shadow-md hover:scale-[1.02] transition-transform duration-200">
                Acessar Sala de Aula
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 2. Master Permission Configuration (Configurar Xerifes) */}
      {access?.isMaster && (
        <Card className="border-border/50 bg-white dark:bg-zinc-900 shadow-md">
          <CardHeader className="pb-3 border-b bg-gradient-to-r from-[#c4a84b]/5 via-transparent to-transparent">
            <CardTitle className="text-lg font-black uppercase tracking-wider text-[#1a3a2a] dark:text-[#c4a84b] flex items-center gap-2">
              <Crown className="h-5 w-5 text-[#c4a84b] fill-current" />
              Configurar Atribuições de Xerife (Master)
            </CardTitle>
            <CardDescription className="text-xs">
              Conceda ou revogue permissões de gerenciamento de Sala de Aula/Quadro de Serviço para usuários cadastrados.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Form */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5 md:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="user-select" className="text-xs font-bold uppercase text-muted-foreground">Usuário</Label>
                <Select value={assignmentForm.userId} onValueChange={(value) => setAssignmentForm((form) => ({ ...form, userId: value }))}>
                  <SelectTrigger id="user-select" className="bg-white dark:bg-zinc-800">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(users ?? []).filter((user: any) => user.role !== "master").map((user: any) => (
                      <SelectItem key={user.id} value={String(user.id)}>{user.name || user.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="level-select" className="text-xs font-bold uppercase text-muted-foreground">Nível</Label>
                <Select value={assignmentForm.level} onValueChange={(value) => setAssignmentForm((form) => ({ ...form, level: value }))}>
                  <SelectTrigger id="level-select" className="bg-white dark:bg-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="principal">Principal (Geral)</SelectItem>
                    <SelectItem value="companhia">Companhia</SelectItem>
                    <SelectItem value="pelotao">Pelotão</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="companhia-select" className="text-xs font-bold uppercase text-muted-foreground">Companhia</Label>
                <Select 
                  value={assignmentForm.companhia} 
                  onValueChange={(value) => setAssignmentForm((form) => ({ ...form, companhia: value }))} 
                  disabled={assignmentForm.level === "principal"}
                >
                  <SelectTrigger id="companhia-select" className="bg-white dark:bg-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((item) => <SelectItem key={item} value={String(item)}>{item}ª Companhia</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pelotao-select" className="text-xs font-bold uppercase text-muted-foreground">Pelotão</Label>
                <Select 
                  value={assignmentForm.peloton} 
                  onValueChange={(value) => setAssignmentForm((form) => ({ ...form, peloton: value }))} 
                  disabled={assignmentForm.level !== "pelotao"}
                >
                  <SelectTrigger id="pelotao-select" className="bg-white dark:bg-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2].map((item) => <SelectItem key={item} value={String(item)}>{item}º Pelotão</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="bg-[#1a3a2a] hover:bg-[#1a3a2a]/95 text-white gap-2 font-bold w-full" 
                onClick={handleSaveAssignment} 
                disabled={saveAssignment.isPending}
              >
                <Shield className="h-4 w-4" />
                Salvar
              </Button>
            </div>

            {/* List */}
            <div className="space-y-3 pt-4 border-t dark:border-zinc-800">
              <h3 className="text-sm font-bold text-foreground">Atribuições Ativas</h3>
              {(assignments ?? []).map((assignment: any) => (
                <div key={assignment.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-foreground">{assignment.userName || assignment.userEmail}</p>
                    <p className="text-xs text-muted-foreground">
                      {assignment.level === "principal" && "Xerife Principal"}
                      {assignment.level === "companhia" && `${assignment.companhia}ª Companhia`}
                      {assignment.level === "pelotao" && `${assignment.companhia}ª Companhia / ${assignment.peloton}º Pelotão`}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="gap-1 text-destructive hover:bg-destructive/10 self-end sm:self-center" 
                    onClick={() => deleteAssignment.mutate({ id: assignment.id })}
                    disabled={deleteAssignment.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remover
                  </Button>
                </div>
              ))}
              {!assignments?.length && (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Nenhum xerife ou administrador de pelotão configurado.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
