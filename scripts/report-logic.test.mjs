import test from "node:test";
import assert from "node:assert/strict";
import { addDays, analyze, buildReport, writeResumenAyer, writeHabitos } from "./report-logic.mjs";

const TODAY = "2026-03-10";
const YESTERDAY = addDays(TODAY, -1); // 2026-03-09

const fixture = {
  tasks: [
    { title: "Informe", date: YESTERDAY, time: "09:00", done: true },
    { title: "Banco", date: YESTERDAY, time: "11:00", done: false },
    { title: "Comprar insumos", date: TODAY, time: null, done: false },
    { title: "Reunión", date: TODAY, time: "15:00", done: false },
  ],
  study: [
    { title: "Capítulo 4", date: YESTERDAY, time: "19:00", done: true },
    { title: "Inglés", date: TODAY, time: "08:00", done: false },
  ],
  finance: [
    { type: "ingreso", amount: 100000, category: "Sueldo", date: addDays(TODAY, -3) },
    { type: "egreso", amount: 4000, category: "Supermercado", date: addDays(TODAY, -1) },
    { type: "egreso", amount: 6000, category: "Supermercado", date: TODAY },
    { type: "egreso", amount: 2500, category: "Transporte", date: TODAY },
  ],
  health: [
    { date: addDays(TODAY, -6), weight: 80, active: true },
    { date: addDays(TODAY, -2), weight: null, active: true },
    { date: addDays(TODAY, -1), weight: 79.2, active: false },
    { date: TODAY, weight: 79, active: true },
  ],
};

test("cuenta lo completado y lo pendiente de ayer", () => {
  const a = analyze(fixture, TODAY);
  assert.equal(a.ayer.total, 3);
  assert.equal(a.ayer.completados, 2);
  assert.deepEqual(a.ayer.pendientes, ["Banco"]);
});

test("ordena lo de hoy por horario y deja lo sin hora al final", () => {
  const a = analyze(fixture, TODAY);
  assert.deepEqual(a.hoy, ["Inglés · 08:00", "Reunión · 15:00", "Comprar insumos"]);
});

test("suma plata de la semana y ordena las categorías por gasto", () => {
  const a = analyze(fixture, TODAY);
  assert.equal(a.plata.ingresos, 100000);
  assert.equal(a.plata.egresos, 12500);
  assert.equal(a.plata.balance, 87500);
  assert.deepEqual(a.plata.topCategorias, [
    { categoria: "Supermercado", monto: 10000 },
    { categoria: "Transporte", monto: 2500 },
  ]);
});

test("mide actividad y variación de peso ignorando días sin registro", () => {
  const a = analyze(fixture, TODAY);
  assert.equal(a.habitos.diasActivos7, 3);
  assert.equal(a.habitos.pesoActual, 79);
  assert.equal(a.habitos.variacionPeso, -1);
});

test("redacta el resumen de ayer nombrando lo que quedó abierto", () => {
  const text = writeResumenAyer(analyze(fixture, TODAY));
  assert.match(text, /2 de 3 cosas cargadas/);
  assert.match(text, /Quedó pendiente: Banco/);
});

test("redacta hábitos con el balance de la semana", () => {
  const text = writeHabitos(analyze(fixture, TODAY));
  assert.match(text, /3 de los últimos 7 días/);
  assert.match(text, /79\.0 kg/);
  assert.match(text, /positivo/);
  assert.match(text, /Supermercado/);
});

test("un día sin datos no rompe el reporte", () => {
  const vacio = { tasks: [], study: [], finance: [], health: [] };
  const a = analyze(vacio, TODAY);
  const row = buildReport(a, "user-1", TODAY);

  assert.equal(row.resumen_ayer, "Ayer no había nada cargado en tareas ni en estudio.");
  assert.deepEqual(row.hoy, []);
  assert.equal(row.ingresos, 0);
  assert.equal(row.egresos, 0);
  assert.match(row.habitos, /0 de los últimos 7 días/);
});

test("un balance negativo se redacta como rojo", () => {
  const a = analyze({ ...fixture, finance: [{ type: "egreso", amount: 500, category: "Otros", date: TODAY }] }, TODAY);
  assert.match(writeHabitos(a), /en rojo/);
});

test("la fila del reporte usa la fecha y el usuario recibidos", () => {
  const row = buildReport(analyze(fixture, TODAY), "abc-123", TODAY);
  assert.equal(row.user_id, "abc-123");
  assert.equal(row.date, TODAY);
});
