"use client";

import { useStore } from "@/lib/store";
import { TaskList } from "@/components/task-list";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/ui";

export default function TareasPage() {
  const { tasks, addTask, toggleTask, removeTask, ready } = useStore();
  if (!ready) return <PageSkeleton />;

  const pending = tasks.filter((t) => !t.done).length;

  return (
    <div>
      <PageHeader
        eyebrow={`${pending} abiertas`}
        title="Tareas"
        subtitle="Todo lo que tenga horario asignado aparece también en el cronograma del día."
      />
      <TaskList
        items={tasks}
        onToggle={toggleTask}
        onRemove={removeTask}
        onAdd={addTask}
        placeholder="Nueva tarea"
        emptyLabel="No hay tareas en este período"
        emptyHint="Cargá una arriba: si le sumás horario, se refleja en el cronograma diario."
      />
    </div>
  );
}
