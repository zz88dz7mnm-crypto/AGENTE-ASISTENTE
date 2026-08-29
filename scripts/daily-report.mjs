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
 *   SUPABASE_SERVICE_ROLE_KEY  clave service_role (salta RLS; nunca en el cliente)
 *   AGENTE_USER_ID             opcional: id del usuario. Si falta y hay una sola
 *                              cuenta en el proyecto, se usa esa.
 *
 * El análisis se imprime como JSON en stdout para que la Routine pueda releerlo
 * y reescribir el texto en prosa; el texto base que arma este script ya queda
 * guardado, así que el reporte existe aunque ese paso no corra.
 */

import { createClient } from "@supabase/supabase-js";
import { addDays, analyze, buildReport, isoDate } from "./report-logic.mjs";

const DRY_RUN = process.argv.includes("--dry-run");

// La rutina corre a las 2 AM: el "hoy" del reporte es el día que arranca.
const today = isoDate(new Date());
const yesterday = addDays(today, -1);
const weekStart = addDays(today, -6);

function connect() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY. Cargalas como variables de entorno."
    );
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function resolveUserId(db) {
  if (process.env.AGENTE_USER_ID) return process.env.AGENTE_USER_ID;

  const { data, error } = await db.auth.admin.listUsers();
  if (error) throw new Error(`No se pudo listar usuarios: ${error.message}`);

  const users = data?.users ?? [];
  if (users.length === 0) throw new Error("El proyecto no tiene usuarios todavía.");
  if (users.length > 1) {
    throw new Error(
      "Hay más de un usuario en el proyecto: definí AGENTE_USER_ID para saber a cuál reportar."
    );
  }
  return users[0].id;
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
  const userId = await resolveUserId(db);
  const analysis = analyze(await fetchAll(db, userId), today);
  const report = buildReport(analysis, userId, today);

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
