import { query } from "./mysql";

export async function ensureAdministrativeDailyTable() {
  await query(`CREATE TABLE IF NOT EXISTS pmam_administrative_daily (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    companhia INT NOT NULL,
    peloton INT NOT NULL,
    location_status VARCHAR(32) NOT NULL DEFAULT 'sala',
    formation_status VARCHAR(32) NOT NULL DEFAULT 'nao_informado',
    lunch_status VARCHAR(32) NOT NULL DEFAULT 'nao_informado',
    snack_status VARCHAR(32) NOT NULL DEFAULT 'nao_informado',
    ranch_advance TINYINT(1) NOT NULL DEFAULT 0,
    punishment_summary TEXT NULL,
    facts_summary TEXT NULL,
    pending_summary TEXT NULL,
    pending_resolved_at TIMESTAMP NULL,
    updated_by INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_pmam_administrative_daily_scope (date, companhia, peloton),
    KEY idx_pmam_administrative_daily_pending (pending_resolved_at, date)
  )`);
  await query(`CREATE TABLE IF NOT EXISTS pmam_administrative_weekly_config (
    companhia INT NOT NULL, peloton INT NOT NULL,
    ranch_weekdays VARCHAR(32) NOT NULL DEFAULT '', lunch_weekdays VARCHAR(32) NOT NULL DEFAULT '', snack_weekdays VARCHAR(32) NOT NULL DEFAULT '',
    updated_by INT NULL, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (companhia, peloton)
  )`);
}

export async function listWeeklyConfig() {
  await ensureAdministrativeDailyTable();
  const rows = await query("SELECT * FROM pmam_administrative_weekly_config ORDER BY companhia, peloton");
  return rows.map((row: any) => ({ companhia: Number(row.companhia), peloton: Number(row.peloton), ranchWeekdays: String(row.ranch_weekdays || '').split(',').filter(Boolean).map(Number), lunchWeekdays: String(row.lunch_weekdays || '').split(',').filter(Boolean).map(Number), snackWeekdays: String(row.snack_weekdays || '').split(',').filter(Boolean).map(Number) }));
}

export async function saveWeeklyConfig(input: any) {
  await ensureAdministrativeDailyTable();
  await query(`INSERT INTO pmam_administrative_weekly_config (companhia, peloton, ranch_weekdays, lunch_weekdays, snack_weekdays, updated_by) VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE ranch_weekdays=VALUES(ranch_weekdays), lunch_weekdays=VALUES(lunch_weekdays), snack_weekdays=VALUES(snack_weekdays), updated_by=VALUES(updated_by)`,
    [input.companhia, input.peloton, input.ranchWeekdays.join(','), input.lunchWeekdays.join(','), input.snackWeekdays.join(','), input.updatedBy]);
  return listWeeklyConfig();
}

export async function listAdministrativeDaily(date?: string, companhia?: number, peloton?: number) {
  await ensureAdministrativeDailyTable();
  const filters = [date ? "date = ?" : "", companhia ? "companhia = ?" : "", peloton ? "peloton = ?" : ""].filter(Boolean);
  const params = [date, companhia, peloton].filter((value) => value !== undefined);
  const rows = await query(`SELECT * FROM pmam_administrative_daily ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""} ORDER BY date DESC, companhia, peloton LIMIT 365`, params);
  return rows.map(mapRow);
}

export async function listOpenAdministrativePendings(companhia?: number, peloton?: number) {
  await ensureAdministrativeDailyTable();
  const filters = ["pending_summary IS NOT NULL", "pending_summary <> ''", "pending_resolved_at IS NULL", companhia ? "companhia = ?" : "", peloton ? "peloton = ?" : ""].filter(Boolean);
  const params = [companhia, peloton].filter((value) => value !== undefined);
  const rows = await query(`SELECT * FROM pmam_administrative_daily WHERE ${filters.join(" AND ")} ORDER BY date ASC, companhia, peloton`, params);
  return rows.map(mapRow);
}

export async function saveAdministrativeDaily(input: any) {
  await ensureAdministrativeDailyTable();
  await query(`INSERT INTO pmam_administrative_daily
    (date, companhia, peloton, location_status, formation_status, lunch_status, snack_status, ranch_advance, punishment_summary, facts_summary, pending_summary, pending_resolved_at, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE location_status=VALUES(location_status), formation_status=VALUES(formation_status), lunch_status=VALUES(lunch_status), snack_status=VALUES(snack_status), ranch_advance=VALUES(ranch_advance), punishment_summary=VALUES(punishment_summary), facts_summary=VALUES(facts_summary), pending_summary=VALUES(pending_summary), pending_resolved_at=VALUES(pending_resolved_at), updated_by=VALUES(updated_by)`,
    [input.date, input.companhia, input.peloton, input.locationStatus, input.formationStatus, input.lunchStatus, input.snackStatus, input.ranchAdvance ? 1 : 0, input.punishmentSummary || null, input.factsSummary || null, input.pendingSummary || null, input.pendingResolved ? new Date() : null, input.updatedBy]);
  return listAdministrativeDaily(input.date);
}

function mapRow(row: any) {
  const date = row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date).slice(0, 10);
  return { id: row.id, date, companhia: Number(row.companhia), peloton: Number(row.peloton), locationStatus: row.location_status, formationStatus: row.formation_status, lunchStatus: row.lunch_status, snackStatus: row.snack_status, ranchAdvance: Boolean(row.ranch_advance), punishmentSummary: row.punishment_summary, factsSummary: row.facts_summary, pendingSummary: row.pending_summary, pendingResolvedAt: row.pending_resolved_at, createdAt: row.created_at, updatedAt: row.updated_at };
}
