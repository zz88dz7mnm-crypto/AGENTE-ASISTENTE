"use client";

import { useState } from "react";
import { TaskItem } from "@/lib/types";
import { IconPlus, IconTrash } from "./icons";

export function TaskList({
  items,
  onToggle,
  onRemove,
  onAdd,
  emptyLabel,
}: {
  items: TaskItem[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (title: string, time?: string) => void;
  emptyLabel: string;
}) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");

  function submit() {
    const t = title.trim();
    if (!t) return;
    onAdd(t, time || undefined);
    setTitle("");
    setTime("");
  }

  const pending = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);

  return (
    <div className="flex flex-col gap-4">
      <div className="card flex items-center gap-2 p-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Nueva tarea"
          className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-[14px] outline-none placeholder:text-[var(--color-text-soft)]"
        />
        <input
          value={time}
          onChange={(e) => setTime(e.target.value)}
          type="time"
          className="font-num w-[92px] shrink-0 rounded-md border px-1.5 py-1 text-[12px] outline-none"
          style={{ borderColor: "var(--color-border)" }}
        />
        <button
          onClick={submit}
          aria-label="Agregar"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white"
          style={{ background: "var(--color-accent)" }}
        >
          <IconPlus size={15} />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {pending.length === 0 && done.length === 0 && (
          <p className="px-1 text-[13px]" style={{ color: "var(--color-text-soft)" }}>
            {emptyLabel}
          </p>
        )}
        {pending.map((item) => (
          <Row key={item.id} item={item} onToggle={onToggle} onRemove={onRemove} />
        ))}
        {done.length > 0 && (
          <>
            <p
              className="mt-2 px-1 text-[11px] uppercase tracking-wide"
              style={{ color: "var(--color-text-soft)" }}
            >
              Completadas
            </p>
            {done.map((item) => (
              <Row key={item.id} item={item} onToggle={onToggle} onRemove={onRemove} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function Row({
  item,
  onToggle,
  onRemove,
}: {
  item: TaskItem;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="card group flex items-center gap-3 px-3 py-2.5">
      <button
        onClick={() => onToggle(item.id)}
        aria-label="Marcar completada"
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border"
        style={{
          borderColor: item.done ? "var(--color-accent)" : "var(--color-border)",
          background: item.done ? "var(--color-accent)" : "transparent",
        }}
      >
        {item.done && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path
              d="m5 12.5 4.5 4.5L19 7"
              stroke="var(--color-surface)"
              strokeWidth={2.3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      <span
        className="min-w-0 flex-1 truncate text-[14px]"
        style={{
          color: item.done ? "var(--color-text-soft)" : "var(--color-text)",
          textDecoration: item.done ? "line-through" : "none",
        }}
      >
        {item.title}
      </span>
      {item.time && (
        <span className="font-num shrink-0 text-[12px]" style={{ color: "var(--color-text-soft)" }}>
          {item.time}
        </span>
      )}
      <button
        onClick={() => onRemove(item.id)}
        aria-label="Eliminar"
        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ color: "var(--color-text-soft)" }}
      >
        <IconTrash />
      </button>
    </div>
  );
}
