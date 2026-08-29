import { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-7 flex items-end justify-between gap-4 rise">
      <div>
        {eyebrow && <p className="label mb-2">{eyebrow}</p>}
        <h1 className="display" style={{ color: "var(--color-accent)" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 max-w-[54ch] text-[13px] leading-relaxed muted" style={{ textWrap: "pretty" }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
