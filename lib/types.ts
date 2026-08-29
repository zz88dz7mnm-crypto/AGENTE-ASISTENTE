export type ID = string;

export interface TaskItem {
  id: ID;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm, optional
  done: boolean;
}

export type StudyItem = TaskItem;

export type FinanceType = "ingreso" | "egreso";

export interface FinanceEntry {
  id: ID;
  type: FinanceType;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  note?: string;
}

export interface HealthEntry {
  id: ID;
  date: string; // YYYY-MM-DD
  weight?: number; // kg
  active?: boolean; // día de actividad física
}

export interface DailyReport {
  id: ID;
  date: string; // YYYY-MM-DD
  resumenAyer: string;
  hoy: string[];
  plata: {
    ingresos: number;
    egresos: number;
    balance: number;
  };
  habitos: string;
}

export interface AppData {
  tasks: TaskItem[];
  study: StudyItem[];
  finance: FinanceEntry[];
  health: HealthEntry[];
  reports: DailyReport[];
}
