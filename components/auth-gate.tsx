"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

/**
 * En modo local (sin Supabase configurado) no hay login: la app entra directo,
 * como en las fases 1-3. Con Supabase conectado exige sesión antes de mostrar
 * cualquier dato.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, ready } = useAuth();

  if (!isSupabaseConfigured) return <>{children}</>;
  if (!ready) return null;
  if (!session) return <LoginScreen />;
  return <>{children}</>;
}

function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const message = await signIn(email.trim(), password);
    if (message) setError(message);
    setBusy(false);
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-1">
      <form onSubmit={submit} className="card card-raised w-full max-w-[340px] p-6 rise">
        <p className="label mb-2">Agente</p>
        <h1 className="h1 mb-1.5" style={{ color: "var(--color-accent)" }}>
          Asistente personal
        </h1>
        <p className="mb-5 text-[12.5px] leading-relaxed muted" style={{ textWrap: "pretty" }}>
          Ingresá para ver tus datos. Sólo vos podés leerlos.
        </p>

        <div className="flex flex-col gap-2.5">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
            placeholder="Email"
            className="field w-full py-2.5"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
            placeholder="Contraseña"
            className="field w-full py-2.5"
          />
        </div>

        {error && (
          <p className="mt-3 text-[12px]" style={{ color: "var(--color-alert)" }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn btn-primary mt-4 w-full">
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
