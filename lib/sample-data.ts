import { AppData } from "./types";
import { addDays, todayISO } from "./date-utils";

// Datos de ejemplo para validar estructura y diseño en local.
// No representan datos reales del usuario: se reemplazan al conectar Supabase (Fase 4).
export function buildSampleData(): AppData {
  const today = todayISO();
  const y = (n: number) => addDays(today, -n);
  const t = (n: number) => addDays(today, n);

  const finance: AppData["finance"] = [
    { id: "f1", type: "egreso", amount: 4200, category: "Supermercado", date: today, note: "Compra semanal" },
    { id: "f2", type: "egreso", amount: 1500, category: "Transporte", date: today },
    { id: "f3", type: "egreso", amount: 3200, category: "Comida afuera", date: y(1) },
    { id: "f4", type: "ingreso", amount: 12000, category: "Freelance", date: y(2), note: "Anticipo proyecto" },
    { id: "f5", type: "egreso", amount: 8900, category: "Servicios", date: y(3), note: "Luz + internet" },
    { id: "f6", type: "egreso", amount: 2100, category: "Transporte", date: y(4) },
    { id: "f7", type: "egreso", amount: 5400, category: "Supermercado", date: y(5) },
    { id: "f8", type: "egreso", amount: 1800, category: "Salud", date: y(6), note: "Farmacia" },
    { id: "f9", type: "ingreso", amount: 185000, category: "Sueldo", date: y(8) },
    { id: "f10", type: "egreso", amount: 62000, category: "Servicios", date: y(9), note: "Alquiler" },
    { id: "f11", type: "egreso", amount: 6100, category: "Supermercado", date: y(11) },
    { id: "f12", type: "egreso", amount: 4300, category: "Comida afuera", date: y(13) },
    { id: "f13", type: "ingreso", amount: 24000, category: "Freelance", date: y(16) },
    { id: "f14", type: "egreso", amount: 2600, category: "Transporte", date: y(18) },
    { id: "f15", type: "egreso", amount: 7400, category: "Supermercado", date: y(20) },
    { id: "f16", type: "egreso", amount: 3100, category: "Otros", date: y(24) },
  ];

  const health: AppData["health"] = Array.from({ length: 30 }, (_, i) => {
    const day = 29 - i;
    const base = 79.4 - i * 0.045;
    return {
      id: `h${day}`,
      date: y(day),
      weight: Math.round((base + (day % 3 === 0 ? 0.2 : -0.1)) * 10) / 10,
      active: [0, 1, 3, 4, 6, 8, 9, 11, 13, 15, 16, 18, 20, 22, 25, 27].includes(day),
    };
  });

  return {
    tasks: [
      { id: "t1", title: "Enviar informe semanal", date: today, time: "09:30", done: true },
      { id: "t2", title: "Llamar al banco por la tarjeta", date: today, time: "11:00", done: false },
      { id: "t3", title: "Comprar insumos de oficina", date: today, done: false },
      { id: "t4", title: "Responder mails pendientes", date: today, time: "17:30", done: false },
      { id: "t5", title: "Preparar presentación del lunes", date: t(1), time: "16:00", done: false },
      { id: "t6", title: "Renovar seguro", date: t(3), done: false },
      { id: "t7", title: "Revisar gastos del mes", date: y(1), time: "10:00", done: true },
    ],
    study: [
      { id: "s1", title: "Repasar capítulo 4 — estadística", date: today, time: "19:00", done: false },
      { id: "s2", title: "Practicar ejercicios de inglés", date: today, done: false },
      { id: "s3", title: "Ver clase grabada de SQL", date: t(1), time: "20:00", done: false },
      { id: "s4", title: "Resumen de la unidad 3", date: y(1), time: "20:00", done: true },
    ],
    finance,
    health,
    reports: [
      {
        id: "r1",
        date: y(1),
        resumenAyer:
          "Se completaron 3 de 5 tareas y 1 de 2 pendientes de estudio. Quedó abierta la presentación del lunes, que ya está reprogramada.",
        hoy: [
          "Enviar informe semanal · 09:30",
          "Llamar al banco por la tarjeta · 11:00",
          "Repasar capítulo 4 · 19:00",
        ],
        plata: { ingresos: 0, egresos: 3200, balance: -3200 },
        habitos: "Día activo. El peso viene bajando de forma sostenida: −0,7 kg en dos semanas.",
      },
      {
        id: "r2",
        date: y(2),
        resumenAyer:
          "Semana cerrada con el 78% de las tareas completadas. Estudio en día, sin arrastre de pendientes.",
        hoy: ["Revisar gastos del mes · 10:00", "Resumen de la unidad 3 · 20:00"],
        plata: { ingresos: 12000, egresos: 8900, balance: 3100 },
        habitos: "Tres días activos en la semana. Buen ritmo, faltó uno para la meta de cuatro.",
      },
    ],
  };
}
