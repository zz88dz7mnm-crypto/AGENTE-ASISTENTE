"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { formatLong } from "@/lib/date-utils";
import { PageHeader } from "@/components/page-header";
import { IconFile } from "@/components/icons";

export default function ReportesPage() {
  const { reports, ready } = useStore();
  const sorted = [...reports].sort((a, b) => (a.date < b.date ? 1 : -1));
  const [selectedId, setSelectedId] = useState<string | null>(sorted[0]?.id ?? null);
  const selected = sorted.find((r) => r.id === selectedId) ?? sorted[0];

  if (!ready) return null;

  return (
    <div>
      <PageHeader
        title="Reportes"
        subtitle="Se generan solos todos los días a las 2:00 AM. Histórico navegable por fecha."
      />

      {sorted.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 px-4 py-10 text-center">
          <span style={{ color: "var(--color-text-soft)" }}>
            <IconFile size={22} />
          </span>
          <p className="text-[13px]" style={{ color: "var(--color-text-soft)" }}>
            Todavía no hay reportes generados. Van a aparecer acá una vez activada la
            automatización diaria (Fase 4).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[180px_1fr]">
          <div className="flex gap-2 overflow-x-auto sm:flex-col sm:overflow-visible">
            {sorted.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className="card shrink-0 px-3 py-2 text-left text-[13px] capitalize"
                style={{
                  borderColor: selected?.id === r.id ? "var(--color-accent)" : "var(--color-border)",
                  color: selected?.id === r.id ? "var(--color-accent)" : "var(--color-text)",
                }}
              >
                {formatLong(r.date)}
              </button>
            ))}
          </div>

          {selected && (
            <div className="card flex flex-col gap-4 p-4">
              <div>
                <p className="text-[12px] uppercase tracking-wide" style={{ color: "var(--color-text-soft)" }}>
                  Resumen de ayer
                </p>
                <p className="mt-1 text-[14px]">{selected.resumenAyer}</p>
              </div>

              <div>
                <p className="text-[12px] uppercase tracking-wide" style={{ color: "var(--color-text-soft)" }}>
                  Qué toca hoy
                </p>
                <ul className="mt-1 flex flex-col gap-1">
                  {selected.hoy.map((h, i) => (
                    <li key={i} className="text-[14px]">
                      · {h}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="card px-3 py-2">
                  <p className="text-[11px]" style={{ color: "var(--color-text-soft)" }}>
                    Ingresos
                  </p>
                  <p className="font-num text-[15px]" style={{ color: "var(--color-positive)" }}>
                    ${selected.plata.ingresos.toLocaleString("es-AR")}
                  </p>
                </div>
                <div className="card px-3 py-2">
                  <p className="text-[11px]" style={{ color: "var(--color-text-soft)" }}>
                    Egresos
                  </p>
                  <p className="font-num text-[15px]" style={{ color: "var(--color-alert)" }}>
                    ${selected.plata.egresos.toLocaleString("es-AR")}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[12px] uppercase tracking-wide" style={{ color: "var(--color-text-soft)" }}>
                  Hábitos
                </p>
                <p className="mt-1 text-[14px]">{selected.habitos}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
