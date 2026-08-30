-- Saca el login: la app entra directo y todas las filas pertenecen a un único
-- dueño fijo.
--
-- ADVERTENCIA: a partir de acá, cualquiera que tenga la URL pública y la clave
-- del bundle puede leer y escribir estos datos. Es una decisión explícita del
-- dueño del proyecto, no un descuido. Para volver atrás, restaurar las
-- políticas de 0001_init.sql y volver a montar el AuthGate en la app.

-- Dueño único de todas las filas. No es un usuario de auth.users: es una
-- constante. Se usa un UUID fijo y NO null porque `unique (user_id, date)`
-- no sirve con nulos (en Postgres dos NULL no colisionan), y sin eso la
-- rutina diaria duplicaría el reporte y el registro de salud cada día.
grant usage on schema public to anon, authenticated;

do $$
declare
  t text;
  owner constant uuid := '00000000-0000-0000-0000-000000000001';
begin
  foreach t in array array['tasks', 'study', 'finance', 'health', 'reports'] loop
    -- El default dejaba de servir: auth.uid() es null sin sesión.
    execute format('alter table public.%I alter column user_id drop default', t);
    execute format('alter table public.%I alter column user_id set default %L::uuid', t, owner);

    -- Ya no hay usuarios en auth.users a los que apuntar.
    execute format('alter table public.%I drop constraint if exists %I', t, t || '_user_id_fkey');

    -- Filas que hayan quedado de la etapa con login pasan al dueño fijo.
    execute format('update public.%I set user_id = %L::uuid where user_id is distinct from %L::uuid', t, owner, owner);
    execute format('alter table public.%I alter column user_id set not null', t);

    -- RLS filtra filas pero no da acceso a la tabla: sin el GRANT, anon recibe
    -- "permission denied" antes de que se evalúe la política.
    execute format('grant select, insert, update, delete on public.%I to anon, authenticated', t);

    -- Acceso abierto: sin sesión, el rol que llega desde el navegador es anon.
    execute format('drop policy if exists %I on public.%I', t || '_own_rows', t);
    execute format('drop policy if exists %I on public.%I', t || '_open', t);
    execute format(
      'create policy %I on public.%I for all to anon, authenticated using (true) with check (true)',
      t || '_open', t
    );
  end loop;
end $$;
