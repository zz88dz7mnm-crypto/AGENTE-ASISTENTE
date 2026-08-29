"use client";

import { TaskItem } from "@/lib/types";
import { nowMinutes, timeToMinutes } from "@/lib/date-utils";

export interface ScheduleEntry extends TaskItem {
  kind: "tarea" | "estudio";
}

export function buildSchedule(tasks: TaskItem[], study: TaskItem[], date: string): ScheduleEntry[] {
  return [
    ...tasks.filter((t) => t.date === date && t.time).map((t) => ({ ...t, kind: "tarea" as const })),
    ...study.filter((t) => t.date === date && t.time).map((t) => ({ ...t, kind: "estudio" as const })),
  ].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
}

export function Schedule({
  entries,
  showNow = false,
  onToggle,
}: {
  entries: ScheduleEntry[];
  showNow?: boolean;
  onToggle?: (entry: ScheduleEntry) => void;
}) {
  if (entries.length === 0) {
    return (
      <p className="py-5 text-center text-[13px] muted">Sin horarios cargados para este día.</p>
    );
  }

  const now = showNow ? nowMinutes() : -1;
  const nowIndex = showNow
    ? entries.findIndex((e) => timeToMinutes(e.time) > now)
    : -1;

  return (
    <div className="flex flex-col">
      {entries.map((e, i) => {
        const past = showNow && timeToMinutes(e.time) < now;
        return (
          <div key={e.id}>
            {i === nowIndex && <NowLine />}
            <div
              className="group flex gap-3.5"
              style={{ animation: `rise 0.45s var(--ease-out) ${i * 0.05}s both` }}
            >
              <div className="w-11 shrink-0 pt-[9px] text-right">
                <span
                  className="font-num text-[12px]"
                  style={{ color: past ? "var(--color-text-faint)" : "var(--color-text-soft)" }}
                >
                  {e.time}
                </span>
              </div>
              <div className="flex flex-col items-center pt-[13px]">
                <button
                  onClick={onToggle ? () => onToggle(e) : undefined}
                  aria-label={e.done ? "Marcar pendiente" : "Marcar completada"}
                  className="shrink-0 rounded-full"
                  style={{
                    height: 9,
                    width: 9,
                    cursor: onToggle ? "pointer" : "default",
                    background: e.done ? "var(--color-positive)" : "var(--color-surface)",
                    border: `2px solid ${
                      e.done
                        ? "var(--color-positive)"
                        : past
                        ? "var(--color-border-strong)"
                        : "var(--color-accent)"
                    }`,
                    transition: "background 0.25s var(--ease-out), border-color 0.25s var(--ease-out)",
                  }}
                />
                {i < entries.length - 1 && (
                  <span className="mt-1 w-px flex-1" style={{ background: "var(--color-border)" }} />
                )}
              </div>
              <div className="flex-1 pb-5">
                <p
                  className="text-[14px] leading-snug"
                  style={{
                    color: e.done ? "var(--color-text-faint)" : "var(--color-text)",
                    textDecoration: e.done ? "line-through" : "none",
                  }}
                >
                  {e.title}
                </p>
                <span
                  className="mt-1 inline-block text-[10px] font-semibold uppercase"
                  style={{ letterSpacing: "0.09em", color: "var(--color-text-faint)" }}
                >
                  {e.kind}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NowLine() {
  return (
    <div className="mb-4 flex items-center gap-2 pl-11">
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: "var(--color-alert)" }}
      />
      <span className="h-px flex-1" style={{ background: "var(--color-alert)", opacity: 0.42 }} />
      <span
        className="font-num text-[9.5px] uppercase"
        style={{ color: "var(--color-alert)", letterSpacing: "0.08em" }}
      >
        ahora
      </span>
    </div>
  );
}
