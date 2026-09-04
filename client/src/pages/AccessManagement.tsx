import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Edit2, Copy, Check, Lock, Power, PowerOff } from 'lucide-react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ROLE_LABELS = {
  admin: 'Administrador Global (Admin)',
  master: 'Xerife Master',
  comandante_corpo: 'Comandante do Corpo de Alunos (CAL)',
  subcomandante_corpo: 'Subcomandante do Corpo de Alunos',
  comandante_cfap: 'Comandante CFAP',
  subcomandante_cfap: 'Subcomandante CFAP',
  comandante_cia: 'Comandante de Companhia',
  comandante_pel: 'Comandante de Pelotão',
};

const PELOTON_OPTIONS = [
  { value: '1', label: '1º Pelotão' },
  { value: '2', label: '2º Pelotão' },
];

const COMPANHIA_OPTIONS = [
  { value: '1', label: '1ª Companhia' },
  { value: '2', label: '2ª Companhia' },
  { value: '3', label: '3ª Companhia' },
  { value: '4', label: '4ª Companhia' },
  { value: '5', label: '5ª Companhia' },
];

export function AccessManagement({ isTab = false }: { isTab?: boolean }) {
  const [, setLocation] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  const [isCreating, setIsCreating] = useState(false);
  const [editingAccess, setEditingAccess] = useState<any | null>(null);
  const [copiedPassword, setCopiedPassword] = useState<string | null>(null);
  
  const canManageAccess = user?.role === 'master';
  const canDeleteAccess = (_access: any) => canManageAccess;
  const canEditAccess = (_access: any) => canManageAccess;

  useEffect(() => {
    if (!isTab && user !== undefined) {
      if (!user) {
        setLocation("/login");
      } else if (!canManageAccess) {
        setLocation("/xerife");
      }
    }
  }, [canManageAccess, isTab, user, setLocation]);
  
  const [formData, setFormData] = useState<any>({
    name: '',
    email: '',
    role: 'comandante_pel',
    pelotaoId: '',
    companhiaId: '',
  });

  const createAccessMutation = trpc.access.createAccess.useMutation();
  const updateAccessMutation = trpc.access.updateAccess.useMutation();
  const deleteAccessMutation = trpc.access.deleteAccess.useMutation();
  const setActiveMutation = trpc.access.setActive.useMutation();
  const listAccessesQuery = trpc.access.listAccesses.useQuery(undefined, {
    enabled: canManageAccess,
  });

  const handleCreateAccess = async () => {
    try {
      await createAccessMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        pelotaoId: formData.pelotaoId ? parseInt(formData.pelotaoId) : undefined,
        companhiaId: formData.companhiaId ? parseInt(formData.companhiaId) : undefined,
      });
      
      setFormData({
        name: '',
        email: '',
        role: 'comandante_pel',
        pelotaoId: '',
        companhiaId: '',
      });
      setIsCreating(false);
      listAccessesQuery.refetch();
    } catch (error: any) {
      console.error('Erro ao criar acesso:', error.message);
    }
  };

  const handleDeleteAccess = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este acesso?')) return;
    
    try {
      await deleteAccessMutation.mutateAsync({ id });
      listAccessesQuery.refetch();
    } catch (error: any) {
      console.error('Erro ao deletar acesso:', error.message);
    }
  };

  const handleSetActive = async (id: number, isActive: boolean) => {
    await setActiveMutation.mutateAsync({ id, isActive });
    await listAccessesQuery.refetch();
  };

  const openEditAccess = (access: any) => {
    setEditingAccess({
      id: access.id,
      name: access.name || '',
      role: access.role,
      pelotaoId: access.pelotaoId ? String(access.pelotaoId) : '',
      companhiaId: access.companhiaId ? String(access.companhiaId) : '',
    });
  };

  const handleUpdateAccess = async () => {
    if (!editingAccess?.name) return;
    try {
      await updateAccessMutation.mutateAsync({
        id: editingAccess.id,
        name: editingAccess.name,
        role: editingAccess.role,
        pelotaoId: editingAccess.pelotaoId ? Number(editingAccess.pelotaoId) : null,
        companhiaId: editingAccess.companhiaId ? Number(editingAccess.companhiaId) : null,
      });
      setEditingAccess(null);
      await listAccessesQuery.refetch();
    } catch (error: any) {
      console.error('Erro ao atualizar acesso:', error.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPassword(text);
    setTimeout(() => setCopiedPassword(null), 2000);
  };

  const getRoleLabel = (role: string) => {
    return ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role;
  };

  const getPelotonLabel = (pelotaoId: number | null) => {
    if (!pelotaoId) return '-';
    return PELOTON_OPTIONS.find(p => p.value === pelotaoId.toString())?.label || '-';
  };

  const getCompanhiaLabel = (companhiaId: number | null) => {
    if (!companhiaId) return '-';
    return COMPANHIA_OPTIONS.find(c => c.value === companhiaId.toString())?.label || '-';
  };

  const content = (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-black text-foreground sm:text-3xl">Usuários e Acessos</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Contas administrativas e níveis de acesso do sistema</p>
        </div>

        {!canManageAccess && (
          <div className="flex items-center gap-2 text-amber-800 bg-amber-100 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-medium">Você não tem permissão para gerenciar contas</span>
          </div>
        )}

        {canManageAccess && (
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-[#1a3a2a] text-white hover:bg-[#234b36] font-bold gap-2 shadow-sm">
                + Criar Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-serif text-lg font-bold">Criar Nova Conta de Comando / Admin</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Nome Completo</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: João Silva"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Nome de Usuário (login)</label>
                  <Input
                    type="text"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Ex: cmt.pel1 ou email@exemplo.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Função</label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value: any) => {
                      const updatedData = { ...formData, role: value };
                      if (value !== 'comandante_pel') {
                        updatedData.pelotaoId = '';
                      }
                      if (value !== 'comandante_cia' && value !== 'comandante_pel') {
                        updatedData.companhiaId = '';
                      }
                      setFormData(updatedData);
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador Global (Admin)</SelectItem>
                      <SelectItem value="comandante_corpo">Comandante do Corpo de Alunos (CAL)</SelectItem>
                      <SelectItem value="subcomandante_corpo">Subcomandante do Corpo de Alunos</SelectItem>
                      <SelectItem value="comandante_cfap">Comandante CFAP</SelectItem>
                      <SelectItem value="subcomandante_cfap">Subcomandante CFAP</SelectItem>
                      <SelectItem value="comandante_cia">Comandante de Companhia</SelectItem>
                      <SelectItem value="comandante_pel">Comandante de Pelotão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.role === 'comandante_pel' && (
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase">Pelotão</label>
                    <Select value={formData.pelotaoId} onValueChange={(value) => setFormData({ ...formData, pelotaoId: value })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PELOTON_OPTIONS.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(formData.role === 'comandante_cia' || formData.role === 'comandante_pel') && (
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase">Companhia</label>
                    <Select value={formData.companhiaId} onValueChange={(value) => setFormData({ ...formData, companhiaId: value })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANHIA_OPTIONS.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button 
                  onClick={handleCreateAccess} 
                  disabled={!formData.name || !formData.email || createAccessMutation.isPending}
                  className="w-full bg-[#1a3a2a] text-white hover:bg-[#234b36] font-bold"
                >
                  {createAccessMutation.isPending ? 'Criando...' : 'Criar Conta'}
                </Button>

                {createAccessMutation.data && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm dark:bg-emerald-950/40 dark:border-emerald-800">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-200">Conta criada com sucesso!</p>
                    <p className="text-emerald-800 dark:text-emerald-300 mt-1 text-xs">Usuário: {createAccessMutation.data.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="bg-card px-2 py-1 rounded text-xs flex-1 break-all border">{createAccessMutation.data.tempPassword}</code>
                      <button
                        onClick={() => copyToClipboard(createAccessMutation.data.tempPassword)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-900"
                      >
                        {copiedPassword === createAccessMutation.data.tempPassword ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Dialog open={Boolean(editingAccess)} onOpenChange={(open) => !open && setEditingAccess(null)}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle className="font-serif text-lg font-bold">Editar acesso de comando</DialogTitle></DialogHeader>
          {editingAccess && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Nome completo</label>
                <Input value={editingAccess.name} onChange={(event) => setEditingAccess({ ...editingAccess, name: event.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Função</label>
                <Select value={editingAccess.role} onValueChange={(role) => setEditingAccess({
                  ...editingAccess,
                  role,
                  pelotaoId: role === 'comandante_pel' ? editingAccess.pelotaoId : '',
                  companhiaId: ['comandante_cia', 'comandante_pel'].includes(role) ? editingAccess.companhiaId : '',
                })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador Global (Admin)</SelectItem>
                    <SelectItem value="comandante_corpo">Comandante do Corpo de Alunos (CAL)</SelectItem>
                    <SelectItem value="subcomandante_corpo">Subcomandante do Corpo de Alunos</SelectItem>
                    <SelectItem value="comandante_cfap">Comandante CFAP</SelectItem>
                    <SelectItem value="subcomandante_cfap">Subcomandante CFAP</SelectItem>
                    <SelectItem value="comandante_cia">Comandante de Companhia</SelectItem>
                    <SelectItem value="comandante_pel">Comandante de Pelotão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingAccess.role === 'comandante_pel' && (
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Pelotão</label>
                  <Select value={editingAccess.pelotaoId} onValueChange={(pelotaoId) => setEditingAccess({ ...editingAccess, pelotaoId })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{PELOTON_OPTIONS.map((pelotao) => <SelectItem key={pelotao.value} value={pelotao.value}>{pelotao.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              {['comandante_cia', 'comandante_pel'].includes(editingAccess.role) && (
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Companhia</label>
                  <Select value={editingAccess.companhiaId} onValueChange={(companhiaId) => setEditingAccess({ ...editingAccess, companhiaId })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{COMPANHIA_OPTIONS.map((companhia) => <SelectItem key={companhia.value} value={companhia.value}>{companhia.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <Button className="w-full bg-[#1a3a2a] text-white hover:bg-[#234b36] font-bold" onClick={handleUpdateAccess} disabled={updateAccessMutation.isPending || !editingAccess.name}>
                {updateAccessMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {listAccessesQuery.isLoading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Carregando contas...</div>
      ) : listAccessesQuery.data?.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma conta de comando criada ainda
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {listAccessesQuery.data?.map((access) => (
            <Card key={access.id} className="overflow-hidden border border-border/70 shadow-sm bg-card rounded-2xl">
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 mb-4">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome</p>
                    <p className="mt-0.5 font-bold text-foreground text-sm sm:text-base truncate" title={access.name}>{access.name}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Usuário</p>
                    <p className="mt-0.5 font-bold text-foreground text-sm sm:text-base break-all" title={access.email}>{access.email}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Função</p>
                    <p className="mt-0.5 font-bold text-foreground text-sm sm:text-base">{getRoleLabel(access.role)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</p>
                    <p className="mt-0.5 font-bold text-sm sm:text-base">
                      {access.isActive === false ? (
                        <span className="text-red-600 dark:text-red-400">Desativado</span>
                      ) : access.forcePasswordChange ? (
                        <span className="text-amber-600 dark:text-amber-400">Aguardando primeira senha</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">Ativo</span>
                      )}
                    </p>
                  </div>
                  {access.pelotaoId && (
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pelotão</p>
                      <p className="mt-0.5 font-bold text-foreground text-sm">{getPelotonLabel(access.pelotaoId)}</p>
                    </div>
                  )}
                  {access.companhiaId && (
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Companhia</p>
                      <p className="mt-0.5 font-bold text-foreground text-sm">{getCompanhiaLabel(access.companhiaId)}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/40">
                  {canEditAccess(access) && (
                    <Button variant="outline" size="sm" onClick={() => openEditAccess(access)} className="h-10 text-xs font-semibold sm:h-9 sm:text-sm">
                      <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                      Editar
                    </Button>
                  )}
                  {canEditAccess(access) && access.role !== 'master' && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={setActiveMutation.isPending}
                      onClick={() => handleSetActive(access.id, access.isActive === false)}
                      className="h-10 text-xs font-semibold sm:h-9 sm:text-sm"
                    >
                      {access.isActive === false ? <Power className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> : <PowerOff className="mr-1.5 h-3.5 w-3.5 text-amber-600" />}
                      {access.isActive === false ? 'Reativar' : 'Desativar'}
                    </Button>
                  )}
                  {canDeleteAccess(access) ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteAccess(access.id)}
                      className="h-10 text-xs font-semibold sm:h-9 sm:text-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Deletar
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      title="Você não tem permissão para deletar acessos"
                      className="h-9 text-xs sm:text-sm font-semibold opacity-60"
                    >
                      <Lock className="w-3.5 h-3.5 mr-1.5" />
                      Deletar (Bloqueado)
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  if (isTab) return content;

  return (
    <div className="mobile-safe-bottom min-h-screen bg-[#f5f2e8] text-foreground dark:bg-[#0c0c0e]">
      <Navbar />
      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:py-10 max-w-6xl">
        {content}
      </main>
      <Footer />
    </div>
  );
}
