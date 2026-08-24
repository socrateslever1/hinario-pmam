import "dotenv/config";
import { connect } from "@tidbcloud/serverless";

async function main() {
  const url = process.env.TIDB_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("TIDB_URL ou DATABASE_URL nao configurada");
  const db = connect({ url, fullResult: true });

  await db.execute(`DELETE newer FROM pmam_drill newer
    INNER JOIN pmam_drill canonical ON canonical.title = newer.title AND canonical.id < newer.id`);
  await db.execute(`DELETE newer FROM pmam_marches newer
    INNER JOIN pmam_marches canonical ON canonical.title = newer.title AND canonical.id < newer.id`);

  await db.execute(`DELETE links FROM pmam_platoon_disciplines links
    INNER JOIN pmam_disciplines duplicate ON duplicate.id = links.discipline_id
    INNER JOIN pmam_disciplines canonical ON canonical.name = duplicate.name AND canonical.id < duplicate.id`);
  await db.execute(`DELETE duplicate FROM pmam_disciplines duplicate
    INNER JOIN pmam_disciplines canonical ON canonical.name = duplicate.name AND canonical.id < duplicate.id`);
  await db.execute(
    "UPDATE pmam_bugle_calls SET name = 'Ordinário marche B' WHERE audio_url = '/uploads/pmam_bugle_calls_90001_ordin_rio_marche_b.mp3'",
  );

  console.log("Duplicatas de recuperacao consolidadas.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
