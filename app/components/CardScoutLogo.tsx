"use client";

import { getTheme } from "../lib/theme";

type CardScoutLogoProps = {
  width?: number;
  height?: number;
  mode?: "personal" | "business";
  className?: string;
  style?: React.CSSProperties;
};

/**
 * SVG Card Scout logo using theme colors.
 * Matches the page background and primary palette.
 */
export function CardScoutLogo({ width = 286, height = 156, mode = "personal", className, style }: CardScoutLogoProps) {
  const theme = getTheme(mode);
  const dark = theme.primaryDark;   // "Card" text, bottom card, magnetic stripe
  const teal = "#55AFAD";          // "Scout" text, top card (RGB 85, 175, 173)
  const light = theme.primaryLight; // shadow/outline

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 286 156"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Card Scout"
    >
      <defs>
        <filter id={`shadow-${mode}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="0" floodColor={light} />
        </filter>
      </defs>
      {/* Cards group - left side */}
      <g transform="translate(0, 18)">
        {/* Bottom card - dark */}
        <g transform="translate(8, 24) rotate(-2)">
          <rect
            x="0"
            y="0"
            width="72"
            height="48"
            rx="4"
            fill={dark}
            stroke={light}
            strokeWidth="1.5"
          />
          {/* Chip / signature lines */}
          <rect x="8" y="32" width="16" height="3" rx="1" fill="rgba(255,255,255,0.4)" />
          <rect x="8" y="37" width="24" height="2" rx="1" fill="rgba(255,255,255,0.25)" />
          <rect x="8" y="41" width="20" height="2" rx="1" fill="rgba(255,255,255,0.2)" />
        </g>
        {/* Top card - teal, offset up-right */}
        <g transform="translate(28, 0) rotate(4)">
          <rect
            x="0"
            y="0"
            width="72"
            height="48"
            rx="4"
            fill={teal}
            stroke={light}
            strokeWidth="1.5"
          />
          {/* Magnetic stripe */}
          <rect x="0" y="0" width="72" height="12" rx="4" fill={dark} />
          <rect x="0" y="4" width="72" height="8" fill={dark} />
        </g>
      </g>

      {/* Text "Card Scout" - right side */}
      <g transform="translate(120, 20)">
        <text
          x="0"
          y="35"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontSize="42"
          fontWeight="700"
          fill={dark}
          filter={`url(#shadow-${mode})`}
        >
          Card
        </text>
        <text
          x="0"
          y="83"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontSize="42"
          fontWeight="700"
          fill={teal}
          filter={`url(#shadow-${mode})`}
        >
          Scout
        </text>
      </g>
    </svg>
  );
}
