import { studyModules } from "@/content/studyModules";

export type StudyLibraryItem = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  sourceTitle: string;
  sourceFileName: string;
  theme: string;
  pages: number;
  difficulty: "base" | "intermediario" | "intensivo";
  pdfUrl: string | null;
  quickFacts: string[];
  category: "manual" | "regulamento";
};

export const STUDY_PDF_PATHS: Record<string, string> = {
  "manual-cfap": "https://d2xsxph8kpxj0f.cloudfront.net/310419663028422427/oYQqDtLooPR5vbQ65ChDb9/manual-do-aluno_placeholder.pdf",
  "estatuto-pmam": "https://d2xsxph8kpxj0f.cloudfront.net/310419663028422427/oYQqDtLooPR5vbQ65ChDb9/estatuto-policiais-militares_f512966e.pdf",
  "rupmam-uniformes": "https://d2xsxph8kpxj0f.cloudfront.net/310419663028422427/oYQqDtLooPR5vbQ65ChDb9/rupmam_257e3301.pdf",
  "rcont-continencias": "https://d2xsxph8kpxj0f.cloudfront.net/310419663028422427/oYQqDtLooPR5vbQ65ChDb9/rcont_24d45246.pdf",
  "rdpmam-disciplina": "https://d2xsxph8kpxj0f.cloudfront.net/310419663028422427/oYQqDtLooPR5vbQ65ChDb9/rdpmam_a7f10966.pdf",
  "risg-servicos-gerais": "https://d2xsxph8kpxj0f.cloudfront.net/310419663028422427/oYQqDtLooPR5vbQ65ChDb9/risg_03c43c18.pdf",
};

export const studyLibraryItems: StudyLibraryItem[] = studyModules.map((module) => ({
  slug: module.slug,
  title: module.title,
  shortTitle: module.shortTitle,
  description: module.description,
  sourceTitle: module.sourceTitle,
  sourceFileName: module.sourceFileName,
  theme: module.theme,
  pages: module.pages,
  difficulty: module.difficulty,
  pdfUrl: STUDY_PDF_PATHS[module.slug] ?? null,
  quickFacts: module.quickFacts,
  category: module.studyMode === "manual" ? "manual" : "regulamento",
}));

export function getStudyLibraryItem(slug: string) {
  return studyLibraryItems.find((item) => item.slug === slug) ?? null;
}

export const ordemUnidaManualHighlights = [
  "O Manual do Aluno cita expressamente o C 22-5 como Manual de Ordem Unida usado na formação.",
  "A rotina militar descrita no manual liga ordem unida, disciplina, continências e postura institucional.",
  "Nos materiais já existentes, a base de ordem unida aparece como parte da formação prática e do padrão de conduta do aluno.",
];
