export type StudentSession = {
  id: number;
  numerica: string;
  nomeGuerra: string;
  companhia: number;
  peloton: number;
  sessionToken: string;
};

export const STUDENT_SESSION_CHANGED = "pmam-student-session-changed";

export function getStudentSession(): StudentSession | null {
  if (typeof window === "undefined") return null;

  const id = Number(window.sessionStorage.getItem("gradeStudentId") || "0");
  const numerica = window.sessionStorage.getItem("gradeStudentNumber") || "";
  const nomeGuerra = window.sessionStorage.getItem("gradeStudentName") || "";
  const companhia = Number(window.sessionStorage.getItem("gradeStudentCompany") || "0");
  const peloton = Number(window.sessionStorage.getItem("gradeStudentPeloton") || "0");
  const sessionToken = window.sessionStorage.getItem("gradeStudentToken") || "";

  if (!id || !numerica || !nomeGuerra || !companhia || !peloton || !sessionToken) return null;

  return {
    id,
    numerica,
    nomeGuerra,
    companhia,
    peloton,
    sessionToken,
  };
}

export function saveStudentSession(student: StudentSession) {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem("gradeStudentId", String(student.id));
  window.sessionStorage.setItem("gradeStudentNumber", student.numerica);
  window.sessionStorage.setItem("gradeStudentName", student.nomeGuerra);
  window.sessionStorage.setItem("gradeStudentCompany", String(student.companhia));
  window.sessionStorage.setItem("gradeStudentPeloton", String(student.peloton));
  window.sessionStorage.setItem("gradeStudentToken", student.sessionToken);
  window.dispatchEvent(new Event(STUDENT_SESSION_CHANGED));
}

export function clearStudentSession() {
  if (typeof window === "undefined") return;

  window.sessionStorage.removeItem("gradeStudentId");
  window.sessionStorage.removeItem("gradeStudentNumber");
  window.sessionStorage.removeItem("gradeStudentName");
  window.sessionStorage.removeItem("gradeStudentCompany");
  window.sessionStorage.removeItem("gradeStudentPeloton");
  window.sessionStorage.removeItem("gradeStudentToken");
  window.dispatchEvent(new Event(STUDENT_SESSION_CHANGED));
}
