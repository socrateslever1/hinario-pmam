import { getFoCodeDefinition } from "@shared/foCatalog";

export type StudentObservationType = "positive" | "negative";

export interface StudentObservationDraft {
  studentId: number;
  type: StudentObservationType;
  foCode: string;
  details: string;
}

export function buildStudentObservationRequest(draft: StudentObservationDraft) {
  if (!Number.isInteger(draft.studentId) || draft.studentId <= 0) {
    throw new Error("Selecione o aluno para a anotação.");
  }

  const definition = getFoCodeDefinition(draft.type, draft.foCode);
  if (!definition) {
    throw new Error("Selecione um código oficial do Manual do Aluno.");
  }

  const details = draft.details.trim();
  if (details.length < 5) {
    throw new Error("Descreva o fato observado com pelo menos cinco caracteres.");
  }

  return {
    studentId: draft.studentId,
    type: draft.type,
    foCode: definition.code,
    note: `[${definition.code}] ${definition.label} - Relato: ${details}`,
  };
}
