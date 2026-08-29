export function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "alert";
}) {
  const color =
    tone === "positive"
      ? "var(--color-positive)"
      : tone === "alert"
      ? "var(--color-alert)"
      : "var(--color-text)";
  return (
    <div className="card flex flex-1 flex-col gap-1 px-4 py-3">
      <span className="text-[11px]" style={{ color: "var(--color-text-soft)" }}>
        {label}
      </span>
      <span className="font-num text-[18px]" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
