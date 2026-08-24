import "dotenv/config";
import { connect } from "@tidbcloud/serverless";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

function rowsOf(result: unknown): Record<string, any>[] {
  if (Array.isArray(result)) return result as Record<string, any>[];
  if (result && typeof result === "object" && "rows" in result) {
    const rows = (result as { rows?: unknown }).rows;
    return Array.isArray(rows) ? rows as Record<string, any>[] : [];
  }
  return [];
}

function readArray<T>(file: string, variable: string): T[] {
  const source = readFileSync(path.resolve(file), "utf8");
  const startToken = `const ${variable} = [`;
  const start = source.indexOf(startToken);
  if (start < 0) throw new Error(`${variable} nao encontrado em ${file}`);
  const arrayStart = source.indexOf("[", start);
  const marker = source.indexOf("\n];", arrayStart);
  if (marker < 0) throw new Error(`Fim de ${variable} nao encontrado em ${file}`);
  const literal = source.slice(arrayStart, marker + 2);
  return Function(`"use strict"; return (${literal});`)() as T[];
}

async function main() {
  const url = process.env.TIDB_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("TIDB_URL ou DATABASE_URL nao configurada");
  const db = connect({ url, fullResult: true });

  const hymns = readArray<any>("seed-hymns.mjs", "hymns");
  for (const hymn of hymns) {
    await db.execute(
      `INSERT INTO pmam_hymns
       (number, title, subtitle, author, composer, category, lyrics, description, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE title=VALUES(title), subtitle=VALUES(subtitle), author=VALUES(author),
       composer=VALUES(composer), category=VALUES(category), lyrics=VALUES(lyrics),
       description=VALUES(description), is_active=1, updated_at=CURRENT_TIMESTAMP`,
      [hymn.number, hymn.title, hymn.subtitle, hymn.author, hymn.composer, hymn.category, hymn.lyrics, hymn.description],
    );
  }
  console.log(`hinos: ${hymns.length}`);

  const drills = readArray<any>("seed-drill.mjs", "drills");
  for (const drill of drills) {
    const existing = rowsOf(await db.execute("SELECT id FROM pmam_drill WHERE title = ? ORDER BY id LIMIT 1", [drill.title]))[0];
    const values = [drill.subtitle, drill.description, drill.category, drill.difficulty, drill.duration, drill.content,
      drill.instructor, drill.prerequisites, drill.learningOutcomes, drill.authorId];
    if (existing) {
      await db.execute(
        `UPDATE pmam_drill SET subtitle=?, description=?, category=?, difficulty=?, duration=?, content=?, instructor=?,
         prerequisites=?, learning_outcomes=?, author_id=?, is_active=1, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
        [...values, existing.id],
      );
    } else {
      await db.execute(
        `INSERT INTO pmam_drill
         (subtitle, description, category, difficulty, duration, content, instructor, prerequisites, learning_outcomes, author_id, title, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [...values, drill.title],
      );
    }
  }
  console.log(`ordem_unida: ${drills.length}`);

  const disciplines = readArray<any>("seed-disciplines.mjs", "disciplines");
  const platoonLinks: Array<[number, number, number]> = [];
  for (const discipline of disciplines) {
    const existing = rowsOf(await db.execute("SELECT id FROM pmam_disciplines WHERE name = ? ORDER BY id LIMIT 1", [discipline.name]))[0];
    let disciplineId: number;
    if (existing) {
      disciplineId = Number(existing.id);
      await db.execute("UPDATE pmam_disciplines SET description=?, is_active=1, updated_at=CURRENT_TIMESTAMP WHERE id=?", [discipline.description, disciplineId]);
    } else {
      const inserted: any = await db.execute("INSERT INTO pmam_disciplines (name, description, created_by, is_active) VALUES (?, ?, 1, 1)", [discipline.name, discipline.description]);
      disciplineId = Number(inserted.lastInsertId ?? inserted.insertId);
    }
    for (let companhia = 1; companhia <= 5; companhia += 1) {
      for (let peloton = 1; peloton <= 2; peloton += 1) {
        platoonLinks.push([disciplineId, companhia, peloton]);
      }
    }
  }
  if (platoonLinks.length) {
    await db.execute(
      `INSERT IGNORE INTO pmam_platoon_disciplines (discipline_id, companhia, peloton, status) VALUES ${platoonLinks.map(() => "(?, ?, ?, 'em_breve')").join(", ")}`,
      platoonLinks.flat(),
    );
  }
  console.log(`disciplinas: ${disciplines.length}`);

  const bugleCalls = readArray<any>("seed-bugle-calls.mjs", "bugleCallsData");
  for (const call of bugleCalls) {
    await db.execute(
      `INSERT INTO pmam_bugle_calls (name, audio_url, icon_key, troop_state, category, source_url, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE icon_key=VALUES(icon_key), troop_state=VALUES(troop_state), category=VALUES(category),
       source_url=VALUES(source_url), sort_order=VALUES(sort_order), is_active=1, updated_at=CURRENT_TIMESTAMP`,
      [call.name, call.audioUrl, call.iconKey, call.troopState, call.category, call.sourceUrl, call.sortOrder],
    );
  }

  const localCalls = [
    ["Bumbo", "/uploads/pmam_bugle_calls_60001_bumbo.mp3", "music", null, "marcha", 60001],
    ["Ordinário marche B", "/uploads/pmam_bugle_calls_90001_ordin_rio_marche_b.mp3", "footprints", "Em marcha", "marcha", 90001],
    ["Cessar o À Vontade", "/uploads/pmam_bugle_calls_30001_cessar_o___vontade.mp3", "shield", "Sentido", "comandos", 30001],
  ];
  for (const [name, audioUrl, iconKey, troopState, category, sortOrder] of localCalls) {
    await db.execute(
      `INSERT INTO pmam_bugle_calls (name, audio_url, icon_key, troop_state, category, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE audio_url=VALUES(audio_url), icon_key=VALUES(icon_key), troop_state=VALUES(troop_state),
       category=VALUES(category), sort_order=VALUES(sort_order), is_active=1, updated_at=CURRENT_TIMESTAMP`,
      [name, audioUrl, iconKey, troopState, category, sortOrder],
    );
  }
  console.log(`toques: ${bugleCalls.length + localCalls.length}`);

  const marchFile = "pmam_marches_60001_dobrado_baptista_de_mello.m4a";
  const existingMarch = rowsOf(await db.execute("SELECT id FROM pmam_marches WHERE title = 'Baptista de Melo' ORDER BY id LIMIT 1"))[0];
  if (existingMarch) {
    await db.execute(
      "UPDATE pmam_marches SET composer='Manoel Alves', audio_url=?, sort_order=1, is_active=1, updated_at=CURRENT_TIMESTAMP WHERE id=?",
      [`/uploads/${marchFile}`, existingMarch.id],
    );
  } else {
    await db.execute(
      "INSERT INTO pmam_marches (title, composer, audio_url, sort_order, is_active) VALUES ('Baptista de Melo', 'Manoel Alves', ?, 1, 1)",
      [`/uploads/${marchFile}`],
    );
  }

  const ordemFile = "pmam_ordem_unida_audios_1_baptista_de_melo.m4a";
  const ordemPath = path.resolve("uploads", ordemFile);
  await db.execute(
    `INSERT INTO pmam_ordem_unida_audios
     (item_id, item_title, item_type, audio_url, file_key, file_name, file_size, mime_type, voice_profile_key, is_active, uploaded_by)
     VALUES ('dobrado-baptista-de-melo', 'Baptista de Melo', 'dobrado', ?, ?, ?, ?, 'audio/mp4', 'default', 1, 1)
     ON DUPLICATE KEY UPDATE item_title=VALUES(item_title), item_type=VALUES(item_type), audio_url=VALUES(audio_url),
     file_key=VALUES(file_key), file_name=VALUES(file_name), file_size=VALUES(file_size), mime_type=VALUES(mime_type),
     is_active=1, updated_at=CURRENT_TIMESTAMP`,
    [`/uploads/${ordemFile}`, ordemFile, ordemFile, statSync(ordemPath).size],
  );
  console.log("dobrado_local: 1");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
