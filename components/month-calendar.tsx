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
  markedDates,
  selected,
  today,
  onSelect,
  onMonthChange,
}: {
  year: number;
  month: number;
  markedDates: Set<string>;
  selected: string;
  today: string;
  onSelect: (iso: string) => void;
  onMonthChange: (delta: number) => void;
}) {
  const total = daysInMonth(year, month);
  const offset = firstWeekdayOfMonth(year, month);
  const cells: (string | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= total; d++) {
    cells.push(toISODate(new Date(year, month, d)));
  }

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => onMonthChange(-1)}
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{ color: "var(--color-text-soft)" }}
          aria-label="Mes anterior"
        >
          <IconChevronRight size={15} className="rotate-180" />
        </button>
        <p className="text-[13px] font-medium capitalize">{monthLabel(year, month)}</p>
        <button
          onClick={() => onMonthChange(1)}
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{ color: "var(--color-text-soft)" }}
          aria-label="Mes siguiente"
        >
          <IconChevronRight size={15} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1.5 text-center">
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} className="text-[11px]" style={{ color: "var(--color-text-soft)" }}>
            {weekdayShort(i)}
          </span>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <span key={`empty-${i}`} />;
          const isSelected = iso === selected;
          const isToday = iso === today;
          const marked = markedDates.has(iso);
          const day = Number(iso.split("-")[2]);
          return (
            <button
              key={iso}
              onClick={() => onSelect(iso)}
              className="relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[13px]"
              style={{
                background: isSelected ? "var(--color-accent)" : "transparent",
                color: isSelected ? "var(--color-surface)" : "var(--color-text)",
                fontWeight: isToday && !isSelected ? 600 : 400,
              }}
            >
              {day}
              {marked && !isSelected && (
                <span
                  className="absolute bottom-0.5 h-1 w-1 rounded-full"
                  style={{ background: "var(--color-accent)" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
