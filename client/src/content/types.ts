export type StudySection = {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
  reference: string;
  checkpoint: string;
};

export type StudyQuestion = {
  id: string;
  type: "single" | "multiple" | "boolean" | "text";
  prompt: string;
  reference: string;
  explanation: string;
  options?: Array<{ id: string; label: string }>;
  correctOptionIds?: string[];
  acceptedAnswers?: string[];
};

export type StudyModule = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  sourceTitle: string;
  sourceFileName: string;
  textPath: string;
  pages: number;
  estimatedMinutes: number;
  difficulty: "base" | "intermediario" | "intensivo";
  theme: string;
  objectives: string[];
  quickFacts: string[];
  sections: StudySection[];
  questions: StudyQuestion[];
  studyMode: "manual" | "regulation";
  studyUnitTarget?: number;
  questionTarget?: number;
};

export const section = (
  id: string,
  title: string,
  summary: string,
  bullets: string[],
  reference: string,
  checkpoint: string
): StudySection => ({ id, title, summary, bullets, reference, checkpoint });

export const question = (
  id: string,
  type: StudyQuestion["type"],
  prompt: string,
  reference: string,
  explanation: string,
  extras: Partial<StudyQuestion> = {}
): StudyQuestion => ({ id, type, prompt, reference, explanation, ...extras });
