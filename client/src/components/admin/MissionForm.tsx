import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, FileText } from "lucide-react";
import { MissionMediaUpload } from "./MissionMediaUpload";
import { MediaViewer } from "../MediaViewer";

const priorityOptions = [
  { value: "normal", label: "Normal" },
  { value: "urgente", label: "Urgente" },
  { value: "critica", label: "Crítica" },
];

export function MissionForm({ mission, onSuccess }: { mission?: any; onSuccess: () => void }) {
  const [activeTab, setActiveTab] = useState("form");
  const [form, setForm] = useState({
    title: mission?.title ?? "",
    content: mission?.content ?? "",
    priority: mission?.priority ?? "normal",
  });

  const utils = trpc.useUtils();
  const createMut = trpc.missions.create.useMutation({
    onSuccess: () => { toast.success("Missão publicada!"); utils.missions.invalidate(); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.missions.update.useMutation({
    onSuccess: () => { toast.success("Missão atualizada!"); utils.missions.invalidate(); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) { toast.error("Título e conteúdo são obrigatórios"); return; }
    if (mission) { updateMut.mutate({ id: mission.id, ...form, priority: form.priority as any }); }
    else { createMut.mutate({ ...form, priority: form.priority as any }); }
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="form">Informações</TabsTrigger>
        <TabsTrigger value="media" disabled={!mission}><FileText className="h-4 w-4 mr-2" />Mídia</TabsTrigger>
      </TabsList>

      <TabsContent value="form">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[min(72vh,calc(100vh-12rem))] overflow-y-auto pr-1">
          <div><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
          <div><Label>Prioridade</Label>
            <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{priorityOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Conteúdo *</Label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={8} required /></div>
          <Button type="submit" className="w-full bg-[#1a3a2a] text-white gap-2" disabled={saving}>
            <Save className="h-4 w-4" />{saving ? "Salvando..." : mission ? "Atualizar Missão" : "Publicar Missão"}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="media" className="max-h-[min(72vh,calc(100vh-12rem))] overflow-y-auto pr-1 space-y-4">
        {mission && (
          <>
            <MissionMediaUpload missionId={mission.id} onMediaUploaded={() => {}} />
            {mission.media && mission.media.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Mídia Carregada</h3>
                <MediaViewer
                  media={mission.media.map((m: any) => ({
                    id: m.id,
                    url: m.url,
                    type: m.type,
                    title: m.fileName,
                    mimeType: m.mimeType,
                  }))}
                  readOnly
                />
              </div>
            )}
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}
