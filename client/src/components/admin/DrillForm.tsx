import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save } from "lucide-react";

const difficultyOptions = [
  { value: "basico", label: "Básico" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
];

function getDefaultDrillFormState(drill?: any) {
  return {
    title: drill?.title ?? "",
    subtitle: drill?.subtitle ?? "",
    description: drill?.description ?? "",
    category: drill?.category ?? "",
    difficulty: drill?.difficulty ?? "intermediario",
    duration: drill?.duration ?? 0,
    videoUrl: drill?.videoUrl ?? "",
    pdfUrl: drill?.pdfUrl ?? "",
    imageUrl: drill?.imageUrl ?? "",
    youtubeUrl: drill?.youtubeUrl ?? "",
    cornettaAudioUrl: drill?.cornettaAudioUrl ?? "",
    content: drill?.content ?? "",
    instructor: drill?.instructor ?? "",
    prerequisites: drill?.prerequisites ?? "",
    learningOutcomes: drill?.learningOutcomes ?? "",
  };
}

export function DrillForm({ drill, onSuccess }: { drill?: any; onSuccess: () => void }) {
  const [form, setForm] = useState(() => getDefaultDrillFormState(drill));

  const utils = trpc.useUtils();
  const createMut = trpc.drill.create.useMutation({
    onSuccess: () => { toast.success("Ordem Unida criada!"); utils.drill.invalidate(); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.drill.update.useMutation({
    onSuccess: () => { toast.success("Ordem Unida atualizada!"); utils.drill.invalidate(); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    setForm(getDefaultDrillFormState(drill));
  }, [drill]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) { toast.error("Título é obrigatório"); return; }
    const data = {
      ...form,
      duration: form.duration ? Number(form.duration) : undefined,
      subtitle: form.subtitle || undefined,
      description: form.description || undefined,
      category: form.category || undefined,
      videoUrl: form.videoUrl || undefined,
      pdfUrl: form.pdfUrl || undefined,
      imageUrl: form.imageUrl || undefined,
      youtubeUrl: form.youtubeUrl || undefined,
      cornettaAudioUrl: form.cornettaAudioUrl || undefined,
      content: form.content || undefined,
      instructor: form.instructor || undefined,
      prerequisites: form.prerequisites || undefined,
      learningOutcomes: form.learningOutcomes || undefined,
    };
    if (drill) { updateMut.mutate({ id: drill.id, ...data }); }
    else { createMut.mutate(data); }
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[min(72vh,calc(100vh-12rem))] overflow-y-auto pr-1">
      <div><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
      <div><Label>Subtítulo</Label><Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} /></div>
      <div><Label>Categoria</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Ex: Formação, Disciplina" /></div>
      <div><Label>Dificuldade</Label>
        <Select value={form.difficulty} onValueChange={v => setForm(f => ({ ...f, difficulty: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{difficultyOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Duração (minutos)</Label><Input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} /></div>
      <div><Label>Instrutor</Label><Input value={form.instructor} onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))} /></div>
      <div><Label>URL do Vídeo</Label><Input value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} placeholder="https://youtube.com/..." /></div>
      <div><Label>URL do YouTube (Execução do Movimento)</Label><Input value={form.youtubeUrl} onChange={e => setForm(f => ({ ...f, youtubeUrl: e.target.value }))} placeholder="https://youtube.com/watch?v=..." /></div>
      <div><Label>URL de Áudio da Corneta</Label><Input value={form.cornettaAudioUrl} onChange={e => setForm(f => ({ ...f, cornettaAudioUrl: e.target.value }))} placeholder="https://..." /></div>
      <div><Label>URL do PDF</Label><Input value={form.pdfUrl} onChange={e => setForm(f => ({ ...f, pdfUrl: e.target.value }))} placeholder="https://..." /></div>
      <div><Label>URL da Imagem</Label><Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." /></div>
      <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
      <div><Label>Conteúdo/Texto</Label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} /></div>
      <div><Label>Pré-requisitos</Label><Textarea value={form.prerequisites} onChange={e => setForm(f => ({ ...f, prerequisites: e.target.value }))} rows={2} /></div>
      <div><Label>Resultados de Aprendizado</Label><Textarea value={form.learningOutcomes} onChange={e => setForm(f => ({ ...f, learningOutcomes: e.target.value }))} rows={2} /></div>
      <Button type="submit" className="w-full bg-[#1a3a2a] text-white gap-2" disabled={saving}>
        <Save className="h-4 w-4" />{saving ? "Salvando..." : drill ? "Atualizar Ordem Unida" : "Criar Ordem Unida"}
      </Button>
    </form>
  );
}
