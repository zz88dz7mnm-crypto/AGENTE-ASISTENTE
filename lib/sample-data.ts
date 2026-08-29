import { AppData } from "./types";
import { addDays, todayISO } from "./date-utils";

// Datos de ejemplo únicamente para probar estructura y diseño en local (Fase 1).
// No representan datos reales del usuario.
export function buildSampleData(): AppData {
  const today = todayISO();
  const y = (n: number) => addDays(today, -n);

  return {
    tasks: [
      { id: "t1", title: "Enviar informe semanal", date: today, time: "09:30", done: false },
      { id: "t2", title: "Llamar al banco", date: today, time: "11:00", done: false },
      { id: "t3", title: "Comprar insumos de oficina", date: today, done: false },
      { id: "t4", title: "Revisar mail pendientes", date: y(1), time: "10:00", done: true },
      { id: "t5", title: "Preparar presentación", date: addDays(today, 1), time: "16:00", done: false },
    ],
    study: [
      { id: "s1", title: "Repasar capítulo 4", date: today, time: "19:00", done: false },
      { id: "s2", title: "Practicar ejercicios de inglés", date: today, done: false },
      { id: "s3", title: "Ver clase grabada", date: y(1), time: "20:00", done: true },
    ],
    finance: [
      { id: "f1", type: "egreso", amount: 4200, category: "Supermercado", date: today, note: "Compra semanal" },
      { id: "f2", type: "egreso", amount: 1500, category: "Transporte", date: y(1) },
      { id: "f3", type: "ingreso", amount: 85000, category: "Sueldo", date: y(3) },
      { id: "f4", type: "egreso", amount: 3200, category: "Comida afuera", date: y(2) },
      { id: "f5", type: "egreso", amount: 8900, category: "Servicios", date: y(4) },
      { id: "f6", type: "egreso", amount: 2100, category: "Transporte", date: y(5) },
      { id: "f7", type: "ingreso", amount: 12000, category: "Freelance", date: y(6) },
      { id: "f8", type: "egreso", amount: 5400, category: "Supermercado", date: y(7) },
    ],
    health: [
      { id: "h1", date: today, weight: 78.2, active: false },
      { id: "h2", date: y(1), weight: 78.4, active: true },
      { id: "h3", date: y(2), weight: 78.5, active: true },
      { id: "h4", date: y(3), weight: 78.6, active: false },
      { id: "h5", date: y(4), weight: 78.9, active: true },
      { id: "h6", date: y(5), weight: 79.0, active: false },
      { id: "h7", date: y(6), weight: 79.1, active: true },
    ],
    reports: [
      {
        id: "r1",
        date: y(1),
        resumenAyer:
          "Se completaron 3 de 5 tareas y 1 de 2 pendientes de estudio. Quedó pendiente la presentación.",
        hoy: ["Enviar informe semanal · 09:30", "Llamar al banco · 11:00", "Repasar capítulo 4 · 19:00"],
        plata: { ingresos: 0, egresos: 1500, balance: -1500 },
        habitos: "Día activo. Peso estable respecto de ayer.",
      },
    ],
  };
}
