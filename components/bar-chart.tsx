export function BarChart({
  data,
  height = 120,
  positiveColor = "var(--color-accent)",
  negativeColor = "var(--color-alert)",
}: {
  data: { label: string; value: number }[];
  height?: number;
  positiveColor?: string;
  negativeColor?: string;
}) {
  const max = Math.max(1, ...data.map((d) => Math.abs(d.value)));
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => {
        const h = Math.max(2, (Math.abs(d.value) / max) * (height - 22));
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full flex-1 items-end justify-center">
              <div
                className="w-full max-w-[22px] rounded-t-[4px]"
                style={{
                  height: h,
                  background: d.value < 0 ? negativeColor : positiveColor,
                  opacity: 0.85,
                }}
              />
            </div>
            <span className="text-[10px]" style={{ color: "var(--color-text-soft)" }}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function LineChart({
  data,
  height = 120,
  color = "var(--color-accent)",
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}) {
  if (data.length === 0) return null;
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 100;
  const step = data.length > 1 ? w / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = i * step;
    const y = height - 18 - ((d.value - min) / range) * (height - 30);
    return `${x},${y}`;
  });

  return (
    <div style={{ height }}>
      <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none">
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={1.6}
          vectorEffect="non-scaling-stroke"
        />
        {data.map((d, i) => (
          <circle key={i} cx={i * step} cy={height - 18 - ((d.value - min) / range) * (height - 30)} r={1.6} fill={color} />
        ))}
      </svg>
      <div className="mt-1 flex justify-between">
        <span className="text-[10px]" style={{ color: "var(--color-text-soft)" }}>
          {data[0].label}
        </span>
        <span className="text-[10px]" style={{ color: "var(--color-text-soft)" }}>
          {data[data.length - 1].label}
        </span>
      </div>
    </div>
  );
}
