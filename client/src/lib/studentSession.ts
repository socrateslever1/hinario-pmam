export type StudentSession = {
  id: number;
  numerica: string;
  nomeGuerra: string;
  companhia: number;
  peloton: number;
  sessionToken: string;
  expiresAt?: number; // Timestamp em ms
};

export const STUDENT_SESSION_CHANGED = "pmam-student-session-changed";

export function getStudentSession(): StudentSession | null {
  if (typeof window === "undefined") return null;

  const id = Number(window.localStorage.getItem("gradeStudentId") || "0");
  const numerica = window.localStorage.getItem("gradeStudentNumber") || "";
  const nomeGuerra = window.localStorage.getItem("gradeStudentName") || "";
  const companhia = Number(window.localStorage.getItem("gradeStudentCompany") || "0");
  const peloton = Number(window.localStorage.getItem("gradeStudentPeloton") || "0");
  const sessionToken = window.localStorage.getItem("gradeStudentToken") || "";
  const expiresAt = Number(window.localStorage.getItem("gradeStudentExpiry") || "0");

  if (!id || !numerica || !nomeGuerra || !sessionToken) return null;

  // Verificar se sessão expirou
  if (expiresAt && expiresAt < Date.now()) {
    clearStudentSession();
    return null;
  }

  return {
    id,
    numerica,
    nomeGuerra,
    companhia,
    peloton,
    sessionToken,
    expiresAt,
  };
}

export function saveStudentSession(student: StudentSession) {
  if (typeof window === "undefined") return;

  // Sessão expira em 30 dias
  const expiresAt = student.expiresAt || Date.now() + 30 * 24 * 60 * 60 * 1000;

  window.localStorage.setItem("gradeStudentId", String(student.id));
  window.localStorage.setItem("gradeStudentNumber", student.numerica);
  window.localStorage.setItem("gradeStudentName", student.nomeGuerra);
  window.localStorage.setItem("gradeStudentCompany", String(student.companhia));
  window.localStorage.setItem("gradeStudentPeloton", String(student.peloton));
  window.localStorage.setItem("gradeStudentToken", student.sessionToken);
  window.localStorage.setItem("gradeStudentExpiry", String(expiresAt));
  window.dispatchEvent(new Event(STUDENT_SESSION_CHANGED));
}

export function clearStudentSession() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem("gradeStudentId");
  window.localStorage.removeItem("gradeStudentNumber");
  window.localStorage.removeItem("gradeStudentName");
  window.localStorage.removeItem("gradeStudentCompany");
  window.localStorage.removeItem("gradeStudentPeloton");
  window.localStorage.removeItem("gradeStudentToken");
  window.localStorage.removeItem("gradeStudentExpiry");
  window.dispatchEvent(new Event(STUDENT_SESSION_CHANGED));
}

