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
  IconWallet,
} from "./icons";

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
      if (x < 24) touchStartX.current = x;
      else touchStartX.current = null;
    }
    function onTouchMove(e: TouchEvent) {
      if (touchStartX.current === null) return;
      const dx = e.touches[0].clientX - touchStartX.current;
      if (dx > 40) {
        setOpen(true);
        touchStartX.current = null;
      }
    }
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return (
    <>
      {/* Franja delgada siempre visible pegada al borde izquierdo */}
      <button
        aria-label="Abrir navegación"
        onClick={() => setOpen(true)}
        className="fixed left-0 top-0 z-40 h-full w-3 bg-transparent"
      >
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 h-16 w-[3px] rounded-full"
          style={{ background: "var(--color-accent)", opacity: 0.55 }}
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute inset-0"
            style={{ background: "rgba(26,31,28,0.28)" }}
          />
          <nav
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 flex h-full w-60 flex-col gap-1 border-r p-4 pt-6"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="mb-4 px-2">
              <p className="text-[13px] font-medium tracking-tight" style={{ color: "var(--color-accent)" }}>
                Agente
              </p>
              <p className="text-[11px]" style={{ color: "var(--color-text-soft)" }}>
                Asistente personal
              </p>
            </div>
            {SECTIONS.map(({ href, label, Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] transition-colors"
                  style={{
                    background: active ? "var(--color-accent)" : "transparent",
                    color: active ? "var(--color-surface)" : "var(--color-text)",
                  }}
                >
                  <Icon size={17} className="shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
