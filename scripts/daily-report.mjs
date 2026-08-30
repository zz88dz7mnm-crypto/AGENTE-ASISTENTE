#!/usr/bin/env node
/**
 * Reporte diario — se ejecuta desde la Routine de Claude Code a las 2:00 AM.
 *
 * Lee de Supabase lo de ayer y lo de hoy, arma las métricas, y deja el reporte
 * escrito en la tabla `reports` para que la web lo muestre al instante.
 *
 * Uso:
 *   node scripts/daily-report.mjs            # escribe el reporte
 *   node scripts/daily-report.mjs --dry-run  # lo imprime sin escribir
 *
 * Variables de entorno requeridas:
 *   SUPABASE_URL               URL del proyecto
 *   SUPABASE_KEY               clave del proyecto. Sirve la publishable, porque
 *                              la app no tiene login y las políticas son
 *                              abiertas. Si preferís la service_role, se toma
 *                              de SUPABASE_SERVICE_ROLE_KEY.
 *
 * El análisis se imprime como JSON en stdout para que la Routine pueda releerlo
 * y reescribir el texto en prosa; el texto base que arma este script ya queda
 * guardado, así que el reporte existe aunque ese paso no corra.
 */

import { createClient } from "@supabase/supabase-js";
import { addDays, analyze, buildReport, todayIn } from "./report-logic.mjs";

const DRY_RUN = process.argv.includes("--dry-run");

// Zona horaria del usuario, no la del servidor donde corre la rutina.
const TZ = process.env.AGENTE_TZ || "America/Argentina/Buenos_Aires";

// La rutina corre a las 2 AM: el "hoy" del reporte es el día que arranca.
const today = todayIn(TZ);
const yesterday = addDays(today, -1);
const weekStart = addDays(today, -6);

// Dueño único de las filas: coincide con el default de la migración 0002.
const OWNER_ID = process.env.AGENTE_USER_ID || "00000000-0000-0000-0000-000000000001";

function connect() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error("Faltan SUPABASE_URL y/o SUPABASE_KEY. Cargalas como variables de entorno.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function fetchAll(db, userId) {
  const [tasks, study, finance, health] = await Promise.all([
    db.from("tasks").select("title,date,time,done").eq("user_id", userId).in("date", [yesterday, today]),
    db.from("study").select("title,date,time,done").eq("user_id", userId).in("date", [yesterday, today]),
    db
      .from("finance")
      .select("type,amount,category,date")
      .eq("user_id", userId)
      .gte("date", weekStart)
      .lte("date", today),
    db
      .from("health")
      .select("date,weight,active")
      .eq("user_id", userId)
      .gte("date", addDays(today, -29))
      .lte("date", today),
  ]);

  for (const r of [tasks, study, finance, health]) {
    if (r.error) throw new Error(`Error leyendo datos: ${r.error.message}`);
  }

  return {
    tasks: tasks.data ?? [],
    study: study.data ?? [],
    finance: finance.data ?? [],
    health: health.data ?? [],
  };
}

async function main() {
  const db = connect();
  const analysis = analyze(await fetchAll(db, OWNER_ID), today);
  const report = buildReport(analysis, OWNER_ID, today);

  console.log(JSON.stringify({ analysis, report }, null, 2));

  if (DRY_RUN) {
    console.error("[dry-run] No se escribió nada en la base.");
    return;
  }

  const { error } = await db.from("reports").upsert(report, { onConflict: "user_id,date" });
  if (error) throw new Error(`No se pudo guardar el reporte: ${error.message}`);

  console.error(`Reporte del ${today} guardado.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
