import { useState } from "react";
import { Send, X } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type AudienceType = "all" | "xerifes" | "pelotao" | "tesouraria";
type NotificationType = "info" | "success" | "warning" | "error";

export function NotificationSendPanel() {
  const { addNotification } = useNotifications();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("info");
  const [audience, setAudience] = useState<AudienceType>("all");
  const [companhia, setCompanhia] = useState<string>("");
  const [peloton, setPeloton] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Título e mensagem são obrigatórios");
      return;
    }

    if (audience === "pelotao" && (!companhia || !peloton)) {
      toast.error("Selecione companhia e pelotão");
      return;
    }

    if (audience === "tesouraria" && (!companhia || !peloton)) {
      toast.error("Selecione companhia e pelotão para tesouraria");
      return;
    }

    addNotification({
      title,
      message,
      type,
      audience,
      companhia: companhia ? Number(companhia) : undefined,
      peloton: peloton ? Number(peloton) : undefined,
    });

    toast.success("Notificação enviada!");
    setTitle("");
    setMessage("");
    setType("info");
    setAudience("all");
    setCompanhia("");
    setPeloton("");
    setIsOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="gap-2 bg-[#c4a84b] text-[#1a1a1a] hover:bg-[#b39740]"
      >
        <Send className="h-4 w-4" />
        Enviar Notificação
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md dark:bg-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Enviar Notificação</CardTitle>
                <CardDescription>Notifique usuários em tempo real</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  placeholder="Ex: Escala publicada"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  placeholder="Ex: A escala de limpeza foi publicada"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1.5 min-h-24"
                />
              </div>

              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as NotificationType)}>
                  <SelectTrigger id="type" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">ℹ️ Informação</SelectItem>
                    <SelectItem value="success">✅ Sucesso</SelectItem>
                    <SelectItem value="warning">⚠️ Aviso</SelectItem>
                    <SelectItem value="error">❌ Erro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="audience">Para Quem?</Label>
                <Select value={audience} onValueChange={(v) => setAudience(v as AudienceType)}>
                  <SelectTrigger id="audience" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">👥 Todos</SelectItem>
                    <SelectItem value="xerifes">👮 Xerifes</SelectItem>
                    <SelectItem value="pelotao">🎖️ Pelotão Específico</SelectItem>
                    <SelectItem value="tesouraria">💰 Tesouraria</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(audience === "pelotao" || audience === "tesouraria") && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="companhia">Companhia</Label>
                      <Select value={companhia} onValueChange={setCompanhia}>
                        <SelectTrigger id="companhia" className="mt-1.5">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((c) => (
                            <SelectItem key={c} value={String(c)}>
                              Companhia {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="peloton">Pelotão</Label>
                      <Select value={peloton} onValueChange={setPeloton}>
                        <SelectTrigger id="peloton" className="mt-1.5">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2].map((p) => (
                            <SelectItem key={p} value={String(p)}>
                              Pelotão {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSend}
                  className="flex-1 gap-2 bg-[#c4a84b] text-[#1a1a1a] hover:bg-[#b39740]"
                >
                  <Send className="h-4 w-4" />
                  Enviar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
