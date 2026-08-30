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
import {
  AppData,
  DailyReport,
  FinanceEntry,
  HealthEntry,
  TaskItem,
} from "./types";
import { buildSampleData } from "./sample-data";
import { isSupabaseConfigured, OWNER_ID, supabase } from "./supabase";
import { addDays, todayISO } from "./date-utils";

const STORAGE_KEY = "agente-prueba:data:v1";

// Ventanas de consulta. PostgREST corta en 1000 filas sin avisar, así que se
// acota por fecha en vez de confiar en que el volumen nunca llegue al tope.
const HISTORY_DAYS = 730;
const AGENDA_DAYS = 365;

function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
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
  upsertHealth: (
    date: string,
    patch: Partial<Omit<HealthEntry, "id" | "date">>,
  ) => void;
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

const EMPTY: AppData = {
  tasks: [],
  study: [],
  finance: [],
  health: [],
  reports: [],
};

/* ------------------------------------------------------------------ mapeo */
// La base usa snake_case y columnas planas; la app usa camelCase y `plata`
// anidada. Estas funciones son el único punto donde conviven las dos formas.

type TaskRow = {
  id: string;
  title: string;
  date: string;
  time: string | null;
  done: boolean;
};
type FinanceRow = {
  id: string;
  type: FinanceEntry["type"];
  amount: number | string;
  category: string;
  date: string;
  note: string | null;
};
type HealthRow = {
  id: string;
  date: string;
  weight: number | string | null;
  active: boolean;
};
type ReportRow = {
  id: string;
  date: string;
  resumen_ayer: string;
  hoy: string[];
  ingresos: number | string;
  egresos: number | string;
  habitos: string;
};

const num = (v: number | string | null | undefined): number =>
  v == null ? 0 : Number(v);

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

/* --------------------------------------------------------------- escrituras */

/** Lo que devuelve una escritura de PostgREST con `.select()` encadenado. */
type WriteResult = {
  error: { message: string } | null;
  data: { id: string }[] | null;
};

