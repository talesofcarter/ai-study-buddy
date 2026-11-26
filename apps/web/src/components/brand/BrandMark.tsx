interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="9"
        y="5"
        width="18"
        height="13"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="1.5"
      />
      <rect
        x="4"
        y="10"
        width="19"
        height="15"
        rx="3"
        className="fill-surface"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="8"
        y="17.5"
        width="11"
        height="4.5"
        rx="1"
        className="fill-accent"
      />
      <path
        d="M8 15h11M8 20h8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
