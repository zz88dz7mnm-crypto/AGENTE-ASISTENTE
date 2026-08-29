"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  IconBook,
  IconCalendar,
  IconCheck,
  IconFile,
  IconHeart,
  IconHome,
  IconLogout,
  IconWallet,
} from "./icons";
import { useAuth } from "@/lib/auth";

const SECTIONS = [
  { href: "/", label: "Dashboard", Icon: IconHome },
  { href: "/tareas", label: "Tareas", Icon: IconCheck },
  { href: "/estudio", label: "Estudio", Icon: IconBook },
  { href: "/calendario", label: "Calendario", Icon: IconCalendar },
  { href: "/finanzas", label: "Finanzas", Icon: IconWallet },
  { href: "/salud", label: "Salud", Icon: IconHeart },
  { href: "/reportes", label: "Reportes", Icon: IconFile },
];

export function Rail() {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const pathname = usePathname();
  const touchStartX = useRef<number | null>(null);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      const x = e.touches[0].clientX;
      touchStartX.current = x < 28 ? x : null;
    }
    function onTouchMove(e: TouchEvent) {
      if (touchStartX.current === null) return;
      if (e.touches[0].clientX - touchStartX.current > 38) {
        setOpen(true);
        touchStartX.current = null;
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const activeIndex = SECTIONS.findIndex((s) => s.href === pathname);

  return (
    <>
      {/* Riel delgado, siempre visible pegado al borde izquierdo */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="fixed left-0 top-0 z-40 flex h-full w-5 flex-col items-center justify-center lg:w-14"
      >
        <button
          aria-label="Abrir navegación"
          onClick={() => setOpen(true)}
          className="absolute inset-0 lg:hidden"
        />
        <div
          className="pointer-events-none absolute left-0 top-0 h-full w-px"
          style={{ background: "var(--color-border)" }}
        />
        <nav className="relative z-10 flex flex-col items-center gap-1.5">
          {SECTIONS.map(({ href, label, Icon }, i) => {
            const active = i === activeIndex;
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className="group relative hidden h-9 w-9 items-center justify-center rounded-[11px] lg:flex"
                style={{
                  background: active ? "var(--color-accent)" : "transparent",
                  color: active ? "var(--color-surface)" : "var(--color-text-faint)",
                  transition: "background 0.26s var(--ease-out), color 0.26s var(--ease-out)",
                }}
              >
                <Icon size={17} strokeWidth={active ? 1.7 : 1.5} />
                <span
                  className="pointer-events-none absolute left-[46px] whitespace-nowrap rounded-lg px-2.5 py-1 text-[12px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  style={{
                    background: "var(--color-text)",
                    color: "var(--color-surface)",
                    boxShadow: "var(--shadow-md)",
                  }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Handle mobile: marca de posición sobre el borde */}
        <div
          className="pointer-events-none absolute left-0 top-1/2 flex -translate-y-1/2 flex-col gap-1.5 lg:hidden"
          style={{ opacity: hovered ? 1 : 0.75, transition: "opacity 0.25s var(--ease-out)" }}
        >
          {SECTIONS.map((s, i) => (
            <span
              key={s.href}
              className="rounded-full"
              style={{
                height: i === activeIndex ? 20 : 5,
                width: 3,
                background: i === activeIndex ? "var(--color-accent)" : "var(--color-border-strong)",
                transition: "height 0.3s var(--ease-out)",
              }}
            />
          ))}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden" onClick={() => setOpen(false)}>
          <div
            className="absolute inset-0 fade"
            style={{ background: "rgba(26,31,28,0.32)", backdropFilter: "blur(3px)" }}
          />
          <nav
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 flex h-full w-[248px] flex-col gap-1 border-r p-4 pt-7"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              boxShadow: "var(--shadow-lg)",
              animation: "slide-in-left 0.36s var(--ease-out) both",
            }}
          >
            <div className="mb-5 px-2.5">
              <p className="h1" style={{ color: "var(--color-accent)" }}>
                Agente
              </p>
              <p className="mt-0.5 text-[12px] muted">Asistente personal</p>
            </div>
            {SECTIONS.map(({ href, label, Icon }, i) => {
              const active = i === activeIndex;
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px]"
                  style={{
                    background: active ? "var(--color-accent)" : "transparent",
                    color: active ? "var(--color-surface)" : "var(--color-text)",
                    fontWeight: active ? 600 : 450,
                    animation: `rise 0.4s var(--ease-out) ${0.03 * i + 0.05}s both`,
                  }}
                >
                  <Icon size={17} className="shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}
            <SignOutButton />
          </nav>
        </div>
      )}
    </>
  );
}

/**
 * Sólo aparece con Supabase conectado: en modo local no hay sesión que cerrar.
 */
function SignOutButton() {
  const { session, signOut } = useAuth();
  if (!session) return null;

  return (
    <button
      onClick={() => void signOut()}
      className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] transition-colors"
      style={{ color: "var(--color-text-soft)" }}
    >
      <IconLogout size={17} className="shrink-0" />
      <span>Cerrar sesión</span>
    </button>
  );
}
