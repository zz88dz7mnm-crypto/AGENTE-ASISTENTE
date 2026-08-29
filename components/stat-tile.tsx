import { ReactNode } from "react";
import { IconArrowDownRight, IconArrowUpRight } from "./icons";

export function StatTile({
  label,
  value,
  hint,
  tone = "default",
  trend,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "alert" | "accent";
  trend?: "up" | "down";
  icon?: ReactNode;
}) {
  const color =
    tone === "positive"
      ? "var(--color-positive)"
      : tone === "alert"
      ? "var(--color-alert)"
      : tone === "accent"
      ? "var(--color-accent)"
      : "var(--color-text)";

  return (
    <div className="card hoverable flex flex-1 flex-col gap-2 px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="label" style={{ letterSpacing: "0.08em" }}>
          {label}
        </span>
        {icon ? (
          <span style={{ color: "var(--color-text-faint)" }}>{icon}</span>
        ) : trend ? (
          <span style={{ color }}>
            {trend === "up" ? <IconArrowUpRight size={13} /> : <IconArrowDownRight size={13} />}
          </span>
        ) : null}
      </div>
      <span className="font-num text-[20px] leading-none" style={{ color }}>
        {value}
      </span>
      {hint && <span className="text-[11.5px] leading-tight muted">{hint}</span>}
    </div>
  );
}
