"use client";

/**
 * Standardized card tile used across results, sandbox-results, max-rewards, pro-churner.
 * Uses design tokens (CSS vars) so theme (personal/business) and dark/light apply automatically.
 * Set data-card-mode="personal" or "business" on a parent to switch accent colors.
 *
 * Exception: showMaxRewardsLine shows "Put $X here → $Y bonus" (only on max-rewards flow).
 */

import type { Card } from "@/app/lib/cardTypes";
import {
  formatBonusDisplay,
  getRewardModelLabel,
  getCashbackDisplay,
  splitProsCons,
  parseMinSpend,
} from "@/app/lib/cardDisplay";
import { getIssuerStyle, getBankLogoPath, getBrandLogoPath } from "@/app/lib/issuerStyles";

export interface CardTileProps {
  card: Card;
  /** Show "Put $X here → $Y bonus" line (max-rewards mode only). */
  showMaxRewardsLine?: boolean;
  /** Override min spend for max-rewards line (e.g. from allocation). */
  minSpendOverride?: number;
  /** Override bonus for max-rewards line (e.g. from allocation). */
  bonusOverride?: number;
  /** Show pros/cons sections on the tile. */
  showProsCons?: boolean;
  /** Show "Add to compare" checkbox. */
  showCompareCheckbox?: boolean;
  compareChecked?: boolean;
  onCompareChange?: (checked: boolean) => void;
  /** Show "Have it / Not interested" checkbox. */
  showOwnedCheckbox?: boolean;
  ownedCards?: string[];
  onOwnedChange?: (cardName: string, haveIt: boolean) => void;
  /** Make card name a button that calls onTitleClick (e.g. open detail modal). */
  titleAsButton?: boolean;
  onTitleClick?: () => void;
  /** Optional content after actions (e.g. CardDetailOption2Expand). */
  children?: React.ReactNode;
  className?: string;
}

