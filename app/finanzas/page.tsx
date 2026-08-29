"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { formatShort, last7Days, todayISO } from "@/lib/date-utils";
import { PageHeader } from "@/components/page-header";
import { StatTile } from "@/components/stat-tile";
import { BarChart } from "@/components/bar-chart";
import { VoiceExpense } from "@/components/voice-expense";
import { IconPlus, IconTrash } from "@/components/icons";
import { FinanceType } from "@/lib/types";

export default function FinanzasPage() {
  const { finance, addFinance, removeFinance, ready } = useStore();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<FinanceType>("egreso");
  const [range, setRange] = useState<"semana" | "mes">("semana");

  const today = todayISO();

  const days = last7Days(today);
  const weekly = useMemo(
    () =>
      days.map((d) => {
        const dayEntries = finance.filter((f) => f.date === d);
        const balance = dayEntries.reduce(
          (acc, f) => acc + (f.type === "ingreso" ? f.amount : -f.amount),
          0
        );
        return { label: formatShort(d), value: balance };
      }),
    [days, finance]
  );

  const periodEntries = useMemo(() => {
    const limit = range === "semana" ? 7 : 30;
    const cutoffSet = new Set(range === "semana" ? days : undefined);
    return finance.filter((f) => {
      if (range === "semana") return cutoffSet.has(f.date);
      const diff =
        (new Date(today).getTime() - new Date(f.date).getTime()) / 86400000;
      return diff >= 0 && diff < limit;
    });
  }, [finance, range, days, today]);

  const ingresos = periodEntries
    .filter((f) => f.type === "ingreso")
    .reduce((a, f) => a + f.amount, 0);
  const egresos = periodEntries
    .filter((f) => f.type === "egreso")
    .reduce((a, f) => a + f.amount, 0);

  function submit() {
    const n = parseFloat(amount);
    if (!n || !category.trim()) return;
    addFinance({ type, amount: n, category: category.trim(), date: today });
    setAmount("");
    setCategory("");
  }

  if (!ready) return null;

  return (
    <div>
      <PageHeader title="Finanzas" subtitle="Ingresos y egresos con estadísticas simples." />

      <VoiceExpense onCapture={(entry) => addFinance(entry)} />

      <div className="mt-4 flex items-center justify-end gap-1">
        {(["semana", "mes"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className="rounded-full px-3 py-1 text-[12px] capitalize"
            style={{
              background: range === r ? "var(--color-accent)" : "transparent",
              color: range === r ? "var(--color-surface)" : "var(--color-text-soft)",
            }}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="mt-2 flex gap-3">
        <StatTile label={`Ingresos (${range})`} value={`$${ingresos.toLocaleString("es-AR")}`} tone="positive" />
        <StatTile label={`Egresos (${range})`} value={`$${egresos.toLocaleString("es-AR")}`} tone="alert" />
      </div>

      <section className="card mt-4 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[12px] uppercase tracking-wide" style={{ color: "var(--color-text-soft)" }}>
            Balance diario · últimos 7 días
          </p>
        </div>
        <BarChart data={weekly} />
      </section>

      <section className="card mt-4 flex items-center gap-2 p-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as FinanceType)}
          className="rounded-md border bg-transparent px-2 py-1.5 text-[13px] outline-none"
          style={{ borderColor: "var(--color-border)" }}
        >
          <option value="egreso">Egreso</option>
          <option value="ingreso">Ingreso</option>
        </select>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Categoría"
          className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-[14px] outline-none placeholder:text-[var(--color-text-soft)]"
        />
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          type="number"
          placeholder="Monto"
          className="font-num w-[90px] shrink-0 bg-transparent px-2 py-1.5 text-[13px] outline-none placeholder:text-[var(--color-text-soft)]"
        />
        <button
          onClick={submit}
          aria-label="Agregar movimiento"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white"
          style={{ background: "var(--color-accent)" }}
        >
          <IconPlus size={15} />
        </button>
      </section>

      <div className="mt-4 flex flex-col gap-2">
        {finance.slice(0, 12).map((f) => (
          <div key={f.id} className="card group flex items-center gap-3 px-3 py-2.5">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: f.type === "ingreso" ? "var(--color-positive)" : "var(--color-alert)" }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px]">{f.category}</p>
              <p className="text-[11px]" style={{ color: "var(--color-text-soft)" }}>
                {formatShort(f.date)}
              </p>
            </div>
            <span
              className="font-num shrink-0 text-[13px]"
              style={{ color: f.type === "ingreso" ? "var(--color-positive)" : "var(--color-alert)" }}
            >
              {f.type === "ingreso" ? "+" : "-"}${f.amount.toLocaleString("es-AR")}
            </span>
            <button
              onClick={() => removeFinance(f.id)}
              className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              style={{ color: "var(--color-text-soft)" }}
              aria-label="Eliminar movimiento"
            >
              <IconTrash />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