/* ---------------------------------------------------------------- provider */

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Sin login: alcanza con que Supabase esté configurado para trabajar contra
  // la base. Todas las filas pertenecen al dueño fijo OWNER_ID.
  const remote = isSupabaseConfigured;

  const [data, setData] = useState<AppData>(buildSampleData);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Espejo síncrono del estado. Las mutaciones calculan el estado siguiente a
  // partir de acá y no desde el updater de setData: React puede diferir ese
  // updater, y la escritura a la base necesita el valor ya resuelto.
  const dataRef = useRef<AppData>(data);

  // Cualquier recarga en vuelo cuyo token quedó viejo se descarta. Lo
  // incrementan tanto reload() como cada mutación, así que una respuesta que
  // salió antes de una edición del usuario nunca la pisa.
  const loadToken = useRef(0);

  // Escrituras en curso: el aviso de error sólo se limpia cuando no queda
  // ninguna, para no borrar el mensaje de otra que falló en paralelo.
  const inFlight = useRef(0);

  const apply = useCallback((next: AppData) => {
    dataRef.current = next;
    setData(next);
  }, []);

  const reload = useCallback(async () => {
    if (!supabase) return;
    const token = ++loadToken.current;

    const today = todayISO();
    const historyFloor = addDays(today, -HISTORY_DAYS);
    const agendaFloor = addDays(today, -AGENDA_DAYS);

    let tasks, study, finance, health, reports;
    try {
      [tasks, study, finance, health, reports] = await Promise.all([
        supabase
          .from("tasks")
          .select("id,title,date,time,done")
          .gte("date", agendaFloor)
          .order("date"),
        supabase
          .from("study")
          .select("id,title,date,time,done")
          .gte("date", agendaFloor)
          .order("date"),
        supabase
          .from("finance")
          .select("id,type,amount,category,date,note")
          .gte("date", historyFloor)
          .order("date", { ascending: false }),
        supabase
          .from("health")
          .select("id,date,weight,active")
          .gte("date", historyFloor)
          .order("date", { ascending: false }),
        supabase
          .from("reports")
          .select("id,date,resumen_ayer,hoy,ingresos,egresos,habitos")
          .gte("date", historyFloor)
          .order("date", { ascending: false }),
      ]);
    } catch (e) {
      // Sin red, con la base caída o detrás de un portal cautivo, el fetch
      // rechaza en vez de devolver { error }. Sin este catch la app se queda
      // en el esqueleto para siempre y parece rota.
      if (token !== loadToken.current) return;
      setError(
        `Sin conexión con la base. Revisá internet y recargá. (${
          e instanceof Error ? e.message : String(e)
        })`,
      );
      setReady(true);
      return;
    }

    // Si el usuario editó mientras esto viajaba, su edición es más nueva.
    if (token !== loadToken.current) return;

    const failure = [tasks, study, finance, health, reports].find(
      (r) => r.error,
    );
    if (failure?.error) {
      setError(`No se pudieron cargar los datos: ${failure.error.message}`);
      setReady(true);
      return;
    }

    setError(null);
    apply({
      tasks: (tasks.data ?? []).map(toTask),
      study: (study.data ?? []).map(toTask),
      finance: (finance.data ?? []).map(toFinance),
      health: (health.data ?? []).map(toHealth),
      reports: (reports.data ?? []).map(toReport),
    });
    setReady(true);
  }, [apply]);

  // Bootstrap del origen de datos. Es un efecto a propósito: tanto localStorage
  // como Supabase son sistemas externos al render y sólo existen en el cliente,
  // así que el servidor no puede resolverlos sin romper la hidratación.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (remote) {
      setReady(false);
      // Arranca vacío para no mostrar datos de ejemplo mientras carga la cuenta.
      apply(EMPTY);
      void reload();
      return;
    }

    // Modo local: hidratación única desde localStorage.
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isValid(parsed)) apply(parsed);
      }
    } catch {
      // localStorage no disponible: seguimos con datos de ejemplo en memoria
    }
    setReady(true);
  }, [remote, reload, apply]);
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
   * Aplica el cambio en pantalla al instante y lo manda a la base.
   *
   * `compute` se ejecuta acá y no dentro de setData: así el estado siguiente
   * queda resuelto antes de armar la escritura, y lo que se guarda es
   * exactamente lo que se muestra.
   *
   * Si la escritura falla, o si no tocó ninguna fila (PostgREST no lo trata
   * como error), se recarga desde el servidor para no dejar en pantalla algo
   * que en realidad no se guardó.
   */
  const mutate = useCallback(
    (
      compute: (d: AppData) => AppData,
      write?: () => PromiseLike<WriteResult>,
      onWritten?: (rows: { id: string }[]) => void,
    ) => {
      const next = compute(dataRef.current);
      loadToken.current++;
      apply(next);

      if (!remote || !write) return;

      inFlight.current++;
      void (async () => {
        const result = await write();
        inFlight.current--;

        const noRows = !result.error && (result.data?.length ?? 0) === 0;
        if (result.error || noRows) {
          setError(
            result.error
              ? `No se pudo guardar: ${result.error.message}`
              : "No se pudo guardar: la base no registró el cambio.",
          );
          void reload();
          return;
        }

        onWritten?.(result.data ?? []);
        if (inFlight.current === 0) setError(null);
      })();
    },
    [remote, reload, apply],
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
              .insert({
                id: item.id,
                user_id: OWNER_ID,
                title,
                date,
                time: time ?? null,
                done: false,
              })
              .select("id"),
        );
      },
    [mutate],
  );

  const toggleItem = useCallback(
    (table: "tasks" | "study", key: "tasks" | "study") => (id: string) => {
      const current = dataRef.current[key].find((t) => t.id === id);
      if (!current) return;
      const done = !current.done;

      mutate(
        (d) => ({
          ...d,
          [key]: d[key].map((t) => (t.id === id ? { ...t, done } : t)),
        }),
        () => supabase!.from(table).update({ done }).eq("id", id).select("id"),
      );
    },
    [mutate],
  );

  const removeItem = useCallback(
    (table: "tasks" | "study", key: "tasks" | "study") => (id: string) => {
      mutate(
        (d) => ({ ...d, [key]: d[key].filter((t) => t.id !== id) }),
        () => supabase!.from(table).delete().eq("id", id).select("id"),
      );
    },
    [mutate],
  );

  const updateItem = useCallback(
    (table: "tasks" | "study", key: "tasks" | "study") =>
      (id: string, patch: TaskPatch) => {
        mutate(
          (d) => ({
            ...d,
            [key]: d[key].map((t) => (t.id === id ? { ...t, ...patch } : t)),
          }),
          () =>
            supabase!
              .from(table)
              .update({
                ...(patch.title !== undefined ? { title: patch.title } : {}),
                ...(patch.date !== undefined ? { date: patch.date } : {}),
                ...(patch.time !== undefined
                  ? { time: patch.time ?? null }
                  : {}),
                ...(patch.done !== undefined ? { done: patch.done } : {}),
              })
              .eq("id", id)
              .select("id"),
        );
      },
    [mutate],
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
          supabase!
            .from("finance")
            .insert({
              id: row.id,
              user_id: OWNER_ID,
              type: row.type,
              amount: row.amount,
              category: row.category,
              date: row.date,
              note: row.note ?? null,
            })
            .select("id"),
      );
    },
    [mutate],
  );

  const removeFinance = useCallback(
    (id: string) => {
      mutate(
        (d) => ({ ...d, finance: d.finance.filter((f) => f.id !== id) }),
        () => supabase!.from("finance").delete().eq("id", id).select("id"),
      );
    },
    [mutate],
  );

  const upsertHealth = useCallback(
    (date: string, patch: Partial<Omit<HealthEntry, "id" | "date">>) => {
      // La fila del día puede no existir todavía: se resuelve con upsert sobre
      // la clave (user_id, date), que es única en la base. El merge se calcula
      // acá para que lo que se guarda incluya los campos que no vienen en el
      // patch (marcar actividad no debe borrar el peso del día, ni al revés).
      const existing = dataRef.current.health.find((h) => h.date === date);
      const merged: HealthEntry = existing
        ? { ...existing, ...patch }
        : { id: uid(), date, ...patch };

      mutate(
        (d) => ({
          ...d,
          health: existing
            ? d.health.map((h) => (h.date === date ? merged : h))
            : [merged, ...d.health],
        }),
        () =>
          supabase!
            .from("health")
            .upsert(
              {
                user_id: OWNER_ID,
                date,
                weight: merged.weight ?? null,
                active: merged.active ?? false,
              },
              { onConflict: "user_id,date" },
            )
            .select("id"),
        // El id lo genera la base en el alta: se adopta el real para que la
        // fila local no quede con un id fantasma que no existe en Supabase.
        (rows) => {
          const realId = rows[0]?.id;
          if (!realId || realId === merged.id) return;
          apply({
            ...dataRef.current,
            health: dataRef.current.health.map((h) =>
              h.date === date ? { ...h, id: realId } : h,
            ),
          });
        },
      );
    },
    [mutate, apply],
  );

  const resetSampleData = useCallback(() => {
    if (remote) return; // en modo conectado los datos reales no se pisan
    apply(buildSampleData());
  }, [remote, apply]);

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
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de DataProvider");
  return ctx;
}
