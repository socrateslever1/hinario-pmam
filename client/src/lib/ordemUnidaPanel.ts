export type OrdemUnidaItemType = "corneta" | "dobrado" | "voz";

export type OrdemUnidaPanelItem = {
  id: string;
  title: string;
  type: OrdemUnidaItemType;
  subtitle?: string;
};

export type OrdemUnidaSessionConfig = {
  name: string;
  itemIds: string[];
  customItems: OrdemUnidaPanelItem[];
  overrides: Record<string, Pick<OrdemUnidaPanelItem, "title" | "subtitle">>;
  currentItemId: string | null;
};

const cornetas: OrdemUnidaPanelItem[] = [
  "A Vontade", "Acelerado", "Ajudante Geral", "Alto", "Alvorada",
  "Apresentar Arma", "Avançar ao Rancho", "Bandeira Nacional", "Batalhão", "Bombeiro",
  "Cavalaria", "Cessar o À Vontade", "Chefe Estado Maior", "Comandante de Batalhão", "Comandante de Companhia", "Comandante Geral",
  "Cobrir", "Companhia", "Contingente", "Cruzar Arma", "Descansar",
  "Descansar Arma", "Direita Volver", "Em Continência", "Em Direção à Direita", "Em Direção à Esquerda",
  "Escola", "Esquerda Volver", "Firme", "Governador", "Granadeira",
  "Início Expediente", "Inspeções Policiais", "Marcar Passo", "Marcha Batida", "Meia Volta Volver",
  "Oficial Superior", "Olhar à Direita", "Olhar em Frente", "Ombro Arma", "Ordem",
  "Ordinário Marche", "Para Prontidão", "Pelotão", "Polícia Militar", "Presidente",
  "Reunir", "Revista do Recolher", "Sentido", "Silêncio", "Término Expediente", "Última Forma",
].map((title) => ({
  id: `corneta-${title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`,
  title,
  type: "corneta" as const,
}));

export const DOBRADOS: OrdemUnidaPanelItem[] = [
  { id: "dobrado-cavalaria", title: "Cavalaria", subtitle: "Dobrado / marcha", type: "dobrado" },
  { id: "dobrado-granadeira", title: "Granadeira", subtitle: "Dobrado / marcha", type: "dobrado" },
  { id: "dobrado-inicio-expediente", title: "Início Expediente", subtitle: "Dobrado / marcha", type: "dobrado" },
  { id: "dobrado-ordinario-marche", title: "Ordinário Marche", subtitle: "Dobrado / marcha", type: "dobrado" },
];

export const VOZES_DE_COMANDO: OrdemUnidaPanelItem[] = [
  { id: "voz-sentido", title: "Sentido", subtitle: "Posição inicial", type: "voz" },
  { id: "voz-firme", title: "Firme", type: "voz" },
  { id: "voz-descansar", title: "Descansar", type: "voz" },
  { id: "voz-alto", title: "Alto", type: "voz" },
  { id: "voz-cobrir", title: "Cobrir", type: "voz" },
  { id: "voz-marcar-passo", title: "Marcar Passo", type: "voz" },
  { id: "voz-marcha-batida", title: "Marcha Batida", type: "voz" },
  { id: "voz-direita-volver", title: "Direita Volver", type: "voz" },
  { id: "voz-esquerda-volver", title: "Esquerda Volver", type: "voz" },
  { id: "voz-meia-volta-volver", title: "Meia Volta Volver", type: "voz" },
  { id: "voz-em-direcao-a-direita", title: "Em Direção à Direita", type: "voz" },
  { id: "voz-em-direcao-a-esquerda", title: "Em Direção à Esquerda", type: "voz" },
  { id: "voz-olhar-a-direita", title: "Olhar à Direita", type: "voz" },
  { id: "voz-olhar-em-frente", title: "Olhar em Frente", type: "voz" },
  { id: "voz-apresentar-arma", title: "Apresentar Arma", type: "voz" },
  { id: "voz-ombro-arma", title: "Ombro Arma", type: "voz" },
  { id: "voz-cruzar-arma", title: "Cruzar Arma", type: "voz" },
  { id: "voz-descansar-arma", title: "Descansar Arma", type: "voz" },
  { id: "voz-cessar-o-a-vontade", title: "Cessar o À Vontade", subtitle: "Retorno a Descansar", type: "voz" },
];

