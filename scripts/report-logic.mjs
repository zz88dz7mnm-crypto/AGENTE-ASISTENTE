/**
 * Lógica pura del reporte diario: fechas, análisis y redacción.
 *
 * Vive separada de `daily-report.mjs` (que hace la entrada/salida contra
 * Supabase) para poder probarla sin base de datos ni red.
 */

export function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * Fecha de hoy en la zona horaria del usuario, no en la del servidor.
 *
 * La rutina corre en un sandbox que casi seguro está en UTC. A las 2:00 de
 * Argentina son las 05:00 UTC del mismo día, así que hoy coincide por
 * casualidad; pero con otro horario de disparo, o con otra zona, el script
 * calcularía un día corrido y el "resumen de ayer" cubriría el día en curso.
 */
export function todayIn(timeZone) {
  // en-CA da directamente el formato YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function addDays(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return isoDate(dt);
}

export const money = (n) => `$${Math.round(Math.abs(n)).toLocaleString("es-AR")}`;

function pluralize(n, singular, plural) {
  return `${n} ${n === 1 ? singular : plural}`;
}

/**
 * Convierte las filas crudas de Supabase en las métricas del reporte.
 * `today` es el día que arranca; `yesterday` el que cerró.
 */
export function analyze({ tasks, study, finance, health }, today) {
  const yesterday = addDays(today, -1);

  const ayerItems = [...tasks, ...study].filter((i) => i.date === yesterday);
  const ayerDone = ayerItems.filter((i) => i.done).length;

  const hoyItems = [...tasks, ...study]
    .filter((i) => i.date === today)
    .sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99"));

  const ingresos = finance
    .filter((f) => f.type === "ingreso")
    .reduce((a, f) => a + Number(f.amount), 0);
  const egresos = finance
    .filter((f) => f.type === "egreso")
    .reduce((a, f) => a + Number(f.amount), 0);

  const egresosPorCategoria = [
    ...finance
      .filter((f) => f.type === "egreso")
      .reduce(
        (map, f) => map.set(f.category, (map.get(f.category) ?? 0) + Number(f.amount)),
        new Map()
      ),
  ].sort((a, b) => b[1] - a[1]);

  const byDate = new Map(health.map((h) => [h.date, h]));
  const activeLast7 = Array.from({ length: 7 }, (_, i) => addDays(today, -i)).filter(
    (d) => byDate.get(d)?.active
  ).length;

  const weights = health
    .filter((h) => h.weight != null)
    .sort((a, b) => a.date.localeCompare(b.date));
  const weightDelta =
    weights.length > 1 ? Number(weights.at(-1).weight) - Number(weights[0].weight) : null;

  return {
    ayer: {
      total: ayerItems.length,
      completados: ayerDone,
      pendientes: ayerItems.filter((i) => !i.done).map((i) => i.title),
    },
    hoy: hoyItems.map((i) => (i.time ? `${i.title} · ${i.time}` : i.title)),
    plata: {
      ingresos,
      egresos,
      balance: ingresos - egresos,
      topCategorias: egresosPorCategoria.slice(0, 3).map(([c, v]) => ({ categoria: c, monto: v })),
    },
    habitos: {
      diasActivos7: activeLast7,
      pesoActual: weights.length ? Number(weights.at(-1).weight) : null,
      variacionPeso: weightDelta,
    },
  };
}

export function writeResumenAyer(a) {
  if (a.ayer.total === 0) return "Ayer no había nada cargado en tareas ni en estudio.";

  let text = `Ayer se completaron ${a.ayer.completados} de ${pluralize(
    a.ayer.total,
    "cosa cargada",
    "cosas cargadas"
  )}.`;

  if (a.ayer.pendientes.length > 0) {
    const lista = a.ayer.pendientes.slice(0, 3).join(", ");
    const resto = a.ayer.pendientes.length > 3 ? ` y ${a.ayer.pendientes.length - 3} más` : "";
    text += ` Quedó pendiente: ${lista}${resto}.`;
  } else {
    text += " No quedó nada abierto.";
  }
  return text;
}

export function writeHabitos(a) {
  const partes = [`${a.habitos.diasActivos7} de los últimos 7 días con actividad física.`];

  if (a.habitos.pesoActual != null) {
    partes.push(`Peso actual: ${a.habitos.pesoActual.toFixed(1)} kg.`);
  }
  if (a.habitos.variacionPeso != null && Math.abs(a.habitos.variacionPeso) >= 0.1) {
    const signo = a.habitos.variacionPeso > 0 ? "+" : "−";
    partes.push(
      `Variación en el período: ${signo}${Math.abs(a.habitos.variacionPeso).toFixed(1)} kg.`
    );
  }

  const balance = a.plata.balance;
  partes.push(
    balance >= 0
      ? `La semana cierra en positivo por ${money(balance)}.`
      : `La semana viene ${money(balance)} en rojo.`
  );
  if (a.plata.topCategorias.length > 0) {
    const top = a.plata.topCategorias[0];
    partes.push(`Donde más se fue: ${top.categoria} (${money(top.monto)}).`);
  }

  return partes.join(" ");
}

/** Arma la fila lista para escribir en la tabla `reports`. */
export function buildReport(analysis, userId, today) {
  return {
    user_id: userId,
    date: today,
    resumen_ayer: writeResumenAyer(analysis),
    hoy: analysis.hoy,
    ingresos: analysis.plata.ingresos,
    egresos: analysis.plata.egresos,
    habitos: writeHabitos(analysis),
  };
}
