"use client";

import { ENABLE_CARD_DETAIL_OPTION_1_MODAL } from "./constants";
import { CardDetailsContent } from "./CardDetailsContent";
import type { CardDetailData, CardDetailTheme } from "./CardDetailsContent";

/** Option 1: Click card title → modal popup with full details. Disabled when ENABLE_CARD_DETAIL_OPTION_1_MODAL is false. */
export function CardDetailOption1Modal({
  card,
  theme,
  onClose,
}: {
  card: CardDetailData | null;
  theme: CardDetailTheme;
  onClose: () => void;
}) {
  if (!ENABLE_CARD_DETAIL_OPTION_1_MODAL || !card) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Card details"
      className="card-detail-modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "rgba(0,0,0,0.5)",
      }}
      onClick={onClose}
    >
      <div
        className="card-detail-modal-content"
        style={{
          background: "var(--surface-elevated)",
          borderRadius: 16,
          border: "2px solid var(--card-tile-border)",
          maxWidth: 720,
          width: "100%",
          boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 24px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{card.card_name}</h3>
          <button
            type="button"
            className="card-detail-modal-close tap-target"
            onClick={onClose}
            style={{
              padding: "8px 14px",
              border: "1px solid var(--border)",
              borderRadius: 8,
              background: "var(--surface)",
              color: "var(--text-muted)",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "20px 24px 24px" }}>
          <CardDetailsContent card={card} theme={theme} />
        </div>
      </div>
    </div>
  );
}
