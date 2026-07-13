import { useMemo, useState } from "react";
import { ClipboardList, Search, User, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { classifyFoText, getFoCodeDefinition, getFoCodesByType } from "@shared/foCatalog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FOProofUploader } from "@/components/FOProofUploader";
import { useUploadProgress } from "@/hooks/useUploadProgress";
import { useModalHistory } from "@/hooks/useModalHistory";

type FOType = "positive" | "negative";

interface ProofFile {
  id: string;
  file: File;
  preview?: string;
  type: "foto" | "video" | "audio" | "documento";
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

export function GlobalFOButton() {
  const utils = trpc.useUtils();
  const { data: access } = trpc.serviceScale.myAccess.useQuery();
  const canUseFO = COMMAND_ROLES.has(String(access?.role || ""));

  const [searchOpen, setSearchOpen] = useState(false);
  const [foOpen, setFoOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [foType, setFoType] = useState<FOType>("negative");
  const [foReason, setFoReason] = useState("");
  const [foDetails, setFoDetails] = useState("");
  const [proofs, setProofs] = useState<ProofFile[]>([]);
  const [proofsUploading, setProofsUploading] = useState(false);

  const {
    uploadItems,
    addItem,
    uploadFile,
    cancelUpload,
    clearItems,
  } = useUploadProgress();

  const studentsQuery = trpc.serviceScale.students.useQuery(undefined, {
    enabled: canUseFO,
  });
  const addStudentObservation = trpc.serviceScale.addStudentObservation.useMutation();
  const uploadFoProof = trpc.foProofs.uploadProof.useMutation();

  const filteredStudents = useMemo(() => {
    const students = studentsQuery.data ?? [];
    const value = search.trim().toLowerCase();
    const sorted = [...students].sort((a: any, b: any) => Number(a.numerica) - Number(b.numerica));
    if (!value) return sorted.slice(0, 20);
    return sorted
      .filter((student: any) =>
        String(student.numerica || "").includes(value) ||
        String(student.nomeGuerra || "").toLowerCase().includes(value) ||
        String(student.nomeCompleto || "").toLowerCase().includes(value) ||
        `${student.companhia || ""}/${student.peloton || ""}`.includes(value)
      )
      .slice(0, 20);
  }, [studentsQuery.data, search]);

  const foTextClassification = useMemo(
    () => classifyFoText(foType, foDetails),
    [foType, foDetails]
  );

  const resetFOForm = () => {
    setFoReason("");
    setFoDetails("");
    setProofs([]);
    clearItems();
  };

  const openFOForStudent = (student: any, type: FOType = "negative") => {
    setSelectedStudent(student);
    setFoType(type);
    resetFOForm();
    setFoOpen(true);
    setSearchOpen(false);
  };

  const closeFO = () => {
    setFoOpen(false);
    setSelectedStudent(null);
    resetFOForm();
  };

  const modalOpen = searchOpen || foOpen;
  useModalHistory(modalOpen, () => {
    if (foOpen) {
      closeFO();
      return;
    }
    setSearchOpen(false);
  }, "global-fo");

  const handleSubmitFO = async () => {
    if (!selectedStudent?.id) {
      toast.error("Selecione um aluno.");
      return;
    }

    const cleanFoText = foDetails.trim();
    if (cleanFoText.length < 5) {
      toast.error("Descreva o fato observado em texto livre.");
      return;
    }

    const selectedCode = foReason;
    if (!selectedCode) {
      toast.error("Selecione o código oficial do Manual antes de registrar o FO.");
      return;
    }

    const selectedDefinition = getFoCodeDefinition(foType, selectedCode);
    if (!selectedDefinition) {
      toast.error("Código de FO inválido para este tipo.");
      return;
    }

    const note = `[${selectedCode}] ${selectedDefinition.label} - Relato: ${cleanFoText}`;

    try {
      toast.loading("Registrando Fato Observado...", { id: "global-fo" });

      const result = await addStudentObservation.mutateAsync({
        studentId: selectedStudent.id,
        type: foType,
        foCode: selectedCode,
        note,
      });

      if (proofs.length > 0) {
        setProofsUploading(true);
        const studentObservationId = result?.id;
        if (!studentObservationId) {
          throw new Error("Não foi possível identificar o Fato Observado criado.");
        }

        proofs.forEach((proof) => addItem(proof.file, proof.id));
        const uploadResults = await Promise.all(
          proofs.map(async (proof) =>
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
                mimeType: file.type,
                fileData,
              });
              onProgress(95, Math.round(file.size * 0.95));
              return { success: true };
            })
          )
        );

        const failed = uploadResults.find((item) => !item?.success);
        if (failed) {
          throw new Error(failed.error || "Não foi possível enviar uma das provas.");
        }
        setProofsUploading(false);
      }

      await Promise.all([
        utils.serviceScale.studentObservations.invalidate(),
        utils.serviceScale.pendingStudentObservations.invalidate(),
      ]);
      toast.success("Fato Observado registrado com sucesso!", { id: "global-fo" });
      closeFO();
    } catch (error: any) {
      toast.error(`Erro ao lançar FO: ${error?.message || "falha desconhecida"}`, { id: "global-fo" });
      setProofsUploading(false);
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
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-[720px] max-h-[calc(100dvh-6rem)] gap-0 overflow-hidden border border-border bg-white p-0 text-foreground dark:bg-zinc-950 sm:rounded-xl">
          <DialogHeader className="border-b bg-muted/20 px-4 pb-3 pt-4 text-left sm:px-5">
            <DialogTitle className="flex items-center gap-2 text-xl font-black leading-tight text-[#1a3a2a] dark:text-[#c4a84b]" style={{ fontFamily: "Merriweather, serif" }}>
              <ClipboardList className="h-5 w-5 shrink-0 text-[#c4a84b]" />
              Atalho FO
            </DialogTitle>
            <DialogDescription className="text-sm leading-snug">
              Pesquise o aluno. Toque no nome para abrir o FO, ou use FO+ / FO-.
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-3 p-4 sm:p-5">
            <div className="relative shrink-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Numérica, nome, cia/pel"
                className="h-11 w-full pl-9 text-base"
                autoFocus
              />
            </div>

            <div className="min-h-0 max-h-[min(58dvh,440px)] overflow-y-auto rounded-lg border bg-muted/10">
              {studentsQuery.isLoading ? (
                <div className="p-4 text-sm text-muted-foreground">Carregando alunos...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">Nenhum aluno encontrado.</div>
              ) : (
                <div className="divide-y divide-border/70">
                  {filteredStudents.map((student: any) => (
                    <div
                      key={student.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openFOForStudent(student)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openFOForStudent(student);
                        }
                      }}
                      className="grid w-full gap-3 p-3 text-left transition-colors hover:bg-[#1a3a2a]/5 sm:grid-cols-[1fr_auto] sm:items-center"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
                          {student.fotoUrl ? (
                            <img src={student.fotoUrl} alt={student.nomeGuerra || "Aluno"} className="h-full w-full object-cover" />
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
                      <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0" onClick={(event) => event.stopPropagation()}>
                        <Button type="button" size="sm" className="h-9 bg-green-700 px-5 text-white hover:bg-green-800" onClick={() => openFOForStudent(student, "positive")}>
                          FO+
                        </Button>
                        <Button type="button" size="sm" className="h-9 bg-red-700 px-5 text-white hover:bg-red-800" onClick={() => openFOForStudent(student, "negative")}>
                          FO-
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
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-[620px] max-h-[calc(100dvh-4rem)] overflow-y-auto border border-border bg-white p-0 text-foreground dark:bg-zinc-950 sm:rounded-xl">
          <DialogHeader className="border-b bg-muted/20 px-4 pb-3 pt-4 text-left sm:px-5">
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-[#1a3a2a] dark:text-[#c4a84b]" style={{ fontFamily: "Merriweather, serif" }}>
              <ClipboardList className="h-5 w-5 shrink-0 text-[#c4a84b]" />
              Lançar FO
            </DialogTitle>
            <DialogDescription className="text-sm leading-snug">
              Confira o aluno, escolha o tipo e registre o fato observado.
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-4 p-4 sm:p-5">
              <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
                  {selectedStudent.fotoUrl ? (
                    <img src={selectedStudent.fotoUrl} alt={selectedStudent.nomeGuerra || "Aluno"} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-black">
                    <span className="text-[#c4a84b]">{selectedStudent.numerica}</span> · {selectedStudent.nomeGuerra}
                  </div>
                  <div className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                    {selectedStudent.nomeCompleto || "Sem nome completo"} · {selectedStudent.companhia}ª Cia / {selectedStudent.peloton}º Pel
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={() => setSearchOpen(true)}>
                  <Search className="h-4 w-4" />
                </Button>
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
                  placeholder="Descreva o ocorrido com data, hora, local e circunstancias..."
                  className="mt-1.5 flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {foDetails.trim() ? (
                  <div className="mt-2 rounded-md border bg-muted/20 p-2 text-xs">
                    {foTextClassification ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={foType === "positive" ? "bg-green-700 text-white" : "bg-red-700 text-white"}>
                            Sugestao FO {foTextClassification.definition.code}
                          </Badge>
                          <span className="font-semibold text-foreground">{foTextClassification.definition.label}</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setFoReason(foTextClassification.definition.code)}
                        >
                          Usar esta linha do Manual
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        Nenhuma sugestao segura pelo relato. Escolha uma linha do Manual abaixo.
                      </p>
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
                  className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">-- Escolha a linha do Manual --</option>
                  {getFoCodesByType(foType).map((item) => (
                    <option key={`${item.type}-${item.code}`} value={item.code}>
                      {item.code} - {item.label}
                    </option>
                  ))}
                </select>
                {foReason && getFoCodeDefinition(foType, foReason) ? (
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {getFoCodeDefinition(foType, foReason)?.manualRef}
                  </p>
                ) : null}
                <p className="mt-1 text-[10px] text-muted-foreground">
                  O FO so e registrado quando uma linha oficial do Manual e selecionada.
                </p>
              </div>

              <div className="border-t pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <Label className="text-sm font-semibold">Provas</Label>
                  {proofs.length > 0 && (
                    <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setProofs([])}>
                      <X className="h-3 w-3" />
                      Limpar
                    </Button>
                  )}
                </div>
                <FOProofUploader
                  onProofsChange={setProofs}
                  uploadItems={uploadItems}
                  onCancelUpload={cancelUpload}
                  isOpen={foOpen}
                  maxFiles={5}
                  maxSizeMB={50}
                />
              </div>
            </div>
          )}

          <DialogFooter className="sticky bottom-0 border-t bg-white p-4 dark:bg-zinc-950 sm:px-5">
            <Button type="button" variant="outline" onClick={closeFO}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-[#1a3a2a] text-white hover:bg-[#1a3a2a]/90"
              onClick={handleSubmitFO}
              disabled={addStudentObservation.isPending || proofsUploading}
            >
              {addStudentObservation.isPending || proofsUploading ? "Processando..." : "Registrar Fato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
