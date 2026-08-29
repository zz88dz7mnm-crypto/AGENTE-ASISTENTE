"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppData, DailyReport, FinanceEntry, HealthEntry, TaskItem } from "./types";
import { buildSampleData } from "./sample-data";
import { isSupabaseConfigured, supabase } from "./supabase";
import { useAuth } from "./auth";

const STORAGE_KEY = "agente-prueba:data:v1";

function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 10);
}

type TaskPatch = Partial<Omit<TaskItem, "id">>;

interface Store extends AppData {
  ready: boolean;
  /** true cuando los datos vienen de Supabase y no de localStorage. */
  remote: boolean;
  /** Mensaje de la última escritura fallida, para avisar sin romper la vista. */
  error: string | null;
  addTask: (title: string, date: string, time?: string) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  updateTask: (id: string, patch: TaskPatch) => void;
  addStudy: (title: string, date: string, time?: string) => void;
  toggleStudy: (id: string) => void;
  removeStudy: (id: string) => void;
  updateStudy: (id: string, patch: TaskPatch) => void;
  addFinance: (entry: Omit<FinanceEntry, "id">) => void;
  removeFinance: (id: string) => void;
  upsertHealth: (date: string, patch: Partial<Omit<HealthEntry, "id" | "date">>) => void;
  resetSampleData: () => void;
}

const StoreContext = createContext<Store | null>(null);

function isValid(data: unknown): data is AppData {
  if (!data || typeof data !== "object") return false;
  const d = data as Partial<AppData>;
  return (
    Array.isArray(d.tasks) &&
    Array.isArray(d.study) &&
    Array.isArray(d.finance) &&
    Array.isArray(d.health) &&
    Array.isArray(d.reports)
  );
}

const EMPTY: AppData = { tasks: [], study: [], finance: [], health: [], reports: [] };

/* ------------------------------------------------------------------ mapeo */
// La base usa snake_case y columnas planas; la app usa camelCase y `plata`
// anidada. Estas funciones son el único punto donde conviven las dos formas.

type TaskRow = { id: string; title: string; date: string; time: string | null; done: boolean };
type FinanceRow = {
  id: string;
  type: FinanceEntry["type"];
  amount: number | string;
  category: string;
  date: string;
  note: string | null;
};
type HealthRow = { id: string; date: string; weight: number | string | null; active: boolean };
type ReportRow = {
  id: string;
  date: string;
  resumen_ayer: string;
  hoy: string[];
  ingresos: number | string;
  egresos: number | string;
  habitos: string;
};

const num = (v: number | string | null | undefined): number => (v == null ? 0 : Number(v));

const toTask = (r: TaskRow): TaskItem => ({
  id: r.id,
  title: r.title,
  date: r.date,
  time: r.time ?? undefined,
  done: r.done,
});

const toFinance = (r: FinanceRow): FinanceEntry => ({
  id: r.id,
  type: r.type,
  amount: num(r.amount),
  category: r.category,
  date: r.date,
  note: r.note ?? undefined,
});

const toHealth = (r: HealthRow): HealthEntry => ({
  id: r.id,
  date: r.date,
  weight: r.weight == null ? undefined : Number(r.weight),
  active: r.active,
});

const toReport = (r: ReportRow): DailyReport => ({
  id: r.id,
  date: r.date,
  resumenAyer: r.resumen_ayer,
  hoy: Array.isArray(r.hoy) ? r.hoy : [],
  plata: {
    ingresos: num(r.ingresos),
    egresos: num(r.egresos),
    balance: num(r.ingresos) - num(r.egresos),
  },
  habitos: r.habitos,
});

