import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Edit2, Copy, Check, Lock } from 'lucide-react';
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
  const { data: myAccess } = trpc.serviceScale.myAccess.useQuery();
  const [isCreating, setIsCreating] = useState(false);
  const [editingAccess, setEditingAccess] = useState<any | null>(null);
  const [copiedPassword, setCopiedPassword] = useState<string | null>(null);
  
  const canManageAccess = user?.role === 'master';
  const canDeleteAccess = (_access: any) => user?.role === 'master';
  const canEditAccess = (_access: any) => user?.role === 'master';

  useEffect(() => {
    if (!isTab && user !== undefined && myAccess !== undefined) {
      if (!user) {
        setLocation("/login");
      } else {
        const canManage = user.role === 'master';
        if (!canManage) {
          setLocation("/xerife");
        }
      }
    }
  }, [isTab, user, myAccess, setLocation]);
  
  const [formData, setFormData] = useState<any>({
    name: '',
    email: '',
    role: 'comandante_pel',
    pelotaoId: '',
    companhiaId: '',
  })

  const createAccessMutation = trpc.access.createAccess.useMutation();
  const updateAccessMutation = trpc.access.updateAccess.useMutation();
  const deleteAccessMutation = trpc.access.deleteAccess.useMutation();
  const listAccessesQuery = trpc.access.listAccesses.useQuery();

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Usuários e Acessos</h1>
        {!canManageAccess && (
          <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-2 rounded">
            <Lock className="w-4 h-4" />
            <span className="text-sm">Você nao tem permissao para gerenciar contas</span>
          </div>
        )}
        {canManageAccess && (
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>+ Criar Nova Conta</Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Nova Conta de Comando / Admin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome Completo</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: João Silva"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Nome de Usuário (login)</label>
                <Input
                  type="text"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: cmt.pel1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Função</label>
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
                  <SelectTrigger>
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
                  <label className="text-sm font-medium">Pelotão</label>
                  <Select value={formData.pelotaoId} onValueChange={(value) => setFormData({ ...formData, pelotaoId: value })}>
                    <SelectTrigger>
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
                  <label className="text-sm font-medium">Companhia</label>
                  <Select value={formData.companhiaId} onValueChange={(value) => setFormData({ ...formData, companhiaId: value })}>
                    <SelectTrigger>
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
                className="w-full"
              >
                {createAccessMutation.isPending ? 'Criando...' : 'Criar Conta'}
              </Button>

              {createAccessMutation.data && (
                <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                  <p className="font-semibold text-green-900">Conta criada com sucesso!</p>
                  <p className="text-green-800 mt-1">Usuário: {createAccessMutation.data.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="bg-card px-2 py-1 rounded text-xs flex-1 break-all">{createAccessMutation.data.tempPassword}</code>
                    <button
                      onClick={() => copyToClipboard(createAccessMutation.data.tempPassword)}
                      className="p-1 hover:bg-green-100 rounded"
                    >
                      {copiedPassword === createAccessMutation.data.tempPassword ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
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
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar acesso de comando</DialogTitle></DialogHeader>
          {editingAccess && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome completo</label>
                <Input value={editingAccess.name} onChange={(event) => setEditingAccess({ ...editingAccess, name: event.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Função</label>
                <Select value={editingAccess.role} onValueChange={(role) => setEditingAccess({
                  ...editingAccess,
                  role,
                  pelotaoId: role === 'comandante_pel' ? editingAccess.pelotaoId : '',
                  companhiaId: ['comandante_cia', 'comandante_pel'].includes(role) ? editingAccess.companhiaId : '',
                })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <label className="text-sm font-medium">Pelotão</label>
                  <Select value={editingAccess.pelotaoId} onValueChange={(pelotaoId) => setEditingAccess({ ...editingAccess, pelotaoId })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{PELOTON_OPTIONS.map((pelotao) => <SelectItem key={pelotao.value} value={pelotao.value}>{pelotao.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              {['comandante_cia', 'comandante_pel'].includes(editingAccess.role) && (
                <div>
                  <label className="text-sm font-medium">Companhia</label>
                  <Select value={editingAccess.companhiaId} onValueChange={(companhiaId) => setEditingAccess({ ...editingAccess, companhiaId })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{COMPANHIA_OPTIONS.map((companhia) => <SelectItem key={companhia.value} value={companhia.value}>{companhia.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <Button className="w-full" onClick={handleUpdateAccess} disabled={updateAccessMutation.isPending || !editingAccess.name}>
                {updateAccessMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {listAccessesQuery.isLoading ? (
        <div className="text-center py-8">Carregando contas...</div>
      ) : listAccessesQuery.data?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Nenhuma conta de comando criada ainda
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {listAccessesQuery.data?.map((access) => (
            <Card key={access.id}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Nome</p>
                    <p className="font-semibold">{access.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Usuário</p>
                    <p className="font-semibold">{access.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Função</p>
                    <p className="font-semibold">{getRoleLabel(access.role)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-semibold">
                      {access.forcePasswordChange ? (
                        <span className="text-orange-600">Aguardando primeira senha</span>
                      ) : (
                        <span className="text-green-600">Ativo</span>
                      )}
                    </p>
                  </div>
                  {access.pelotaoId && (
                    <div>
                      <p className="text-sm text-gray-600">Pelotão</p>
                      <p className="font-semibold">{getPelotonLabel(access.pelotaoId)}</p>
                    </div>
                  )}
                  {access.companhiaId && (
                    <div>
                      <p className="text-sm text-gray-600">Companhia</p>
                      <p className="font-semibold">{getCompanhiaLabel(access.companhiaId)}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {canEditAccess(access) && (
                    <Button variant="outline" size="sm" onClick={() => openEditAccess(access)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  )}
                  {canDeleteAccess(access) ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteAccess(access.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Deletar
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      title="Voce nao tem permissao para deletar acessos"
                    >
                      <Lock className="w-4 h-4 mr-2" />
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
      <main className="container mx-auto px-4 py-6 md:py-10 max-w-6xl">
        {content}
      </main>
      <Footer />
    </div>
  );
}
