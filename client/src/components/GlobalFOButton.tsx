import { useMemo, useState } from "react";
import { ClipboardList, Search, User, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const TRANSGRESSIONS_LIST = [
  "Atraso para formaturas ou instruções",
  "Fardamento incorreto ou desalinhado",
  "Falta de zelo ou dano ao material de instrução",
  "Postura inadequada ou desatenção em instrução",
  "Conversas paralelas durante a instrução",
  "Utilização de celular sem autorização",
  "Dormir durante a instrução ou serviço",
  "Faltar com a verdade ou omitir fatos",
  "Descumprimento de ordens ou prescrições dos manuais",
  "Falta de asseio pessoal ou de higiene",
];

const ELOGIOS_LIST = [
  "Destaque intelectual em avaliações ou trabalhos",
  "Destaque em instrução de Ordem Unida ou Treinamento",
  "Espírito de corpo exemplar e cooperação ativa",
  "Honestidade ou ato de probidade militar exemplar",
  "Presteza e dedicação excepcional no serviço",
  "Iniciativa positiva na resolução de problemas do pelotão",
  "Asseio impecável e alinhamento de fardamento exemplar",
  "Desempenho exemplar como Xerife ou função de liderança",
  "Conduta exemplar dentro e fora das dependências",
];

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
  const [foCustomReason, setFoCustomReason] = useState("");
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
  const foReasonsQuery = trpc.serviceScale.foReasons.useQuery(undefined, {
    enabled: canUseFO,
  });
  const addStudentObservation = trpc.serviceScale.addStudentObservation.useMutation();
  const suggestFoReason = trpc.serviceScale.suggestFoReason.useMutation({
    onSuccess: () => utils.serviceScale.foReasons.invalidate(),
  });
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

  const resetFOForm = () => {
    setFoReason("");
    setFoCustomReason("");
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

    if (!foReason) {
      toast.error("Selecione o fato observado.");
      return;
    }

    let selectedReason = foReason;
    if (foReason === "outro") {
      if (foCustomReason.trim().length < 3) {
        toast.error("Informe o novo elogio ou transgressão.");
        return;
      }
      selectedReason = foCustomReason.trim();
    }

    const note = foDetails.trim()
      ? `${selectedReason} - Detalhes: ${foDetails.trim()}`
      : selectedReason;

    try {
      toast.loading("Registrando Fato Observado...", { id: "global-fo" });

      if (foReason === "outro") {
        await suggestFoReason.mutateAsync({
          type: foType,
          label: selectedReason,
        });
      }

      const result = await addStudentObservation.mutateAsync({
        studentId: selectedStudent.id,
        type: foType,
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
                      setFoCustomReason("");
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
                      setFoCustomReason("");
                    }}
                  >
                    FO- (Transgressão)
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="global-fo-reason">Fato Observado</Label>
                <select
                  id="global-fo-reason"
                  value={foReason}
                  onChange={(event) => setFoReason(event.target.value)}
                  className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">-- Selecione o fato --</option>
                  {(foType === "positive" ? ELOGIOS_LIST : TRANSGRESSIONS_LIST).map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                  {foReasonsQuery.data
                    ?.filter((item: any) => item.type === foType)
                    .map((item: any) => (
                      <option key={`custom-${item.id}`} value={item.label}>{item.label}</option>
                    ))}
                  <option value="outro">Outro / Especificar</option>
                </select>
              </div>

              {foReason === "outro" && (
                <div>
                  <Label htmlFor="global-fo-custom">{foType === "positive" ? "Novo elogio" : "Nova transgressão"}</Label>
                  <Input
                    id="global-fo-custom"
                    value={foCustomReason}
                    onChange={(event) => setFoCustomReason(event.target.value)}
                    maxLength={500}
                    placeholder={foType === "positive" ? "Escreva o elogio" : "Escreva a transgressão"}
                    className="mt-1.5 h-10 text-sm"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="global-fo-details">Detalhes Complementares</Label>
                <textarea
                  id="global-fo-details"
                  value={foDetails}
                  onChange={(event) => setFoDetails(event.target.value)}
                  placeholder="Detalhe o ocorrido: data, hora, local e circunstâncias adicionais..."
                  className="mt-1.5 flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
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
