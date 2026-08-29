"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppData, FinanceEntry, HealthEntry } from "./types";
import { buildSampleData } from "./sample-data";

const STORAGE_KEY = "agente-prueba:data:v1";

function loadInitial(): AppData {
  return buildSampleData();
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

interface Store extends AppData {
  ready: boolean;
  addTask: (title: string, date: string, time?: string) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  addStudy: (title: string, date: string, time?: string) => void;
  toggleStudy: (id: string) => void;
  removeStudy: (id: string) => void;
  addFinance: (entry: Omit<FinanceEntry, "id">) => void;
  removeFinance: (id: string) => void;
  upsertHealth: (date: string, patch: Partial<Omit<HealthEntry, "id" | "date">>) => void;
  resetSampleData: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(loadInitial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Hidratación única desde localStorage al montar en el cliente: el servidor
    // siempre renderiza los datos de ejemplo para evitar un mismatch de hidratación.
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setData(JSON.parse(raw));
    } catch {
      // localStorage no disponible: seguimos con datos de ejemplo en memoria
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // sin espacio o sin acceso a localStorage: se ignora silenciosamente
    }
  }, [data, ready]);

  const addTask = useCallback((title: string, date: string, time?: string) => {
    setData((d) => ({
      ...d,
      tasks: [...d.tasks, { id: uid(), title, date, time, done: false }],
    }));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      tasks: d.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  }, []);

  const removeTask = useCallback((id: string) => {
    setData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
  }, []);

  const addStudy = useCallback((title: string, date: string, time?: string) => {
    setData((d) => ({
      ...d,
      study: [...d.study, { id: uid(), title, date, time, done: false }],
    }));
  }, []);

  const toggleStudy = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      study: d.study.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  }, []);

  const removeStudy = useCallback((id: string) => {
    setData((d) => ({ ...d, study: d.study.filter((t) => t.id !== id) }));
  }, []);

  const addFinance = useCallback((entry: Omit<FinanceEntry, "id">) => {
    setData((d) => ({
      ...d,
      finance: [{ id: uid(), ...entry }, ...d.finance],
    }));
  }, []);

  const removeFinance = useCallback((id: string) => {
    setData((d) => ({ ...d, finance: d.finance.filter((f) => f.id !== id) }));
  }, []);

  const upsertHealth = useCallback(
    (date: string, patch: Partial<Omit<HealthEntry, "id" | "date">>) => {
      setData((d) => {
        const existing = d.health.find((h) => h.date === date);
        if (existing) {
          return {
            ...d,
            health: d.health.map((h) =>
              h.date === date ? { ...h, ...patch } : h
            ),
          };
        }
        return { ...d, health: [{ id: uid(), date, ...patch }, ...d.health] };
      });
    },
    []
  );

  const resetSampleData = useCallback(() => {
    setData(buildSampleData());
  }, []);

  const value = useMemo<Store>(
    () => ({
      ...data,
      ready,
      addTask,
      toggleTask,
      removeTask,
      addStudy,
      toggleStudy,
      removeStudy,
      addFinance,
      removeFinance,
      upsertHealth,
      resetSampleData,
    }),
    [
      data,
      ready,
      addTask,
      toggleTask,
      removeTask,
      addStudy,
      toggleStudy,
      removeStudy,
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
