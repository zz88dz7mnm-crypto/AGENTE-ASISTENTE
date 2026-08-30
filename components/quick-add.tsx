"use client";

import { useState } from "react";
import { IconPlus } from "./icons";

/**
 * Alta rápida para una fecha concreta. La usa el calendario, donde antes se
 * podía mirar el día pero no cargarle nada.
 */
export function QuickAdd({
  date,
  onAddTask,
  onAddStudy,
}: {
  date: string;
  onAddTask: (title: string, date: string, time?: string) => void;
  onAddStudy: (title: string, date: string, time?: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [kind, setKind] = useState<"tarea" | "estudio">("tarea");

  function submit() {
    const t = title.trim();
    if (!t) return;
    (kind === "tarea" ? onAddTask : onAddStudy)(t, date, time || undefined);
    setTitle("");
    setTime("");
  }

  return (
    <div
      className="mt-4 flex flex-col gap-2 border-t pt-4"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div className="flex items-center gap-2">
        <div className="segmented">
          {(["tarea", "estudio"] as const).map((k) => (
            <button key={k} data-active={kind === k} onClick={() => setKind(k)} className="capitalize">
              {k}
            </button>
          ))}
        </div>
        <input
          value={time}
          onChange={(e) => setTime(e.target.value)}
          type="time"
          aria-label="Horario"
          className="field font-num ml-auto shrink-0"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={`Agregar a este día`}
          className="input flex-1"
        />
        <button
          onClick={submit}
          disabled={!title.trim()}
          aria-label="Agregar"
          className="btn btn-primary shrink-0 px-3"
          style={{ opacity: title.trim() ? 1 : 0.45 }}
        >
          <IconPlus size={16} />
        </button>
      </div>
    </div>
  );
}
