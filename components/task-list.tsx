"use client";

import { useMemo, useState } from "react";
import { TaskItem } from "@/lib/types";
import {
  daysBetween,
  relativeDayLabel,
  timeToMinutes,
  todayISO,
} from "@/lib/date-utils";
import { IconClock, IconPlus, IconTrash } from "./icons";
import { Empty, SectionLabel } from "./ui";

type Filter = "hoy" | "semana" | "todo";
const FILTERS = ["hoy", "semana", "todo"] as const;

export function TaskList({
  items,
  onToggle,
  onRemove,
  onAdd,
  emptyLabel,
  emptyHint,
  placeholder = "Nueva tarea",
}: {
  items: TaskItem[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (title: string, date: string, time?: string) => void;
  emptyLabel: string;
  emptyHint?: string;
  placeholder?: string;
}) {
  const today = todayISO();
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [date, setDate] = useState(today);
  const [filter, setFilter] = useState<Filter>("semana");

  function submit() {
    const t = title.trim();
    if (!t) return;
    onAdd(t, date || today, time || undefined);
    setTitle("");
    setTime("");
  }

  const visible = useMemo(() => {
    return items.filter((i) => {
      const diff = daysBetween(today, i.date);
      if (filter === "hoy") return i.date === today;
      if (filter === "semana") return diff >= -1 && diff <= 7;
      return true;
    });
  }, [items, filter, today]);

  const pending = visible.filter((i) => !i.done);
  const done = visible.filter((i) => i.done);

  const groups = useMemo(() => {
    const map = new Map<string, TaskItem[]>();
    [...pending]
      .sort((a, b) => (a.date === b.date ? timeToMinutes(a.time) - timeToMinutes(b.time) : a.date < b.date ? -1 : 1))
      .forEach((i) => {
        const list = map.get(i.date) ?? [];
        list.push(i);
        map.set(i.date, list);
      });
    return [...map.entries()];
  }, [pending]);

  return (
    <div className="flex flex-col gap-5">
      <div className="card card-raised flex flex-col gap-2 p-2.5 sm:flex-row sm:items-center">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={placeholder}
          className="input flex-1"
        />
        <div className="flex items-center gap-2">
          <input
            value={date}
            onChange={(e) => setDate(e.target.value)}
            type="date"
            aria-label="Fecha"
            className="field font-num flex-1 sm:flex-none"
          />
          <input
            value={time}
            onChange={(e) => setTime(e.target.value)}
            type="time"
            aria-label="Horario"
            className="field font-num w-[92px] shrink-0"
          />
          <button onClick={submit} aria-label="Agregar" className="btn btn-primary shrink-0 px-3">
            <IconPlus size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="label">
          {pending.length} pendiente{pending.length === 1 ? "" : "s"}
        </span>
        <div className="segmented">
          {FILTERS.map((f) => (
            <button key={f} data-active={filter === f} onClick={() => setFilter(f)} className="capitalize">
              {f}
            </button>
          ))}
        </div>
      </div>

      {pending.length === 0 && done.length === 0 ? (
        <div className="card">
          <Empty title={emptyLabel} hint={emptyHint} icon={<IconClock size={17} />} />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map(([groupDate, list], gi) => (
            <div key={groupDate} className="flex flex-col gap-2">
              <SectionLabel
                right={
                  <span className="font-num text-[11px]" style={{ color: "var(--color-text-faint)" }}>
                    {list.length}
                  </span>
                }
              >
                {relativeDayLabel(groupDate, today)}
              </SectionLabel>
              {list.map((item, i) => (
                <Row
                  key={item.id}
                  item={item}
                  delay={gi * 0.05 + i * 0.035}
                  onToggle={onToggle}
                  onRemove={onRemove}
                  overdue={daysBetween(today, item.date) < 0}
                />
              ))}
            </div>
          ))}

          {done.length > 0 && (
            <div className="flex flex-col gap-2">
              <SectionLabel>Completadas</SectionLabel>
              {done.map((item, i) => (
                <Row key={item.id} item={item} delay={i * 0.03} onToggle={onToggle} onRemove={onRemove} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({
  item,
  onToggle,
  onRemove,
  delay = 0,
  overdue = false,
}: {
  item: TaskItem;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  delay?: number;
  overdue?: boolean;
}) {
  return (
    <div
      className="card hoverable group flex items-center gap-3 px-3.5 py-3"
      style={{ animation: `rise 0.42s var(--ease-out) ${delay}s both`, opacity: item.done ? 0.72 : 1 }}
    >
      <button
        onClick={() => onToggle(item.id)}
        aria-label={item.done ? "Marcar pendiente" : "Marcar completada"}
        className="flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-[7px] border"
        style={{
          borderColor: item.done ? "var(--color-accent)" : "var(--color-border-strong)",
          background: item.done ? "var(--color-accent)" : "transparent",
          transition: "background 0.22s var(--ease-out), border-color 0.22s var(--ease-out)",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path
            d="m5 12.5 4.5 4.5L19 7"
            stroke="var(--color-surface)"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="24"
            strokeDashoffset={item.done ? 0 : 24}
            style={{ transition: "stroke-dashoffset 0.32s var(--ease-out)" }}
          />
        </svg>
      </button>
      <span
        className="min-w-0 flex-1 truncate text-[14.5px]"
        style={{
          color: item.done ? "var(--color-text-faint)" : "var(--color-text)",
          textDecoration: item.done ? "line-through" : "none",
        }}
      >
        {item.title}
      </span>
      {overdue && !item.done && (
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
          style={{ background: "rgba(184,80,61,0.1)", color: "var(--color-alert)", letterSpacing: "0.06em" }}
        >
          Atrasada
        </span>
      )}
      {item.time && (
        <span className="font-num shrink-0 text-[12px]" style={{ color: "var(--color-text-soft)" }}>
          {item.time}
        </span>
      )}
      <button
        onClick={() => onRemove(item.id)}
        aria-label="Eliminar"
        className="icon-btn h-7 w-7 shrink-0 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
      >
        <IconTrash size={14} />
      </button>
    </div>
  );
}
