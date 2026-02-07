"use client";

import { ENABLE_CARD_DETAIL_OPTION_2_EXPAND } from "./constants";
import { CardDetailsContent } from "./CardDetailsContent";
import type { CardDetailData, CardDetailTheme } from "./CardDetailsContent";

/** Option 2: "More details" arrow at bottom of tile → expand in place with same details. Disabled when ENABLE_CARD_DETAIL_OPTION_2_EXPAND is false. */
export function CardDetailOption2Expand({
  card,
  theme,
  expanded,
  onToggle,
}: {
  card: CardDetailData;
  theme: CardDetailTheme;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (!ENABLE_CARD_DETAIL_OPTION_2_EXPAND) return null;

  return (
    <>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--pill-bg)", display: "flex", justifyContent: "center" }}>
        <button
          type="button"
          onClick={onToggle}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 14px",
            border: "1px solid var(--border)",
            borderRadius: 8,
            background: "var(--surface)",
            color: "var(--text-muted)",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {expanded ? "▲ Less" : "▼ More details"}
        </button>
      </div>
      <div
        style={{
          overflow: "hidden",
          transition: "max-height 0.55s ease-out",
          maxHeight: expanded ? 2000 : 0,
        }}
      >
        {expanded && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--pill-bg)", paddingBottom: 4 }}>
            <CardDetailsContent card={card} theme={theme} />
          </div>
        )}
      </div>
    </>
  );
}
