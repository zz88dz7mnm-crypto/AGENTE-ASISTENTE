"use client";

import { useStore } from "@/lib/store";

/**
 * Aviso discreto cuando una escritura contra Supabase falla. La vista ya se
 * recargó con lo que hay en la base, así que esto sólo explica por qué el
 * cambio no quedó.
 */
export function SyncNotice() {
  const { error } = useStore();
  if (!error) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-[12.5px] fade"
      style={{
        background: "var(--color-alert)",
        color: "var(--color-surface)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {error}
    </div>
  );
}
