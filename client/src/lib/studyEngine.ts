import type { StudyModule, StudyQuestion } from "@/content/studyModules";

export type StudyUnit = {
  id: string;
  kind: "article" | "topic";
  reference: string;
  title: string;
  summary: string;
  simpleExplanation: string;
  originalText: string;
  keywords: string[];
};

const STOPWORDS = new Set([
  "a",
  "ao",
  "aos",
  "aquela",
  "aquelas",
  "aquele",
  "aqueles",
  "as",
  "até",
  "com",
  "como",
  "da",
  "das",
  "de",
  "dela",
  "dele",
  "deles",
  "depois",
  "do",
  "dos",
  "e",
  "é",
  "em",
  "entre",
  "essa",
  "essas",
  "esse",
  "esses",
  "esta",
  "está",
  "estao",
  "estas",
  "este",
  "estes",
  "foi",
  "já",
  "la",
  "lhe",
  "mais",
  "mas",
  "na",
  "nas",
  "não",
  "nem",
  "no",
  "nos",
  "o",
  "os",
  "ou",
  "para",
  "pela",
  "pelas",
  "pelo",
  "pelos",
  "por",
  "que",
  "se",
  "sem",
  "ser",
  "seu",
  "seus",
  "sua",
  "suas",
  "também",
  "tem",
  "ter",
  "um",
  "uma",
  "uns",
  "umas",
]);

const SIMPLE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\btem por finalidade\b/gi, "serve para"],
  [/\btem a finalidade de\b/gi, "serve para"],
  [/\bprescreve\b/gi, "define"],
  [/\bregula\b/gi, "organiza"],
  [/\bestabelece\b/gi, "define"],
  [/\bcompete ao\b/gi, "cabe ao"],
  [/\bcompete à\b/gi, "cabe à"],
  [/\bincumbe\b/gi, "cabe"],
  [/\bé vedado\b/gi, "é proibido"],
  [/\bserá\b/gi, "deve ser"],
  [/\bserão\b/gi, "devem ser"],
  [/\bdeverá\b/gi, "deve"],
  [/\bdeverão\b/gi, "devem"],
  [/\bfica aprovado\b/gi, "aprova"],
  [/\bficam aprovados\b/gi, "aprovam"],
  [/\bsubordina-se\b/gi, "fica subordinada a"],
  [/\bsubordinam-se\b/gi, "ficam subordinados a"],
  [/\bobservadas\b/gi, "respeitando"],
  [/\bobservado\b/gi, "respeitando"],
  [/\bressalvada\b/gi, "respeitando"],
  [/\bressalvado\b/gi, "respeitando"],
];

function stripPageNoise(raw: string) {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/gim, "")
    .replace(/^\s*\d+\s*$/gm, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function isLikelyHeading(line: string) {
  const text = line.trim();
  if (!text || text.length < 4 || text.length > 90) return false;
  if (/^art\.?/i.test(text)) return false;
  if (/\d{3,}/.test(text)) return false;
  if (/[.;!?]$/.test(text)) return false;
  if (/^\d/.test(text)) return false;
  if (/^\w+\s+\d/.test(text)) return false;
  if (/^(GOVERNO|Manaus|Manual do Aluno|foto|MENSAGEM|NOME DO COMANDANTE|P O L Í C I A)/i.test(text)) return false;
  if (/^TEMPO\s*\(h\)/i.test(text)) return false;
  if (/^(06:|07:|08:|09:|10:|11:|13:|14:|15:|16:|17:)/.test(text)) return false;

  const letters = Array.from(text).filter((char) => /[A-Za-zÀ-ÿ]/.test(char));
  if (letters.length < 3) return false;

  const uppercaseRatio = letters.filter((char) => char === char.toUpperCase()).length / letters.length;
  return uppercaseRatio > 0.72 || /^(Da|Das|Do|Dos|Anexo|Introdução|Finalidade|Aspectos|Estrutura|Regulamentos|Hierarquia|Frequência|Comportamento|Desligamento|Oração|Referência)/i.test(text);
}

function reflowParagraph(paragraph: string) {
  const lines = paragraph
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return "";

  const isListBlock = lines.every((line) => /^([IVXLCDM]+[\s.-]|[a-z]\)|\d+[\s.-]|[•\-])/i.test(line));
  if (isListBlock) return lines.join("\n");

  return lines.join(" ").replace(/\s+([,.;:!?])/g, "$1");
}

