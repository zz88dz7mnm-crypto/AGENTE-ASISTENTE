"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { formatDayMonth, last7Days, lastNDays, todayISO, weekdayShort, weekdayIndex } from "@/lib/date-utils";
import { PageHeader } from "@/components/page-header";
import { StatTile } from "@/components/stat-tile";
import { AreaChart } from "@/components/charts";
import { IconHeart } from "@/components/icons";
import { Card, Empty, PageSkeleton, SectionLabel } from "@/components/ui";

export default function SaludPage() {
  const { health, upsertHealth, ready } = useStore();
  const [weightInput, setWeightInput] = useState("");
  const today = todayISO();

  const todayEntry = health.find((h) => h.date === today);
  const days30 = useMemo(() => lastNDays(today, 30), [today]);
  const days7 = useMemo(() => last7Days(today), [today]);

  const weightSeries = useMemo(() => {
    const byDate = new Map(health.map((h) => [h.date, h]));
    return days30
      .map((d) => ({ label: formatDayMonth(d), value: byDate.get(d)?.weight }))
      .filter((p): p is { label: string; value: number } => typeof p.value === "number");
  }, [days30, health]);

  const activeSet = useMemo(
    () => new Set(health.filter((h) => h.active).map((h) => h.date)),
    [health]
  );

  const activeDays7 = days7.filter((d) => activeSet.has(d)).length;
  const activeDays30 = days30.filter((d) => activeSet.has(d)).length;

  const streak = useMemo(() => {
    // Se cuenta hacia atrás desde hoy. Si hoy todavía no está marcado, la racha
    // arranca en ayer: de lo contrario mostraría 0 durante todo el día hasta
    // que el usuario marque la actividad.
    let i = days30.length - 1;
    if (!activeSet.has(days30[i])) i--;
    let n = 0;
    for (; i >= 0; i--) {
      if (activeSet.has(days30[i])) n++;
      else break;
    }
    return n;
  }, [days30, activeSet]);

  const lastWeight = weightSeries[weightSeries.length - 1]?.value;
  const firstWeight = weightSeries[0]?.value;
  const delta = lastWeight != null && firstWeight != null ? lastWeight - firstWeight : null;

  function saveWeight() {
    const n = parseFloat(weightInput);
    if (!n) return;
    upsertHealth(today, { weight: n });
    setWeightInput("");
  }

  if (!ready) return <PageSkeleton />;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Hábitos"
        title="Salud"
        subtitle="Peso y actividad física, con comparación entre períodos."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Peso actual" value={lastWeight != null ? `${lastWeight.toFixed(1)} kg` : "—"} />
        <StatTile
          label="Variación 30 días"
          value={delta != null ? `${delta > 0 ? "+" : "−"}${Math.abs(delta).toFixed(1)} kg` : "—"}
          tone={delta == null ? "default" : delta > 0 ? "alert" : "positive"}
          trend={delta == null ? undefined : delta > 0 ? "up" : "down"}
        />
        <StatTile label="Días activos" value={`${activeDays7}/7`} hint={`${activeDays30}/30 en el mes`} tone="accent" />
        <StatTile
          label="Racha"
          value={`${streak} día${streak === 1 ? "" : "s"}`}
          hint="consecutivos"
          icon={<IconHeart size={14} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <SectionLabel
            right={
              <span className="text-[11px]" style={{ color: "var(--color-text-faint)" }}>
                kg · 30 días
              </span>
            }
          >
            Evolución del peso
          </SectionLabel>
          {weightSeries.length > 1 ? (
            <AreaChart data={weightSeries} unit=" kg" />
          ) : (
            <Empty
              title="Sin suficientes registros"
              hint="Cargá el peso de hoy para empezar la serie."
              icon={<IconHeart size={17} />}
            />
          )}
        </Card>

        <Card>
          <SectionLabel
            right={
              <span className="text-[11px]" style={{ color: "var(--color-text-faint)" }}>
                {activeDays30} activos
              </span>
            }
          >
            Actividad · 30 días
          </SectionLabel>
          <WeekGrid days={days30} activeSet={activeSet} today={today} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="card card-raised flex items-center gap-2 p-2.5">
          <input
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveWeight()}
            type="number"
            step="0.1"
            placeholder="Peso de hoy (kg)"
            className="input font-num flex-1"
          />
          <button onClick={saveWeight} className="btn btn-primary shrink-0">
            Guardar
          </button>
        </div>

        <div className="card flex items-center justify-between gap-3 p-3.5">
          <div className="min-w-0">
            <p className="text-[14px] font-medium">Actividad de hoy</p>
            <p className="text-[11.5px] muted">Marcá si hiciste actividad física.</p>
          </div>
          <button
            onClick={() => upsertHealth(today, { active: !todayEntry?.active })}
            className="btn shrink-0"
            style={{
              background: todayEntry?.active ? "var(--color-positive)" : "transparent",
              color: todayEntry?.active ? "var(--color-surface)" : "var(--color-text-soft)",
              borderColor: todayEntry?.active ? "transparent" : "var(--color-border)",
            }}
          >
            {todayEntry?.active ? "Día activo" : "Marcar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function WeekGrid({
  days,
  activeSet,
  today,
}: {
  days: string[];
  activeSet: Set<string>;
  today: string;
}) {
  // Columnas = semanas, filas = días de la semana (lunes arriba)
  const cols: (string | null)[][] = [];
  let current: (string | null)[] = Array(7).fill(null);
  days.forEach((d, i) => {
    const wd = weekdayIndex(d);
    if (i > 0 && wd === 0) {
      cols.push(current);
      current = Array(7).fill(null);
    }
    current[wd] = d;
  });
  cols.push(current);

  return (
    <div className="flex gap-2">
      <div className="flex flex-col gap-[5px] pr-1">
        {Array.from({ length: 7 }, (_, i) => (
          <span
            key={i}
            className="flex h-[17px] items-center text-[9.5px] font-semibold"
            style={{ color: "var(--color-text-faint)", letterSpacing: "0.06em" }}
          >
            {weekdayShort(i)}
          </span>
        ))}
      </div>
      <div className="flex gap-[5px]">
        {cols.map((week, ci) => (
          <div key={ci} className="flex flex-col gap-[5px]">
            {week.map((d, ri) => {
              if (!d) return <span key={ri} style={{ height: 17, width: 17 }} />;
              const on = activeSet.has(d);
              return (
                <span
                  key={d}
                  title={d}
                  className="rounded-[5px]"
                  style={{
                    height: 17,
                    width: 17,
                    background: on ? "var(--color-positive)" : "var(--color-surface-2)",
                    border: `1px solid ${
                      d === today ? "var(--color-accent)" : on ? "transparent" : "var(--color-border)"
                    }`,
                    opacity: on ? 1 : 0.9,
                    animation: `fade 0.4s var(--ease-out) ${(ci * 7 + ri) * 0.008}s both`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
