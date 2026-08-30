-- AGENTE PRUEBA — esquema inicial
--
-- Cada fila queda atada al usuario que la creó (user_id) y las políticas de RLS
-- sólo dejan ver y escribir las filas propias. Sin esto, la clave publishable
-- que viaja en el bundle del navegador daría acceso de lectura y escritura a
-- cualquiera que abra la URL pública.

-- ---------------------------------------------------------------- tareas

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title       text not null check (length(trim(title)) > 0),
  date        date not null,
  time        text,
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- estudio

create table if not exists public.study (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title       text not null check (length(trim(title)) > 0),
  date        date not null,
  time        text,
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- finanzas

create table if not exists public.finance (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade default auth.uid(),
  type        text not null check (type in ('ingreso', 'egreso')),
  amount      numeric(14, 2) not null check (amount > 0),
  category    text not null,
  date        date not null,
  note        text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- salud

create table if not exists public.health (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade default auth.uid(),
  date        date not null,
  weight      numeric(6, 2),
  active      boolean not null default false,
  created_at  timestamptz not null default now(),
  -- un único registro de salud por día y por usuario: la app hace upsert sobre él
  unique (user_id, date)
);

-- ---------------------------------------------------------------- reportes

create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade default auth.uid(),
  date          date not null,
  resumen_ayer  text not null default '',
  hoy           jsonb not null default '[]'::jsonb,
  ingresos      numeric(14, 2) not null default 0,
  egresos       numeric(14, 2) not null default 0,
  habitos       text not null default '',
  created_at    timestamptz not null default now(),
  -- un reporte por día: la rutina de las 2 AM hace upsert y es idempotente,
  -- así que volver a correrla el mismo día reescribe en vez de duplicar
  unique (user_id, date)
);

-- ---------------------------------------------------------------- índices

create index if not exists tasks_user_date_idx   on public.tasks   (user_id, date);
create index if not exists study_user_date_idx   on public.study   (user_id, date);
create index if not exists finance_user_date_idx on public.finance (user_id, date desc);
create index if not exists health_user_date_idx  on public.health  (user_id, date desc);
create index if not exists reports_user_date_idx on public.reports (user_id, date desc);

-- ---------------------------------------------------------------- permisos

-- RLS filtra filas, pero no otorga acceso a la tabla: sin estos GRANT, el rol
-- que llega desde el navegador recibe "permission denied" antes de que las
-- políticas lleguen a evaluarse. Supabase suele darlos por privilegios por
-- defecto; se explicitan para que la migración no dependa de eso.
grant usage on schema public to anon, authenticated;

-- ---------------------------------------------------------------- RLS

alter table public.tasks   enable row level security;
alter table public.study   enable row level security;
alter table public.finance enable row level security;
alter table public.health  enable row level security;
alter table public.reports enable row level security;

-- Una política por tabla que cubre select/insert/update/delete: se ve y se
-- escribe únicamente lo propio. El service_role (que usa la rutina diaria)
-- salta RLS por definición y no necesita política.
do $$
declare
  t text;
begin
  foreach t in array array['tasks', 'study', 'finance', 'health', 'reports'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_own_rows', t);
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t || '_own_rows', t
    );
  end loop;
end $$;
