"use client";

import {
  daysInMonth,
  firstWeekdayOfMonth,
  monthLabel,
  toISODate,
  weekdayShort,
} from "@/lib/date-utils";
import { IconChevronRight } from "./icons";

export function MonthCalendar({
  year,
  month,
  counts,
  selected,
  today,
  onSelect,
  onMonthChange,
  onToday,
}: {
  year: number;
  month: number;
  counts: Map<string, number>;
  selected: string;
  today: string;
  onSelect: (iso: string) => void;
  onMonthChange: (delta: number) => void;
  onToday?: () => void;
}) {
  const total = daysInMonth(year, month);
  const offset = firstWeekdayOfMonth(year, month);
  const cells: (string | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= total; d++) cells.push(toISODate(new Date(year, month, d)));
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[15px] font-semibold capitalize" style={{ letterSpacing: "-0.02em" }}>
          {monthLabel(year, month)}
        </p>
        <div className="flex items-center gap-1">
          {onToday && (
            <button onClick={onToday} className="btn btn-ghost h-8 px-3 text-[12px]">
              Hoy
            </button>
          )}
          <button onClick={() => onMonthChange(-1)} className="icon-btn" aria-label="Mes anterior">
            <IconChevronRight size={15} className="rotate-180" />
          </button>
          <button onClick={() => onMonthChange(1)} className="icon-btn" aria-label="Mes siguiente">
            <IconChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {Array.from({ length: 7 }, (_, i) => (
          <span
            key={i}
            className="pb-2 text-[10px] font-semibold uppercase"
            style={{ color: "var(--color-text-faint)", letterSpacing: "0.08em" }}
          >
            {weekdayShort(i)}
          </span>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <span key={`empty-${i}`} />;
          const isSelected = iso === selected;
          const isToday = iso === today;
          const count = counts.get(iso) ?? 0;
          const day = Number(iso.split("-")[2]);
          return (
            <button
              key={iso}
              onClick={() => onSelect(iso)}
              className="relative mx-auto flex h-9 w-9 flex-col items-center justify-center rounded-full text-[13.5px]"
              style={{
                background: isSelected ? "var(--color-accent)" : "transparent",
                color: isSelected
                  ? "var(--color-surface)"
                  : isToday
                  ? "var(--color-accent)"
                  : "var(--color-text)",
                fontWeight: isToday || isSelected ? 600 : 450,
                boxShadow: isToday && !isSelected ? "inset 0 0 0 1px var(--color-border-strong)" : "none",
                transition: "background 0.22s var(--ease-out), color 0.22s var(--ease-out)",
              }}
            >
              <span className="font-num leading-none">{day}</span>
              {count > 0 && (
                <span className="absolute bottom-[5px] flex gap-[2px]">
                  {Array.from({ length: Math.min(3, count) }, (_, k) => (
                    <span
                      key={k}
                      className="rounded-full"
                      style={{
                        height: 3,
                        width: 3,
                        background: isSelected ? "var(--color-surface)" : "var(--color-accent)",
                        opacity: isSelected ? 0.85 : 0.55,
                      }}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
