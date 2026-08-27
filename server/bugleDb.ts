import { query } from "./mysql";

export type BugleContentKind = "call" | "march";

let schemaPromise: Promise<void> | null = null;

const FALLBACK_SOURCE_URL = "https://cpmlondrina.com.br/alunos/toques-corneta/";

const fallbackCallRows = [
  ["À vontade", "01-a_vontade", "relaxed", "À vontade", "comandos"],
  ["Acelerado", "02-acelerado", "gauge", "Em acelerado", "marcha"],
  ["Ajudante-geral", "03-ajudante_geral", "user", null, "autoridades"],
  ["Alto", "04-alto", "hand", "Alto", "comandos"],
  ["Alvorada", "05-alvorada", "sun", null, "rotina"],
  ["Apresentar arma", "06-apresentar_arma", "shield", "Apresentar arma", "armas"],
  ["Avançar ao rancho", "07-avancar_ao_rancho", "utensils", "Avançar ao rancho", "rotina"],
  ["Bandeira Nacional", "08-bandeira_nacional", "flag", null, "cerimonial"],
  ["Batalhão", "09-batalhao", "users", null, "frações"],
  ["Bombeiro", "10-bombeiro", "flame", null, "institucional"],
  ["Cavalaria", "11-cavalaria", "shield", null, "institucional"],
  ["Cessar o À vontade", null, "relaxed", "Descansar", "comandos"],
  ["Chefe do Estado-Maior", "12-chefe_estado_maior", "user", null, "autoridades"],
  ["Comandante de batalhão", "13-cmt_batalhao", "user", null, "autoridades"],
  ["Comandante de companhia", "14-cmt_companhia", "user", null, "autoridades"],
  ["Comandante-geral", "15-cmt_geral", "user", null, "autoridades"],
  ["Cobrir", "16-cobrir", "users", "Cobrir", "comandos"],
  ["Companhia", "17-companhia", "users", null, "frações"],
  ["Contingente", "18-contingente", "users", null, "frações"],
  ["Cruzar arma", "19-cruzar_arma", "shield", "Cruzar arma", "armas"],
  ["Descansar", "20-descansar", "relaxed", "Descansar", "comandos"],
  ["Descansar arma", "21-descansar_arma", "shield", "Descansar arma", "armas"],
  ["Direita volver", "22-direita_volver", "rotate", "Direita volver", "comandos"],
  ["Em continência", "23-em_continencia", "salute", "Em continência", "cerimonial"],
  ["Em direção à direita", "24-em_direcao_a_direita", "arrow-right", "Em direção à direita", "comandos"],
  ["Em direção à esquerda", "25-em_direcao_a_esquerda", "arrow-left", "Em direção à esquerda", "comandos"],
  ["Escola", "26-escola", "school", null, "institucional"],
  ["Esquerda volver", "27-esquerda_volver", "rotate", "Esquerda volver", "comandos"],
  ["Firme", "28-firme", "shield", "Firme", "comandos"],
  ["Governador", "29-governador", "user", null, "autoridades"],
  ["Granadeira", "30-granadeira", "shield", null, "institucional"],
  ["Início do expediente", "31-inicio_expediente", "clock", "Início do expediente", "rotina"],
  ["Inspeções policiais", "32-inspecoes_policiais", "search", null, "institucional"],
  ["Marcar passo", "33-marcar_passo", "footprints", "Marcar passo", "marcha"],
  ["Marcha batida", "34-marcha_batida", "footprints", "Em marcha", "marcha"],
  ["Meia-volta volver", "35-meia_volta_volver", "rotate", "Meia-volta volver", "comandos"],
  ["Oficial superior", "36-oficial_superior", "user", null, "autoridades"],
  ["Olhar à direita", "37-olhar_a_direita", "eye", "Olhar à direita", "comandos"],
  ["Olhar em frente", "38-olhar_em_frente", "eye", "Olhar em frente", "comandos"],
  ["Ombro arma", "39-ombro_arma", "shield", "Ombro arma", "armas"],
  ["Ordem", "40-ordem", "volume", null, "comandos"],
  ["Ordinário marche", "41-ordinario_marche", "footprints", "Em marcha", "marcha"],
  ["Para prontidão", "42-para_a_prontidao", "bell", "Em prontidão", "comandos"],
  ["Pelotão", "43-pelotao", "users", null, "frações"],
  ["Polícia Militar", "44-policia_militar", "shield", null, "institucional"],
  ["Presidente", "45-presidente", "user", null, "autoridades"],
  ["Reunir", "46-reunir", "users", "Reunir", "comandos"],
  ["Revista do recolher", "47-revista_do_recolher", "search", "Revista do recolher", "rotina"],
  ["Sentido", "48-sentido", "shield", "Sentido", "comandos"],
  ["Silêncio", "49-silencio", "volume-off", "Em silêncio", "rotina"],
  ["Término do expediente", "50-termino_expediente", "clock", "Término do expediente", "rotina"],
  ["Última forma", "51-ultima_forma", "users", "Última forma", "comandos"],
] as const;

