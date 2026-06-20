import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Shield, Users, Plus, Trash2, Edit2, Wallet,
  TrendingUp, TrendingDown, DollarSign, ChevronDown, ChevronUp, UserPlus, X,
  Save, Clock, Camera, Radio
} from "lucide-react";
import { toast } from "sonner";

const ICONE_OPTIONS = [
  { value: "shield", label: "Escudo", icon: "🛡️" },
  { value: "star", label: "Estrela", icon: "⭐" },
  { value: "crown", label: "Coroa", icon: "👑" },
  { value: "book", label: "Livro", icon: "📚" },
  { value: "music", label: "Música", icon: "🎵" },
  { value: "flag", label: "Bandeira", icon: "🚩" },
  { value: "heart", label: "Coração", icon: "❤️" },
  { value: "trophy", label: "Troféu", icon: "🏆" },
  { value: "wallet", label: "Carteira", icon: "💰" },
  { value: "users", label: "Grupo", icon: "👥" },
];

const EXTRA_ICONE_OPTIONS = [
  { value: "clock", label: "Homem-Hora", icon: "HH" },
  { value: "camera", label: "P5 / MÃ­dia", icon: "P5" },
  { value: "radio", label: "Aluno de LigaÃ§Ã£o", icon: "AL" },
  { value: "clipboard", label: "Prancheta", icon: "CP" },
  { value: "megaphone", label: "Avisos", icon: "AV" },
  { value: "briefcase", label: "Secretaria", icon: "SC" },
  { value: "target", label: "MissÃ£o", icon: "MS" },
  { value: "medal", label: "Medalha", icon: "MD" },
  { value: "calendar", label: "Escala", icon: "ES" },
  { value: "file", label: "Documento", icon: "DOC" },
  { value: "treasury", label: "Tesouraria", icon: "R$" },
  { value: "justice", label: "Conselho", icon: "CD" },
  { value: "check", label: "FiscalizaÃ§Ã£o", icon: "OK" },
  { value: "headphones", label: "ComunicaÃ§Ã£o", icon: "COM" },
  { value: "tools", label: "Apoio", icon: "AP" },
  { value: "map", label: "OrientaÃ§Ã£o", icon: "MAP" },
  { value: "bell", label: "Alerta", icon: "!" },
  { value: "note", label: "Registro", icon: "REG" },
];

const ALL_ICONE_OPTIONS = [...ICONE_OPTIONS, ...EXTRA_ICONE_OPTIONS];

function iconeEmoji(icone: string) {
  return ICONE_OPTIONS.find(o => o.value === icone)?.icon ?? "🛡️";
}

function cargoIconLabel(icone: string) {
  return ALL_ICONE_OPTIONS.find(o => o.value === icone)?.icon ?? iconeEmoji(icone);
}

interface Props {
  companhia: number;
  peloton: number;
  isAdmin: boolean;
}

function getCurrentWeekStart() {
  const copy = new Date();
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
}

