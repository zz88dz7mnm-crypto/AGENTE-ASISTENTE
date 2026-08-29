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
  signOut: () => Promise<void>;
}

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
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
        await supabase?.auth.signOut();
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
