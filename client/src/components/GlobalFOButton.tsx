import { useMemo, useState } from "react";
import { ClipboardList, Search, Shield, User, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { classifyFoText, getFoCodeDefinition, getFoCodesByType } from "@shared/foCatalog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FOProofUploader } from "@/components/FOProofUploader";
import { useUploadProgress } from "@/hooks/useUploadProgress";
import { useModalHistory } from "@/hooks/useModalHistory";

type FOType = "positive" | "negative";

type ProofType = "foto" | "video" | "audio" | "documento";

interface ProofFile {
  id: string;
  file: File;
  preview?: string;
  type: ProofType;
}

const COMMAND_ROLES = new Set([
  "master",
  "admin",
  "comandante_corpo",
  "subcomandante_corpo",
  "sub_comandante_corpo",
  "comandante_cfap",
  "subcomandante_cfap",
  "sub_comandante_cfap",
  "comandante_cia",
  "comandante_pel",
]);

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const dialogShell =
  "left-2 right-2 top-2 h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-auto translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-xl border border-border bg-white p-0 text-foreground dark:bg-zinc-950 sm:left-[50%] sm:right-auto sm:top-[50%] sm:h-auto sm:max-h-[calc(100dvh-3rem)] sm:w-full sm:translate-x-[-50%] sm:translate-y-[-50%]";

function preventInitialFocus(event: Event) {
  event.preventDefault();
}

function getSafeMimeType(file: File) {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  return MIME_BY_EXTENSION[extension] || file.type || "application/octet-stream";
}

function StudentSummary({ student }: { student: any }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
        {student.fotoUrl ? (
          <img
            src={student.fotoUrl}
            alt={student.nomeGuerra || "Aluno"}
            className="h-full w-full object-cover"
          />
        ) : (
          <User className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 text-sm font-black text-[#c4a84b]">{student.numerica}</span>
          <span className="truncate text-sm font-bold sm:text-base">{student.nomeGuerra}</span>
        </div>
        <div className="line-clamp-2 text-xs leading-snug text-muted-foreground">
          {student.nomeCompleto || "Sem nome completo"} · {student.companhia}ª Cia / {student.peloton}º Pel
        </div>
      </div>
    </div>
  );
}

export function GlobalFOButton() {
  const utils = trpc.useUtils();
  const { data: access } = trpc.serviceScale.myAccess.useQuery();
  const canUseFO = Boolean(
    access?.isGeneral || access?.assignment || COMMAND_ROLES.has(String(access?.role || "")),
  );

  const [searchOpen, setSearchOpen] = useState(false);
  const [foOpen, setFoOpen] = useState(false);
  const [lcOpen, setLcOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [foType, setFoType] = useState<FOType>("negative");
  const [foReason, setFoReason] = useState("");
  const [foDetails, setFoDetails] = useState("");
  const [proofs, setProofs] = useState<ProofFile[]>([]);
  const [proofsUploading, setProofsUploading] = useState(false);
  const [proofUploaderKey, setProofUploaderKey] = useState(0);
  const [lcForm, setLcForm] = useState({
    directReason: "",
    recolhimentoDate: new Date().toISOString().slice(0, 10),
    recolhimentoTime: "18:00",
    durationHours: 12,
    procedures: "",
  });

  const { uploadItems, addItem, uploadFile, cancelUpload, clearItems } = useUploadProgress();
  const studentsQuery = trpc.serviceScale.students.useQuery(undefined, { enabled: canUseFO });
  const addStudentObservation = trpc.serviceScale.addStudentObservation.useMutation();
  const uploadFoProof = trpc.foProofs.uploadProof.useMutation();
  const createDirectLcCase = trpc.serviceScale.createDirectLcCase.useMutation();

  const filteredStudents = useMemo(() => {
    const students = [...(studentsQuery.data ?? [])].sort(
      (a: any, b: any) => Number(a.numerica) - Number(b.numerica),
    );
    const value = search.trim().toLowerCase();
    if (!value) return students.slice(0, 30);
    return students
      .filter(
        (student: any) =>
          String(student.numerica || "").includes(value) ||
          String(student.nomeGuerra || "").toLowerCase().includes(value) ||
          String(student.nomeCompleto || "").toLowerCase().includes(value) ||
          `${student.companhia || ""}/${student.peloton || ""}`.includes(value),
      )
      .slice(0, 30);
  }, [studentsQuery.data, search]);

  const foTextClassification = useMemo(
    () => classifyFoText(foType, foDetails),
    [foType, foDetails],
  );

  const resetProofs = () => {
    setProofs([]);
    clearItems();
    setProofUploaderKey((current) => current + 1);
  };

  const resetFO = () => {
    setFoReason("");
    setFoDetails("");
    resetProofs();
  };

  const resetLC = () => {
    setLcForm({
      directReason: "",
      recolhimentoDate: new Date().toISOString().slice(0, 10),
      recolhimentoTime: "18:00",
      durationHours: 12,
      procedures: "",
    });
  };

  const openFOForStudent = (student: any, type: FOType = "negative") => {
    setSelectedStudent(student);
    setFoType(type);
    resetFO();
    setSearchOpen(false);
    setLcOpen(false);
    setFoOpen(true);
  };

  const openLCForStudent = (student: any) => {
    setSelectedStudent(student);
    resetLC();
    setSearchOpen(false);
    setFoOpen(false);
    setLcOpen(true);
  };

  const closeFO = () => {
    setFoOpen(false);
    setSelectedStudent(null);
    resetFO();
  };

  const closeLC = () => {
    setLcOpen(false);
    setSelectedStudent(null);
    resetLC();
  };

  useModalHistory(
    searchOpen || foOpen || lcOpen,
    () => {
      if (foOpen) return closeFO();
      if (lcOpen) return closeLC();
      setSearchOpen(false);
    },
    "global-fo",
  );

  const handleSubmitFO = async () => {
    if (!selectedStudent?.id) return toast.error("Selecione um aluno.");
    const cleanText = foDetails.trim();
    if (cleanText.length < 5) return toast.error("Descreva o fato observado em texto livre.");
    if (!foReason) return toast.error("Selecione o código oficial do Manual antes de registrar o FO.");

    const definition = getFoCodeDefinition(foType, foReason);
    if (!definition) return toast.error("Código de FO inválido para este tipo.");

    try {
      toast.loading("Registrando Fato Observado...", { id: "global-fo" });
      const result = await addStudentObservation.mutateAsync({
        studentId: selectedStudent.id,
        type: foType,
        foCode: foReason,
        note: `[${foReason}] ${definition.label} - Relato: ${cleanText}`,
      });

      if (proofs.length > 0) {
        setProofsUploading(true);
        const studentObservationId = result?.id;
        if (!studentObservationId) throw new Error("Não foi possível identificar o Fato Observado criado.");

        proofs.forEach((proof) => addItem(proof.file, proof.id));
        const results = await Promise.all(
          proofs.map((proof) =>
            uploadFile(proof.id, async (file, onProgress, isCancelled) => {
              if (isCancelled()) return { success: false, error: "Upload cancelado pelo usuário" };

              const fileData = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onprogress = (event) => {
                  if (event.lengthComputable) {
                    onProgress(Math.round((event.loaded / event.total) * 45), event.loaded);
                  }
                };
                reader.onload = () => {
                  onProgress(50, Math.round(file.size * 0.5));
                  resolve(String(reader.result || "").split(",")[1] || "");
                };
                reader.onerror = () => reject(reader.error || new Error("Erro ao ler o arquivo."));
                reader.readAsDataURL(file);
              });

              if (isCancelled()) return { success: false, error: "Upload cancelado pelo usuário" };
              onProgress(70, Math.round(file.size * 0.7));
              await uploadFoProof.mutateAsync({
                studentObservationId,
                fileName: file.name,
                fileSize: file.size,
                mimeType: getSafeMimeType(file),
                fileData,
              });
              onProgress(95, Math.round(file.size * 0.95));
              return { success: true };
            }),
          ),
        );

        const failed = results.find((item) => !item?.success);
        if (failed) throw new Error(failed.error || "Não foi possível enviar uma das provas.");
      }

      await Promise.all([
        utils.serviceScale.studentObservations.invalidate(),
        utils.serviceScale.pendingStudentObservations.invalidate(),
      ]);
      toast.success("Fato Observado registrado com sucesso!", { id: "global-fo" });
      closeFO();
    } catch (error: any) {
      toast.error(`Erro ao lançar FO: ${error?.message || "falha desconhecida"}`, { id: "global-fo" });
    } finally {
      setProofsUploading(false);
    }
  };

  const handleSubmitLC = async () => {
    if (!selectedStudent?.id) return toast.error("Selecione um aluno.");
    if (lcForm.directReason.trim().length < 5) return toast.error("Descreva o motivo da LC direta.");
    if (!lcForm.recolhimentoDate || !lcForm.recolhimentoTime) return toast.error("Informe data e hora do recolhimento.");
    if (!Number.isInteger(lcForm.durationHours) || lcForm.durationHours < 1 || lcForm.durationHours > 240) {
      return toast.error("Informe uma duração entre 1 e 240 horas.");
    }
    if (lcForm.procedures.trim().length < 3) return toast.error("Informe os procedimentos e regras.");

    try {
      toast.loading("Registrando Licença Cassada...", { id: "global-lc" });
      await createDirectLcCase.mutateAsync({
        studentId: selectedStudent.id,
        directReason: lcForm.directReason.trim(),
        recolhimentoDate: lcForm.recolhimentoDate,
        recolhimentoTime: lcForm.recolhimentoTime,
        durationHours: lcForm.durationHours,
        procedures: lcForm.procedures.trim(),
      });
      await Promise.all([
        utils.serviceScale.lcCases.invalidate(),
        utils.serviceScale.pendingStudentObservations.invalidate(),
      ]);
      toast.success("Licença Cassada registrada com sucesso!", { id: "global-lc" });
      closeLC();
    } catch (error: any) {
      toast.error(`Erro ao lançar LC: ${error?.message || "falha desconhecida"}`, { id: "global-lc" });
    }
  };

  if (!canUseFO) return null;

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          setSearch("");
          setSearchOpen(true);
        }}
        className="fixed bottom-24 right-4 z-50 h-14 w-14 rounded-full bg-[#1a3a2a] p-0 text-base font-black text-white shadow-xl ring-2 ring-[#c4a84b]/70 hover:bg-[#12281d] md:bottom-8 md:right-8"
        aria-label="Abrir atalho de Fato Observado"
        title="Abrir FO"
      >
        FO
      </Button>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent
          className={`${dialogShell} max-w-[720px]`}
          onOpenAutoFocus={preventInitialFocus}
        >
          <DialogHeader className="shrink-0 border-b bg-muted/20 px-4 pb-3 pt-4 text-left sm:px-5">
            <DialogTitle className="flex items-center gap-2 text-xl font-black leading-tight text-[#1a3a2a] dark:text-[#c4a84b]">
              <ClipboardList className="h-5 w-5 shrink-0 text-[#c4a84b]" />
              Atalho FO
            </DialogTitle>
            <DialogDescription className="text-sm leading-snug">
              Pesquise o aluno ou use FO+, FO- ou LC.
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 sm:p-5">
            <div className="relative shrink-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Numérica, nome, cia/pel"
                className="h-11 w-full pl-9 text-base"
                inputMode="search"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border bg-muted/10 overscroll-contain">
              {studentsQuery.isLoading ? (
                <div className="p-4 text-sm text-muted-foreground">Carregando alunos...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">Nenhum aluno encontrado.</div>
              ) : (
                <div className="divide-y divide-border/70">
                  {filteredStudents.map((student: any) => (
                    <div key={student.id} className="space-y-3 p-3 transition-colors hover:bg-[#1a3a2a]/5 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-3 sm:space-y-0">
                      <button
                        type="button"
                        className="w-full min-w-0 text-left"
                        onClick={() => openFOForStudent(student)}
                      >
                        <StudentSummary student={student} />
                      </button>
                      <div className="grid grid-cols-3 gap-2 sm:w-[252px]">
                        <Button type="button" size="sm" className="h-10 bg-green-700 px-2 text-white hover:bg-green-800" onClick={() => openFOForStudent(student, "positive")}>
                          FO+
                        </Button>
                        <Button type="button" size="sm" className="h-10 bg-red-700 px-2 text-white hover:bg-red-800" onClick={() => openFOForStudent(student, "negative")}>
                          FO-
                        </Button>
                        <Button type="button" size="sm" className="h-10 bg-zinc-800 px-2 text-white hover:bg-zinc-900" onClick={() => openLCForStudent(student)}>
                          LC
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={foOpen} onOpenChange={(open) => (open ? setFoOpen(true) : closeFO())}>
        <DialogContent
          className={`${dialogShell} max-w-[620px]`}
          onOpenAutoFocus={preventInitialFocus}
        >
          <DialogHeader className="shrink-0 border-b bg-muted/20 px-4 pb-3 pt-4 text-left sm:px-5">
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-[#1a3a2a] dark:text-[#c4a84b]">
              <ClipboardList className="h-5 w-5 shrink-0 text-[#c4a84b]" />
              Lançar FO
            </DialogTitle>
            <DialogDescription className="text-sm leading-snug">
              Confira o aluno, escolha o tipo e registre o fato observado.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5">
            {selectedStudent && (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/20 p-3">
                  <StudentSummary student={selectedStudent} />
                </div>

                <div>
                  <Label>Tipo de Fato</Label>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={foType === "positive" ? "default" : "outline"}
                      className={foType === "positive" ? "bg-green-700 text-white hover:bg-green-800" : ""}
                      onClick={() => {
                        setFoType("positive");
                        setFoReason("");
                      }}
                    >
                      FO+ (Elogio)
                    </Button>
                    <Button
                      type="button"
                      variant={foType === "negative" ? "default" : "outline"}
                      className={foType === "negative" ? "bg-red-700 text-white hover:bg-red-800" : ""}
                      onClick={() => {
                        setFoType("negative");
                        setFoReason("");
                      }}
                    >
                      FO- (Transgressão)
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="global-fo-details">Relato livre do Fato Observado</Label>
                  <textarea
                    id="global-fo-details"
                    value={foDetails}
                    onChange={(event) => setFoDetails(event.target.value)}
                    placeholder="Descreva o ocorrido com data, hora, local e circunstâncias..."
                    className="mt-1.5 flex min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  {foDetails.trim() ? (
                    <div className="mt-2 rounded-md border bg-muted/20 p-2 text-xs">
                      {foTextClassification ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={foType === "positive" ? "bg-green-700 text-white" : "bg-red-700 text-white"}>
                              Sugestão FO {foTextClassification.definition.code}
                            </Badge>
                            <span className="font-semibold text-foreground">{foTextClassification.definition.label}</span>
                          </div>
                          <Button type="button" variant="outline" size="sm" onClick={() => setFoReason(foTextClassification.definition.code)}>
                            Usar esta linha do Manual
                          </Button>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Escolha uma linha do Manual abaixo.</p>
                      )}
                    </div>
                  ) : null}
                </div>

                <div>
                  <Label htmlFor="global-fo-reason">Código oficial do Manual do Aluno</Label>
                  <select
                    id="global-fo-reason"
                    value={foReason}
                    onChange={(event) => setFoReason(event.target.value)}
                    className="mt-1.5 flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">-- Escolha a linha do Manual --</option>
                    {getFoCodesByType(foType).map((item) => (
                      <option key={`${item.type}-${item.code}`} value={item.code}>
                        {item.code} - {item.label}
                      </option>
                    ))}
                  </select>
                  {foReason && getFoCodeDefinition(foType, foReason) ? (
                    <p className="mt-1 text-xs text-muted-foreground">{getFoCodeDefinition(foType, foReason)?.manualRef}</p>
                  ) : null}
                </div>

                <div className="border-t pt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="text-sm font-semibold">Provas</Label>
                    {proofs.length > 0 && (
                      <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={resetProofs}>
                        <X className="h-3 w-3" />
                        Limpar
                      </Button>
                    )}
                  </div>
                  <FOProofUploader
                    key={proofUploaderKey}
                    onProofsChange={setProofs}
                    uploadItems={uploadItems}
                    onCancelUpload={cancelUpload}
                    isOpen={foOpen}
                    maxFiles={5}
                    maxSizeMB={15}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 grid grid-cols-1 gap-2 border-t bg-white p-3 dark:bg-zinc-950 sm:flex sm:px-5">
            <Button type="button" className="order-1 bg-[#1a3a2a] text-white hover:bg-[#1a3a2a]/90 sm:order-2" onClick={handleSubmitFO} disabled={addStudentObservation.isPending || proofsUploading}>
              {addStudentObservation.isPending || proofsUploading ? "Processando..." : "Registrar Fato"}
            </Button>
            <Button type="button" variant="outline" className="order-2 sm:order-1" onClick={closeFO}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lcOpen} onOpenChange={(open) => (open ? setLcOpen(true) : closeLC())}>
        <DialogContent
          className={`${dialogShell} max-w-[520px]`}
          onOpenAutoFocus={preventInitialFocus}
        >
          <DialogHeader className="shrink-0 border-b bg-muted/20 px-4 pb-3 pt-4 text-left sm:px-5">
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-red-700">
              <Shield className="h-5 w-5" />
              Lançar LC Direta
            </DialogTitle>
            <DialogDescription>Registre a determinação, o período e os procedimentos.</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-3 sm:p-5">
            {selectedStudent && <div className="rounded-lg border bg-muted/20 p-3"><StudentSummary student={selectedStudent} /></div>}
            <div>
              <Label htmlFor="global-lc-reason">Motivo da LC direta</Label>
              <textarea
                id="global-lc-reason"
                value={lcForm.directReason}
                onChange={(event) => setLcForm((current) => ({ ...current, directReason: event.target.value }))}
                className="mt-1.5 min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Descreva a determinação e o motivo..."
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="global-lc-date">Data do recolhimento</Label>
                <Input id="global-lc-date" type="date" value={lcForm.recolhimentoDate} onChange={(event) => setLcForm((current) => ({ ...current, recolhimentoDate: event.target.value }))} className="mt-1.5 h-11" />
              </div>
              <div>
                <Label htmlFor="global-lc-time">Hora</Label>
                <Input id="global-lc-time" type="time" value={lcForm.recolhimentoTime} onChange={(event) => setLcForm((current) => ({ ...current, recolhimentoTime: event.target.value }))} className="mt-1.5 h-11" />
              </div>
            </div>
            <div>
              <Label htmlFor="global-lc-duration">Duração em horas</Label>
              <Input id="global-lc-duration" type="number" min={1} max={240} value={lcForm.durationHours} onChange={(event) => setLcForm((current) => ({ ...current, durationHours: Number(event.target.value) || 0 }))} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label htmlFor="global-lc-procedures">Procedimentos e regras</Label>
              <textarea
                id="global-lc-procedures"
                value={lcForm.procedures}
                onChange={(event) => setLcForm((current) => ({ ...current, procedures: event.target.value }))}
                className="mt-1.5 min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Informe apresentação, local, horário e demais orientações..."
              />
            </div>
          </div>

          <DialogFooter className="shrink-0 grid grid-cols-1 gap-2 border-t bg-white p-3 dark:bg-zinc-950 sm:flex sm:px-5">
            <Button type="button" className="order-1 bg-red-700 text-white hover:bg-red-800 sm:order-2" onClick={handleSubmitLC} disabled={createDirectLcCase.isPending}>
              {createDirectLcCase.isPending ? "Processando..." : "Registrar LC"}
            </Button>
            <Button type="button" variant="outline" className="order-2 sm:order-1" onClick={closeLC}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
