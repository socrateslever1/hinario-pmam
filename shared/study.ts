export const STUDY_STUDENT_NUMBER_MIN = 1111;
export const STUDY_STUDENT_NUMBER_MAX = 5251;

export function normalizeStudyStudentNumber(value: string) {
  return value.trim().replace(/\s+/g, "");
}

export function isValidStudyStudentNumber(value: string) {
  const normalized = normalizeStudyStudentNumber(value);
  if (!/^\d{4}$/.test(normalized)) return false;

  const numericValue = Number(normalized);
  return numericValue >= STUDY_STUDENT_NUMBER_MIN && numericValue <= STUDY_STUDENT_NUMBER_MAX;
}

export function getStudyStudentNumberErrorMessage() {
  return `Informe um numero de aluno valido entre ${STUDY_STUDENT_NUMBER_MIN} e ${STUDY_STUDENT_NUMBER_MAX}.`;
}