export const TOQUES_DE_CORNETA = cornetas;
export const TODOS_OS_ITENS_DE_ORDEM_UNIDA = [...TOQUES_DE_CORNETA, ...DOBRADOS, ...VOZES_DE_COMANDO];

export function sanitizeSessionItemIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const validIds = new Set(TODOS_OS_ITENS_DE_ORDEM_UNIDA.map((item) => item.id));
  const ids = value.filter((id): id is string => typeof id === "string" && validIds.has(id));
  return Array.from(new Set(ids));
}

export function getSessionItems(ids: string[]): OrdemUnidaPanelItem[] {
  const itemById = new Map(TODOS_OS_ITENS_DE_ORDEM_UNIDA.map((item) => [item.id, item]));
  return ids.map((id) => itemById.get(id)).filter((item): item is OrdemUnidaPanelItem => Boolean(item));
}

export function createDefaultSessionConfig(): OrdemUnidaSessionConfig {
  return {
    name: "Sessão atual",
    itemIds: [],
    customItems: [],
    overrides: {},
    currentItemId: null,
  };
}

function sanitizeText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isItemType(value: unknown): value is OrdemUnidaItemType {
  return value === "corneta" || value === "dobrado" || value === "voz";
}

export function sanitizeSessionConfig(value: unknown): OrdemUnidaSessionConfig {
  const fallback = createDefaultSessionConfig();
  if (Array.isArray(value)) {
    return { ...fallback, itemIds: sanitizeSessionItemIds(value) };
  }
  if (!value || typeof value !== "object") return fallback;

  const raw = value as Partial<OrdemUnidaSessionConfig>;
  const customItems = Array.isArray(raw.customItems)
    ? raw.customItems.reduce<OrdemUnidaPanelItem[]>((items, candidate) => {
        if (!candidate || typeof candidate !== "object") return items;
        const item = candidate as Partial<OrdemUnidaPanelItem>;
        const title = sanitizeText(item.title, 80);
        const subtitle = sanitizeText(item.subtitle, 120);
        if (!item.id?.startsWith("custom-") || !title || !isItemType(item.type) || items.some((existing) => existing.id === item.id)) {
          return items;
        }
        items.push({ id: item.id, title, type: item.type, ...(subtitle ? { subtitle } : {}) });
        return items;
      }, [])
    : [];
  const knownIds = new Set([...TODOS_OS_ITENS_DE_ORDEM_UNIDA, ...customItems].map((item) => item.id));
  const itemIds = Array.isArray(raw.itemIds)
    ? Array.from(new Set(raw.itemIds.filter((id): id is string => typeof id === "string" && knownIds.has(id))))
    : [];
  const overrides = Object.entries(raw.overrides ?? {}).reduce<OrdemUnidaSessionConfig["overrides"]>((result, [id, candidate]) => {
    if (!knownIds.has(id) || !candidate || typeof candidate !== "object") return result;
    const override = candidate as Partial<Pick<OrdemUnidaPanelItem, "title" | "subtitle">>;
    const title = sanitizeText(override.title, 80);
    const subtitle = sanitizeText(override.subtitle, 120);
    if (title) result[id] = { title, ...(subtitle ? { subtitle } : {}) };
    return result;
  }, {});
  const currentItemId = typeof raw.currentItemId === "string" && knownIds.has(raw.currentItemId)
    ? raw.currentItemId
    : null;

  return {
    name: sanitizeText(raw.name, 60) || fallback.name,
    itemIds,
    customItems,
    overrides,
    currentItemId,
  };
}

export function getConfiguredItems(config: OrdemUnidaSessionConfig) {
  const baseById = new Map([...TODOS_OS_ITENS_DE_ORDEM_UNIDA, ...config.customItems].map((item) => [item.id, item]));
  return Array.from(baseById.values()).map((item) => ({ ...item, ...config.overrides[item.id] }));
}

export function getConfiguredSessionItems(config: OrdemUnidaSessionConfig) {
  const itemById = new Map(getConfiguredItems(config).map((item) => [item.id, item]));
  return config.itemIds.map((id) => itemById.get(id)).filter((item): item is OrdemUnidaPanelItem => Boolean(item));
}
