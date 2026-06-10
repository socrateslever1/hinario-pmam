import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileText, Phone, Mail, MapPin, Instagram, Facebook, Save } from "lucide-react";

export function SettingsTab() {
  const { data: settings } = trpc.settings.getAll.useQuery();
  const [form, setForm] = useState({
    footer_phone: "",
    footer_email: "",
    footer_address: "",
    footer_text: "",
    footer_instagram: "",
    footer_facebook: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        footer_phone: settings.footer_phone || "",
        footer_email: settings.footer_email || "",
        footer_address: settings.footer_address || "",
        footer_text: settings.footer_text || "",
        footer_instagram: settings.footer_instagram || "",
        footer_facebook: settings.footer_facebook || "",
      });
    }
  }, [settings]);

  const utils = trpc.useUtils();
  const updateBatch = trpc.settings.updateBatch.useMutation({
    onSuccess: () => { toast.success("Configurações salvas!"); utils.settings.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    const settingsArr = Object.entries(form).map(([key, value]) => ({ key, value: value || "" }));
    updateBatch.mutate({ settings: settingsArr });
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#c4a84b]" /> Informações do Rodapé
          </h3>
          <div className="space-y-4">
            <div><Label className="flex items-center gap-2"><FileText className="h-3 w-3" /> Texto do Rodapé</Label>
              <Input value={form.footer_text} onChange={e => setForm(f => ({ ...f, footer_text: e.target.value }))} placeholder="Hinos e Canções Militares da PMAM" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label className="flex items-center gap-2"><Phone className="h-3 w-3" /> Telefone</Label>
                <Input value={form.footer_phone} onChange={e => setForm(f => ({ ...f, footer_phone: e.target.value }))} placeholder="(92) 3XXX-XXXX" /></div>
              <div><Label className="flex items-center gap-2"><Mail className="h-3 w-3" /> Email</Label>
                <Input value={form.footer_email} onChange={e => setForm(f => ({ ...f, footer_email: e.target.value }))} placeholder="contato@pmam.am.gov.br" /></div>
            </div>
            <div><Label className="flex items-center gap-2"><MapPin className="h-3 w-3" /> Endereço</Label>
              <Input value={form.footer_address} onChange={e => setForm(f => ({ ...f, footer_address: e.target.value }))} placeholder="Manaus - AM" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label className="flex items-center gap-2"><Instagram className="h-3 w-3" /> Instagram (URL)</Label>
                <Input value={form.footer_instagram} onChange={e => setForm(f => ({ ...f, footer_instagram: e.target.value }))} placeholder="https://instagram.com/..." /></div>
              <div><Label className="flex items-center gap-2"><Facebook className="h-3 w-3" /> Facebook (URL)</Label>
                <Input value={form.footer_facebook} onChange={e => setForm(f => ({ ...f, footer_facebook: e.target.value }))} placeholder="https://facebook.com/..." /></div>
            </div>
          </div>
          <Button onClick={handleSave} className="mt-6 bg-[#1a3a2a] text-white gap-2" disabled={updateBatch.isPending}>
            <Save className="h-4 w-4" />{updateBatch.isPending ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