/* ---------------------------------------------------------------- provider */

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { userId, ready: authReady } = useAuth();
  const remote = isSupabaseConfigured && Boolean(userId);

  const [data, setData] = useState<AppData>(buildSampleData);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Evita que una recarga en curso pise una edición más nueva del usuario.
  const loadToken = useRef(0);

  const reload = useCallback(async () => {
    if (!supabase || !userId) return;
    const token = ++loadToken.current;

    const [tasks, study, finance, health, reports] = await Promise.all([
      supabase.from("tasks").select("id,title,date,time,done").order("date"),
      supabase.from("study").select("id,title,date,time,done").order("date"),
      supabase.from("finance").select("id,type,amount,category,date,note").order("date", { ascending: false }),
      supabase.from("health").select("id,date,weight,active").order("date", { ascending: false }),
      supabase
        .from("reports")
        .select("id,date,resumen_ayer,hoy,ingresos,egresos,habitos")
        .order("date", { ascending: false }),
    ]);

    if (token !== loadToken.current) return;

    const failure = [tasks, study, finance, health, reports].find((r) => r.error);
    if (failure?.error) {
      setError(`No se pudieron cargar los datos: ${failure.error.message}`);
      setReady(true);
      return;
    }

    setError(null);
    setData({
      tasks: (tasks.data ?? []).map(toTask),
      study: (study.data ?? []).map(toTask),
      finance: (finance.data ?? []).map(toFinance),
      health: (health.data ?? []).map(toHealth),
      reports: (reports.data ?? []).map(toReport),
    });
    setReady(true);
  }, [userId]);

  // Bootstrap del origen de datos. Es un efecto a propósito: tanto localStorage
  // como Supabase son sistemas externos al render y sólo existen en el cliente,
  // así que el servidor no puede resolverlos sin romper la hidratación.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!authReady) return;

    if (remote) {
      setReady(false);
      // Arranca vacío para no mostrar datos de ejemplo mientras carga la cuenta.
      setData(EMPTY);
      void reload();
      return;
    }

    if (isSupabaseConfigured) {
      // Configurado pero sin sesión: no hay nada que mostrar (el AuthGate
      // muestra el login por encima de todo esto).
      setData(EMPTY);
      setReady(true);
      return;
    }

    // Modo local: hidratación única desde localStorage.
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isValid(parsed)) setData(parsed);
      }
    } catch {
      // localStorage no disponible: seguimos con datos de ejemplo en memoria
    }
    setReady(true);
  }, [authReady, remote, reload]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!ready || remote || isSupabaseConfigured) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // sin espacio o sin acceso: se ignora silenciosamente
    }
  }, [data, ready, remote]);

  /**
   * Aplica el cambio en pantalla al instante y lo manda a la base. Si la
   * escritura falla, recarga desde el servidor para no dejar en pantalla algo
   * que en realidad no se guardó.
   */
  const mutate = useCallback(
    (optimistic: (d: AppData) => AppData, write?: () => PromiseLike<{ error: { message: string } | null }>) => {
      setData(optimistic);
      if (!remote || !write) return;
      void (async () => {
        const { error: writeError } = await write();
        if (writeError) {
          setError(`No se pudo guardar: ${writeError.message}`);
          void reload();
        } else {
          setError(null);
        }
      })();
    },
    [remote, reload]
  );

  const addItem = useCallback(
    (table: "tasks" | "study", key: "tasks" | "study") =>
      (title: string, date: string, time?: string) => {
        const item: TaskItem = { id: uid(), title, date, time, done: false };
        mutate(
          (d) => ({ ...d, [key]: [...d[key], item] }),
          () =>
            supabase!
              .from(table)
              .insert({ id: item.id, user_id: userId, title, date, time: time ?? null, done: false })
        );
      },
    [mutate, userId]
  );

  const toggleItem = useCallback(
    (table: "tasks" | "study", key: "tasks" | "study") => (id: string) => {
      let next = false;
      mutate(
        (d) => ({
          ...d,
          [key]: d[key].map((t) => {
            if (t.id !== id) return t;
            next = !t.done;
            return { ...t, done: next };
          }),
        }),
        () => supabase!.from(table).update({ done: next }).eq("id", id)
      );
    },
    [mutate]
  );

  const removeItem = useCallback(
    (table: "tasks" | "study", key: "tasks" | "study") => (id: string) => {
      mutate(
        (d) => ({ ...d, [key]: d[key].filter((t) => t.id !== id) }),
        () => supabase!.from(table).delete().eq("id", id)
      );
    },
    [mutate]
  );

  const updateItem = useCallback(
    (table: "tasks" | "study", key: "tasks" | "study") => (id: string, patch: TaskPatch) => {
      mutate(
        (d) => ({ ...d, [key]: d[key].map((t) => (t.id === id ? { ...t, ...patch } : t)) }),
        () =>
          supabase!
            .from(table)
            .update({
              ...(patch.title !== undefined ? { title: patch.title } : {}),
              ...(patch.date !== undefined ? { date: patch.date } : {}),
              ...(patch.time !== undefined ? { time: patch.time ?? null } : {}),
              ...(patch.done !== undefined ? { done: patch.done } : {}),
            })
            .eq("id", id)
      );
    },
    [mutate]
  );

  const addTask = useMemo(() => addItem("tasks", "tasks"), [addItem]);
  const toggleTask = useMemo(() => toggleItem("tasks", "tasks"), [toggleItem]);
  const removeTask = useMemo(() => removeItem("tasks", "tasks"), [removeItem]);
  const updateTask = useMemo(() => updateItem("tasks", "tasks"), [updateItem]);

  const addStudy = useMemo(() => addItem("study", "study"), [addItem]);
  const toggleStudy = useMemo(() => toggleItem("study", "study"), [toggleItem]);
  const removeStudy = useMemo(() => removeItem("study", "study"), [removeItem]);
  const updateStudy = useMemo(() => updateItem("study", "study"), [updateItem]);

  const addFinance = useCallback(
    (entry: Omit<FinanceEntry, "id">) => {
      const row: FinanceEntry = { id: uid(), ...entry };
      mutate(
        (d) => ({ ...d, finance: [row, ...d.finance] }),
        () =>
          supabase!.from("finance").insert({
            id: row.id,
            user_id: userId,
            type: row.type,
            amount: row.amount,
            category: row.category,
            date: row.date,
            note: row.note ?? null,
          })
      );
    },
    [mutate, userId]
  );

  const removeFinance = useCallback(
    (id: string) => {
      mutate(
        (d) => ({ ...d, finance: d.finance.filter((f) => f.id !== id) }),
        () => supabase!.from("finance").delete().eq("id", id)
      );
    },
    [mutate]
  );

  const upsertHealth = useCallback(
    (date: string, patch: Partial<Omit<HealthEntry, "id" | "date">>) => {
      // La fila del día puede no existir todavía: se resuelve con upsert sobre
      // la clave (user_id, date), que es única en la base.
      let merged: HealthEntry = { id: uid(), date, ...patch };
      mutate(
        (d) => {
          const existing = d.health.find((h) => h.date === date);
          merged = existing ? { ...existing, ...patch } : merged;
          return {
            ...d,
            health: existing
              ? d.health.map((h) => (h.date === date ? merged : h))
              : [merged, ...d.health],
          };
        },
        () =>
          supabase!.from("health").upsert(
            {
              user_id: userId,
              date,
              weight: merged.weight ?? null,
              active: merged.active ?? false,
            },
            { onConflict: "user_id,date" }
          )
      );
    },
    [mutate, userId]
  );

  const resetSampleData = useCallback(() => {
    if (remote) return; // en modo conectado los datos reales no se pisan
    setData(buildSampleData());
  }, [remote]);

  const value = useMemo<Store>(
    () => ({
      ...data,
      ready,
      remote,
      error,
      addTask,
      toggleTask,
      removeTask,
      updateTask,
      addStudy,
      toggleStudy,
      removeStudy,
      updateStudy,
      addFinance,
      removeFinance,
      upsertHealth,
      resetSampleData,
    }),
    [
      data,
      ready,
      remote,
      error,
      addTask,
      toggleTask,
      removeTask,
      updateTask,
      addStudy,
      toggleStudy,
      removeStudy,
      updateStudy,
      addFinance,
      removeFinance,
      upsertHealth,
      resetSampleData,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de DataProvider");
  return ctx;
}
