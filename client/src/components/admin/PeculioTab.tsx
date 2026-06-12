import { useEffect, useState } from "react";
import { CalendarDays, Check, FileText, Printer, Save, Users } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const statusList = [
  { value: "pronto", label: "PRONTO", color: "bg-green-700 text-white hover:bg-green-800" },
  { value: "falta", label: "FT", color: "bg-red-600 text-white hover:bg-red-700" },
  { value: "atraso", label: "AT", color: "bg-amber-500 text-black hover:bg-amber-600" },
  { value: "diverso_destino", label: "DD", color: "bg-blue-600 text-white hover:bg-blue-700" },
  { value: "destino_ignorado", label: "DI", color: "bg-gray-600 text-white hover:bg-gray-700" },
  { value: "dispensa_medica", label: "DM", color: "bg-orange-600 text-white hover:bg-orange-700" },
  { value: "dispensa_administrativa", label: "DA", color: "bg-purple-600 text-white hover:bg-purple-700" },
];

const legendDetails = [
  { abbr: "FT", name: "Falta" },
  { abbr: "AT", name: "Atraso" },
  { abbr: "DD", name: "Diverso Destino" },
  { abbr: "DI", name: "Destino Ignorado" },
  { abbr: "DM", name: "Dispensa Médica" },
  { abbr: "DA", name: "Dispensa Administrativa" },
];