function buildReadableText(raw: string) {
  return stripPageNoise(raw)
    .split(/\n{2,}/)
    .map(reflowParagraph)
    .filter(Boolean)
    .join("\n\n");
}

function takeFirstSentence(text: string) {
  const clean = normalizeWhitespace(text);
  const parts = clean.split(/(?<=[.;!?])\s+/).filter(Boolean);
  return parts[0] ?? clean;
}

function simplifySentence(text: string) {
  let simple = normalizeWhitespace(text);
  for (const [pattern, replacement] of SIMPLE_REPLACEMENTS) {
    simple = simple.replace(pattern, replacement);
  }
  return simple;
}

function summarizeText(text: string, maxLength = 180) {
  const sentence = simplifySentence(takeFirstSentence(text));
  if (sentence.length <= maxLength) return sentence;
  return `${sentence.slice(0, maxLength - 1).trimEnd()}…`;
}

function cleanKeywordToken(token: string) {
  return token
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function extractKeywords(text: string, limit = 4) {
  const counts = new Map<string, number>();
  for (const rawToken of text.match(/[A-Za-zÀ-ÿ]{4,}/g) ?? []) {
    const token = cleanKeywordToken(rawToken);
    if (STOPWORDS.has(token)) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([token]) => token);
}

function titleFromSummary(reference: string, summary: string) {
  const trimmed = summary.replace(/\.$/, "");
  const shortened = trimmed.length > 86 ? `${trimmed.slice(0, 85).trimEnd()}…` : trimmed;
  return `${reference} · ${shortened}`;
}

function createSimpleExplanation(reference: string, text: string, keywords: string[]) {
  const sentence = summarizeText(text, 210);
  const base = sentence ? sentence.charAt(0).toLowerCase() + sentence.slice(1) : "resume uma orientação importante do documento";
  const keywordText = keywords.length ? ` Pontos-chave: ${keywords.join(", ")}.` : "";
  return `Em linguagem simples, ${reference.toLowerCase()} ${base}${keywordText}`;
}

function sanitizeReference(reference: string) {
  return reference
    .replace(/\s+/g, " ")
    .replace(/\s*[-–]\s*$/, "")
    .trim();
}

function extractArticleUnits(text: string) {
  const source = stripPageNoise(text);
  const articleRegex = /Art\.?\s*(\d+[A-Za-zº°.]*)\s*[-–.]?\s*([\s\S]*?)(?=(?:Art\.?\s*\d+[A-Za-zº°.]*)|$)/gi;
  const units: StudyUnit[] = [];
  let match: RegExpExecArray | null;

  while ((match = articleRegex.exec(source))) {
    const articleNumber = sanitizeReference(match[1]);
    const rawBody = match[2]?.trim();
    if (!rawBody) continue;

    const originalText = buildReadableText(rawBody);
    if (originalText.length < 30) continue;

    const reference = `Art. ${articleNumber}`;
    const keywords = extractKeywords(originalText);
    const summary = summarizeText(originalText);

    units.push({
      id: `art-${articleNumber.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      kind: "article",
      reference,
      title: titleFromSummary(reference, summary),
      summary,
      simpleExplanation: createSimpleExplanation(reference, originalText, keywords),
      originalText,
      keywords,
    });
  }

  return units;
}

function extractTopicUnits(text: string) {
  const source = stripPageNoise(text);
  const lines = source.split("\n");
  const headingIndexes: number[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (isLikelyHeading(lines[index] ?? "")) {
      headingIndexes.push(index);
    }
  }

  const units: StudyUnit[] = [];

  for (let index = 0; index < headingIndexes.length; index += 1) {
    const start = headingIndexes[index];
    const end = headingIndexes[index + 1] ?? lines.length;
    const heading = lines[start]?.trim();
    const bodyLines = lines.slice(start + 1, end).filter((line) => line.trim());
    const originalText = buildReadableText(bodyLines.join("\n"));

    if (!heading || originalText.length < 60) continue;

    const reference = heading;
    const keywords = extractKeywords(`${heading} ${originalText}`);
    const summary = summarizeText(originalText);

    units.push({
      id: `topic-${index + 1}`,
      kind: "topic",
      reference,
      title: titleFromSummary(reference, summary),
      summary,
      simpleExplanation: createSimpleExplanation(reference, originalText, keywords),
      originalText,
      keywords,
    });
  }

  return units;
}

function pickDistributedUnits(units: StudyUnit[], count: number) {
  if (units.length <= count) return units;
  if (count <= 1) return [units[0]];

  const selected: StudyUnit[] = [];
  for (let index = 0; index < count; index += 1) {
    const position = Math.floor((index * (units.length - 1)) / (count - 1));
    selected.push(units[position]);
  }
  return selected;
}

function buildSingleChoiceQuestion(unit: StudyUnit, pool: StudyUnit[], index: number): StudyQuestion {
  const others = pool.filter((candidate) => candidate.id !== unit.id);
  const start = others.length > 0 ? index % others.length : 0;
  const distractors = [...others.slice(start, start + 3), ...others.slice(0, Math.max(0, start + 3 - others.length))].slice(0, 3);

  const options = [
    { id: "correct", label: unit.summary },
    ...distractors.map((candidate, distractorIndex) => ({
      id: `d-${distractorIndex + 1}`,
      label: candidate.summary,
    })),
  ].sort((left, right) => left.id.localeCompare(right.id));

  return {
    id: `generated-single-${unit.id}`,
    type: "single",
    prompt: `Qual resumo combina melhor com ${unit.reference}?`,
    reference: unit.reference,
    explanation: unit.simpleExplanation,
    options,
    correctOptionIds: ["correct"],
  };
}

function buildBooleanQuestion(unit: StudyUnit, pool: StudyUnit[], index: number): StudyQuestion {
  const other = pool[(index + 1) % pool.length] ?? unit;
  const useCorrectStatement = index % 2 === 0;
  const subject = useCorrectStatement ? unit.summary : other.summary;

  return {
    id: `generated-boolean-${unit.id}`,
    type: "boolean",
    prompt: `${subject} corresponde a ${unit.reference}?`,
    reference: unit.reference,
    explanation: unit.simpleExplanation,
    options: [
      { id: "sim", label: "Sim" },
      { id: "nao", label: "Não" },
    ],
    correctOptionIds: [useCorrectStatement ? "sim" : "nao"],
  };
}

function buildMultipleChoiceQuestion(unit: StudyUnit, pool: StudyUnit[], index: number): StudyQuestion {
  const correctKeywords = unit.keywords.slice(0, 2);
  const distractorKeywords = pool
    .filter((candidate) => candidate.id !== unit.id)
    .flatMap((candidate) => candidate.keywords)
    .filter((keyword) => !correctKeywords.includes(keyword))
    .slice(index % 3, index % 3 + 2);

  const options = [...correctKeywords, ...distractorKeywords]
    .slice(0, 4)
    .map((keyword) => ({ id: keyword, label: keyword }));

  return {
    id: `generated-multiple-${unit.id}`,
    type: "multiple",
    prompt: `Selecione os termos mais ligados a ${unit.reference}.`,
    reference: unit.reference,
    explanation: unit.simpleExplanation,
    options,
    correctOptionIds: correctKeywords,
  };
}

function buildTextQuestion(unit: StudyUnit): StudyQuestion {
  const acceptedAnswers = unit.keywords.length ? unit.keywords : extractKeywords(unit.summary, 3);

  return {
    id: `generated-text-${unit.id}`,
    type: "text",
    prompt: `Em palavra curta, qual tema principal você associa a ${unit.reference}?`,
    reference: unit.reference,
    explanation: unit.simpleExplanation,
    acceptedAnswers,
  };
}

export function extractStudyUnits(module: StudyModule, text: string) {
  const units = module.studyMode === "manual" ? extractTopicUnits(text) : extractArticleUnits(text);
  return units.filter((unit, index, allUnits) => index === allUnits.findIndex((candidate) => candidate.reference === unit.reference));
}

export function buildQuestionBank(module: StudyModule, units: StudyUnit[]) {
  const target = Math.max(module.questionTarget ?? 100, module.questions.length);
  const bank = [...module.questions];

  if (!units.length || bank.length >= target) {
    return bank.slice(0, target);
  }

  const generatedNeeded = target - bank.length;
  const sampledUnits = pickDistributedUnits(units, Math.max(Math.ceil(generatedNeeded / 4), 12));

  sampledUnits.forEach((unit, index) => {
    if (bank.length < target) bank.push(buildSingleChoiceQuestion(unit, sampledUnits, index));
    if (bank.length < target) bank.push(buildBooleanQuestion(unit, sampledUnits, index));
    if (bank.length < target) bank.push(buildMultipleChoiceQuestion(unit, sampledUnits, index));
    if (bank.length < target) bank.push(buildTextQuestion(unit));
  });

  return bank.slice(0, target);
}

export function buildReadableStudyText(raw: string) {
  return buildReadableText(raw);
}
