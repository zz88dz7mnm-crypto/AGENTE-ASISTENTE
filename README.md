# AGENTE PRUEBA

Asistente personal web: tareas, estudio, agenda, finanzas y salud en un solo
lugar, con un reporte automático cada mañana.

Next.js (App Router) + Tailwind + Supabase. Mobile-first, sin emojis.

---

## Cómo correrlo

```bash
npm install
npm run dev        # http://localhost:3000
```

Sin variables de entorno la app arranca en **modo local**: datos de ejemplo
guardados en el navegador (localStorage), sin login y sin base de datos. Sirve
para trabajar en el diseño sin tocar datos reales.

Otros comandos:

```bash
npm run build      # build de producción
npm run lint       # eslint
npm test           # tests de la lógica del reporte diario
npm run report     # genera el reporte de hoy (requiere las claves de servidor)
```

---

## Conectar Supabase

### 1. Crear las tablas

En el proyecto de Supabase → **SQL Editor**, pegar y ejecutar el contenido de
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).

Crea las cinco tablas (`tasks`, `study`, `finance`, `health`, `reports`), sus
índices y las políticas de RLS.

Con la CLI, alternativamente:

```bash
supabase login
supabase link --project-ref znpnbuxmgatyjqtdpync
supabase db push
```

Después ejecutar, del mismo modo,
[`supabase/migrations/0002_sin_login.sql`](supabase/migrations/0002_sin_login.sql):
saca el login y deja todas las filas bajo un único dueño fijo.

### 2. Variables de entorno

Copiar `.env.example` a `.env.local` (local) y cargar las mismas dos variables
en **Vercel → Settings → Environment Variables**:

| Variable | Valor |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://znpnbuxmgatyjqtdpync.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la publishable key del proyecto |

En cuanto existan esas variables, la app deja de usar localStorage y guarda
todo en Supabase. Después de agregarlas hay que **redesplegar**: no se aplican
a los deploys que ya existen.

### Sobre la seguridad

**La app no tiene login: cualquiera que tenga la URL puede leer y modificar los
datos.** Es una decisión tomada a propósito, a cambio de entrar sin fricción.

La publishable key viaja en el bundle del navegador, así que no es un secreto,
y las políticas de RLS son abiertas (`using (true)`). La única mitigación
activa es que la app se publica con `noindex`, así que no la indexan los
buscadores; la privacidad depende de que la URL no circule.

Para volver a poner login: restaurar las políticas de `0001_init.sql`, crear el
usuario en **Authentication → Users** y volver a montar el `AuthGate`, que está
en el historial de git.

---

## Reporte automático de las 2:00 AM

Corre como **Routine de Claude Code**, en un sandbox en la nube que se destruye
al terminar. No consume API aparte de la suscripción.

Qué hace, cada noche:

1. Clona el repo y lee de Supabase lo de ayer y lo de hoy.
2. Calcula: qué se completó y qué quedó abierto, ingresos/egresos de la semana,
   categorías donde más se gastó, días activos y variación de peso.
3. Redacta el reporte y lo guarda en la tabla `reports`.
4. La web lo muestra al instante en la sección Reportes.

El reporte es **idempotente**: la tabla tiene un único registro por día
(`unique (user_id, date)`), así que volver a correrla reescribe en vez de
duplicar.

### Variables que necesita la Routine

Se cargan en el entorno de Claude Code, **no** en Vercel:

| Variable | Para qué |
| --- | --- |
| `SUPABASE_URL` | URL del proyecto |
| `SUPABASE_KEY` | la misma publishable key: alcanza, porque las políticas son abiertas |
| `AGENTE_TZ` | opcional; por defecto `America/Argentina/Buenos_Aires` |

### Probarlo a mano

```bash
npm run report -- --dry-run   # imprime el análisis sin escribir nada
npm run report                # genera y guarda el reporte de hoy
```

---

## Estructura

```
app/              páginas (dashboard, tareas, estudio, calendario, finanzas, salud, reportes)
components/       UI compartida, gráficos, riel de navegación
lib/              tipos, store, cliente de Supabase, utilidades de fecha
scripts/          rutina del reporte diario + sus tests
supabase/         migraciones SQL
```

El **store** (`lib/store.tsx`) es el único punto que sabe de dónde salen los
datos: expone la misma API en modo local y en modo conectado, así que las
páginas no cambian según el backend.
