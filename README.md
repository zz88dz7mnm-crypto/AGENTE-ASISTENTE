# AGENTE PRUEBA — Fase 3 (revisión y mejora)

Asistente personal minimalista y mobile-first: tareas, estudio, agenda, finanzas y salud
en un solo lugar, más el histórico de reportes automáticos.

## Correr en local

```bash
npm install
npm run dev
```

Abrir http://localhost:3000

## Qué cambió en esta vuelta (mejoras sobre la versión revisada)

**Identidad visual**
- Se mantiene la paleta del plan (fondo #F5F4F1, cards #FDFDFC, acento #1F3D2B).
- Textura mármol real: vetas suaves en gradiente + grano fino generado por SVG, fija al viewport.
- Tipografía nueva: **Manrope** para interfaz (más carácter que Inter) e **IBM Plex Mono**
  reservada solo para cifras, horas y métricas (`.font-num`, tabular).
- Sistema de tokens ampliado: radios, cuatro niveles de sombra, curvas de easing y
  jerarquía de texto (`.display`, `.h1`, `.label`, `.muted`).
- Sin emojis. Íconos de trazo lineal unificados, con grosor consistente.

**Navegación**
- El riel lateral ahora es un componente doble: en escritorio queda fijo con íconos y
  tooltip por sección; en mobile sigue siendo la franja delgada del borde izquierdo
  (con marcador de posición de sección) que se despliega con swipe o tap.
- Cierre con Escape, fondo con blur y entrada animada de los ítems.

**Dashboard**
- Saludo + fecha larga, anillo de progreso animado con leyenda.
- Franja de cuatro métricas: tareas de hoy, estudio de hoy, balance semanal, días activos.
- Cronograma con línea de "ahora" y check directo desde el timeline.
- Tarjeta con el último reporte automático y accesos rápidos con ícono.

**Tareas y estudio**
- Filtros Hoy / Semana / Todo, agrupado por día con etiquetas relativas (Hoy, Mañana, día de la semana).
- Alta con fecha + horario, no solo hoy.
- Marca de "Atrasada", check con animación de trazo y estados vacíos con explicación.

**Calendario**
- Día seleccionado en grande con cronograma y bloque "sin horario".
- Mes con hasta tres puntos por día según cantidad de ítems, anillo en el día actual y botón "Hoy".

**Finanzas**
- Gráfico de barras con línea de base en cero (positivo/negativo) y tooltip al pasar el mouse.
- Ranking de egresos por categoría con porcentaje sobre el total.
- Rango semana/mes aplicado a todas las métricas.
- Carga por voz mejorada: entiende "2 mil"/"2 lucas", más categorías, feedback de lo cargado.

**Salud**
- Serie de peso como área con grilla, cursor y lectura del punto activo.
- Mapa de actividad en columnas semanales con etiquetas de día y marca del día actual.
- Métricas de racha y días activos 7/30.

**Reportes**
- Selector de fecha en tarjetas con etiqueta relativa, detalle en bloques
  (resumen, qué toca hoy numerado, plata con balance, hábitos).

**Base técnica**
- `lib/date-utils.ts`: utilidades nuevas (fechas relativas, minutos, formato de plata, rangos N días).
- `lib/store.tsx`: validación del payload de localStorage antes de hidratar, `updateTask`/`updateStudy`.
- `lib/sample-data.ts`: 30 días de salud y ~16 movimientos para que los gráficos tengan sentido.
- Skeletons de carga en lugar de pantalla en blanco mientras hidrata.
- `prefers-reduced-motion` respetado en todas las animaciones.

## Estructura

```
app/            rutas: dashboard, tareas, estudio, calendario, finanzas, salud, reportes
components/     riel, listas, cronograma, calendario, gráficos, primitivas de UI
lib/            tipos, store con localStorage, utilidades de fecha, datos de ejemplo
```

## Notas

- Los datos son de ejemplo y viven en localStorage (clave `agente-prueba:data:v1`).
  Se reemplazan por Supabase en la Fase 4.
- El archivo `CLAUDE.md` del proyecto original no viene en este zip por una restricción
  del entorno de trabajo; su contenido era una sola línea: `@AGENTS.md`. Volvé a crearlo
  con esa línea si lo necesitás.