export function PeculioTab() {
  const { data: access } = trpc.serviceScale.myAccess.useQuery();

  const [companhia, setCompanhia] = useState("1");
  const [peloton, setPeloton] = useState("1");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Instructions & Signatures
  const [instrucaoLocal, setInstrucaoLocal] = useState("");
  const [instrucaoDisciplina, setInstrucaoDisciplina] = useState("");
  const [instrucaoExterna, setInstrucaoExterna] = useState(false);
  const [chefeTurma, setChefeTurma] = useState("");
  const [subchefeTurma, setSubchefeTurma] = useState("");
  const [cmtPel, setCmtPel] = useState("");

  // Student statuses state
  const [studentStatuses, setStudentStatuses] = useState<Record<number, { status: string; observacao: string }>>({});

  const selectedCompanhia = Number(companhia);
  const selectedPeloton = Number(peloton);

  useEffect(() => {
    if (!access?.scope) return;
    if (access.scope.companhia) setCompanhia(String(access.scope.companhia));
    if (access.scope.peloton) setPeloton(String(access.scope.peloton));
  }, [access?.scope]);

  // Load students for platoon
  const studentsQuery = trpc.serviceScale.students.useQuery(
    { companhia: selectedCompanhia, peloton: selectedPeloton },
    { enabled: Boolean(selectedCompanhia && selectedPeloton) }
  );

  // Load Peculio Report for selected date
  const peculioQuery = trpc.peculio.get.useQuery(
    { companhia: selectedCompanhia, peloton: selectedPeloton, date },
    { enabled: Boolean(selectedCompanhia && selectedPeloton && date) }
  );

  const students = studentsQuery.data ?? [];

  useEffect(() => {
    if (peculioQuery.data) {
      const { report, statuses } = peculioQuery.data;

      // Update header
      setInstrucaoLocal(report?.instrucaoLocal || "");
      setInstrucaoDisciplina(report?.instrucaoDisciplina || "");
      setInstrucaoExterna(Boolean(report?.instrucaoExterna));
      setChefeTurma(report?.chefeTurma || "");
      setSubchefeTurma(report?.subchefeTurma || "");
      setCmtPel(report?.cmtPel || "");

      // Update statuses
      const nextStatuses: Record<number, { status: string; observacao: string }> = {};
      for (const student of students) {
        const existing = statuses.find((s) => s.studentId === student.id);
        nextStatuses[student.id] = {
          status: existing?.status || "pronto",
          observacao: existing?.observacao || "",
        };
      }
      setStudentStatuses(nextStatuses);
    }
  }, [peculioQuery.data, students]);

  const savePeculio = trpc.peculio.save.useMutation({
    onSuccess: async () => {
      toast.success("Pecúlio salvo com sucesso!");
      await peculioQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const handleStatusChange = (studentId: number, status: string) => {
    setStudentStatuses((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        status,
      },
    }));
  };

  const handleObservacaoChange = (studentId: number, observacao: string) => {
    setStudentStatuses((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        observacao,
      },
    }));
  };

  const handleSave = () => {
    const statusesPayload = students.map((student) => {
      const entry = studentStatuses[student.id] || { status: "pronto", observacao: "" };
      return {
        studentId: student.id,
        status: entry.status,
        observacao: entry.observacao || null,
      };
    });

    savePeculio.mutate({
      companhia: selectedCompanhia,
      peloton: selectedPeloton,
      date,
      instrucaoLocal: instrucaoLocal || null,
      instrucaoDisciplina: instrucaoDisciplina || null,
      instrucaoExterna,
      chefeTurma: chefeTurma || null,
      subchefeTurma: subchefeTurma || null,
      cmtPel: cmtPel || null,
      statuses: statusesPayload,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const canChangeCompany = Boolean(access?.scope?.unrestricted);
  const canChangeScope = Boolean(access?.scope?.unrestricted || access?.assignment?.level === "companhia");

  const formattedDate = date ? new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR") : "";

  return (
    <div className="space-y-6">
      {/* 1. Header controls */}
      <Card className="border-border/50 bg-white dark:bg-zinc-900 print:hidden">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="grid flex-1 gap-3 sm:grid-cols-4">
              <div>
                <Label>Companhia</Label>
                <select
                  value={companhia}
                  onChange={(e) => setCompanhia(e.target.value)}
                  disabled={!canChangeCompany}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {[1, 2, 3, 4, 5].map((item) => (
                    <option key={item} value={String(item)}>
                      {item}ª Companhia
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Pelotão</Label>
                <select
                  value={peloton}
                  onChange={(e) => setPeloton(e.target.value)}
                  disabled={!canChangeScope || Boolean(access?.scope?.peloton)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {[1, 2].map((item) => (
                    <option key={item} value={String(item)}>
                      {item}º Pelotão
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Data do Pecúlio</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="flex gap-2 items-end">
                <Button className="flex-1 gap-2 bg-[#1a3a2a] text-white" onClick={handleSave} disabled={savePeculio.isPending}>
                  <Save className="h-4 w-4" />
                  Salvar Pecúlio
                </Button>
                <Button variant="outline" className="gap-2" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Frequency table - Web View */}
      <Card className="border-border/50 bg-white dark:bg-zinc-900 print:hidden hidden md:block">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#c4a84b]" />
              <h2 className="text-lg font-bold text-foreground">Matriz de Frequência e Alterações</h2>
            </div>
            <span className="text-sm font-semibold text-muted-foreground">Data: {formattedDate}</span>
          </div>

          <div className="rounded-md border border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[60px] text-center font-bold">Nº</TableHead>
                  <TableHead className="font-bold">Aluno</TableHead>
                  {statusList.map((st) => (
                    <TableHead key={st.value} className="text-center font-bold w-[70px]">
                      {st.label}
                    </TableHead>
                  ))}
                  <TableHead className="font-bold">Situação / Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const entry = studentStatuses[student.id] || { status: "pronto", observacao: "" };
                  return (
                    <TableRow key={student.id} className="hover:bg-muted/30">
                      <TableCell className="text-center font-semibold">{student.numerica}</TableCell>
                      <TableCell className="font-medium text-[#1a3a2a] dark:text-green-400">
                        {student.nomeGuerra}
                      </TableCell>
                      {statusList.map((st) => {
                        const isSelected = entry.status === st.value;
                        return (
                          <TableCell key={st.value} className="text-center p-2">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.id, st.value)}
                              className={`w-9 h-9 rounded-full text-xs font-black transition-all ${
                                isSelected ? st.color + " scale-110 shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              {st.label}
                            </button>
                          </TableCell>
                        );
                      })}
                      <TableCell className="p-2">
                        <Input
                          placeholder="Observação da alteração..."
                          value={entry.observacao}
                          onChange={(e) => handleObservacaoChange(student.id, e.target.value)}
                          className="h-9 text-xs"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!students.length && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center p-6 text-muted-foreground">
                      Nenhum aluno cadastrado para este Pelotão.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 2. Frequency list - Mobile View */}
      <div className="space-y-4 print:hidden md:hidden">
        {students.map((student) => {
          const entry = studentStatuses[student.id] || { status: "pronto", observacao: "" };
          return (
            <Card key={student.id} className="border-border/50 bg-white dark:bg-zinc-900">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-bold text-[#1a3a2a] dark:text-green-400">{student.nomeGuerra}</span>
                  <span className="text-xs font-bold text-muted-foreground">Nº {student.numerica}</span>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Status / Frequência</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {statusList.map((st) => {
                      const isSelected = entry.status === st.value;
                      return (
                        <button
                          key={st.value}
                          type="button"
                          onClick={() => handleStatusChange(student.id, st.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isSelected ? st.color + " shadow-sm" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {st.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">SITUAÇÃO / ALTERAÇÃO</Label>
                  <Input
                    placeholder="Observação da alteração..."
                    value={entry.observacao}
                    onChange={(e) => handleObservacaoChange(student.id, e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 3. Header config, signatures, and legend (Web view) */}
      <div className="grid gap-6 print:hidden xl:grid-cols-[1.2fr_0.8fr]">
        {/* Extra instruction details */}
        <Card className="border-border/50 bg-white dark:bg-zinc-900">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2 border-b pb-2">
              <FileText className="h-5 w-5 text-[#c4a84b]" />
              <h2 className="text-lg font-bold text-foreground">Instrução Externa & Assinaturas</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Local da Instrução</Label>
                <Input value={instrucaoLocal} onChange={(e) => setInstrucaoLocal(e.target.value)} placeholder="Ex.: Stand de Tiro" />
              </div>
              <div>
                <Label>Disciplina / Instrução</Label>
                <Input value={instrucaoDisciplina} onChange={(e) => setInstrucaoDisciplina(e.target.value)} placeholder="Ex.: Armamento e Tiro" />
              </div>
              <div className="flex flex-col justify-end pb-2">
                <div className="flex items-center gap-2">
                  <Switch id="instrucao-externa" checked={instrucaoExterna} onCheckedChange={setInstrucaoExterna} />
                  <Label htmlFor="instrucao-externa" className="cursor-pointer">Possui Instrução Externa?</Label>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 pt-2">
              <div>
                <Label>Chefe de Turma</Label>
                <Input value={chefeTurma} onChange={(e) => setChefeTurma(e.target.value)} placeholder="Nome do Chefe de Turma" />
              </div>
              <div>
                <Label>Subchefe de Turma</Label>
                <Input value={subchefeTurma} onChange={(e) => setSubchefeTurma(e.target.value)} placeholder="Nome do Subchefe de Turma" />
              </div>
              <div>
                <Label>CMT de Pelotão</Label>
                <Input value={cmtPel} onChange={(e) => setCmtPel(e.target.value)} placeholder="Nome do CMT do Pelotão" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legend Card */}
        <Card className="border-border/50 bg-white dark:bg-zinc-900">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-bold text-foreground border-b pb-2">Legenda de Alterações</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {legendDetails.map((item) => (
                <div key={item.abbr} className="flex items-center gap-2 p-1.5 rounded bg-muted/30">
                  <span className="font-bold bg-muted px-2 py-0.5 rounded border text-[10px] w-8 text-center">{item.abbr}</span>
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. OFFICIAL PMAM PECÚLIO PRINT VIEW - Hidden by default, visible during window.print() */}
      <div className="hidden print:block peculio-print-container font-serif text-black p-4 space-y-4" style={{ fontSize: "11px" }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { background: white !important; color: black !important; }
            .print\\:hidden, header, nav, footer, aside, .sw-active, button { display: none !important; }
            .peculio-print-container { display: block !important; width: 100%; }
            @page { size: portrait; margin: 1.5cm; }
          }
          .peculio-table th, .peculio-table td { border: 1px solid black !important; padding: 2px 4px !important; text-align: center; }
          .peculio-table td.left-align { text-align: left !important; }
        ` }} />

        {/* Header section matching PDF */}
        <div className="flex flex-col items-center text-center space-y-1">
          <h1 className="text-sm font-black tracking-wider">PMAM</h1>
          <h2 className="text-xs font-black">POLÍCIA MILITAR DO AMAZONAS</h2>
          <h3 className="text-[10px] font-bold">DIRETORIA DE CAPACITAÇÃO E TREINAMENTO</h3>
          <h4 className="text-[10px] font-bold">CENTRO DE FORMAÇÃO E APERFEIÇOAMENTO DE PRAÇAS</h4>
          <div className="w-full border-t border-black my-2"></div>
          
          <div className="flex justify-between w-full font-bold text-xs">
            <span>PECÚLIO {selectedCompanhia}ª CIA/{selectedPeloton}º PEL - CFSD/2026</span>
            <span>DATA: {formattedDate}</span>
          </div>
        </div>

        {/* Attendance Matrix Table */}
        <table className="w-full peculio-table border-collapse mt-4">
          <thead>
            <tr className="font-bold">
              <th className="w-10">ORD</th>
              <th className="w-12">Nº</th>
              <th>NOME COMPLETO</th>
              <th className="w-16">PRONTO</th>
              <th className="w-8">FT</th>
              <th className="w-8">AT</th>
              <th className="w-8">DD</th>
              <th className="w-8">DI</th>
              <th className="w-8">DM</th>
              <th className="w-8">DA</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => {
              const entry = studentStatuses[student.id] || { status: "pronto", observacao: "" };
              return (
                <tr key={student.id}>
                  <td>{idx + 1}</td>
                  <td>{student.numerica}</td>
                  <td className="left-align font-semibold uppercase">{student.nomeCompleto || student.nomeGuerra}</td>
                  <td>{entry.status === "pronto" ? "X" : ""}</td>
                  <td>{entry.status === "falta" ? "X" : ""}</td>
                  <td>{entry.status === "atraso" ? "X" : ""}</td>
                  <td>{entry.status === "diverso_destino" ? "X" : ""}</td>
                  <td>{entry.status === "destino_ignorado" ? "X" : ""}</td>
                  <td>{entry.status === "dispensa_medica" ? "X" : ""}</td>
                  <td>{entry.status === "dispensa_administrativa" ? "X" : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Legend and Instruction Box */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="border border-black p-2 space-y-1">
            <h5 className="font-bold uppercase border-b border-black pb-1 mb-1">Legenda das Alterações</h5>
            <div className="grid grid-cols-2 gap-x-2 text-[9px]">
              <div><strong>FT</strong> - FALTA</div>
              <div><strong>AT</strong> - ATRASO</div>
              <div><strong>DD</strong> - DIVERSO DESTINO</div>
              <div><strong>DI</strong> - DESTINO IGNORADO</div>
              <div><strong>DM</strong> - DISPENSA MÉDICA</div>
              <div><strong>DA</strong> - DISPENSA ADMINISTRATIVA</div>
            </div>
          </div>

          <div className="border border-black p-2 flex flex-col justify-between">
            <h5 className="font-bold uppercase border-b border-black pb-1 mb-1 text-center">Instrução Externa</h5>
            <div className="grid grid-cols-2 gap-2 text-[9px]">
              <div><strong>Local:</strong> {instrucaoLocal || "________________"}</div>
              <div><strong>Disciplina:</strong> {instrucaoDisciplina || "________________"}</div>
            </div>
            <div className="flex items-center gap-4 text-[9px] mt-2">
              <span><strong>Externa?</strong></span>
              <span>[ {instrucaoExterna ? "X" : " "} ] SIM</span>
              <span>[ {!instrucaoExterna ? "X" : " "} ] NÃO</span>
            </div>
          </div>
        </div>

        {/* Descriptions / Details of changes (Page 2 layout elements inside print view) */}
        <div className="page-break-before border border-black p-2 mt-4">
          <h5 className="font-bold uppercase border-b border-black pb-1 mb-2 text-center">Descrição das Alterações</h5>
          <div className="space-y-1">
            {students.filter(s => (studentStatuses[s.id]?.status !== "pronto" || studentStatuses[s.id]?.observacao)).map((student, idx) => {
              const entry = studentStatuses[student.id];
              return (
                <div key={student.id} className="text-[10px] uppercase border-b border-dashed border-gray-300 pb-1">
                  <strong>{idx + 1}. Nº {student.numerica} - {student.nomeGuerra}:</strong> {conditionAbbrs[entry.status]} {entry.observacao ? ` - ${entry.observacao}` : ""}
                </div>
              );
            })}
            {!students.some(s => (studentStatuses[s.id]?.status !== "pronto" || studentStatuses[s.id]?.observacao)) && (
              <div className="text-center text-gray-500 italic p-4 text-[10px]">Sem alterações registradas.</div>
            )}
          </div>
        </div>

        {/* Signatures section matching PDF */}
        <div className="grid grid-cols-3 gap-6 text-center pt-12">
          <div className="flex flex-col items-center">
            <div className="w-40 border-b border-black"></div>
            <span className="text-[9px] font-bold uppercase mt-1">Chefe de Turma</span>
            <span className="text-[8px] text-gray-500 italic">{chefeTurma || "Assinatura"}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-40 border-b border-black"></div>
            <span className="text-[9px] font-bold uppercase mt-1">Subchefe de Turma</span>
            <span className="text-[8px] text-gray-500 italic">{subchefeTurma || "Assinatura"}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-40 border-b border-black"></div>
            <span className="text-[9px] font-bold uppercase mt-1">CMT de Pel</span>
            <span className="text-[8px] text-gray-500 italic">{cmtPel || "Assinatura"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
