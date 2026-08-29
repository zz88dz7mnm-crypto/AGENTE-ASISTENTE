"use client";

import { useStore } from "@/lib/store";
import { TaskList } from "@/components/task-list";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/ui";

export default function EstudioPage() {
  const { study, addStudy, toggleStudy, removeStudy, ready } = useStore();
  if (!ready) return <PageSkeleton />;

  const pending = study.filter((t) => !t.done).length;

  return (
    <div>
      <PageHeader
        eyebrow={`${pending} abiertas`}
        title="Estudio"
        subtitle="Pendientes de estudio. Lo que tiene horario se integra al cronograma diario."
      />
      <TaskList
        items={study}
        onToggle={toggleStudy}
        onRemove={removeStudy}
        onAdd={addStudy}
        placeholder="Nuevo pendiente de estudio"
        emptyLabel="No hay pendientes en este período"
        emptyHint="Cargá lecturas, clases o prácticas y asignales horario para verlas en el día."
      />
    </div>
  );
}
