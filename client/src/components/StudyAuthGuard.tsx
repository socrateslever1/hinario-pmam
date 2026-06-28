import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Link } from "wouter";
import { Lock, LogIn } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getStudentSession, type StudentSession } from "@/lib/studentSession";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

type StudySession = {
  student: {
    id: number;
    studentNumber: string;
    displayName: string | null;
    createdAt?: unknown;
    updatedAt?: unknown;
    lastActiveAt?: unknown;
  };
  accessToken: string;
};

type StudyAuthContextType = {
  session: StudySession | null;
  student: StudentSession | null;
  logout: () => void;
};

const StudyAuthContext = createContext<StudyAuthContextType | undefined>(undefined);

export function useStudyAuth() {
  const context = useContext(StudyAuthContext);
  if (context === undefined) {
    throw new Error("useStudyAuth must be used within a StudyAuthGuard");
  }
  return context;
}

export default function StudyAuthGuard({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<StudentSession | null>(() => getStudentSession());
  const [session, setSession] = useState<StudySession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const buildLocalStudySession = (currentStudent: StudentSession): StudySession => ({
    student: {
      id: currentStudent.id,
      studentNumber: currentStudent.numerica,
      displayName: currentStudent.nomeGuerra,
    },
    accessToken: currentStudent.sessionToken,
  });

  const ensureStudent = trpc.study.ensureStudent.useMutation({
    onSuccess: (data) => {
      setSession(data as StudySession);
      setIsInitializing(false);
    },
    onError: (error) => {
      const currentStudent = getStudentSession();
      const isOffline =
        typeof navigator !== "undefined" &&
        (!navigator.onLine || error.message.includes("Offline") || error.message.includes("Failed to fetch"));

      if (currentStudent && isOffline) {
        setStudent(currentStudent);
        setSession(buildLocalStudySession(currentStudent));
      }
      setIsInitializing(false);
    },
  });

  useEffect(() => {
    const currentStudent = getStudentSession();
    setStudent(currentStudent);

    if (!currentStudent) {
      setIsInitializing(false);
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSession(buildLocalStudySession(currentStudent));
      setIsInitializing(false);
      return;
    }

    ensureStudent.mutate({
      studentId: currentStudent.id,
      sessionToken: currentStudent.sessionToken,
      studentNumber: currentStudent.numerica,
      displayName: currentStudent.nomeGuerra,
    });
  }, []);

  const logout = () => {
    setSession(null);
  };

  if (isInitializing || ensureStudent.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#c4a84b]" />
      </div>
    );
  }

  if (!student || !session) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-[#c4a84b] blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-[#1a3a2a] blur-[140px]" />
        </div>

        <Card className="relative z-10 w-full max-w-md border-border/60 bg-background/90 shadow-2xl backdrop-blur-sm">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-fit rounded-full border border-[#c4a84b]/30 bg-[#1a3a2a] p-4">
              <Lock className="h-8 w-8 text-[#c4a84b]" />
            </div>
            <div>
              <CardTitle className="text-2xl" style={{ fontFamily: "Merriweather, serif" }}>
                Área Restrita do Aluno
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                Entre com sua numérica e senha para acessar o Centro de Estudos.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/entrar">
              <Button className="w-full bg-[#1a3a2a] text-white hover:bg-[#10281d]">
                <LogIn className="mr-2 h-4 w-4" />
                Acesso do Aluno
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <StudyAuthContext.Provider value={{ session, student, logout }}>
      {children}
    </StudyAuthContext.Provider>
  );
}
