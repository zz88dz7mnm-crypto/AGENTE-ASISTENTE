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

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

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

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${cap(DIAS[dt.getDay()])} ${d} de ${MESES[m - 1]}`;
}

export function formatShort(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MESES[m - 1].slice(0, 3)}`;
}

export function formatDayMonth(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}`;
}

export function monthLabel(year: number, month: number): string {
  return `${cap(MESES[month])} ${year}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function firstWeekdayOfMonth(year: number, month: number): number {
  // 0 = lunes ... 6 = domingo (la semana empieza en lunes)
  const jsDay = new Date(year, month, 1).getDay();
  return (jsDay + 6) % 7;
}

export function weekdayShort(index: number): string {
  return ["L", "M", "X", "J", "V", "S", "D"][index];
}

export function weekdayIndex(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return (new Date(y, m - 1, d).getDay() + 6) % 7;
}

export function startOfWeek(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
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

export function lastNDays(fromIso: string, n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(fromIso, -i));
  return out;
}

export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round(
    (new Date(by, bm - 1, bd).getTime() - new Date(ay, am - 1, ad).getTime()) / 86400000
  );
}

export function relativeDayLabel(iso: string, today: string): string {
  const diff = daysBetween(today, iso);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff === -1) return "Ayer";
  if (diff > 1 && diff < 7) {
    const [y, m, d] = iso.split("-").map(Number);
    return cap(DIAS[new Date(y, m - 1, d).getDay()]);
  }
  return formatShort(iso);
}

export function timeToMinutes(time?: string): number {
  if (!time) return -1;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Buenas noches";
  if (h < 13) return "Buen día";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

export function money(n: number): string {
  const abs = Math.abs(Math.round(n));
  return `$${abs.toLocaleString("es-AR")}`;
}

export function moneySigned(n: number): string {
  return `${n < 0 ? "−" : "+"}${money(n)}`;
}

export function compactMoney(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${Math.round(n / 1000)}k`;
  return String(Math.round(n));
}