export function ClassroomCargosTab({ companhia, peloton, isAdmin }: Props) {
  const utils = trpc.useUtils();

  const cargosQuery = trpc.classroom.listCargos.useQuery({ companhia, peloton });
  const studentsQuery = trpc.serviceScale.students.useQuery(
    { companhia, peloton },
    { enabled: isAdmin }
  );
  const rolesQuery = trpc.serviceScale.getPlatoonPublic.useQuery(
    { companhia, peloton, weekStart: getCurrentWeekStart() },
    { enabled: Boolean(companhia && peloton) }
  );

  const createCargo = trpc.classroom.createCargo.useMutation({
    onSuccess: () => { utils.classroom.listCargos.invalidate(); toast.success("Função criada!"); setShowCreateModal(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateCargo = trpc.classroom.updateCargo.useMutation({
    onSuccess: () => { utils.classroom.listCargos.invalidate(); toast.success("Função atualizada!"); setEditingCargo(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteCargo = trpc.classroom.deleteCargo.useMutation({
    onSuccess: () => { utils.classroom.listCargos.invalidate(); toast.success("Função removida!"); },
    onError: (e) => toast.error(e.message),
  });
  const addMember = trpc.classroom.addCargoMember.useMutation({
    onSuccess: () => { utils.classroom.listCargos.invalidate(); toast.success("Membro adicionado!"); setAddMemberCargoId(null); },
    onError: (e) => toast.error(e.message),
  });
  const removeMember = trpc.classroom.removeCargoMember.useMutation({
    onSuccess: () => { utils.classroom.listCargos.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const saveRoles = trpc.serviceScale.saveRoles.useMutation({
    onSuccess: async () => {
      toast.success("Cargos fixos atualizados!");
      await Promise.all([
        rolesQuery.refetch(),
        utils.serviceScale.getPlatoonPublic.invalidate(),
        utils.serviceScale.published.invalidate(),
      ]);
    },
    onError: (e) => toast.error(e.message),
  });

  // Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCargo, setEditingCargo] = useState<any | null>(null);
  const [formNome, setFormNome] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formIcone, setFormIcone] = useState("shield");
  const [formTesouraria, setFormTesouraria] = useState(false);
  const [homemHoraId, setHomemHoraId] = useState("");
  const [p5FilmmakerId, setP5FilmmakerId] = useState("");
  const [alunoLigacaoId, setAlunoLigacaoId] = useState("");

  // Member state
  const [addMemberCargoId, setAddMemberCargoId] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [memberTitulo, setMemberTitulo] = useState("");

  // Treasury state
  const [openTreasuryCargoId, setOpenTreasuryCargoId] = useState<number | null>(null);

  function resetForm() {
    setFormNome(""); setFormDesc(""); setFormIcone("shield"); setFormTesouraria(false);
  }

  function openCreate() {
    resetForm();
    setShowCreateModal(true);
  }

  function openEdit(cargo: any) {
    setFormNome(cargo.nome);
    setFormDesc(cargo.descricao || "");
    setFormIcone(cargo.icone || "shield");
    setFormTesouraria(cargo.temTesouraria);
    setEditingCargo(cargo);
  }

  function handleCreate() {
    if (!formNome.trim()) return toast.error("Nome é obrigatório");
    createCargo.mutate({ companhia, peloton, nome: formNome.trim(), descricao: formDesc.trim() || undefined, icone: formIcone, temTesouraria: formTesouraria });
  }

  function handleUpdate() {
    if (!editingCargo || !formNome.trim()) return;
    updateCargo.mutate({ id: editingCargo.id, companhia, peloton, nome: formNome.trim(), descricao: formDesc.trim() || undefined, icone: formIcone, temTesouraria: formTesouraria });
  }

  function handleAddMember() {
    if (!addMemberCargoId || !selectedStudentId) return toast.error("Selecione um aluno");
    addMember.mutate({ cargoId: addMemberCargoId, companhia, peloton, studentId: Number(selectedStudentId), tituloCargo: memberTitulo.trim() || undefined });
    setSelectedStudentId(""); setMemberTitulo("");
  }

  const cargos = cargosQuery.data ?? [];
  const students = studentsQuery.data ?? [];
  const studentOptions = students.map((student: any) => ({
    value: String(student.id),
    label: `${student.numerica} - ${student.nomeGuerra}`,
  }));

  useEffect(() => {
    const roles = rolesQuery.data?.roles;
    setHomemHoraId(roles?.homemHoraId ? String(roles.homemHoraId) : "");
    setP5FilmmakerId(roles?.p5FilmmakerId ? String(roles.p5FilmmakerId) : "");
    setAlunoLigacaoId(roles?.alunoLigacaoId ? String(roles.alunoLigacaoId) : "");
  }, [rolesQuery.data?.roles]);

  function toNullableId(value: string) {
    return value && value !== "none" ? Number(value) : null;
  }

  function handleSaveFixedRoles() {
    saveRoles.mutate({
      companhia,
      peloton,
      homemHoraId: toNullableId(homemHoraId),
      p5FilmmakerId: toNullableId(p5FilmmakerId),
      alunoLigacaoId: toNullableId(alunoLigacaoId),
    });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#c4a84b]" />
          <h2 className="text-lg font-bold text-[#1a3a2a] dark:text-[#c4a84b]">Funções e Cargos</h2>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={openCreate} className="bg-[#c4a84b] hover:bg-[#b8973e] text-black font-bold gap-1">
            <Plus className="h-4 w-4" /> Nova Função
          </Button>
        )}
      </div>

      <Card className="border-[#c4a84b]/25 bg-[#c4a84b]/5 dark:border-[#c4a84b]/20 dark:bg-[#c4a84b]/10">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-[0.16em] text-[#1a3a2a] dark:text-[#f0bd3a]">
                Cargos Fixos do Pelotão
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Defina as funções permanentes que aparecem no quadro geral da sala.
              </p>
            </div>
            {rolesQuery.isFetching && <Badge variant="outline" className="w-fit text-[10px]">Atualizando</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border bg-background/80 p-3 dark:bg-[#071018]">
              <Label className="mb-2 flex items-center gap-2 text-xs font-bold">
                <Clock className="h-4 w-4 text-[#c4a84b]" />
                Homem-Hora
              </Label>
              <Select value={homemHoraId || "none"} onValueChange={(value) => setHomemHoraId(value === "none" ? "" : value)} disabled={!isAdmin}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não definido</SelectItem>
                  {studentOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border bg-background/80 p-3 dark:bg-[#071018]">
              <Label className="mb-2 flex items-center gap-2 text-xs font-bold">
                <Camera className="h-4 w-4 text-[#c4a84b]" />
                P5
              </Label>
              <Select value={p5FilmmakerId || "none"} onValueChange={(value) => setP5FilmmakerId(value === "none" ? "" : value)} disabled={!isAdmin}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não definido</SelectItem>
                  {studentOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border bg-background/80 p-3 dark:bg-[#071018]">
              <Label className="mb-2 flex items-center gap-2 text-xs font-bold">
                <Radio className="h-4 w-4 text-[#c4a84b]" />
                Aluno de Ligação
              </Label>
              <Select value={alunoLigacaoId || "none"} onValueChange={(value) => setAlunoLigacaoId(value === "none" ? "" : value)} disabled={!isAdmin}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não definido</SelectItem>
                  {studentOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isAdmin && (
            <Button
              type="button"
              className="h-9 w-full gap-2 bg-[#1a3a2a] text-white hover:bg-[#145c3a] sm:w-auto"
              onClick={handleSaveFixedRoles}
              disabled={saveRoles.isPending}
            >
              <Save className="h-4 w-4" />
              Salvar Cargos Fixos
            </Button>
          )}
        </CardContent>
      </Card>

      {cargosQuery.isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

      {!cargosQuery.isLoading && cargos.length === 0 && (
        <Card className="border-dashed border-[#c4a84b]/30 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <Shield className="h-10 w-10 text-[#c4a84b]/40" />
            <p className="text-muted-foreground text-sm">Nenhuma função criada ainda.</p>
            {isAdmin && <Button size="sm" variant="outline" onClick={openCreate} className="gap-1 border-[#c4a84b]/50 text-[#c4a84b]"><Plus className="h-4 w-4" />Criar primeira função</Button>}
          </CardContent>
        </Card>
      )}

      {cargos.map((cargo) => (
        <Card key={cargo.id} className="border-border/50 bg-white dark:bg-zinc-900/50">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{cargoIconLabel(cargo.icone)}</span>
                <div>
                  <CardTitle className="text-base font-bold text-foreground">{cargo.nome}</CardTitle>
                  {cargo.descricao && <p className="text-xs text-muted-foreground mt-0.5">{cargo.descricao}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {cargo.temTesouraria && (
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-[#c4a84b]" onClick={() => setOpenTreasuryCargoId(openTreasuryCargoId === cargo.id ? null : cargo.id)}>
                    <Wallet className="h-4 w-4" />
                  </Button>
                )}
                {isAdmin && (
                  <>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(cargo)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { if (confirm(`Remover função "${cargo.nome}"?`)) deleteCargo.mutate({ id: cargo.id, companhia, peloton }); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Members */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Membros ({cargo.members.length})</span>
                </div>
                {isAdmin && (
                  <Button size="sm" variant="ghost" className="h-6 text-xs gap-1 text-[#c4a84b] hover:text-[#c4a84b]" onClick={() => { setAddMemberCargoId(cargo.id); setSelectedStudentId(""); setMemberTitulo(""); }}>
                    <UserPlus className="h-3 w-3" /> Nomear
                  </Button>
                )}
              </div>

              {cargo.members.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhum membro nomeado</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {cargo.members.map((m) => (
                    <Badge key={m.id} variant="secondary" className="gap-1 pr-1 text-xs">
                      <span>{m.numerica} - {m.nomeGuerra}</span>
                      {m.tituloCargo && <span className="text-muted-foreground">({m.tituloCargo})</span>}
                      {isAdmin && (
                        <button onClick={() => removeMember.mutate({ cargoId: cargo.id, companhia, peloton, studentId: m.studentId })} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Add member inline */}
            {addMemberCargoId === cargo.id && (
              <div className="border border-[#c4a84b]/30 rounded-lg p-3 space-y-2 bg-[#c4a84b]/5">
                <p className="text-xs font-semibold text-[#c4a84b]">Nomear aluno para "{cargo.nome}"</p>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Selecionar aluno..." />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.numerica} - {s.nomeGuerra}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Título do cargo (opcional)" value={memberTitulo} onChange={e => setMemberTitulo(e.target.value)} className="h-8 text-sm" />
                <div className="flex gap-2">
                  <Button size="sm" className="bg-[#c4a84b] hover:bg-[#b8973e] text-black font-bold h-7 text-xs" onClick={handleAddMember} disabled={addMember.isPending}>Nomear</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAddMemberCargoId(null)}>Cancelar</Button>
                </div>
              </div>
            )}

            {/* Treasury */}
            {cargo.temTesouraria && openTreasuryCargoId === cargo.id && (
              <TreasuryPanel cargoId={cargo.id} companhia={companhia} peloton={peloton} isAdmin={isAdmin} cargoNome={cargo.nome} />
            )}
          </CardContent>
        </Card>
      ))}

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal || !!editingCargo} onOpenChange={(open) => { if (!open) { setShowCreateModal(false); setEditingCargo(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCargo ? "Editar Função" : "Nova Função"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome da Função *</Label>
              <Input placeholder="Ex: Grêmio, Presidente, Tesoureiro..." value={formNome} onChange={e => setFormNome(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Descrição (opcional)</Label>
              <Input placeholder="Descrição breve..." value={formDesc} onChange={e => setFormDesc(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Ícone</Label>
              <Select value={formIcone} onValueChange={setFormIcone}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ICONE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.icon} {o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="tesouraria" checked={formTesouraria} onCheckedChange={(v) => setFormTesouraria(Boolean(v))} />
              <Label htmlFor="tesouraria" className="text-sm cursor-pointer flex items-center gap-1.5">
                <Wallet className="h-4 w-4 text-[#c4a84b]" /> Habilitar Tesouraria Digital
              </Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => { setShowCreateModal(false); setEditingCargo(null); }}>Cancelar</Button>
            <Button className="bg-[#c4a84b] hover:bg-[#b8973e] text-black font-bold" onClick={editingCargo ? handleUpdate : handleCreate} disabled={createCargo.isPending || updateCargo.isPending}>
              {editingCargo ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== TESOURARIA PANEL =====
function TreasuryPanel({ cargoId, companhia, peloton, isAdmin, cargoNome }: { cargoId: number; companhia: number; peloton: number; isAdmin: boolean; cargoNome: string }) {
  const utils = trpc.useUtils();
  const entriesQuery = trpc.classroom.listTreasuryEntries.useQuery({ cargoId });
  const addEntry = trpc.classroom.addTreasuryEntry.useMutation({
    onSuccess: () => { utils.classroom.listTreasuryEntries.invalidate(); toast.success("Lançamento registrado!"); setShowForm(false); resetEntryForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteEntry = trpc.classroom.deleteTreasuryEntry.useMutation({
    onSuccess: () => { utils.classroom.listTreasuryEntries.invalidate(); toast.success("Lançamento removido!"); },
    onError: (e) => toast.error(e.message),
  });

  const [showForm, setShowForm] = useState(false);
  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));

  function resetEntryForm() { setValor(""); setDescricao(""); setTipo("entrada"); setData(new Date().toISOString().slice(0, 10)); }

  function handleAdd() {
    const v = parseFloat(valor.replace(",", "."));
    if (!v || v <= 0) return toast.error("Valor inválido");
    if (!descricao.trim()) return toast.error("Descrição obrigatória");
    addEntry.mutate({ cargoId, companhia, peloton, tipo, valor: v, descricao: descricao.trim(), data });
  }

  const entries = entriesQuery.data ?? [];
  const saldo = (entries as any[]).reduce((acc: number, e: any) => e.tipo === "entrada" ? acc + e.valor : acc - e.valor, 0);
  const totalEntradas = (entries as any[]).filter((e: any) => e.tipo === "entrada").reduce((acc: number, e: any) => acc + e.valor, 0);
  const totalSaidas = (entries as any[]).filter((e: any) => e.tipo === "saida").reduce((acc: number, e: any) => acc + e.valor, 0);

  return (
    <div className="border border-[#c4a84b]/30 rounded-lg p-3 space-y-3 bg-[#c4a84b]/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Wallet className="h-4 w-4 text-[#c4a84b]" />
          <span className="text-sm font-bold text-[#c4a84b]">Tesouraria — {cargoNome}</span>
        </div>
        {isAdmin && (
          <Button size="sm" variant="ghost" className="h-6 text-xs gap-1 text-[#c4a84b]" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-3 w-3" /> Lançar
          </Button>
        )}
      </div>

      {/* Saldo summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-green-500/10 rounded-lg p-2">
          <TrendingUp className="h-3.5 w-3.5 text-green-500 mx-auto mb-0.5" />
          <p className="text-xs text-muted-foreground">Entradas</p>
          <p className="text-sm font-bold text-green-600 dark:text-green-400">R$ {totalEntradas.toFixed(2)}</p>
        </div>
        <div className="bg-red-500/10 rounded-lg p-2">
          <TrendingDown className="h-3.5 w-3.5 text-red-500 mx-auto mb-0.5" />
          <p className="text-xs text-muted-foreground">Saídas</p>
          <p className="text-sm font-bold text-red-600 dark:text-red-400">R$ {totalSaidas.toFixed(2)}</p>
        </div>
        <div className={`rounded-lg p-2 ${saldo >= 0 ? "bg-[#c4a84b]/10" : "bg-red-500/10"}`}>
          <DollarSign className="h-3.5 w-3.5 text-[#c4a84b] mx-auto mb-0.5" />
          <p className="text-xs text-muted-foreground">Saldo</p>
          <p className={`text-sm font-bold ${saldo >= 0 ? "text-[#c4a84b]" : "text-red-500"}`}>R$ {saldo.toFixed(2)}</p>
        </div>
      </div>

      {/* Add entry form */}
      {showForm && (
        <div className="border border-[#c4a84b]/20 rounded-lg p-3 space-y-2 bg-background">
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant={tipo === "entrada" ? "default" : "outline"} className={tipo === "entrada" ? "bg-green-600 hover:bg-green-700 text-white h-8" : "h-8"} onClick={() => setTipo("entrada")}>
              <TrendingUp className="h-3.5 w-3.5 mr-1" /> Entrada
            </Button>
            <Button size="sm" variant={tipo === "saida" ? "default" : "outline"} className={tipo === "saida" ? "bg-red-600 hover:bg-red-700 text-white h-8" : "h-8"} onClick={() => setTipo("saida")}>
              <TrendingDown className="h-3.5 w-3.5 mr-1" /> Saída
            </Button>
          </div>
          <Input placeholder="Valor (R$)" value={valor} onChange={e => setValor(e.target.value)} className="h-8 text-sm" type="number" min="0" step="0.01" />
          <Input placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} className="h-8 text-sm" />
          <Input type="date" value={data} onChange={e => setData(e.target.value)} className="h-8 text-sm" />
          <div className="flex gap-2">
            <Button size="sm" className="bg-[#c4a84b] hover:bg-[#b8973e] text-black font-bold h-7 text-xs flex-1" onClick={handleAdd} disabled={addEntry.isPending}>Registrar</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Entries list */}
      {entries.length > 0 && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {entries.map((e: any) => (
            <div key={e.id} className="flex items-center justify-between gap-2 text-xs bg-background rounded-md px-2 py-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                {e.tipo === "entrada"
                  ? <TrendingUp className="h-3 w-3 text-green-500 shrink-0" />
                  : <TrendingDown className="h-3 w-3 text-red-500 shrink-0" />}
                <span className="truncate text-foreground">{e.descricao}</span>
                <span className="text-muted-foreground shrink-0">{e.data}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className={`font-bold ${e.tipo === "entrada" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {e.tipo === "entrada" ? "+" : "-"}R$ {e.valor.toFixed(2)}
                </span>
                {isAdmin && (
                  <button onClick={() => deleteEntry.mutate({ id: e.id, companhia, peloton })} className="text-muted-foreground hover:text-destructive ml-1">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground text-center italic">Nenhum lançamento registrado</p>
      )}
    </div>
  );
}