export function CardTile({
  card,
  showMaxRewardsLine = false,
  minSpendOverride,
  bonusOverride,
  showProsCons = false,
  showCompareCheckbox = false,
  compareChecked = false,
  onCompareChange,
  showOwnedCheckbox = false,
  ownedCards = [],
  onOwnedChange,
  titleAsButton = false,
  onTitleClick,
  children,
  className = "",
}: CardTileProps) {
  const style = getIssuerStyle(card.issuer);
  const bonusDisplay = formatBonusDisplay(card);
  const rewardLabel = getRewardModelLabel(card.reward_model);
  const cashbackDisplay = getCashbackDisplay(card);
  const bankLogo = getBankLogoPath(card.issuer);
  const brandLogo = getBrandLogoPath(card);

  const minSpend = minSpendOverride ?? parseMinSpend(card.minimum_spend_amount);
  const bonus = bonusOverride ?? parseInt(card.estimated_bonus_value_usd || "0", 10);
  const showPutLine = showMaxRewardsLine && (minSpend > 0 && bonus > 0);

  const isOwned = ownedCards.includes(card.card_name);

  return (
    <div className={`results-card-wrap ${className}`.trim()} style={{ marginBottom: 20 }}>
      <div
        className="results-card-tile"
        style={{
          display: "flex",
          gap: 16,
          background: "var(--surface-elevated)",
          borderRadius: 14,
          padding: 16,
          border: "2px solid var(--card-tile-border)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <div
          className="results-card-tile-logo"
          style={{
            width: 72,
            minWidth: 72,
            height: 72,
            borderRadius: 10,
            background: bankLogo ? "transparent" : "linear-gradient(145deg, var(--pill-bg) 0%, var(--border) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {bankLogo ? (
            <img src={bankLogo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          ) : null}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            {titleAsButton && onTitleClick ? (
              <button
                type="button"
                onClick={onTitleClick}
                style={{
                  margin: 0,
                  padding: 0,
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  font: "inherit",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  lineHeight: 1.3,
                  textAlign: "left",
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                }}
              >
                {card.card_name}
              </button>
            ) : (
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>
                {card.card_name}
              </h3>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {brandLogo && (
                <img src={brandLogo} alt="" style={{ width: 40, height: 40, objectFit: "contain" }} />
              )}
              {showOwnedCheckbox && (
                <label style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }} className="results-tap-target">
                  <input
                    type="checkbox"
                    checked={isOwned}
                    onChange={() =>
                      onOwnedChange?.(
                        card.card_name,
                        !ownedCards.includes(card.card_name)
                      )
                    }
                  />{" "}
                  Have it / Not interested
                </label>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, alignItems: "center" }}>
            <span
              style={{
                background: style.bg,
                color: style.text,
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {card.issuer}
            </span>
            {card.card_type === "business" && (
              <span
                style={{
                  background: "var(--business-badge-bg)",
                  color: "var(--business-badge-text)",
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                Business card
              </span>
            )}
            {rewardLabel && (
              <span
                style={{
                  background: "var(--pill-bg)",
                  color: "var(--pill-text)",
                  padding: "4px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                }}
              >
                {rewardLabel}
              </span>
            )}
            {card.intro_apr_purchase && (
              <span style={{ color: "var(--text-muted)", fontSize: 11 }}>APR {card.intro_apr_purchase}</span>
            )}
            {cashbackDisplay && (
              <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
                • Expected cashback {cashbackDisplay}
              </span>
            )}
          </div>

          {showPutLine && (
            <div
              className="results-card-bonus"
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "var(--bonus-text)",
                background: "var(--bonus-bg)",
                padding: "6px 10px",
                borderRadius: 6,
                display: "inline-block",
              }}
            >
              Put <strong>${minSpend.toLocaleString()}</strong> here → <strong>${bonus.toLocaleString()}</strong> bonus
            </div>
          )}

          {!showMaxRewardsLine && bonusDisplay && (
            <div
              className="results-card-bonus"
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "var(--bonus-text)",
                background: "var(--bonus-bg)",
                padding: "6px 10px",
                borderRadius: 6,
                display: "inline-block",
              }}
            >
              {bonusDisplay}
            </div>
          )}

          {card.best_for && (
            <p
              className="results-card-best-for"
              style={{ margin: "8px 0 0", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.4 }}
            >
              This card is best for: {card.best_for}
            </p>
          )}

          {showProsCons && (
            <div className="results-card-pros-cons">
              {card.pros && (
                <div
                  style={{
                    background: "var(--pros-bg)",
                    padding: 10,
                    borderRadius: 8,
                    borderLeft: "4px solid var(--pros-text)",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 11, color: "var(--pros-text)", marginBottom: 4 }}>
                    Pros
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--pros-list)", lineHeight: 1.5 }}>
                    {splitProsCons(card.pros).map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {card.cons && (
                <div
                  style={{
                    background: "var(--cons-bg)",
                    padding: 10,
                    borderRadius: 8,
                    borderLeft: "4px solid var(--cons-text)",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 11, color: "var(--cons-text)", marginBottom: 4 }}>
                    Cons
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--cons-list)", lineHeight: 1.5 }}>
                    {splitProsCons(card.cons).map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div
            className="results-card-tile-actions"
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: "1px solid var(--pill-bg)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div>
              {(card.application_link || "").trim() && (
                <a
                  href={(card.application_link || "").trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="results-apply-btn tap-target"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: 8,
                    background: "var(--accent)",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Apply for this card →
                </a>
              )}
            </div>
            {showCompareCheckbox && onCompareChange && (
              <label
                className="tap-target"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: compareChecked ? "var(--accent-light)" : "var(--surface)",
                  border: `1px solid ${compareChecked ? "var(--accent-lighter)" : "var(--border)"}`,
                  fontSize: 12,
                  color: compareChecked ? "var(--accent-dark)" : "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={compareChecked}
                  onChange={(e) => onCompareChange(e.target.checked)}
                />
                {compareChecked ? "✓ In compare" : "Add to compare"}
              </label>
            )}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
