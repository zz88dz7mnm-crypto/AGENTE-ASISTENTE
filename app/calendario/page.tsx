"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { formatLong, relativeDayLabel, todayISO } from "@/lib/date-utils";
import { PageHeader } from "@/components/page-header";
import { MonthCalendar } from "@/components/month-calendar";
import { Schedule, buildSchedule } from "@/components/schedule";
import { Card, PageSkeleton, SectionLabel } from "@/components/ui";

export default function CalendarioPage() {
  const { tasks, study, toggleTask, toggleStudy, ready } = useStore();
  const today = todayISO();
  const [selected, setSelected] = useState(today);
  const [cursor, setCursor] = useState(() => {
    const [y, m] = today.split("-").map(Number);
    return { year: y, month: m - 1 };
  });

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    [...tasks, ...study].forEach((i) => map.set(i.date, (map.get(i.date) ?? 0) + 1));
    return map;
  }, [tasks, study]);

  const selectedSchedule = buildSchedule(tasks, study, selected);
  const unscheduled = [...tasks, ...study].filter((i) => i.date === selected && !i.time);

  if (!ready) return <PageSkeleton />;

  return (
    <div>
      <PageHeader
        eyebrow="Agenda"
        title="Calendario"
        subtitle="El día seleccionado en detalle, con su cronograma por hora. Los puntos marcan días con algo cargado."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.05fr]">
        <Card>
          <SectionLabel
            right={
              <span className="font-num text-[11px]" style={{ color: "var(--color-text-faint)" }}>
                {selectedSchedule.length + unscheduled.length} ítems
              </span>
            }
          >
            {relativeDayLabel(selected, today)}
          </SectionLabel>
          <p className="mb-4 text-[17px] font-semibold capitalize" style={{ letterSpacing: "-0.025em" }}>
            {formatLong(selected)}
          </p>
          <Schedule
            entries={selectedSchedule}
            showNow={selected === today}
            onToggle={(e) => (e.kind === "tarea" ? toggleTask(e.id) : toggleStudy(e.id))}
          />
          {unscheduled.length > 0 && (
            <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
              <SectionLabel>Sin horario</SectionLabel>
              <ul className="flex flex-col gap-2">
                {unscheduled.map((item) => (
                  <li key={item.id} className="flex items-center gap-2.5 text-[13.5px]">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: "var(--color-border-strong)" }}
                    />
                    <span
                      className="truncate"
                      style={{
                        color: item.done ? "var(--color-text-faint)" : "var(--color-text)",
                        textDecoration: item.done ? "line-through" : "none",
                      }}
                    >
                      {item.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <MonthCalendar
          year={cursor.year}
          month={cursor.month}
          counts={counts}
          selected={selected}
          today={today}
          onSelect={setSelected}
          onToday={() => {
            const [y, m] = today.split("-").map(Number);
            setCursor({ year: y, month: m - 1 });
            setSelected(today);
          }}
          onMonthChange={(delta) =>
            setCursor((c) => {
              const m = c.month + delta;
              if (m < 0) return { year: c.year - 1, month: 11 };
              if (m > 11) return { year: c.year + 1, month: 0 };
              return { year: c.year, month: m };
            })
          }
        />
      </div>
    </div>
  );
}
