import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Save, KeyRound } from "lucide-react";

export function UsersTab() {
  const { data: usersList } = trpc.users.list.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "admin" as "user" | "admin" });
  const [passwordByUser, setPasswordByUser] = useState<Record<number, string>>({});

  const utils = trpc.useUtils();
  const createUser = trpc.users.create.useMutation({
    onSuccess: () => { toast.success("Usuário criado!"); utils.users.invalidate(); setDialogOpen(false); setNewUser({ name: "", email: "", password: "", role: "admin" }); },
    onError: (e) => toast.error(e.message),
  });
  const deleteUserMut = trpc.users.delete.useMutation({
    onSuccess: () => { toast.success("Usuário removido!"); utils.users.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const updateRole = trpc.users.updateRole.useMutation({
    onSuccess: () => { toast.success("Papel atualizado!"); utils.users.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const resetPassword = trpc.users.resetPassword.useMutation({
    onSuccess: (_data, variables) => {
      toast.success("Senha alterada!");
      setPasswordByUser((current) => ({ ...current, [variables.id]: "" }));
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-foreground">Gerenciar Usuários</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#c4a84b] text-[#1a1a1a] gap-2"><Plus className="h-4 w-4" /> Novo Usuário</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] overflow-y-auto p-4 sm:max-w-lg sm:p-6">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>Preencha os dados abaixo para cadastrar um novo administrador ou usuário no sistema.</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createUser.mutate(newUser); }} className="space-y-4">
              <div><Label>Nome *</Label><Input value={newUser.name} onChange={e => setNewUser(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><Label>Email *</Label><Input type="email" value={newUser.email} onChange={e => setNewUser(f => ({ ...f, email: e.target.value }))} required /></div>
              <div><Label>Senha *</Label><Input type="password" value={newUser.password} onChange={e => setNewUser(f => ({ ...f, password: e.target.value }))} required minLength={4} /></div>
              <div><Label>Papel</Label>
                <Select value={newUser.role} onValueChange={v => setNewUser(f => ({ ...f, role: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-[#1a3a2a] text-white gap-2" disabled={createUser.isPending}>
                <Save className="h-4 w-4" />{createUser.isPending ? "Criando..." : "Criar Usuário"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {usersList?.map((u: any) => (
          <Card key={u.id} className="border-border/50">
            <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="w-10 h-10 rounded-full bg-[#1a3a2a] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {(u.name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{u.name || "Sem nome"}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <Badge className={u.role === "master" ? "bg-[#c4a84b] text-[#1a1a1a]" : u.role === "admin" ? "bg-[#1a3a2a] text-white" : "bg-gray-200 text-gray-700"}>
                {u.role === "master" ? "Xerife Master" : u.role === "admin" ? "Administrador" : "Usuário"}
              </Badge>
              {u.role !== "master" && (
                <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
                  <Select value={u.role} onValueChange={v => updateRole.mutate({ id: u.id, role: v as any })}>
                    <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="password"
                    placeholder="Nova senha"
                    className="h-8 w-36 text-xs"
                    value={passwordByUser[u.id] || ""}
                    onChange={(event) =>
                      setPasswordByUser((current) => ({ ...current, [u.id]: event.target.value }))
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    disabled={!passwordByUser[u.id] || resetPassword.isPending}
                    onClick={() => resetPassword.mutate({ id: u.id, password: passwordByUser[u.id] })}
                  >
                    <KeyRound className="h-3 w-3" />
                    Senha
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive h-8 w-8"
                    onClick={() => { if (confirm("Remover este usuário?")) deleteUserMut.mutate({ id: u.id }); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
