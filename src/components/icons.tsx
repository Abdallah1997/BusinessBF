/**
 * Inline SVG icon set — 16px stroke icons, currentColor.
 * Per DESIGN.md: no emoji/unicode glyphs in UI chrome.
 */

type IconProps = { className?: string };

function base(props: IconProps) {
  return {
    className: props.className ?? "h-4 w-4",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

export const IconGrid = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

export const IconBox = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
    <path d="M3 8l9 5 9-5" />
    <path d="M12 13v8" />
  </svg>
);

export const IconTag = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 2H2v10l9.3 9.3a1.5 1.5 0 002.1 0l8-8a1.5 1.5 0 000-2.1L12 2z" />
    <circle cx="7" cy="7" r="1.5" />
  </svg>
);

export const IconTrendUp = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </svg>
);

export const IconReceipt = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3z" />
    <path d="M9 8h6M9 12h6" />
  </svg>
);

export const IconChart = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />
  </svg>
);

export const IconPen = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M17 3l4 4L8 20l-5 1 1-5L17 3z" />
  </svg>
);

export const IconGear = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a7.97 7.97 0 00.1-6l2-1.5-2-3.4-2.4.9a8 8 0 00-5.2-3l-.4-2.5h-4l-.4 2.5a8 8 0 00-5.2 3L-.4 4.1l2 3.4L3.5 9a7.97 7.97 0 00.1 6l-2 1.5 2 3.4 2.4-.9a8 8 0 005.2 3l.4 2.5h4l.4-2.5a8 8 0 005.2-3l2.4.9 2-3.4-2.1-1.5z" transform="scale(0.92) translate(1,1)" />
  </svg>
);

export const IconBank = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 9l9-6 9 6v1H3V9z" />
    <path d="M5 10v8M10 10v8M14 10v8M19 10v8" />
    <path d="M3 21h18M3 18h18" />
  </svg>
);

export const IconMail = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);

export const IconCamera = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 7h3l2-2h6l2 2h3a1 1 0 011 1v11a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

export const IconAlert = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3l10 18H2L12 3z" />
    <path d="M12 10v4M12 17.5v.5" />
  </svg>
);

export const IconCheck = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 12.5l5 5L20 6" />
  </svg>
);

export const IconX = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 5l14 14M19 5L5 19" />
  </svg>
);

export const IconSparkle = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
    <path d="M19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16z" />
  </svg>
);

export const IconExternal = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14 4h6v6" />
    <path d="M20 4L10 14" />
    <path d="M20 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1h5" />
  </svg>
);
