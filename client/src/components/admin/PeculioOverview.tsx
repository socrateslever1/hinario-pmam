import { useState } from "react";
import { ArrowLeft, Check, ClipboardList, Lock, ShieldCheck, UnlockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PeculioTab } from "@/components/admin/PeculioTab";

type SelectedScope = {
  companhia: string;
  peloton: string;
} | null;

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function scopeLabel(companhia: number, peloton: number) {
  return `${companhia}ª Companhia / ${peloton}º Pelotão`;
}

export function PeculioOverview() {
  const utils = trpc.useUtils();
  const [date, setDate] = useState(getToday);
  const [selectedScope, setSelectedScope] = useState<SelectedScope>(null);

  const summariesQuery = trpc.peculio.list.useQuery({ date });

  const closePeculio = trpc.peculio.close.useMutation({
    onSuccess: async () => {
      toast.success("Pecúlio fechado e autenticado.");
      await utils.peculio.list.invalidate({ date });
    },
    onError: (error) => toast.error(error.message),
  });

  const releasePeculio = trpc.peculio.release.useMutation({
    onSuccess: async () => {
      toast.success("Pecúlio liberado para lançamento.");
      await utils.peculio.list.invalidate({ date });
    },
    onError: (error) => toast.error(error.message),
  });

  if (selectedScope) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedScope(null)}
            className="w-fit gap-2 bg-white font-bold dark:bg-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar aos Pecúlios
          </Button>
          <Badge className="w-fit bg-[#1a3a2a] text-white">
            {scopeLabel(Number(selectedScope.companhia), Number(selectedScope.peloton))}
          </Badge>
        </div>
        <PeculioTab
          companhia={selectedScope.companhia}
          setCompanhia={(value) => setSelectedScope((current) => current ? { ...current, companhia: value } : current)}
          peloton={selectedScope.peloton}
          setPeloton={(value) => setSelectedScope((current) => current ? { ...current, peloton: value } : current)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="border-border/50 bg-white shadow-md dark:bg-zinc-900">
        <CardHeader className="border-b bg-gradient-to-r from-[#1a3a2a]/5 via-transparent to-transparent pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-wider text-[#1a3a2a] dark:text-[#c4a84b]">
            <ClipboardList className="h-5 w-5 text-[#c4a84b]" />
            Pecúlios dos Pelotões
          </CardTitle>
          <CardDescription>
            Visão geral do Xerife Geral para fechar, liberar e lançar pecúlios por sala.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="max-w-xs">
            <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Data</label>
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {(summariesQuery.data ?? []).map((row: any) => {
              const isClosed = Boolean(row.closedAt);
              const isReleased = Boolean(row.lock?.isReleased);
              const lockedByTime = Boolean(row.lock?.isLocked);

              return (
                <Card key={`${row.companhia}-${row.peloton}`} className="border-border/60 bg-muted/10">
                  <CardContent className="space-y-4 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-black text-[#1a3a2a] dark:text-[#c4a84b]">
                          {scopeLabel(row.companhia, row.peloton)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {row.totalStudents} alunos | Entrada {row.entryTime || "05:00"}
                        </p>
                      </div>
                      <Badge
                        className={
                          isClosed
                            ? "w-fit bg-[#c4a84b] text-black"
                            : isReleased
                              ? "w-fit bg-amber-100 text-amber-800"
                              : lockedByTime
                                ? "w-fit bg-red-100 text-red-800"
                                : "w-fit bg-green-100 text-green-800"
                        }
                      >
                        {isClosed ? "Fechado" : isReleased ? "Liberado" : lockedByTime ? "Travado" : "Aberto"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-lg border bg-white p-2 dark:bg-zinc-950">
                        <p className="font-black text-lg text-red-600">{row.totalAbsences}</p>
                        <p className="text-muted-foreground">Faltas</p>
                      </div>
                      <div className="rounded-lg border bg-white p-2 dark:bg-zinc-950">
                        <p className="font-black text-lg text-amber-600">{row.totalLate}</p>
                        <p className="text-muted-foreground">Atrasos</p>
                      </div>
                      <div className="rounded-lg border bg-white p-2 dark:bg-zinc-950">
                        <p className="font-black text-lg text-[#1a3a2a] dark:text-green-400">{row.totalChanges}</p>
                        <p className="text-muted-foreground">Alterações</p>
                      </div>
                    </div>

                    {isClosed && (
                      <p className="rounded-lg bg-[#c4a84b]/10 p-2 text-xs text-muted-foreground">
                        Fechado por {row.closedByName || "usuário autenticado"} em {new Date(row.closedAt).toLocaleString("pt-BR")}
                      </p>
                    )}

                    <div className="grid gap-2 sm:grid-cols-3">
                      <Button
                        className="gap-2 bg-[#1a3a2a] text-white"
                        onClick={() => setSelectedScope({ companhia: String(row.companhia), peloton: String(row.peloton) })}
                      >
                        <ClipboardList className="h-4 w-4" />
                        Lançar
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => closePeculio.mutate({
                          companhia: row.companhia,
                          peloton: row.peloton,
                          date,
                          entryTime: row.entryTime || "05:00",
                        })}
                        disabled={isClosed || closePeculio.isPending}
                      >
                        {isClosed ? <Check className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                        Fechar
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 border-[#c4a84b]/40 text-[#1a3a2a]"
                        onClick={() => releasePeculio.mutate({
                          companhia: row.companhia,
                          peloton: row.peloton,
                          date,
                          reason: "Liberado pelo Xerife Geral para lançamento de pecúlio.",
                          hours: 12,
                        })}
                        disabled={releasePeculio.isPending}
                      >
                        {lockedByTime || isClosed ? <UnlockKeyhole className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        Liberar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {summariesQuery.isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">Carregando pecúlios...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
