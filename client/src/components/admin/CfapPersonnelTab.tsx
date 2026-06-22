import { useEffect, useState } from "react";
import { Building2, Pencil, Plus, Search, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type PersonnelCategory = "comando" | "administracao" | "corpo_alunos" | "apoio";

type PersonnelForm = {
  category: PersonnelCategory;
  rank: string;
  fullName: string;
  ci: string;
  permanentFunction: string;
  section: string;
  companhia: string;
  peloton: string;
  isActive: boolean;
  sourceDocument: string;
  sourceDate: string;
  notes: string;
};

const EMPTY_FORM: PersonnelForm = {
  category: "administracao",
  rank: "",
  fullName: "",
  ci: "",
  permanentFunction: "",
  section: "",
  companhia: "none",
  peloton: "none",
  isActive: true,
  sourceDocument: "",
  sourceDate: "",
  notes: "",
};

const CATEGORY_LABELS: Record<PersonnelCategory, string> = {
  comando: "Comando",
  administracao: "Administração",
  corpo_alunos: "Corpo de Alunos",
  apoio: "Apoio",
};

function toForm(item: any): PersonnelForm {
  return {
    category: item.category,
    rank: item.rank || "",
    fullName: item.fullName || "",
    ci: item.ci || "",
    permanentFunction: item.permanentFunction || "",
    section: item.section || "",
    companhia: item.companhia ? String(item.companhia) : "none",
    peloton: item.peloton ? String(item.peloton) : "none",
    isActive: item.isActive !== false,
    sourceDocument: item.sourceDocument || "",
    sourceDate: item.sourceDate || "",
    notes: item.notes || "",
  };
}

export function CfapPersonnelTab() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PersonnelForm>(EMPTY_FORM);

  const summaryQuery = trpc.cfapPersonnel.summary.useQuery();
  const personnelQuery = trpc.cfapPersonnel.list.useQuery({ includeInactive, search: search || undefined });
  const personnel = personnelQuery.data ?? [];

  const createPersonnel = trpc.cfapPersonnel.create.useMutation({
    onSuccess: async () => {
      toast.success("Militar incluído no efetivo do CFAP");
      setDialogOpen(false);
      await Promise.all([utils.cfapPersonnel.list.invalidate(), utils.cfapPersonnel.summary.invalidate()]);
    },
    onError: (error) => toast.error(error.message),
  });
  const updatePersonnel = trpc.cfapPersonnel.update.useMutation({
    onSuccess: async () => {
      toast.success("Cadastro do efetivo atualizado");
      setDialogOpen(false);
      await Promise.all([utils.cfapPersonnel.list.invalidate(), utils.cfapPersonnel.summary.invalidate()]);
    },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    if (!dialogOpen) {
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
  }, [dialogOpen]);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm(toForm(item));
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.fullName.trim() || !form.rank.trim() || !form.permanentFunction.trim()) {
      toast.error("Preencha nome, posto/graduação e função");
      return;
    }
    const payload = {
      category: form.category,
      rank: form.rank.trim(),
      fullName: form.fullName.trim(),
      ci: form.ci.trim() || null,
      permanentFunction: form.permanentFunction.trim(),
      section: form.section.trim() || null,
      companhia: form.companhia === "none" ? null : Number(form.companhia),
      peloton: form.peloton === "none" ? null : Number(form.peloton),
      isActive: form.isActive,
      sourceDocument: form.sourceDocument.trim() || null,
      sourceDate: form.sourceDate || null,
      notes: form.notes.trim() || null,
    };
    if (editingId) updatePersonnel.mutate({ id: editingId, ...payload });
    else createPersonnel.mutate(payload);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#c4a84b]" />
            <h2 className="text-lg font-bold text-foreground">Efetivo Institucional do CFAP</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Cadastro reservado ao Xerife Geral. Funções diárias serão controladas separadamente nas escalas.
          </p>
        </div>
        <Button className="gap-2 bg-[#1a3a2a] text-white" onClick={openNew}>
          <Plus className="h-4 w-4" /> Incluir militar
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Card className="border-border/60 py-0"><CardContent className="flex items-center gap-2 p-3"><Users className="h-5 w-5 text-[#c4a84b]" /><div><p className="text-lg font-bold leading-none">{summaryQuery.data?.active ?? 0}</p><p className="text-xs text-muted-foreground">Militares ativos</p></div></CardContent></Card>
        <Card className="border-border/60 py-0"><CardContent className="flex items-center gap-2 p-3"><ShieldCheck className="h-5 w-5 text-[#1a3a2a] dark:text-[#c4a84b]" /><div><p className="text-lg font-bold leading-none">{summaryQuery.data?.students ?? 0}</p><p className="text-xs text-muted-foreground">Alunos na base</p></div></CardContent></Card>
      </div>

      <div className="flex flex-col gap-3 rounded-md border border-border/60 bg-card p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, CI, função ou seção" className="pl-9" />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={includeInactive} onCheckedChange={setIncludeInactive} /> Mostrar inativos
        </label>
      </div>

      <div className="hidden overflow-hidden rounded-md border border-border/60 md:block">
        <Table>
          <TableHeader><TableRow><TableHead>Militar</TableHead><TableHead>Função permanente</TableHead><TableHead>Seção</TableHead><TableHead>CI</TableHead><TableHead>Situação</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
          <TableBody>
            {personnel.map((item: any) => (
              <TableRow key={item.id} className={!item.isActive ? "opacity-55" : undefined}>
                <TableCell><p className="font-semibold">{item.fullName}</p><p className="text-xs text-muted-foreground">{item.rank} · {CATEGORY_LABELS[item.category as PersonnelCategory]}</p></TableCell>
                <TableCell>{item.permanentFunction}</TableCell>
                <TableCell>{item.section || "-"}</TableCell>
                <TableCell>{item.ci || "-"}</TableCell>
                <TableCell><Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? "Ativo" : "Inativo"}</Badge></TableCell>
                <TableCell><Button variant="ghost" size="icon" title="Editar cadastro" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-2 md:hidden">
        {personnel.map((item: any) => (
          <Card key={item.id} className={`border-border/60 py-0 ${!item.isActive ? "opacity-55" : ""}`}>
            <CardContent className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><p className="truncate font-semibold">{item.fullName}</p><Badge variant={item.isActive ? "default" : "secondary"} className="shrink-0">{item.isActive ? "Ativo" : "Inativo"}</Badge></div>
                <p className="text-xs text-muted-foreground">{item.rank} · CI {item.ci || "não informado"}</p>
                <p className="mt-1 text-sm">{item.permanentFunction}{item.section ? ` · ${item.section}` : ""}</p>
              </div>
              <Button variant="ghost" size="icon" title="Editar cadastro" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {!personnel.length && !personnelQuery.isLoading && <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum militar encontrado.</p>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar militar" : "Incluir militar"}</DialogTitle>
            <DialogDescription>Registre a função permanente. Serviços diários não devem ser cadastrados aqui.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2"><Label>Nome completo</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Posto/graduação</Label><Input value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })} placeholder="Ex.: CAP QOPM" /></div>
            <div className="space-y-1.5"><Label>CI</Label><Input value={form.ci} onChange={(e) => setForm({ ...form, ci: e.target.value.replace(/[^0-9]/g, "") })} inputMode="numeric" /></div>
            <div className="space-y-1.5"><Label>Categoria</Label><Select value={form.category} onValueChange={(value: PersonnelCategory) => setForm({ ...form, category: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(CATEGORY_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Seção</Label><Input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} placeholder="Ex.: P-4 ou CAL" /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Função permanente</Label><Input value={form.permanentFunction} onChange={(e) => setForm({ ...form, permanentFunction: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Companhia, se confirmada</Label><Select value={form.companhia} onValueChange={(value) => setForm({ ...form, companhia: value, peloton: value === "none" ? "none" : form.peloton })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Não definida</SelectItem>{[1,2,3,4,5].map((value) => <SelectItem key={value} value={String(value)}>{value}ª Companhia</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Pelotão, se confirmado</Label><Select disabled={form.companhia === "none"} value={form.peloton} onValueChange={(value) => setForm({ ...form, peloton: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Não definido</SelectItem><SelectItem value="1">1º Pelotão</SelectItem><SelectItem value="2">2º Pelotão</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Documento de origem</Label><Input value={form.sourceDocument} onChange={(e) => setForm({ ...form, sourceDocument: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Data da fonte</Label><Input type="date" value={form.sourceDate} onChange={(e) => setForm({ ...form, sourceDate: e.target.value })} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
            <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2"><Switch checked={form.isActive} onCheckedChange={(isActive) => setForm({ ...form, isActive })} /> Militar ativo no efetivo</label>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button className="bg-[#1a3a2a] text-white" onClick={save} disabled={createPersonnel.isPending || updatePersonnel.isPending}>Salvar</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
