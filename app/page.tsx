"use client";

import { useStore } from "@/lib/store";
import { formatLong, todayISO } from "@/lib/date-utils";
import { ProgressRing } from "@/components/progress-ring";
import { Schedule, buildSchedule } from "@/components/schedule";
import Link from "next/link";
import { IconChevronRight } from "@/components/icons";

export default function DashboardPage() {
  const { tasks, study, ready } = useStore();
  const today = todayISO();

  const todayTasks = tasks.filter((t) => t.date === today);
  const todayStudy = study.filter((t) => t.date === today);
  const totalItems = todayTasks.length + todayStudy.length;
  const doneItems = [...todayTasks, ...todayStudy].filter((t) => t.done).length;
  const progress = totalItems === 0 ? 0 : doneItems / totalItems;

  const pending = [...todayTasks, ...todayStudy].filter((t) => !t.done);
  const schedule = buildSchedule(tasks, study, today);

  if (!ready) return null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between pl-4">
        <div>
          <p className="text-[13px] capitalize" style={{ color: "var(--color-text-soft)" }}>
            {formatLong(today)}
          </p>
          <h1 className="text-[20px] font-medium tracking-tight" style={{ color: "var(--color-accent)" }}>
            Hoy
          </h1>
        </div>
        <ProgressRing value={progress} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="card p-4">
          <p className="mb-3 text-[12px] uppercase tracking-wide" style={{ color: "var(--color-text-soft)" }}>
            Cronograma
          </p>
          <Schedule entries={schedule} />
        </section>

        <section className="card p-4">
          <p className="mb-3 text-[12px] uppercase tracking-wide" style={{ color: "var(--color-text-soft)" }}>
            Pendientes de hoy
          </p>
          {pending.length === 0 ? (
            <p className="text-[13px]" style={{ color: "var(--color-text-soft)" }}>
              No queda nada pendiente para hoy.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {pending.map((item) => (
                <li key={item.id} className="flex items-center gap-2 text-[14px]">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--color-accent)" }} />
                  <span className="truncate">{item.title}</span>
                  {item.time && (
                    <span className="font-num ml-auto shrink-0 text-[12px]" style={{ color: "var(--color-text-soft)" }}>
                      {item.time}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickLink href="/finanzas" label="Finanzas" hint="Ver movimientos" />
        <QuickLink href="/salud" label="Salud" hint="Ver seguimiento" />
        <QuickLink href="/reportes" label="Reportes" hint="Ver histórico" />
      </div>
    </div>
  );
}

function QuickLink({ href, label, hint }: { href: string; label: string; hint: string }) {
  return (
    <Link href={href} className="card flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-[14px]">{label}</p>
        <p className="text-[11px]" style={{ color: "var(--color-text-soft)" }}>
          {hint}
        </p>
      </div>
      <span style={{ color: "var(--color-text-soft)" }}>
        <IconChevronRight size={15} className="shrink-0" />
      </span>
    </Link>
  );
}
