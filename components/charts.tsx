"use client";

import { useState } from "react";
import { compactMoney } from "@/lib/date-utils";

export interface Point {
  label: string;
  value: number;
}

/** Barras con línea de base en cero: positivo hacia arriba, negativo hacia abajo. */
export function BarChart({
  data,
  height = 148,
  formatValue = compactMoney,
}: {
  data: Point[];
  height?: number;
  formatValue?: (n: number) => string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => Math.abs(d.value)));
  const hasNeg = data.some((d) => d.value < 0);
  const plot = height - 26;
  const zero = hasNeg ? plot * 0.58 : plot;

  return (
    <div style={{ height }} className="relative select-none">
      <div className="absolute left-0 right-0" style={{ top: zero, height: 1 }}>
        <div className="h-px w-full" style={{ background: "var(--color-border)" }} />
      </div>
      <div className="flex h-full items-stretch gap-[3px]">
        {data.map((d, i) => {
          const h = Math.max(2, (Math.abs(d.value) / max) * (d.value < 0 ? plot - zero : zero) * 0.92);
          const pos = d.value >= 0;
          const on = active === i;
          return (
            <div
              key={i}
              className="relative flex flex-1 cursor-default flex-col items-center"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              <div className="relative w-full" style={{ height: plot }}>
                <div
                  className="absolute left-1/2 w-full max-w-[26px] -translate-x-1/2 rounded-[5px]"
                  style={{
                    height: h,
                    top: pos ? zero - h : zero,
                    background: pos ? "var(--color-accent)" : "var(--color-alert)",
                    opacity: active === null ? 0.9 : on ? 1 : 0.32,
                    transition: "opacity 0.2s var(--ease-out), height 0.5s var(--ease-out)",
                  }}
                />
                {on && d.value !== 0 && (
                  <span
                    className="font-num absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] fade"
                    style={{
                      top: Math.max(0, (pos ? zero - h : zero + h) - (pos ? 20 : -4)),
                      background: "var(--color-text)",
                      color: "var(--color-surface)",
                    }}
                  >
                    {formatValue(d.value)}
                  </span>
                )}
              </div>
              <span
                className="mt-1.5 text-[9.5px]"
                style={{
                  color: on ? "var(--color-text)" : "var(--color-text-faint)",
                  transition: "color 0.2s var(--ease-out)",
                }}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Serie continua con relleno degradado, grilla suave y extremos marcados. */
export function AreaChart({
  data,
  height = 168,
  unit = "",
  color = "var(--color-accent)",
}: {
  data: Point[];
  height?: number;
  unit?: string;
  color?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  if (data.length === 0) return null;

  const w = 320;
  const padY = 22;
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = data.length > 1 ? w / (data.length - 1) : 0;
  const yOf = (v: number) => padY + (1 - (v - min) / range) * (height - padY * 2);
  const pts = data.map((d, i) => [i * step, yOf(d.value)] as const);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${w},${height} L0,${height} Z`;
  const cur = active === null ? data.length - 1 : active;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${w} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        onMouseLeave={() => setActive(null)}
        onMouseMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const rel = ((e.clientX - box.left) / box.width) * w;
          setActive(Math.max(0, Math.min(data.length - 1, Math.round(rel / (step || 1)))));
        }}
      >
        <defs>
          <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.16" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1="0"
            x2={w}
            y1={padY + f * (height - padY * 2)}
            y2={padY + f * (height - padY * 2)}
            stroke="var(--color-border)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            strokeDasharray="2 5"
          />
        ))}
        <path d={area} fill="url(#area-fill)" />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={pts[cur][0]}
          x2={pts[cur][0]}
          y1={padY - 8}
          y2={height - 4}
          stroke="var(--color-border-strong)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={pts[cur][0]} cy={pts[cur][1]} r="3.4" fill="var(--color-surface)" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-1.5 flex items-baseline justify-between">
        <span className="text-[10px]" style={{ color: "var(--color-text-faint)" }}>
          {data[0].label}
        </span>
        <span className="font-num text-[11.5px]" style={{ color: "var(--color-text)" }}>
          {data[cur].label} · {data[cur].value}
          {unit}
        </span>
        <span className="text-[10px]" style={{ color: "var(--color-text-faint)" }}>
          {data[data.length - 1].label}
        </span>
      </div>
    </div>
  );
}

/** Ranking horizontal de categorías. */
export function CategoryBars({
  data,
  total,
  formatValue = (n: number) => String(n),
}: {
  data: Point[];
  total: number;
  formatValue?: (n: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d, i) => (
        <div key={d.label} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px]">{d.label}</span>
            <span className="flex items-baseline gap-2">
              <span className="font-num text-[12.5px]">{formatValue(d.value)}</span>
              <span className="font-num text-[10.5px]" style={{ color: "var(--color-text-faint)" }}>
                {total > 0 ? Math.round((d.value / total) * 100) : 0}%
              </span>
            </span>
          </div>
          <div className="h-[5px] w-full overflow-hidden rounded-full" style={{ background: "var(--color-surface-2)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${(d.value / max) * 100}%`,
                background: "var(--color-accent)",
                opacity: 1 - i * 0.13,
                transition: "width 0.7s var(--ease-out)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Mapa de días activos, en columnas semanales. */
export function ActivityGrid({
  days,
  isActive,
}: {
  days: string[];
  isActive: (iso: string) => boolean;
}) {
  return (
    <div className="flex flex-wrap gap-[5px]">
      {days.map((d, i) => {
        const on = isActive(d);
        return (
          <span
            key={d}
            title={d}
            className="rounded-[4px]"
            style={{
              height: 15,
              width: 15,
              background: on ? "var(--color-positive)" : "var(--color-surface-2)",
              border: `1px solid ${on ? "transparent" : "var(--color-border)"}`,
              animation: `fade 0.4s var(--ease-out) ${i * 0.012}s both`,
            }}
          />
        );
      })}
    </div>
  );
}