function fallbackAudioUrl(slug: string | null, sortOrder: number, name: string) {
  const normalized = name.toLocaleLowerCase("pt-BR");
  if (normalized.includes("cessar")) return "/uploads/pmam_bugle_calls_30001_cessar_o___vontade.mp3";
  if (normalized.includes("b+d") || normalized.includes("bumbo e dobrado")) return "/uploads/ordinario%20marche%20bumbo%20e%20dobrado.mp3";
  if (normalized.includes("ordinário marche")) return "/uploads/pmam_bugle_calls_90001_ordin_rio_marche_b.mp3";
  if (!slug) return null;
  return `https://cpmlondrina.com.br/wp-content/uploads/2018/06/${slug}.mp3`;
}

function fallbackBugleCalls(activeOnly = true) {
  const calls: ReturnType<typeof mapBugleCall>[] = fallbackCallRows.map(([name, slug, iconKey, troopState, category], index) => {
    const sortOrder = index + 1;
    return {
      id: sortOrder,
      name,
      audioUrl: fallbackAudioUrl(slug, sortOrder, name),
      iconKey,
      troopState,
      category,
      sourceUrl: FALLBACK_SOURCE_URL,
      sortOrder,
      isActive: true,
      createdAt: null,
      updatedAt: null,
    };
  });

  calls.push({
    id: 60001,
    name: "Bumbo",
    audioUrl: "/uploads/pmam_bugle_calls_60001_bumbo.mp3",
    iconKey: "music",
    troopState: null,
    category: "marcha",
    sourceUrl: null,
    sortOrder: 60001,
    isActive: true,
    createdAt: null,
    updatedAt: null,
  });

  return activeOnly ? calls.filter((item) => item.isActive) : calls;
}

function fallbackMarches(activeOnly = true) {
  const marches = [
    {
      id: 60001,
      title: "Dobrado Baptista de Mello",
      composer: "Manoel Alves",
      audioUrl: "/uploads/pmam_marches_60001_dobrado_baptista_de_mello.m4a",
      sourceUrl: null,
      sortOrder: 1,
      isActive: true,
      createdAt: null,
      updatedAt: null,
    },
  ];

  return activeOnly ? marches.filter((item) => item.isActive) : marches;
}

async function withFastPublicFallback<T>(promise: Promise<T>, fallback: () => T, message: string) {
  let settled = false;
  promise.finally(() => {
    settled = true;
  }).catch(() => {});

  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => {
        if (!settled) {
          console.warn(message);
          resolve(fallback());
        }
      }, 700);
    }),
  ]);
}

export async function ensureBugleSchema() {
  // Tabelas e alterações são aplicadas pelas migrações, não durante leituras.
  schemaPromise ??= Promise.resolve();
  await schemaPromise;
}

/**
 * Resolve the audio URL for a bugle call or march row.
 * - HTTP/HTTPS and data: URIs that are already accessible externally are returned as-is.
 * - data: URIs stored inline and /uploads/ local paths are redirected to the
 *   /api/bugle-audio proxy endpoint, which reads the raw bytes from the DB and
 *   serves them correctly in both Node.js and Cloudflare Workers.
 */
function resolveAudioUrl(audioUrl: string | null | undefined, kind: "call" | "march", id: number): string | null {
  if (!audioUrl) return null;
  // If stored as inline data: URI in DB, route through proxy endpoint
  if (audioUrl.startsWith("data:")) {
    return `/api/bugle-audio/${kind}/${id}`;
  }
  // Return direct path (/uploads/... or https://...)
  return audioUrl;
}

