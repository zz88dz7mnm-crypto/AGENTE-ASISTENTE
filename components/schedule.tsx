import { TaskItem } from "@/lib/types";

export interface ScheduleEntry extends TaskItem {
  kind: "tarea" | "estudio";
}

export function buildSchedule(tasks: TaskItem[], study: TaskItem[], date: string): ScheduleEntry[] {
  const items: ScheduleEntry[] = [
    ...tasks.filter((t) => t.date === date && t.time).map((t) => ({ ...t, kind: "tarea" as const })),
    ...study.filter((t) => t.date === date && t.time).map((t) => ({ ...t, kind: "estudio" as const })),
  ];
  return items.sort((a, b) => (a.time! < b.time! ? -1 : 1));
}

export function Schedule({ entries }: { entries: ScheduleEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="px-1 text-[13px]" style={{ color: "var(--color-text-soft)" }}>
        Sin horarios cargados para este día.
      </p>
    );
  }
  return (
    <div className="flex flex-col">
      {entries.map((e, i) => (
        <div key={e.id} className="flex gap-3">
          <div className="flex w-14 shrink-0 flex-col items-end pt-2.5">
            <span className="font-num text-[12px]" style={{ color: "var(--color-text-soft)" }}>
              {e.time}
            </span>
          </div>
          <div className="flex flex-col items-center pt-2.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background: e.done ? "var(--color-positive)" : "var(--color-accent)",
              }}
            />
            {i < entries.length - 1 && (
              <span className="mt-1 w-px flex-1" style={{ background: "var(--color-border)" }} />
            )}
          </div>
          <div className="flex-1 pb-4">
            <p
              className="text-[14px]"
              style={{
                color: e.done ? "var(--color-text-soft)" : "var(--color-text)",
                textDecoration: e.done ? "line-through" : "none",
              }}
            >
              {e.title}
            </p>
            <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--color-text-soft)" }}>
              {e.kind}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
