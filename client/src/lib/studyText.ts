import { buildReadableStudyText } from "@/lib/studyEngine";

export function cleanExtractedStudyText(raw: string) {
  return buildReadableStudyText(raw);
}

export function buildStudySnippets(text: string, query: string) {
  if (!query.trim()) return [] as string[];

  const normalized = query.trim().toLowerCase();
  const paragraphs = text.split(/\n{2,}/).filter(Boolean);
  const matches: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.toLowerCase().includes(normalized)) {
      const compact = paragraph.replace(/\s+/g, " ").trim();
      matches.push(compact.length > 220 ? `${compact.slice(0, 219).trimEnd()}…` : compact);
    }
    if (matches.length >= 8) break;
  }

  return matches;
}
