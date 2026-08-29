"use client";

import { ReactNode } from "react";

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3.5 flex items-baseline justify-between gap-3">
      <span className="label">{children}</span>
      {right}
    </div>
  );
}

export function Card({
  children,
  className = "",
  padded = true,
  hover = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  hover?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <section
      className={`card ${hover ? "hoverable" : ""} ${padded ? "p-5" : ""} ${className}`}
      style={style}
    >
      {children}
    </section>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button key={o} data-active={value === o} onClick={() => onChange(o)} className="capitalize">
          {o}
        </button>
      ))}
    </div>
  );
}

export function Empty({ title, hint, icon }: { title: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-5 py-11 text-center">
      {icon && (
        <span
          className="mb-1 flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: "var(--color-accent-tint)", color: "var(--color-accent)" }}
        >
          {icon}
        </span>
      )}
      <p className="text-[14px] font-medium">{title}</p>
      {hint && (
        <p className="max-w-[34ch] text-[12.5px] leading-relaxed muted" style={{ textWrap: "pretty" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function Skeleton({ h = 16, w = "100%", r = 10 }: { h?: number; w?: number | string; r?: number }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: r }} />;
}

export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4 fade">
      <div className="flex flex-col gap-2.5 pl-1">
        <Skeleton h={11} w={110} />
        <Skeleton h={26} w={190} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} h={78} r={16} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton h={250} r={16} />
        <Skeleton h={250} r={16} />
      </div>
    </div>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return <div className={`h-px w-full ${className}`} style={{ background: "var(--color-border)" }} />;
}

export function Dot({ color, size = 6 }: { color: string; size?: number }) {
  return (
    <span
      className="shrink-0 rounded-full"
      style={{ background: color, height: size, width: size }}
    />
  );
}