function mapBugleCall(row: any) {
  if (!row) return row;
  const id = Number(row.id);
  return {
    id,
    name: row.name,
    audioUrl: resolveAudioUrl(row.audio_url, "call", id),
    iconKey: row.icon_key || "music",
    troopState: row.troop_state,
    category: row.category || "geral",
    sourceUrl: row.source_url,
    sortOrder: Number(row.sort_order || 0),
    isActive: row.is_active === 1 || row.is_active === true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMarch(row: any) {
  if (!row) return row;
  const id = Number(row.id);
  return {
    id,
    title: row.title,
    composer: row.composer,
    audioUrl: resolveAudioUrl(row.audio_url, "march", id),
    sourceUrl: row.source_url,
    sortOrder: Number(row.sort_order || 0),
    isActive: row.is_active === 1 || row.is_active === true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listBugleCalls(activeOnly = true) {
  await ensureBugleSchema();
  const where = activeOnly ? "WHERE is_active = 1" : "";
  const dbRead = query(`SELECT * FROM pmam_bugle_calls ${where} ORDER BY sort_order, name`).then((rows) => rows.map(mapBugleCall));
  if (activeOnly) {
    return withFastPublicFallback(dbRead, () => fallbackBugleCalls(activeOnly), "[BuglePanel] Leitura publica demorou; usando fallback local de toques.");
  }
  try {
    return await dbRead;
  } catch (error) {
    console.warn("[BuglePanel] Banco indisponível; usando fallback local de toques.", (error as any)?.code || String((error as any)?.message || error));
    return fallbackBugleCalls(activeOnly);
  }
}

export async function listMarches(activeOnly = true) {
  await ensureBugleSchema();
  const where = activeOnly ? "WHERE is_active = 1" : "";
  const dbRead = query(`SELECT * FROM pmam_marches ${where} ORDER BY sort_order, title`).then((rows) => rows.map(mapMarch));
  if (activeOnly) {
    return withFastPublicFallback(dbRead, () => fallbackMarches(activeOnly), "[BuglePanel] Leitura publica demorou; usando fallback local de dobrados.");
  }
  try {
    return await dbRead;
  } catch (error) {
    console.warn("[BuglePanel] Banco indisponível; usando fallback local de dobrados.", (error as any)?.code || String((error as any)?.message || error));
    return fallbackMarches(activeOnly);
  }
}

export async function createBugleCall(input: any) {
  await ensureBugleSchema();
  const result = await query(
    `INSERT INTO pmam_bugle_calls
      (name, audio_url, icon_key, troop_state, category, source_url, sort_order, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.audioUrl || null,
      input.iconKey || "music",
      input.troopState || null,
      input.category || "geral",
      input.sourceUrl || null,
      input.sortOrder ?? 0,
      input.isActive === false ? 0 : 1,
    ],
  );
  return (result as any).insertId as number | undefined;
}

export async function createMarch(input: any) {
  await ensureBugleSchema();
  const result = await query(
    `INSERT INTO pmam_marches
      (title, composer, audio_url, source_url, sort_order, is_active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.title,
      input.composer || null,
      input.audioUrl || null,
      input.sourceUrl || null,
      input.sortOrder ?? 0,
      input.isActive === false ? 0 : 1,
    ],
  );
  return (result as any).insertId as number | undefined;
}

const CALL_FIELDS: Record<string, string> = {
  name: "name",
  audioUrl: "audio_url",
  iconKey: "icon_key",
  troopState: "troop_state",
  category: "category",
  sourceUrl: "source_url",
  sortOrder: "sort_order",
  isActive: "is_active",
};

const MARCH_FIELDS: Record<string, string> = {
  title: "title",
  composer: "composer",
  audioUrl: "audio_url",
  sourceUrl: "source_url",
  sortOrder: "sort_order",
  isActive: "is_active",
};

async function updateRecord(table: string, id: number, input: any, fields: Record<string, string>) {
  await ensureBugleSchema();
  const updates: string[] = [];
  const values: any[] = [];
  for (const [key, column] of Object.entries(fields)) {
    if (input[key] === undefined) continue;
    updates.push(`${column} = ?`);
    const value = input[key];
    values.push(
      key === "isActive"
        ? (value ? 1 : 0)
        : (typeof value === "string" && value.trim() === "" ? null : value),
    );
  }
  if (!updates.length) return;
  values.push(id);
  await query(`UPDATE ${table} SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
}

export function updateBugleCall(id: number, input: any) {
  return updateRecord("pmam_bugle_calls", id, input, CALL_FIELDS);
}

export function updateMarch(id: number, input: any) {
  return updateRecord("pmam_marches", id, input, MARCH_FIELDS);
}

export async function deleteBugleCall(id: number) {
  await ensureBugleSchema();
  await query("DELETE FROM pmam_bugle_calls WHERE id = ?", [id]);
}

export async function deleteMarch(id: number) {
  await ensureBugleSchema();
  await query("DELETE FROM pmam_marches WHERE id = ?", [id]);
}
