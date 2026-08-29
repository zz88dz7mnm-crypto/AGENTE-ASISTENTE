"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./supabase";

interface Auth {
  /** null = sin sesión. En modo local siempre es null y no hace falta login. */
  session: Session | null;
  userId: string | null;
  /** false mientras se resuelve la sesión inicial: evita parpadeo del login. */
  ready: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  /** Devuelve el mensaje de error, o null si la sesión se cerró de verdad. */
  signOut: () => Promise<string | null>;
}

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;

    // El listener manda: emite INITIAL_SESSION al suscribirse y después cada
    // cambio. getSession() sólo cubre el caso de que esa emisión no llegue, y
    // se descarta si el listener ya habló: si no, un SIGNED_OUT que llegue
    // antes de que resuelva la promesa quedaría pisado por la sesión vieja.
    let settled = false;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      settled = true;
      setSession(next);
      setReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (settled) return;
      setSession(data.session);
      setReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<Auth>(
    () => ({
      session,
      userId: session?.user.id ?? null,
      ready,
      async signIn(email, password) {
        if (!supabase) return "Supabase no está configurado.";
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? error.message : null;
      },
      async signOut() {
        // Es la única acción de seguridad de la app: si falla, el usuario tiene
        // que enterarse en vez de creer que quedó cerrada.
        const { error } = (await supabase?.auth.signOut()) ?? { error: null };
        return error ? error.message : null;
      },
    }),
    [session, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Auth {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
