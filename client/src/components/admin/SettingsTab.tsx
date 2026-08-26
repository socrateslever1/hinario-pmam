import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  FileText,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  Save,
  Image as ImageIcon,
  Upload,
  Sparkles,
  Trash2,
} from "lucide-react";

export function SettingsTab() {
  const { data: settings } = trpc.settings.getAll.useQuery();
  const [form, setForm] = useState({
    footer_phone: "",
    footer_email: "",
    footer_address: "",
    footer_text: "",
    footer_instagram: "",
    footer_facebook: "",
    cfap_current_commander_flanks_enabled: "false",
    cfap_current_commander_left_photo: "",
    cfap_current_commander_right_photo: "",
  });

  const [uploadingLeft, setUploadingLeft] = useState(false);
  const [uploadingRight, setUploadingRight] = useState(false);
  const leftFileRef = useRef<HTMLInputElement>(null);
  const rightFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setForm({
        footer_phone: settings.footer_phone || "",
        footer_email: settings.footer_email || "",
        footer_address: settings.footer_address || "",
        footer_text: settings.footer_text || "",
        footer_instagram: settings.footer_instagram || "",
        footer_facebook: settings.footer_facebook || "",
        cfap_current_commander_flanks_enabled: settings.cfap_current_commander_flanks_enabled || "false",
        cfap_current_commander_left_photo: settings.cfap_current_commander_left_photo || "",
        cfap_current_commander_right_photo: settings.cfap_current_commander_right_photo || "",
      });
    }
  }, [settings]);

  const utils = trpc.useUtils();
  const updateBatch = trpc.settings.updateBatch.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas!");
      utils.settings.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleFileUpload = async (file: File, side: "left" | "right") => {
    const setUploading = side === "left" ? setUploadingLeft : setUploadingRight;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Erro ao fazer upload da imagem");
      const result = await response.json();
      if (side === "left") {
        setForm((f) => ({ ...f, cfap_current_commander_left_photo: result.url }));
      } else {
        setForm((f) => ({ ...f, cfap_current_commander_right_photo: result.url }));
      }
      toast.success(`Foto lateral ${side === "left" ? "esquerda" : "direita"} carregada!`);
    } catch (err: any) {
      toast.error(err.message || "Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    const settingsArr = Object.entries(form).map(([key, value]) => ({
      key,
      value: value || "",
    }));
    updateBatch.mutate({ settings: settingsArr });
  };

  const isFlanksEnabled = form.cfap_current_commander_flanks_enabled === "true";

  return (
    <div className="space-y-6">
      {/* SEÇÃO: FOTOS LATERAIS DO COMANDANTE ATUAL (FUMÊ/FUNDIDAS) */}
      <Card className="border-[#c4a84b]/40 bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-[#f0bd3a]" />
                Fotos Laterais do Comandante Atual (Galeria CFAP)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Exibe fotos institucionais/operacionais em segundo plano fumê, fundidas suavemente nas laterais do card do Comandante Atual.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="flanks-toggle" className="text-xs font-bold cursor-pointer">
                {isFlanksEnabled ? "Ativado" : "Desativado"}
              </Label>
              <Switch
                id="flanks-toggle"
                checked={isFlanksEnabled}
                onCheckedChange={(checked) =>
                  setForm((f) => ({
                    ...f,
                    cfap_current_commander_flanks_enabled: checked ? "true" : "false",
                  }))
                }
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Foto Lateral Esquerda */}
            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
              <Label className="font-bold flex items-center gap-2 text-xs">
                <ImageIcon className="h-4 w-4 text-[#c4a84b]" />
                Foto Lateral Esquerda
              </Label>
              <Input
                value={form.cfap_current_commander_left_photo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cfap_current_commander_left_photo: e.target.value }))
                }
                placeholder="https://... ou faça upload"
                className="text-xs"
              />
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={leftFileRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "left");
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => leftFileRef.current?.click()}
                  disabled={uploadingLeft}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploadingLeft ? "Enviando..." : "Carregar Foto Esquerda"}
                </Button>
                {form.cfap_current_commander_left_photo && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 p-2"
                    onClick={() => setForm((f) => ({ ...f, cfap_current_commander_left_photo: "" }))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              {form.cfap_current_commander_left_photo && (
                <div className="relative h-28 w-full overflow-hidden rounded-lg border border-border/80 bg-black/60">
                  <div className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-[#061a11]/60 to-[#061a11]" />
                  <img
                    src={form.cfap_current_commander_left_photo}
                    alt="Preview Esquerda"
                    className="h-full w-full object-cover object-left opacity-60 mix-blend-luminosity filter contrast-125"
                  />
                  <span className="absolute bottom-1 left-2 z-20 text-[10px] font-black uppercase text-[#f0bd3a]">
                    Efeito Fumê Esquerdo
                  </span>
                </div>
              )}
            </div>

            {/* Foto Lateral Direita */}
            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
              <Label className="font-bold flex items-center gap-2 text-xs">
                <ImageIcon className="h-4 w-4 text-[#c4a84b]" />
                Foto Lateral Direita
              </Label>
              <Input
                value={form.cfap_current_commander_right_photo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cfap_current_commander_right_photo: e.target.value }))
                }
                placeholder="https://... ou faça upload"
                className="text-xs"
              />
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={rightFileRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "right");
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => rightFileRef.current?.click()}
                  disabled={uploadingRight}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploadingRight ? "Enviando..." : "Carregar Foto Direita"}
                </Button>
                {form.cfap_current_commander_right_photo && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 p-2"
                    onClick={() => setForm((f) => ({ ...f, cfap_current_commander_right_photo: "" }))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              {form.cfap_current_commander_right_photo && (
                <div className="relative h-28 w-full overflow-hidden rounded-lg border border-border/80 bg-black/60">
                  <div className="absolute inset-0 z-10 bg-gradient-to-l from-transparent via-[#061a11]/60 to-[#061a11]" />
                  <img
                    src={form.cfap_current_commander_right_photo}
                    alt="Preview Direita"
                    className="h-full w-full object-cover object-right opacity-60 mix-blend-luminosity filter contrast-125"
                  />
                  <span className="absolute bottom-1 right-2 z-20 text-[10px] font-black uppercase text-[#f0bd3a]">
                    Efeito Fumê Direito
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO: INFORMAÇÕES DO RODAPÉ */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#c4a84b]" /> Informações do Rodapé
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="flex items-center gap-2">
                <FileText className="h-3 w-3" /> Texto do Rodapé
              </Label>
              <Input
                value={form.footer_text}
                onChange={(e) => setForm((f) => ({ ...f, footer_text: e.target.value }))}
                placeholder="Hinos e Canções Militares da PMAM"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Phone className="h-3 w-3" /> Telefone
                </Label>
                <Input
                  value={form.footer_phone}
                  onChange={(e) => setForm((f) => ({ ...f, footer_phone: e.target.value }))}
                  placeholder="(92) 3XXX-XXXX"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Mail className="h-3 w-3" /> Email
                </Label>
                <Input
                  value={form.footer_email}
                  onChange={(e) => setForm((f) => ({ ...f, footer_email: e.target.value }))}
                  placeholder="contato@pmam.am.gov.br"
                />
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Endereço
              </Label>
              <Input
                value={form.footer_address}
                onChange={(e) => setForm((f) => ({ ...f, footer_address: e.target.value }))}
                placeholder="Manaus - AM"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Instagram className="h-3 w-3" /> Instagram (URL)
                </Label>
                <Input
                  value={form.footer_instagram}
                  onChange={(e) => setForm((f) => ({ ...f, footer_instagram: e.target.value }))}
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Facebook className="h-3 w-3" /> Facebook (URL)
                </Label>
                <Input
                  value={form.footer_facebook}
                  onChange={(e) => setForm((f) => ({ ...f, footer_facebook: e.target.value }))}
                  placeholder="https://facebook.com/..."
                />
              </div>
            </div>
          </div>
          <Button
            onClick={handleSave}
            className="mt-6 bg-[#1a3a2a] text-white gap-2"
            disabled={updateBatch.isPending}
          >
            <Save className="h-4 w-4" />
            {updateBatch.isPending ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
