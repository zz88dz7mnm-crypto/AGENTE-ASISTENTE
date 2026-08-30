import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Sin variables de entorno la app corre en modo local (localStorage + datos de
 * ejemplo), que es como funciona en desarrollo y como funcionó en las fases 1-3.
 * Con las variables cargadas pasa a modo conectado contra Supabase.
 */
export const isSupabaseConfigured = Boolean(url && key);

export const supabase = isSupabaseConfigured ? createClient(url!, key!) : null;

/**
 * Dueño único de todas las filas. La app no tiene login, así que no hay
 * auth.uid() del cual derivar la pertenencia: se usa esta constante, que
 * coincide con el default de la migración 0002.
 */
export const OWNER_ID = "00000000-0000-0000-0000-000000000001";
