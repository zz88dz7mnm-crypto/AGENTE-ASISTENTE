"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import {
  formatLong,
  greeting,
  last7Days,
  money,
  moneySigned,
  todayISO,
} from "@/lib/date-utils";
import { ProgressRing } from "@/components/progress-ring";
import { Schedule, buildSchedule } from "@/components/schedule";
import { StatTile } from "@/components/stat-tile";
import { Card, Empty, PageSkeleton, SectionLabel } from "@/components/ui";
import {
  IconArrowUpRight,
  IconBook,
  IconCheck,
  IconChevronRight,
  IconFile,
  IconHeart,
  IconWallet,
} from "@/components/icons";

export default function DashboardPage() {
  const { tasks, study, finance, health, reports, toggleTask, toggleStudy, ready } = useStore();
  const today = todayISO();

  const todayTasks = tasks.filter((t) => t.date === today);
  const todayStudy = study.filter((t) => t.date === today);
  const allToday = [...todayTasks, ...todayStudy];
  const doneItems = allToday.filter((t) => t.done).length;
  const progress = allToday.length === 0 ? 0 : doneItems / allToday.length;

  const pending = allToday.filter((t) => !t.done);
  const schedule = buildSchedule(tasks, study, today);

  const week = last7Days(today);
  const weekFinance = finance.filter((f) => week.includes(f.date));
  const ingresos = weekFinance.filter((f) => f.type === "ingreso").reduce((a, f) => a + f.amount, 0);
  const egresos = weekFinance.filter((f) => f.type === "egreso").reduce((a, f) => a + f.amount, 0);
  const balance = ingresos - egresos;
  const activeDays = week.filter((d) => health.find((h) => h.date === d)?.active).length;
  const lastReport = [...reports].sort((a, b) => (a.date < b.date ? 1 : -1))[0];

  if (!ready) return <PageSkeleton />;

  return (
    <div className="flex flex-col gap-5">
      <header className="mb-1 flex items-end justify-between gap-4 rise">
        <div>
          <p className="label mb-2">{greeting()}</p>
          <h1 className="display" style={{ color: "var(--color-accent)" }}>
            {formatLong(today)}
          </h1>
          <p className="mt-1.5 text-[13px] muted">
            {allToday.length === 0
              ? "El día está libre de pendientes cargados."
              : `${doneItems} de ${allToday.length} completado${allToday.length === 1 ? "" : "s"} · ${
                  pending.length
                } en curso`}
          </p>
        </div>
        <ProgressRing value={progress} caption={`${doneItems}/${allToday.length} del día`} />
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Tareas hoy"
          value={`${todayTasks.filter((t) => t.done).length}/${todayTasks.length}`}
          hint="completadas"
          icon={<IconCheck size={14} />}
        />
        <StatTile
          label="Estudio hoy"
          value={`${todayStudy.filter((t) => t.done).length}/${todayStudy.length}`}
          hint="completadas"
          icon={<IconBook size={14} />}
        />
        <StatTile
          label="Balance semanal"
          value={moneySigned(balance)}
          hint={`${money(ingresos)} in · ${money(egresos)} out`}
          tone={balance >= 0 ? "positive" : "alert"}
          trend={balance >= 0 ? "up" : "down"}
        />
        <StatTile
          label="Días activos"
          value={`${activeDays}/7`}
          hint="última semana"
          tone="accent"
          icon={<IconHeart size={14} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_1fr]">
        <Card>
          <SectionLabel
            right={
              <Link
                href="/calendario"
                className="flex items-center gap-1 text-[11.5px] muted transition-colors hover:text-[var(--color-accent)]"
              >
                Calendario <IconArrowUpRight size={12} />
              </Link>
            }
          >
            Cronograma de hoy
          </SectionLabel>
          <Schedule
            entries={schedule}
            showNow
            onToggle={(e) => (e.kind === "tarea" ? toggleTask(e.id) : toggleStudy(e.id))}
          />
        </Card>

        <Card>
          <SectionLabel
            right={
              <span className="font-num text-[11px]" style={{ color: "var(--color-text-faint)" }}>
                {pending.length}
              </span>
            }
          >
            Pendientes de hoy
          </SectionLabel>
          {pending.length === 0 ? (
            <Empty
              title="Nada pendiente"
              hint="Todo lo cargado para hoy está completado."
              icon={<IconCheck size={17} />}
            />
          ) : (
            <ul className="flex flex-col">
              {pending.map((item, i) => {
                const isStudy = todayStudy.some((s) => s.id === item.id);
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 border-b py-2.5 last:border-b-0"
                    style={{
                      borderColor: "var(--color-border)",
                      animation: `rise 0.42s var(--ease-out) ${i * 0.04}s both`,
                    }}
                  >
                    <button
                      onClick={() => (isStudy ? toggleStudy(item.id) : toggleTask(item.id))}
                      aria-label="Marcar completada"
                      className="h-[18px] w-[18px] shrink-0 rounded-[6px] border"
                      style={{ borderColor: "var(--color-border-strong)" }}
                    />
                    <span className="min-w-0 flex-1 truncate text-[14px]">{item.title}</span>
                    <span
                      className="shrink-0 text-[10px] font-semibold uppercase"
                      style={{ color: "var(--color-text-faint)", letterSpacing: "0.08em" }}
                    >
                      {isStudy ? "estudio" : "tarea"}
                    </span>
                    {item.time && (
                      <span className="font-num shrink-0 text-[12px] muted">{item.time}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {lastReport && (
        <Card>
          <SectionLabel
            right={
              <Link
                href="/reportes"
                className="flex items-center gap-1 text-[11.5px] muted transition-colors hover:text-[var(--color-accent)]"
              >
                Ver histórico <IconArrowUpRight size={12} />
              </Link>
            }
          >
            Último reporte automático
          </SectionLabel>
          <p className="text-[14px] leading-relaxed" style={{ textWrap: "pretty" }}>
            {lastReport.resumenAyer}
          </p>
          <p className="mt-3 text-[12px] muted">{lastReport.habitos}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickLink href="/finanzas" label="Finanzas" hint="Movimientos y gráficos" icon={<IconWallet size={16} />} />
        <QuickLink href="/salud" label="Salud" hint="Peso y actividad" icon={<IconHeart size={16} />} />
        <QuickLink href="/reportes" label="Reportes" hint="Histórico diario" icon={<IconFile size={16} />} />
      </div>
    </div>
  );
}

function QuickLink({
  href,
  label,
  hint,
  icon,
}: {
  href: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="card hoverable flex items-center gap-3 px-4 py-3.5">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
        style={{ background: "var(--color-accent-tint)", color: "var(--color-accent)" }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium">{label}</p>
        <p className="text-[11.5px] muted">{hint}</p>
      </div>
      <span style={{ color: "var(--color-text-faint)" }}>
        <IconChevronRight size={15} />
      </span>
    </Link>
  );
}
