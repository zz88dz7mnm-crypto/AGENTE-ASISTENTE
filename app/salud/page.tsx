"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { formatShort, last30Days, last7Days, todayISO } from "@/lib/date-utils";
import { PageHeader } from "@/components/page-header";
import { StatTile } from "@/components/stat-tile";
import { LineChart } from "@/components/bar-chart";
import { IconHeart } from "@/components/icons";

export default function SaludPage() {
  const { health, upsertHealth, ready } = useStore();
  const [weightInput, setWeightInput] = useState("");
  const today = todayISO();

  const todayEntry = health.find((h) => h.date === today);
  const days30 = useMemo(() => last30Days(today), [today]);
  const days7 = useMemo(() => last7Days(today), [today]);

  const weightSeries = useMemo(() => {
    const byDate = new Map(health.map((h) => [h.date, h]));
    return days30
      .map((d) => ({ label: formatShort(d), value: byDate.get(d)?.weight }))
      .filter((p): p is { label: string; value: number } => typeof p.value === "number");
  }, [days30, health]);

  const activeDaysCount = days7.filter((d) => health.find((h) => h.date === d)?.active).length;

  const lastWeight = weightSeries[weightSeries.length - 1]?.value;
  const firstWeight = weightSeries[0]?.value;
  const delta = lastWeight != null && firstWeight != null ? lastWeight - firstWeight : null;

  function saveWeight() {
    const n = parseFloat(weightInput);
    if (!n) return;
    upsertHealth(today, { weight: n });
    setWeightInput("");
  }

  function toggleActive() {
    upsertHealth(today, { active: !todayEntry?.active });
  }

  if (!ready) return null;

  return (
    <div>
      <PageHeader title="Salud" subtitle="Peso y actividad física, con comparación simple." />

      <div className="flex gap-3">
        <StatTile
          label="Peso actual"
          value={lastWeight != null ? `${lastWeight.toFixed(1)} kg` : "—"}
        />
        <StatTile
          label="Variación (30 días)"
          value={delta != null ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg` : "—"}
          tone={delta == null ? "default" : delta > 0 ? "alert" : "positive"}
        />
        <StatTile label="Días activos (semana)" value={`${activeDaysCount}/7`} tone="positive" />
      </div>

      <section className="card mt-4 p-4">
        <p className="mb-3 text-[12px] uppercase tracking-wide" style={{ color: "var(--color-text-soft)" }}>
          Peso · últimos 30 días
        </p>
        {weightSeries.length > 0 ? (
          <LineChart data={weightSeries} />
        ) : (
          <p className="text-[13px]" style={{ color: "var(--color-text-soft)" }}>
            Sin registros de peso todavía.
          </p>
        )}
      </section>

      <section className="card mt-4 flex items-center gap-3 p-3">
        <input
          value={weightInput}
          onChange={(e) => setWeightInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && saveWeight()}
          type="number"
          step="0.1"
          placeholder="Peso de hoy (kg)"
          className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-[14px] outline-none placeholder:text-[var(--color-text-soft)]"
        />
        <button
          onClick={saveWeight}
          className="shrink-0 rounded-md px-3 py-1.5 text-[13px] text-white"
          style={{ background: "var(--color-accent)" }}
        >
          Guardar
        </button>
      </section>

      <section className="card mt-4 flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <IconHeart size={18} className="shrink-0" />
          <div>
            <p className="text-[14px]">Actividad de hoy</p>
            <p className="text-[11px]" style={{ color: "var(--color-text-soft)" }}>
              Marcá si hiciste actividad física hoy.
            </p>
          </div>
        </div>
        <button
          onClick={toggleActive}
          className="shrink-0 rounded-full px-3 py-1.5 text-[13px]"
          style={{
            background: todayEntry?.active ? "var(--color-positive)" : "var(--color-border)",
            color: todayEntry?.active ? "var(--color-surface)" : "var(--color-text-soft)",
          }}
        >
          {todayEntry?.active ? "Activo" : "Marcar"}
        </button>
      </section>

      <section className="mt-4 flex flex-wrap gap-1.5">
        {days30.map((d) => {
          const active = health.find((h) => h.date === d)?.active;
          return (
            <span
              key={d}
              title={d}
              className="h-3 w-3 rounded-[3px]"
              style={{ background: active ? "var(--color-positive)" : "var(--color-border)" }}
            />
          );
        })}
      </section>
    </div>
  );
}
