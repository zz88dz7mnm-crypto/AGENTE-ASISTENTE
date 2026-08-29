"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { formatLong, todayISO } from "@/lib/date-utils";
import { PageHeader } from "@/components/page-header";
import { MonthCalendar } from "@/components/month-calendar";
import { Schedule, buildSchedule } from "@/components/schedule";

export default function CalendarioPage() {
  const { tasks, study, ready } = useStore();
  const today = todayISO();
  const [selected, setSelected] = useState(today);
  const [cursor, setCursor] = useState(() => {
    const [y, m] = today.split("-").map(Number);
    return { year: y, month: m - 1 };
  });

  const markedDates = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => set.add(t.date));
    study.forEach((s) => set.add(s.date));
    return set;
  }, [tasks, study]);

  const selectedSchedule = buildSchedule(tasks, study, selected);
  const selectedUnscheduled = [...tasks, ...study].filter(
    (item) => item.date === selected && !item.time
  );

  if (!ready) return null;

  return (
    <div>
      <PageHeader title="Calendario" subtitle="Agenda del día y vista mensual." />

      <section className="card mb-4 p-4">
        <p className="mb-1 text-[12px] uppercase tracking-wide" style={{ color: "var(--color-text-soft)" }}>
          {selected === today ? "Hoy" : "Seleccionado"}
        </p>
        <p className="mb-3 text-[15px] font-medium capitalize">{formatLong(selected)}</p>
        <Schedule entries={selectedSchedule} />
        {selectedUnscheduled.length > 0 && (
          <div className="mt-3 flex flex-col gap-1.5 border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--color-text-soft)" }}>
              Sin horario
            </p>
            {selectedUnscheduled.map((item) => (
              <p key={item.id} className="text-[13px]" style={{ color: "var(--color-text-soft)" }}>
                · {item.title}
              </p>
            ))}
          </div>
        )}
      </section>

      <MonthCalendar
        year={cursor.year}
        month={cursor.month}
        markedDates={markedDates}
        selected={selected}
        today={today}
        onSelect={setSelected}
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
  );
}
