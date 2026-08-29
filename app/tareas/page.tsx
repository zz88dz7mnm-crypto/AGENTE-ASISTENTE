"use client";

import { useStore } from "@/lib/store";
import { todayISO } from "@/lib/date-utils";
import { TaskList } from "@/components/task-list";
import { PageHeader } from "@/components/page-header";

export default function TareasPage() {
  const { tasks, addTask, toggleTask, removeTask, ready } = useStore();
  if (!ready) return null;

  return (
    <div>
      <PageHeader title="Tareas" subtitle="Lo que tiene horario aparece en el cronograma diario." />
      <TaskList
        items={tasks}
        onToggle={toggleTask}
        onRemove={removeTask}
        onAdd={(title, time) => addTask(title, todayISO(), time)}
        emptyLabel="No hay tareas cargadas."
      />
    </div>
  );
}
