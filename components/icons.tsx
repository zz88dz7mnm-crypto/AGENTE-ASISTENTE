type IconProps = { size?: number; className?: string; strokeWidth?: number };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function svg(size: number, className?: string, strokeWidth = 1.5) {
  return { width: size, height: size, viewBox: "0 0 24 24", className, strokeWidth, ...base };
}

export function IconHome({ size = 18, className, strokeWidth }: IconProps) {
  return (
    <svg {...svg(size, className, strokeWidth)}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9.5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V10" />
      <path d="M10 20.5v-6h4v6" />
    </svg>
  );
}

export function IconCheck({ size = 18, className, strokeWidth }: IconProps) {
  return (
    <svg {...svg(size, className, strokeWidth)}>
      <rect x="4" y="4" width="16" height="16" rx="3.5" />
      <path d="m8.5 12.5 2.5 2.5 5-5" />
    </svg>
  );
}

export function IconBook({ size = 18, className, strokeWidth }: IconProps) {
  return (
    <svg {...svg(size, className, strokeWidth)}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v18h5.5a2.5 2.5 0 0 0 2.5-2.5v-13Z" />
    </svg>
  );
}

export function IconCalendar({ size = 18, className, strokeWidth }: IconProps) {
  return (
    <svg {...svg(size, className, strokeWidth)}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </svg>
  );
}

export function IconWallet({ size = 18, className, strokeWidth }: IconProps) {
  return (
    <svg {...svg(size, className, strokeWidth)}>
      <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h12a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5v-9Z" />
      <path d="M15.5 12.75a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" />
      <path d="M3.5 9.5h17" />
    </svg>
  );
}

export function IconHeart({ size = 18, className, strokeWidth }: IconProps) {
  return (
    <svg {...svg(size, className, strokeWidth)}>
      <path d="M12 20s-7.2-4.5-9.6-9.1C.9 7.9 2.4 4.7 5.6 4.1c1.9-.3 3.7.6 4.7 2.1l1.7 2.4 1.7-2.4c1-1.5 2.8-2.4 4.7-2.1 3.2.6 4.7 3.8 3.2 6.8C19.2 15.5 12 20 12 20Z" />
    </svg>
  );
}

export function IconFile({ size = 18, className, strokeWidth }: IconProps) {
  return (
    <svg {...svg(size, className, strokeWidth)}>
      <path d="M6.5 3.5h8L19 8v12a1 1 0 0 1-1 1H6.5a1 1 0 0 1-1-1v-15.5a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5V8h5" />
      <path d="M8.5 12.5h7M8.5 15.5h7M8.5 18h4" />
    </svg>
  );
}

export function IconChevronRight({ size = 16, className, strokeWidth }: IconProps) {
  return (
    <svg {...svg(size, className, strokeWidth)}>
      <path d="m9.5 5 7 7-7 7" />
    </svg>
  );
}

export function IconChevronDown({ size = 16, className, strokeWidth }: IconProps) {
  return (
    <svg {...svg(size, className, strokeWidth)}>
      <path d="m5 9.5 7 7 7-7" />
    </svg>
  );
}

export function IconClose({ size = 18, className, strokeWidth }: IconProps) {
  return (
    <svg {...svg(size, className, strokeWidth)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconPlus({ size = 16, className, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg {...svg(size, className, strokeWidth)}>
      <path d="M12 5.5v13M5.5 12h13" />
    </svg>
  );
}

export function IconTrash({ size = 15, className, strokeWidth }: IconProps) {
  return (
    <svg {...svg(size, className, strokeWidth)}>
      <path d="M4.5 7h15M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M18 7l-.7 12.2a2 2 0 0 1-2 1.8H8.7a2 2 0 0 1-2-1.8L6 7" />
    </svg>
  );
}

export function IconMic({ size = 16, className, strokeWidth }: IconProps) {
  return (
    <svg {...svg(size, className, strokeWidth)}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" />
    </svg>
  );
}

export function IconArrowUpRight({ size = 14, className, strokeWidth }: IconProps) {
  return (
    <svg {...svg(size, className, strokeWidth)}>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

export function IconArrowDownRight({ size = 14, className, strokeWidth }: IconProps) {
  return (
    <svg {...svg(size, className, strokeWidth)}>
      <path d="M7 7l10 10M17 9v8H9" />
    </svg>
  );
}

export function IconMenu({ size = 18, className, strokeWidth }: IconProps) {
  return (
    <svg {...svg(size, className, strokeWidth)}>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  );
}

export function IconClock({ size = 15, className, strokeWidth }: IconProps) {
  return (
    <svg {...svg(size, className, strokeWidth)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function IconRefresh({ size = 15, className, strokeWidth }: IconProps) {
  return (
    <svg {...svg(size, className, strokeWidth)}>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4.5V9h-4.5" />
    </svg>
  );
}

export function IconLogout({ size = 18, className, strokeWidth }: IconProps) {
  return (
    <svg {...svg(size, className, strokeWidth)}>
      <path d="M14.5 5.5V4a1 1 0 0 0-1-1h-8a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1.5" />
      <path d="M10 12h10M17 9l3 3-3 3" />
    </svg>
  );
}
