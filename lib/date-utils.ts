export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toISODate(dt);
}

const DIAS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export function formatLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const diaSemana = DIAS[dt.getDay()];
  return `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)} ${d} de ${MESES[m - 1]}`;
}

export function formatShort(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MESES[m - 1].slice(0, 3)}`;
}

export function monthLabel(year: number, month: number): string {
  return `${MESES[month].charAt(0).toUpperCase() + MESES[month].slice(1)} ${year}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function firstWeekdayOfMonth(year: number, month: number): number {
  // 0 = lunes ... 6 = domingo (semana empieza en lunes)
  const jsDay = new Date(year, month, 1).getDay(); // 0 = domingo
  return (jsDay + 6) % 7;
}

export function weekdayShort(index: number): string {
  // index 0 = lunes
  const labels = ["L", "M", "X", "J", "V", "S", "D"];
  return labels[index];
}

export function startOfWeek(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const offset = (dt.getDay() + 6) % 7; // lunes = 0
  dt.setDate(dt.getDate() - offset);
  return toISODate(dt);
}

export function last7Days(fromIso: string): string[] {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) out.push(addDays(fromIso, -i));
  return out;
}

export function last30Days(fromIso: string): string[] {
  const out: string[] = [];
  for (let i = 29; i >= 0; i--) out.push(addDays(fromIso, -i));
  return out;
}
