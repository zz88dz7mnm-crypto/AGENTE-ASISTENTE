"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  compactMoney,
  formatDayMonth,
  formatShort,
  last7Days,
  lastNDays,
  money,
  moneySigned,
  todayISO,
} from "@/lib/date-utils";
import { PageHeader } from "@/components/page-header";
import { StatTile } from "@/components/stat-tile";
import { BarChart, CategoryBars } from "@/components/charts";
import { VoiceExpense } from "@/components/voice-expense";
import { IconPlus, IconTrash, IconWallet } from "@/components/icons";
import { Card, Empty, PageSkeleton, SectionLabel, Segmented } from "@/components/ui";
import { FinanceType } from "@/lib/types";

const RANGES = ["semana", "mes"] as const;
type Range = (typeof RANGES)[number];

export default function FinanzasPage() {
  const { finance, addFinance, removeFinance, ready } = useStore();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<FinanceType>("egreso");
  const [range, setRange] = useState<Range>("semana");

  const today = todayISO();
  const days = useMemo(() => last7Days(today), [today]);
  const days30 = useMemo(() => lastNDays(today, 30), [today]);

  const daily = useMemo(
    () =>
      days.map((d) => ({
        label: formatDayMonth(d).slice(0, 5),
        value: finance
          .filter((f) => f.date === d)
          .reduce((acc, f) => acc + (f.type === "ingreso" ? f.amount : -f.amount), 0),
      })),
    [days, finance]
  );

  const periodDays = range === "semana" ? days : days30;
  const periodEntries = useMemo(
    () => finance.filter((f) => periodDays.includes(f.date)),
    [finance, periodDays]
  );

  const ingresos = periodEntries.filter((f) => f.type === "ingreso").reduce((a, f) => a + f.amount, 0);
  const egresos = periodEntries.filter((f) => f.type === "egreso").reduce((a, f) => a + f.amount, 0);
  const balance = ingresos - egresos;

  // Ordenados por fecha: la lista es "recientes", y un movimiento cargado con
  // fecha vieja no debe encabezarla solo por haber sido el último en entrar.
  const recent = useMemo(
    () => [...finance].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, 14),
    [finance]
  );

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    periodEntries
      .filter((f) => f.type === "egreso")
      .forEach((f) => map.set(f.category, (map.get(f.category) ?? 0) + f.amount));
    return [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [periodEntries]);

  function submit() {
    // El signo lo define el tipo (ingreso/egreso), no el número: un monto
    // negativo tipeado por error invertiría el movimiento sin avisar.
    const n = Math.abs(parseFloat(amount));
    if (!Number.isFinite(n) || n === 0 || !category.trim()) return;
    addFinance({ type, amount: n, category: category.trim(), date: today });
    setAmount("");
    setCategory("");
  }

  if (!ready) return <PageSkeleton />;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Plata"
        title="Finanzas"
        subtitle="Ingresos y egresos con estadísticas simples. La carga por voz interpreta monto y categoría sola."
        actions={<Segmented value={range} options={RANGES} onChange={setRange} />}
      />

      <VoiceExpense onCapture={addFinance} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label={`Ingresos · ${range}`} value={money(ingresos)} tone="positive" trend="up" />
        <StatTile label={`Egresos · ${range}`} value={money(egresos)} tone="alert" trend="down" />
        <StatTile
          label={`Balance · ${range}`}
          value={moneySigned(balance)}
          tone={balance >= 0 ? "positive" : "alert"}
          hint={`${periodEntries.length} movimientos`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1fr]">
        <Card>
          <SectionLabel
            right={
              <span className="text-[11px]" style={{ color: "var(--color-text-faint)" }}>
                balance diario
              </span>
            }
          >
            Últimos 7 días
          </SectionLabel>
          <BarChart data={daily} formatValue={(n) => `${n < 0 ? "−" : "+"}${compactMoney(Math.abs(n))}`} />
        </Card>

        <Card>
          <SectionLabel>Egresos por categoría</SectionLabel>
          {categories.length === 0 ? (
            <Empty title="Sin egresos en el período" icon={<IconWallet size={17} />} />
          ) : (
            <CategoryBars data={categories} total={egresos} formatValue={money} />
          )}
        </Card>
      </div>

      <div className="card card-raised flex flex-col gap-2 p-2.5 sm:flex-row sm:items-center">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as FinanceType)}
          className="field shrink-0 py-2"
        >
          <option value="egreso">Egreso</option>
          <option value="ingreso">Ingreso</option>
        </select>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Categoría"
          className="input flex-1"
        />
        <div className="flex items-center gap-2">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            type="number"
            placeholder="Monto"
            className="input font-num flex-1 sm:w-[110px] sm:flex-none"
          />
          <button onClick={submit} aria-label="Agregar movimiento" className="btn btn-primary shrink-0 px-3">
            <IconPlus size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <SectionLabel>Movimientos recientes</SectionLabel>
        {recent.map((f, i) => (
          <div
            key={f.id}
            className="card hoverable group flex items-center gap-3 px-3.5 py-3"
            style={{ animation: `rise 0.4s var(--ease-out) ${i * 0.025}s both` }}
          >
            <span
              className="h-6 w-1 shrink-0 rounded-full"
              style={{
                background: f.type === "ingreso" ? "var(--color-positive)" : "var(--color-alert)",
                opacity: 0.85,
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px]">{f.category}</p>
              <p className="truncate text-[11.5px] muted">
                {formatShort(f.date)}
                {f.note ? ` · ${f.note}` : ""}
              </p>
            </div>
            <span
              className="font-num shrink-0 text-[13.5px]"
              style={{ color: f.type === "ingreso" ? "var(--color-positive)" : "var(--color-alert)" }}
            >
              {f.type === "ingreso" ? "+" : "−"}
              {money(f.amount)}
            </span>
            <button
              onClick={() => removeFinance(f.id)}
              className="icon-btn reveal shrink-0"
              aria-label="Eliminar movimiento"
            >
              <IconTrash size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
