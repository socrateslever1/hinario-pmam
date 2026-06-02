import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, ArrowLeft, Medal } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface StudentRanking {
  id: number;
  studentNumber: string;
  fullName?: string;
  averageGrade: number;
  disciplineCount: number;
}

export default function GradesRanking() {
  const [, setLocation] = useLocation();
  const [studentId, setStudentId] = useState<number | null>(null);
  const [ranking, setRanking] = useState<StudentRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserPosition, setCurrentUserPosition] = useState<number | null>(null);

  useEffect(() => {
    const id = sessionStorage.getItem('gradeStudentId');
    if (!id) {
      setLocation('/grades-login');
      return;
    }

    const studentIdNum = parseInt(id);
    setStudentId(studentIdNum);
    loadRanking();
  }, [setLocation]);

  const loadRanking = async () => {
    try {
      setIsLoading(true);
      // Simular dados de ranking - em produção, isso viria de uma API
      // Por enquanto, vamos mostrar uma mensagem
      setRanking([]);
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
      setIsLoading(false);
    }
  };

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Medal className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-orange-600" />;
      default:
        return <span className="text-sm font-semibold text-muted-foreground">{position}º</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a3a2a] to-white">
      <div className="container py-8">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/grades')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Ranking de Alunos
          </h1>
        </div>

        {isLoading ? (
          <Card className="bg-white/95">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Carregando ranking...</p>
            </CardContent>
          </Card>
        ) : ranking.length === 0 ? (
          <Card className="bg-white/95">
            <CardContent className="py-12 text-center">
              <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Nenhum aluno com notas cadastradas ainda.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Adicione disciplinas e notas para aparecer no ranking!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {ranking.map((student, index) => (
              <Card
                key={student.id}
                className={`bg-white/95 ${
                  student.id === studentId ? 'border-[#c4a84b] border-2' : ''
                }`}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a3a2a] text-white">
                        {getMedalIcon(index + 1)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {student.fullName || `Aluno ${student.studentNumber}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {student.disciplineCount} disciplina{student.disciplineCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#c4a84b]">
                        {student.averageGrade.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Média</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
