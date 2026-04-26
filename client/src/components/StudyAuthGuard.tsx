import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { StudyStudent } from "@shared/types";
import { getStudyStudentNumberErrorMessage, isValidStudyStudentNumber } from "@shared/study";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Input } from "./ui/input";
import { ShieldAlert, LogIn, Lock } from "lucide-react";

type StudySession = {
  student: StudyStudent;
  accessToken: string;
};

type StudyAuthContextType = {
  session: StudySession | null;
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
  const [session, setSession] = useState<StudySession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [studentNumber, setStudentNumber] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loginMutation = trpc.study.login.useMutation({
    onSuccess: (data) => {
      setSession(data);
      localStorage.setItem("pmam_study_session", JSON.stringify(data));
      setError(null);
    },
    onError: (error) => {
      setError(error.message || "Erro ao acessar. Verifique seu número.");
    }
  });

  useEffect(() => {
    const savedSession = localStorage.getItem("pmam_study_session");
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession) as StudySession;
        if (parsed.student && parsed.accessToken) {
          setSession(parsed);
        }
      } catch (e) {
        localStorage.removeItem("pmam_study_session");
      }
    }
    setIsInitializing(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidStudyStudentNumber(studentNumber)) {
      setError(getStudyStudentNumberErrorMessage());
      return;
    }
    loginMutation.mutate({ studentNumber, displayName: displayName || undefined });
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem("pmam_study_session");
  };

  if (isInitializing) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c4a84b]"></div></div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-[#c4a84b] blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-[#1a3a2a] blur-[140px]" />
        </div>
        
        <Card className="w-full max-w-md border-border/60 relative z-10 shadow-2xl backdrop-blur-sm bg-background/90">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto bg-[#1a3a2a] p-4 rounded-full w-fit border border-[#c4a84b]/30">
              <Lock className="h-8 w-8 text-[#c4a84b]" />
            </div>
            <div>
              <CardTitle className="text-2xl" style={{ fontFamily: "Merriweather, serif" }}>Área Restrita</CardTitle>
              <CardDescription className="mt-2 text-base">
                O acesso aos materiais de estudo é exclusivo para alunos matriculados no CFAP.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="studentNumber" className="text-sm font-medium text-foreground">
                  Número de Acesso
                </label>
                <Input
                  id="studentNumber"
                  type="text"
                  placeholder="Ex: 1111 a 5251"
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                  className="bg-muted/50 border-border"
                  disabled={loginMutation.isPending}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="displayName" className="text-sm font-medium text-foreground">
                  Nome (Opcional)
                </label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Como você quer ser chamado"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-muted/50 border-border"
                  disabled={loginMutation.isPending}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-[#1a3a2a] hover:bg-[#10281d] text-white"
                disabled={loginMutation.isPending || !studentNumber.trim()}
              >
                {loginMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Acessar Estudos
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <StudyAuthContext.Provider value={{ session, logout }}>
      {children}
    </StudyAuthContext.Provider>
  );
}
