"use client";

import { useEffect, useState } from "react";

export function ProgressRing({
  value,
  size = 62,
  stroke = 5,
  caption,
}: {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  caption?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  return (
    <div className="flex shrink-0 items-center gap-3">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - shown)}
            style={{ transition: "stroke-dashoffset 1.1s var(--ease-out)" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-num text-[13px]" style={{ color: "var(--color-accent)" }}>
            {Math.round(pct * 100)}
            <span className="text-[9px]" style={{ color: "var(--color-text-faint)" }}>
              %
            </span>
          </span>
        </div>
      </div>
      {caption && (
        <div className="hidden sm:block">
          <p className="label" style={{ marginBottom: 2 }}>
            Progreso
          </p>
          <p className="text-[12.5px] muted">{caption}</p>
        </div>
      )}
    </div>
  );
}
