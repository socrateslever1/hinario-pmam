import { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { getStudentSession } from "@/lib/studentSession";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, LayoutGrid, Plus, Minus, User, Laptop } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

export default function ClassroomMap() {
  const studentSession = getStudentSession();
  const { data: access } = trpc.serviceScale.myAccess.useQuery();

  const [companhia, setCompanhia] = useState("4");
  const [peloton, setPeloton] = useState("1");
  const [capacity, setCapacity] = useState(51);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("none");

  // Sync initial scope from logged-in session or assignment
  useEffect(() => {
    if (studentSession) {
      setCompanhia(String(studentSession.companhia));
      setPeloton(String(studentSession.peloton));
    } else if (access?.scope) {
      if (access.scope.companhia) setCompanhia(String(access.scope.companhia));
      if (access.scope.peloton) setPeloton(String(access.scope.peloton));
    }
  }, [access, studentSession]);

  const selectedCompanhia = Number(companhia);
  const selectedPeloton = Number(peloton);

  // Queries
  const classroomQuery = trpc.serviceScale.getClassroom.useQuery(
    { companhia: selectedCompanhia, peloton: selectedPeloton },
    { enabled: Boolean(selectedCompanhia && selectedPeloton) }
  );

  const capacityQuery = trpc.serviceScale.getPlatoonCapacity.useQuery(
    { companhia: selectedCompanhia, peloton: selectedPeloton },
    { enabled: Boolean(selectedCompanhia && selectedPeloton) }
  );

  // Sync capacity from DB
  useEffect(() => {
    if (capacityQuery.data?.capacity) {
      setCapacity(capacityQuery.data.capacity);
    }
  }, [capacityQuery.data]);

  // Mutations
  const updateStudentDesk = trpc.serviceScale.updateStudentDeskNumber.useMutation({
    onSuccess: async () => {
      toast.success("Carteira atualizada com sucesso");
      setAssignmentModalOpen(false);
      await classroomQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateCapacity = trpc.serviceScale.updatePlatoonCapacity.useMutation({
    onSuccess: async () => {
      toast.success("Capacidade do pelotão atualizada");
      await capacityQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const students = classroomQuery.data?.students ?? [];
  
  // Is current user xerife/admin for this scope?
  const isXerife = access?.isMaster || 
    (access?.assignment && 
     (access.assignment.level === "principal" ||
      (access.assignment.level === "companhia" && access.assignment.companhia === selectedCompanhia) ||
      (access.assignment.level === "pelotao" && 
       access.assignment.companhia === selectedCompanhia && 
       access.assignment.peloton === selectedPeloton)));

  // Generate numeric sequence for seats based on company/peloton
  // 4ª Cia 1º Pel -> starts at 4101
  // 4ª Cia 2º Pel -> starts at 4201
  const startNumber = selectedCompanhia * 1000 + selectedPeloton * 100;
  const seats = Array.from({ length: capacity }, (_, i) => startNumber + i + 1);

  // Handle seat click
  const handleSeatClick = (seatNumber: number) => {
    if (!isXerife) return;
    setSelectedSeat(seatNumber);
    const occupant = students.find((s: any) => s.deskNumber === seatNumber);
    setSelectedStudentId(occupant ? String(occupant.id) : "none");
    setAssignmentModalOpen(true);
  };

  const handleAssignSeat = () => {
    if (!selectedSeat) return;
    updateStudentDesk.mutate({
      studentId: Number(selectedStudentId),
      deskNumber: selectedStudentId === "none" ? null : selectedSeat,
    });
  };

  const handleAdjustCapacity = (amount: number) => {
    const nextCapacity = capacity + amount;
    if (nextCapacity < 10 || nextCapacity > 120) return;
    setCapacity(nextCapacity);
    updateCapacity.mutate({
      companhia: selectedCompanhia,
      peloton: selectedPeloton,
      capacity: nextCapacity,
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f2e8] text-foreground dark:bg-[#0c0c0e]">
      <Navbar />

      <main className="container mx-auto px-4 py-8 pb-24 max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href={studentSession ? "/notas-do-curso" : "/xerife"}>
              <Button variant="ghost" size="icon" className="rounded-full border border-border bg-white dark:bg-zinc-900">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-6 w-6 text-[#c4a84b]" />
              <h1 className="text-2xl font-black uppercase tracking-wider text-[#1a3a2a] dark:text-[#c4a84b]">
                Sala de Aula
              </h1>
            </div>
          </div>

          {/* Scope selection */}
          <div className="flex items-center gap-2">
            <Select 
              value={companhia} 
              onValueChange={setCompanhia} 
              disabled={Boolean(studentSession || (access?.assignment?.level && access.assignment.level !== "principal"))}
            >
              <SelectTrigger className="w-[140px] bg-white dark:bg-zinc-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((item) => (
                  <SelectItem key={item} value={String(item)}>
                    {item}ª Companhia
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={peloton} 
              onValueChange={setPeloton} 
              disabled={Boolean(studentSession || (access?.assignment?.level === "pelotao"))}
            >
              <SelectTrigger className="w-[120px] bg-white dark:bg-zinc-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2].map((item) => (
                  <SelectItem key={item} value={String(item)}>
                    {item}º Pelotão
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Capacity adjust (Xerife only) */}
        {isXerife && (
          <Card className="mb-6 border-border/50 bg-white dark:bg-zinc-900">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-bold text-foreground">Painel do Xerife</p>
                <p className="text-xs text-muted-foreground">Adicione ou remova carteiras na sala de aula.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleAdjustCapacity(-1)}
                  disabled={capacity <= 10 || updateCapacity.isPending}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-sm font-bold min-w-[80px] text-center">
                  {capacity} Carteiras
                </span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleAdjustCapacity(1)}
                  disabled={capacity >= 120 || updateCapacity.isPending}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Visual Map */}
        <Card className="border-border/50 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">
          <CardContent className="p-6">
            {/* Front of Classroom indicator */}
            <div className="mb-10 flex flex-col items-center justify-center border-b pb-6 dark:border-zinc-800">
              <div className="flex items-center gap-2 rounded-lg bg-zinc-100 px-8 py-3 dark:bg-zinc-800 border border-border/50 shadow-inner w-full max-w-md justify-center">
                <Laptop className="h-4 w-4 text-[#c4a84b]" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                  QUADRO / MESA DO INSTRUTOR (FRENTE)
                </span>
              </div>
            </div>

            {/* Grid of Seats */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 md:gap-6">
              {seats.map((seatNumber) => {
                const occupant = students.find((s: any) => s.deskNumber === seatNumber);
                const isOccupied = !!occupant;

                return (
                  <div
                    key={seatNumber}
                    onClick={() => handleSeatClick(seatNumber)}
                    className={`relative flex flex-col items-center justify-between rounded-xl border p-3 text-center transition-all duration-200 ${
                      isOccupied
                        ? "bg-[#1a3a2a]/5 border-[#1a3a2a]/20 dark:bg-green-950/20 dark:border-green-800/40 shadow-sm"
                        : "bg-zinc-50/50 border-dashed border-zinc-300 dark:bg-zinc-950/50 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700"
                    } ${isXerife ? "cursor-pointer hover:shadow-md hover:scale-[1.02]" : ""}`}
                    style={{ minHeight: "105px" }}
                  >
                    {/* Seat number tag */}
                    <div className="absolute top-2 left-2 flex items-center justify-center">
                      <span className="text-[10px] font-black text-muted-foreground/80 dark:text-zinc-500">
                        {seatNumber}
                      </span>
                    </div>

                    {isOccupied ? (
                      <div className="flex flex-col items-center justify-center h-full w-full pt-4">
                        {occupant.fotoUrl ? (
                          <img
                            src={occupant.fotoUrl}
                            alt={occupant.nomeGuerra}
                            className="h-10 w-10 rounded-full object-cover border-2 border-[#c4a84b] shadow-sm mb-2"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-[#c4a84b]/10 flex items-center justify-center border-2 border-[#c4a84b] text-[#c4a84b] mb-2 font-bold text-xs">
                            {occupant.nomeGuerra.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-bold text-[#1a3a2a] dark:text-green-400 truncate w-full px-1">
                          {occupant.nomeGuerra}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          {occupant.numerica}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full w-full pt-4 text-muted-foreground/60 dark:text-zinc-600">
                        <User className="h-6 w-6 stroke-[1.5] mb-1 opacity-40" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">
                          Vazia
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Back of Classroom indicator */}
            <div className="mt-10 pt-6 border-t dark:border-zinc-800 text-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                FUNDO DA SALA
              </span>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Assignment Modal (Xerife only) */}
      <Dialog open={assignmentModalOpen} onOpenChange={setAssignmentModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white dark:bg-zinc-900 border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Ocupar Carteira {selectedSeat}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Selecione o aluno que ocupará esta cadeira na sala de aula.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="student-select" className="text-foreground">Aluno</Label>
            <Select 
              value={selectedStudentId} 
              onValueChange={setSelectedStudentId}
            >
              <SelectTrigger id="student-select" className="w-full bg-white dark:bg-zinc-800 mt-2">
                <SelectValue placeholder="Selecione o aluno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Desocupada / Vazia</SelectItem>
                {students.map((student: any) => (
                  <SelectItem key={student.id} value={String(student.id)}>
                    {student.numerica} - {student.nomeGuerra}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignmentModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-[#1a3a2a] text-white hover:bg-[#1a3a2a]/90" 
              onClick={handleAssignSeat}
              disabled={updateStudentDesk.isPending}
            >
              {updateStudentDesk.isPending ? "Salvando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
