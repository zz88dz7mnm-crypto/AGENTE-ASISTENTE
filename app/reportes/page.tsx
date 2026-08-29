"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { formatLong, money, moneySigned, relativeDayLabel, todayISO } from "@/lib/date-utils";
import { PageHeader } from "@/components/page-header";
import { IconFile } from "@/components/icons";
import { Card, Empty, PageSkeleton, SectionLabel } from "@/components/ui";

export default function ReportesPage() {
  const { reports, ready } = useStore();
  const today = todayISO();
  const sorted = [...reports].sort((a, b) => (a.date < b.date ? 1 : -1));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = sorted.find((r) => r.id === selectedId) ?? sorted[0];

  if (!ready) return <PageSkeleton />;

  return (
    <div>
      <PageHeader
        eyebrow="Automático · 2:00 AM"
        title="Reportes"
        subtitle="Se generan solos todas las noches: cómo cerró el día anterior y qué toca hoy. Histórico navegable por fecha."
      />

      {sorted.length === 0 ? (
        <Card>
          <Empty
            title="Todavía no hay reportes"
            hint="Van a aparecer acá una vez activada la automatización diaria (Fase 4)."
            icon={<IconFile size={18} />}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[192px_1fr]">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none lg:flex-col lg:overflow-visible lg:pb-0">
            {sorted.map((r) => {
              const active = selected?.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className="card hoverable shrink-0 px-3.5 py-2.5 text-left"
                  style={{
                    borderColor: active ? "var(--color-accent)" : "var(--color-border)",
                    background: active ? "var(--color-accent-tint)" : "var(--color-surface)",
                  }}
                >
                  <p className="label" style={{ marginBottom: 3 }}>
                    {relativeDayLabel(r.date, today)}
                  </p>
                  <p
                    className="text-[13px] font-medium capitalize"
                    style={{ color: active ? "var(--color-accent)" : "var(--color-text)" }}
                  >
                    {formatLong(r.date)}
                  </p>
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="flex flex-col gap-4 fade">
              <Card>
                <SectionLabel>Resumen de ayer</SectionLabel>
                <p className="text-[15px] leading-relaxed" style={{ textWrap: "pretty" }}>
                  {selected.resumenAyer}
                </p>
              </Card>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.1fr_1fr]">
                <Card>
                  <SectionLabel>Qué toca hoy</SectionLabel>
                  <ul className="flex flex-col">
                    {selected.hoy.map((h, i) => (
                      <li
                        key={i}
                        className="flex items-baseline gap-2.5 border-b py-2.5 text-[14px] last:border-b-0"
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        <span className="font-num text-[10.5px]" style={{ color: "var(--color-text-faint)" }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card>
                  <SectionLabel>Plata del día</SectionLabel>
                  <div className="flex flex-col gap-3">
                    <Line label="Ingresos" value={money(selected.plata.ingresos)} color="var(--color-positive)" />
                    <Line label="Egresos" value={money(selected.plata.egresos)} color="var(--color-alert)" />
                    <div className="h-px w-full" style={{ background: "var(--color-border)" }} />
                    <Line
                      label="Balance"
                      value={moneySigned(selected.plata.balance)}
                      color={selected.plata.balance >= 0 ? "var(--color-positive)" : "var(--color-alert)"}
                      strong
                    />
                  </div>
                </Card>
              </div>

              <Card>
                <SectionLabel>Hábitos y actividad</SectionLabel>
                <p className="text-[14px] leading-relaxed" style={{ textWrap: "pretty" }}>
                  {selected.habitos}
                </p>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Line({
  label,
  value,
  color,
  strong = false,
}: {
  label: string;
  value: string;
  color: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[13px] muted">{label}</span>
      <span className="font-num" style={{ color, fontSize: strong ? 17 : 14.5 }}>
        {value}
      </span>
    </div>
  );
}
