"use client";

import { useStore } from "@/lib/store";
import { todayISO } from "@/lib/date-utils";
import { TaskList } from "@/components/task-list";
import { PageHeader } from "@/components/page-header";

export default function EstudioPage() {
  const { study, addStudy, toggleStudy, removeStudy, ready } = useStore();
  if (!ready) return null;

  return (
    <div>
      <PageHeader title="Estudio" subtitle="Lo que tiene horario aparece en el cronograma diario." />
      <TaskList
        items={study}
        onToggle={toggleStudy}
        onRemove={removeStudy}
        onAdd={(title, time) => addStudy(title, todayISO(), time)}
        emptyLabel="No hay pendientes de estudio."
      />
    </div>
  );
}
