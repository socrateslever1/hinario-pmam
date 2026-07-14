import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, Award, CalendarDays, Camera, Clock, FileText, Save, User, Shield, KeyRound, Loader2, MinusCircle, CheckCircle2, Upload } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getStudentSession, saveStudentSession, clearStudentSession } from "@/lib/studentSession";
import { trpc } from "@/lib/trpc";
import { getFoCodeDefinition } from "@shared/foCatalog";
import {
  emptyStudentProfile,
  getStudentProfile,
  saveStudentProfile,
  type StudentProfile,
} from "@/lib/studentProfile";

function formatDateOnly(value?: string | null) {
  if (!value) return "Data não informada";
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

export default function StudentProfilePage() {
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<StudentProfile>(emptyStudentProfile);
  const [senhaNova, setSenhaNova] = useState("");
  const [confirmarSenhaNova, setConfirmarSenhaNova] = useState("");
  const [baixadoFile, setBaixadoFile] = useState<File | null>(null);
  const [baixadoNote, setBaixadoNote] = useState("");
  const [baixadoHpmHomologated, setBaixadoHpmHomologated] = useState(true);
  
  const session = getStudentSession();

  // TRPC Hooks
  const profileQuery = trpc.student.getProfile.useQuery(
    { id: session?.id ?? 0, sessionToken: session?.sessionToken ?? "" },
    { enabled: !!session }
  );
  const observationsQuery = trpc.student.observations.useQuery(
    { id: session?.id ?? 0, sessionToken: session?.sessionToken ?? "" },
    { enabled: !!session }
  );
  const lcStatusQuery = trpc.student.licencaCacadaStatus.useQuery(
    { id: session?.id ?? 0, sessionToken: session?.sessionToken ?? "" },
    { enabled: !!session }
  );
  const baixadoDocumentsQuery = trpc.student.baixadoDocuments.useQuery(
    { id: session?.id ?? 0, sessionToken: session?.sessionToken ?? "" },
    { enabled: !!session }
  );
  const internalReportsQuery = trpc.student.internalReports.useQuery(
    { id: session?.id ?? 0, sessionToken: session?.sessionToken ?? "" },
    { enabled: !!session }
  );

  const updateMutation = trpc.student.updateProfile.useMutation();
  const uploadBaixadoDocument = trpc.student.uploadBaixadoDocument.useMutation({
    onSuccess: async () => {
      toast.success("Documento enviado para acompanhamento do comando.");
      setBaixadoFile(null);
      setBaixadoNote("");
      await baixadoDocumentsQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const contestObservation = trpc.student.contestObservation.useMutation({
    onSuccess: async () => {
      toast.success("Contestação enviada para análise do Comandante do CAL.");
      await observationsQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  // Redirecionar para login se sessão inválida
  useEffect(() => {
    if (profileQuery.error) {
      const err = profileQuery.error as any;
      if (err?.data?.code === "UNAUTHORIZED" || err?.message?.includes("Sessão inválida") || err?.message?.includes("expirada")) {
        clearStudentSession();
        setLocation("/entrar");
      }
    }
  }, [profileQuery.error]);

  useEffect(() => {
    if (!session) {
      setLocation("/entrar");
      return;
    }

    // Carregar do localStorage local por segurança/offline inicial
    const local = getStudentProfile();
    setProfile({
      ...local,
      nomeGuerra: local.nomeGuerra || session.nomeGuerra,
    });
  }, [setLocation]);

  useEffect(() => {
    if (profileQuery.data) {
      setProfile((current) => ({
        ...current,
        fullName: profileQuery.data.nomeCompleto || current.fullName,
        nomeGuerra: profileQuery.data.nomeGuerra || current.nomeGuerra,
        rg: profileQuery.data.rg || current.rg,
        email: profileQuery.data.email || current.email,
        cpf: profileQuery.data.cpf || current.cpf,
        phone: profileQuery.data.phone || current.phone,
        address: profileQuery.data.address || current.address,
        birthDate: profileQuery.data.birthDate || current.birthDate,
        bloodType: profileQuery.data.bloodType || current.bloodType,
        emergencyContact: profileQuery.data.emergencyContact || current.emergencyContact,
        emergencyPhone: profileQuery.data.emergencyPhone || current.emergencyPhone,
        photoDataUrl: profileQuery.data.fotoUrl || current.photoDataUrl,
      }));
    }
  }, [profileQuery.data]);

  const updateField = (field: keyof StudentProfile, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar e comprimir para economizar espaço no DB
        const canvas = document.createElement("canvas");
        const maxDim = 300; // Tamanho máximo (largura ou altura)
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Converter para JPG comprimido a 70% de qualidade
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
          updateField("photoDataUrl", compressedDataUrl);
          toast.success("Foto carregada e otimizada!");
        } else {
          updateField("photoDataUrl", String(reader.result || ""));
        }
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session) return;

    // Validar alteração de senha se preenchida
    if (senhaNova) {
      if (senhaNova.length < 6) {
        toast.error("A nova senha deve ter pelo menos 6 caracteres.");
        return;
      }
      if (senhaNova !== confirmarSenhaNova) {
        toast.error("As senhas informadas não coincidem.");
        return;
      }
    }

    try {
      // Salvar no banco de dados via TRPC
      const updatedStudent = await updateMutation.mutateAsync({
        id: session.id,
        sessionToken: session.sessionToken,
        nomeCompleto: profile.fullName,
        nomeGuerra: profile.nomeGuerra,
        rg: profile.rg,
        email: profile.email,
        fotoUrl: profile.photoDataUrl,
        cpf: profile.cpf,
        phone: profile.phone,
        address: profile.address,
        birthDate: profile.birthDate,
        bloodType: profile.bloodType,
        emergencyContact: profile.emergencyContact,
        emergencyPhone: profile.emergencyPhone,
        senha: senhaNova || undefined,
      });

      // Salvar localmente no LocalStorage todos os dados (incluindo campos extras)
      saveStudentProfile(profile);

      // Atualizar a sessão do Aluno no localStorage se nomeGuerra mudou
      if (updatedStudent.nomeGuerra !== session.nomeGuerra) {
        saveStudentSession({
          ...session,
          nomeGuerra: updatedStudent.nomeGuerra,
        });
      }

      setSenhaNova("");
      setConfirmarSenhaNova("");
      toast.success("Cadastro e perfil atualizados com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar cadastro no banco de dados.");
    }
  };

  const handleBaixadoUpload = async () => {
    if (!session || !baixadoFile) {
      toast.error("Selecione o atestado ou documento.");
      return;
    }
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
      reader.onerror = () => reject(reader.error || new Error("Erro ao ler arquivo"));
      reader.readAsDataURL(baixadoFile);
    });
    uploadBaixadoDocument.mutate({
      id: session.id,
      sessionToken: session.sessionToken,
      fileName: baixadoFile.name,
      mimeType: baixadoFile.type || "application/octet-stream",
      base64Data,
      note: baixadoNote || null,
      hpmHomologated: baixadoHpmHomologated,
    });
  };

  const handleContestObservation = (item: any) => {
    if (!session) return;
    const text = window.prompt(
      `Informe a contestação do FO ${item.fo_code || item.id}. Descreva o motivo e, se houver, indique provas ou testemunhas:`,
      ""
    );
    if (!text?.trim()) return;
    contestObservation.mutate({
      id: session.id,
      sessionToken: session.sessionToken,
      observationId: item.id,
      text: text.trim(),
    });
  };

  if (!session) return null;

  const isLoading = profileQuery.isLoading || updateMutation.isPending;
  const lcCases = lcStatusQuery.data ?? [];
  const pendingLcCases = lcCases.filter((item: any) => item.status === "pending");
  const homologatedLcCases = lcCases.filter((item: any) => item.status === "homologated");
  const internalReports = internalReportsQuery.data ?? [];

  return (
    <div className="mobile-safe-bottom min-h-screen bg-[#f5f2e8]">
      <Navbar />
      <main className="container max-w-5xl px-4 py-6 md:py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 p-5 text-foreground md:flex-row md:items-center md:p-0">
          <div>
            <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-[#1a3a2a]" style={{ fontFamily: "Merriweather, serif" }}>
              <Shield className="h-8 w-8 text-[#c4a84b]" />
              Ficha de Cadastro do Aluno
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gerencie suas informações militares e dados pessoais.
            </p>
          </div>
          <div className="rounded-full border border-[#c4a84b]/25 bg-[#c4a84b]/10 px-4 py-2 text-xs font-semibold text-[#1a3a2a] shadow-sm backdrop-blur md:rounded-lg md:bg-card/80">
            CFSD 2026 • {session.companhia}ª CIA • {session.peloton}º PEL • Numérica {session.numerica}
          </div>
        </div>

        {profileQuery.isLoading ? (
          <div className="flex h-60 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#1a3a2a]" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            {/* Coluna Esquerda: Foto & Status */}
            <div className="flex flex-col gap-6">
              <Card className="overflow-hidden border-border/50 bg-card text-foreground shadow-sm">
                <CardHeader className="pb-3 text-center border-b bg-muted/20">
                  <CardTitle className="text-sm font-bold text-[#1a3a2a]">Identidade Visual</CardTitle>
                  <CardDescription className="text-[10px]">Foto oficial 3x4 em fardamento</CardDescription>
                </CardHeader>
                <CardContent className="p-6 flex flex-col items-center gap-4">
                  <div className="relative w-44 aspect-[3/4] rounded-lg border border-border shadow-inner bg-muted/50 overflow-hidden group flex items-center justify-center">
                    {profile.photoDataUrl ? (
                      <img 
                        src={profile.photoDataUrl} 
                        alt="Foto do Aluno" 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center">
                        <User className="h-14 w-14 opacity-40" />
                        <span className="text-[10px] leading-tight font-medium">Sem foto cadastrada</span>
                      </div>
                    )}
                    <label 
                      htmlFor="photo-upload" 
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity duration-200"
                    >
                      <Camera className="h-6 w-6 mb-1" />
                      <span className="text-xs font-bold">Enviar Foto</span>
                    </label>
                  </div>
                  <input 
                    id="photo-upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoChange} 
                    className="hidden" 
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => document.getElementById("photo-upload")?.click()}
                    className="w-full gap-2 text-xs h-8 border-border"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Selecionar Imagem
                  </Button>
                </CardContent>
              </Card>

              {/* Card Segurança / Senha */}
              <Card className="border-border/50 bg-card text-foreground shadow-sm">
                <CardHeader className="pb-3 border-b bg-muted/20">
                  <CardTitle className="text-sm font-bold text-[#1a3a2a] flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-[#c4a84b]" />
                    Alterar Senha
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Nova Senha</Label>
                    <Input 
                      type="password" 
                      value={senhaNova} 
                      onChange={(e) => setSenhaNova(e.target.value)} 
                      placeholder="Mínimo 6 dígitos"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Confirmar Nova Senha</Label>
                    <Input 
                      type="password" 
                      value={confirmarSenhaNova} 
                      onChange={(e) => setConfirmarSenhaNova(e.target.value)} 
                      placeholder="Confirme a senha"
                      className="h-9 text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card text-foreground shadow-sm">
                <CardHeader className="pb-3 border-b bg-muted/20">
                  <CardTitle className="text-sm font-bold text-[#1a3a2a] flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#c4a84b]" />
                    Baixado / Atestado HPM
                  </CardTitle>
                  <CardDescription className="text-[10px]">
                    Envie atestado ou documento para acompanhamento do comando.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                  <Input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(event) => setBaixadoFile(event.target.files?.[0] ?? null)}
                  />
                  <Textarea
                    value={baixadoNote}
                    onChange={(event) => setBaixadoNote(event.target.value)}
                    placeholder="Observações: período, restrições, homologação pelo HPM..."
                    className="min-h-[74px] text-xs"
                  />
                  <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={baixadoHpmHomologated}
                      onChange={(event) => setBaixadoHpmHomologated(event.target.checked)}
                    />
                    Documento homologado pelo HPM
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={handleBaixadoUpload}
                    disabled={!baixadoFile || uploadBaixadoDocument.isPending}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {uploadBaixadoDocument.isPending ? "Enviando..." : "Enviar documento"}
                  </Button>
                  {baixadoDocumentsQuery.data?.length ? (
                    <div className="space-y-1.5 border-t pt-3">
                      {baixadoDocumentsQuery.data.map((doc: any) => (
                        <a
                          key={doc.id}
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-md border bg-muted/20 px-2 py-1 text-[11px] font-semibold text-[#1a3a2a] hover:underline"
                        >
                          {doc.hpmHomologated ? "HPM - " : ""}{doc.fileName}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {internalReports.length ? (
                <Card className="border-amber-500/30 bg-amber-50 text-amber-950 shadow-sm dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100">
                  <CardHeader className="pb-3 border-b border-amber-500/20">
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Informes internos do CAL
                    </CardTitle>
                    <CardDescription className="text-[10px] text-amber-800 dark:text-amber-200">
                      Procedimento interno entre o Corpo de Alunos e o aluno.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 p-4">
                    {internalReports.map((item: any) => (
                      <div key={item.id} className="rounded-md border border-amber-500/25 bg-white/70 p-3 text-xs dark:bg-amber-950/20">
                        <p className="font-black">{item.title}</p>
                        <p className="mt-1 text-amber-800 dark:text-amber-200">
                          Tipo: {item.type === "desistente" ? "Desistente" : item.type === "desertor" ? "Desertor" : item.type === "baixado" ? "Baixado" : "Outro"}
                        </p>
                        {item.note ? <p className="mt-2 whitespace-pre-wrap">{item.note}</p> : null}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}

              {pendingLcCases.length ? (
                <Card className="border-red-500/40 bg-red-50 text-red-950 shadow-sm dark:border-red-700/60 dark:bg-red-950/30 dark:text-red-100">
                  <CardHeader className="pb-3 border-b border-red-500/20">
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Aviso de possibilidade de LC
                    </CardTitle>
                    <CardDescription className="text-[10px] text-red-800 dark:text-red-200">
                      Reincidência de FO- com o mesmo código.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 p-4">
                    {pendingLcCases.map((item: any) => (
                      <div key={item.id} className="rounded-md border border-red-500/25 bg-white/70 p-3 text-xs dark:bg-red-950/20">
                        <p className="font-black">
                          FO {item.foCode} - {item.foLabel}: você está sujeito à LC.
                        </p>
                        <p className="mt-1 text-red-800 dark:text-red-200">
                          Saldo do código: {item.netCount} ({item.negativeCount} FO- menos {item.positiveCount} FO+).
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}

              {homologatedLcCases.length ? (
                <Card className="border-red-700/50 bg-white text-foreground shadow-sm dark:bg-zinc-900">
                  <CardHeader className="pb-3 border-b bg-red-700/10">
                    <CardTitle className="text-sm font-black text-red-800 flex items-center gap-2 dark:text-red-200">
                      <Shield className="h-4 w-4" />
                      LC homologada
                    </CardTitle>
                    <CardDescription className="text-[10px]">
                      Procedimentos definidos pelo comando.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 p-4">
                    {homologatedLcCases.map((item: any) => (
                      <div key={item.id} className="rounded-md border border-red-500/25 bg-red-50/70 p-3 text-xs dark:bg-red-950/20">
                        <p className="font-black text-red-800 dark:text-red-200">
                          FO {item.foCode} - {item.foLabel}
                        </p>
                        <div className="mt-2 grid gap-2">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5 text-red-700" />
                            <span>Recolhimento: {formatDateOnly(item.recolhimentoDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-red-700" />
                            <span>Duração: {item.durationHours ? `${item.durationHours}h` : "Não informada"}</span>
                          </div>
                          {item.procedures ? (
                            <div className="flex items-start gap-2">
                              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-700" />
                              <p className="whitespace-pre-wrap">{item.procedures}</p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}

              <Card className="border-border/50 bg-card text-foreground shadow-sm">
                <CardHeader className="pb-3 border-b bg-muted/20">
                  <CardTitle className="text-sm font-bold text-[#1a3a2a] flex items-center gap-2">
                    <Award className="h-4 w-4 text-[#c4a84b]" />
                    FO+ / FO-
                  </CardTitle>
                  <CardDescription className="text-[10px]">
                    Fatos Observados homologados, contestáveis pelo portal ou no CAL.
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-96 space-y-2 overflow-auto p-4">
                  {observationsQuery.isLoading ? (
                    <div className="flex h-16 items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-[#1a3a2a]" />
                    </div>
                  ) : observationsQuery.data?.length ? (
                    observationsQuery.data.map((item: any) => {
                      const isPositive = item.type === "positive";
                      const isAnnulled = Boolean(item.annulled_at);
                      const contestStatus = String(item.contest_status || "none");
                      const canContest = !isAnnulled && contestStatus === "none";
                      const codeDefinition = item.fo_code && (item.type === "positive" || item.type === "negative")
                        ? getFoCodeDefinition(item.type, item.fo_code)
                        : null;
                      return (
                        <div key={item.id} className={`rounded-lg border p-3 text-xs ${isAnnulled ? "border-zinc-300 bg-zinc-100 opacity-80" : "border-border/60 bg-muted/20"}`}>
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1">
                              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-black ${isPositive ? "bg-green-600/10 text-green-700 dark:text-green-300" : "bg-red-600/10 text-red-700 dark:text-red-300"}`}>
                                {isPositive ? <CheckCircle2 className="h-3 w-3" /> : <MinusCircle className="h-3 w-3" />}
                                {isPositive ? "FO+" : "FO-"}
                                {item.fo_code ? ` ${item.fo_code}` : ""}
                              </span>
                              {isAnnulled ? (
                                <span className="rounded-md bg-zinc-700 px-2 py-0.5 text-[10px] font-black text-white">Anulado</span>
                              ) : contestStatus === "pending" ? (
                                <span className="rounded-md bg-amber-600 px-2 py-0.5 text-[10px] font-black text-white">Contestação em análise</span>
                              ) : contestStatus === "rejected" ? (
                                <span className="rounded-md bg-red-700 px-2 py-0.5 text-[10px] font-black text-white">Contestação não acolhida</span>
                              ) : null}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {item.created_at ? new Date(item.created_at).toLocaleDateString("pt-BR") : ""}
                            </span>
                          </div>
                          {codeDefinition ? (
                            <p className="mb-1 font-semibold text-foreground">{codeDefinition.label}</p>
                          ) : null}
                          <p className="whitespace-pre-wrap text-muted-foreground">{item.note}</p>
                          <p className="mt-2 text-[10px] text-muted-foreground">
                            Validado por {item.validated_by_name || "Xerife Geral"}
                          </p>
                          {item.contest_text ? (
                            <div className="mt-2 rounded-md border bg-background/70 p-2">
                              <p className="font-semibold">Contestação:</p>
                              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{item.contest_text}</p>
                              {item.contest_decision_note ? (
                                <p className="mt-1 text-muted-foreground">Decisão: {item.contest_decision_note}</p>
                              ) : null}
                            </div>
                          ) : null}
                          {canContest ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2 h-8 w-full text-xs"
                              onClick={() => handleContestObservation(item)}
                              disabled={contestObservation.isPending}
                            >
                              Contestar FO
                            </Button>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground">Nenhuma FO+ ou FO- validada na ficha.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Coluna Direita: Informações Gerais */}
            <Card className="border-border/50 bg-card text-foreground shadow-sm">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base font-bold text-[#1a3a2a]">Dados Cadastrais Oficiais</CardTitle>
                <CardDescription className="text-xs">Estes dados serão integrados na geração de documentos de expediente.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 flex flex-col gap-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-bold text-[#1a3a2a]">Nome Completo</Label>
                    <Input 
                      value={profile.fullName} 
                      onChange={(event) => updateField("fullName", event.target.value)} 
                      placeholder="Nome completo para documentos oficiais"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#1a3a2a]">Nome de Guerra (Militar)</Label>
                    <Input 
                      value={profile.nomeGuerra} 
                      onChange={(event) => updateField("nomeGuerra", event.target.value)} 
                      placeholder="Ex: AL SD PM SÓCRATES"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#1a3a2a]">RG Militar / CI</Label>
                    <Input 
                      value={profile.rg} 
                      onChange={(event) => updateField("rg", event.target.value)} 
                      placeholder="Registro Geral de Identidade Militar"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#1a3a2a]">CPF</Label>
                    <Input 
                      value={profile.cpf} 
                      onChange={(event) => updateField("cpf", event.target.value)} 
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#1a3a2a]">Data de Nascimento</Label>
                    <Input 
                      type="date" 
                      value={profile.birthDate} 
                      onChange={(event) => updateField("birthDate", event.target.value)} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#1a3a2a]">E-mail de Contato</Label>
                    <Input 
                      type="email" 
                      value={profile.email} 
                      onChange={(event) => updateField("email", event.target.value)} 
                      placeholder="aluno@pm.am.gov.br"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#1a3a2a]">Telefone / WhatsApp</Label>
                    <Input 
                      value={profile.phone} 
                      onChange={(event) => updateField("phone", event.target.value)} 
                      placeholder="(92) 99999-9999"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#1a3a2a]">Tipo Sanguíneo / Fator Rh</Label>
                    <Input 
                      value={profile.bloodType} 
                      onChange={(event) => updateField("bloodType", event.target.value)} 
                      placeholder="Ex: O+ / A-"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#1a3a2a]">Contato de Emergência (Nome)</Label>
                    <Input 
                      value={profile.emergencyContact} 
                      onChange={(event) => updateField("emergencyContact", event.target.value)} 
                      placeholder="Nome do parente ou contato"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-bold text-[#1a3a2a]">Telefone de Emergência</Label>
                    <Input 
                      value={profile.emergencyPhone} 
                      onChange={(event) => updateField("emergencyPhone", event.target.value)} 
                      placeholder="(92) 99999-9999"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-bold text-[#1a3a2a]">Endereço de Residência</Label>
                    <Textarea 
                      value={profile.address} 
                      onChange={(event) => updateField("address", event.target.value)} 
                      placeholder="Rua, número, bairro, cidade - AM"
                      className="min-h-20"
                    />
                  </div>
                </div>

                <div className="border-t pt-4 mt-2 flex justify-end">
                  <Button 
                    type="submit" 
                    className="gap-2 bg-[#1a3a2a] text-white hover:bg-[#1a3a2a]/90 h-11 px-6 shadow"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salvar Ficha de Cadastro
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        )}
      </main>
    </div>
  );
}
