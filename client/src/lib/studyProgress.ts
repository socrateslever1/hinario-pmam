import type { StudyModule, StudyQuestion } from "@/content/studyModules";

export type StoredAnswer = string | string[] | null;

export type ModuleProgress = {
  completedSectionIds: string[];
  answers: Record<string, StoredAnswer>;
  lastScore: number | null;
  bestScore: number | null;
  lastSubmittedAt: string | null;
};

export type StudentStudyStore = Record<string, ModuleProgress>;
export type StudyProgressStore = Record<string, StudentStudyStore>;

export const createEmptyModuleProgress = (): ModuleProgress => ({
  completedSectionIds: [],
  answers: {},
  lastScore: null,
  bestScore: null,
  lastSubmittedAt: null,
});

export function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function isQuestionCorrect(question: StudyQuestion, answer: StoredAnswer) {
  if (!answer) return false;

  if (question.type === "text") {
    const normalized = normalizeAnswer(String(answer));
    return (question.acceptedAnswers ?? []).some((candidate) => normalizeAnswer(candidate) === normalized);
  }

  if (question.type === "multiple") {
    const selected = Array.isArray(answer) ? [...answer].sort() : [];
    const expected = [...(question.correctOptionIds ?? [])].sort();
    return selected.length === expected.length && selected.every((value, index) => value === expected[index]);
  }

  return question.correctOptionIds?.includes(String(answer)) ?? false;
}

export function calculateQuizScore(module: StudyModule, answers: Record<string, StoredAnswer>) {
  const total = module.questions.length;
  const correct = module.questions.filter((question) => isQuestionCorrect(question, answers[question.id] ?? null)).length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { total, correct, percentage };
}

export function getAnsweredCount(module: StudyModule, answers: Record<string, StoredAnswer>) {
  return module.questions.filter((question) => {
    const answer = answers[question.id];
    if (Array.isArray(answer)) return answer.length > 0;
    return Boolean(answer && String(answer).trim().length > 0);
  }).length;
}

export function getStudyCompletion(module: StudyModule, progress: ModuleProgress, studyItemCountOverride?: number) {
  const sectionCount = studyItemCountOverride ?? module.studyUnitTarget ?? module.sections.length;
  const studied = Math.min(progress.completedSectionIds.length, sectionCount);
  const studyPercent = sectionCount > 0 ? Math.round((studied / sectionCount) * 100) : 0;
  const quizPercent = progress.lastScore ?? 0;
  const overallPercent = Math.round(studyPercent * 0.65 + quizPercent * 0.35);

  return {
    studied,
    sectionCount,
    studyPercent,
    quizPercent,
    overallPercent,
  };
}
