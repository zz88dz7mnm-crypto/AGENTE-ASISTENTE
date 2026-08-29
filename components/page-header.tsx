export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 pl-4">
      <h1 className="text-[20px] font-medium tracking-tight" style={{ color: "var(--color-accent)" }}>
        {title}
      </h1>
      {subtitle && (
        <p className="mt-0.5 text-[13px]" style={{ color: "var(--color-text-soft)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
