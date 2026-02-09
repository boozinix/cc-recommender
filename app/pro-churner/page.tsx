"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { computeOptimalPlan, type CardForAllocation } from "@/app/lib/spendAllocation";
import { getTheme } from "@/app/lib/theme";
import { getEstimatedBonusValueUsd } from "@/app/lib/pointValues";

type Card = CardForAllocation & {
  issuer: string;
  card_type: string;
  reward_model: string;
  card_family?: string;
  spend_time_frame?: string;
  best_for?: string;
  application_link?: string;
};

const issuerColors: Record<string, { bg: string; text: string }> = {
  chase: { bg: "#1e3a8a", text: "#ffffff" },
  amex: { bg: "#e5e7eb", text: "#0f172a" },
  citi: { bg: "#0e7490", text: "#ffffff" },
  "bank of america": { bg: "#dc2626", text: "#ffffff" },
  "capital one": { bg: "#dc2626", text: "#ffffff" },
  barclays: { bg: "#e0f2fe", text: "#075985" },
  "u.s. bank": { bg: "#0f172a", text: "#ffffff" },
  "wells fargo": { bg: "#d71e28", text: "#ffffff" }
};

const bankLogoFiles: Record<string, string> = {
  "Chase": "chase.svg",
  "Citi": "citi.svg",
  "Capital One": "capital-one.svg",
  "Bank of America": "bank-of-america.svg",
  "Amex": "american-express.svg",
  "Barclays": "barclays.jpeg",
  "U.S. Bank": "usbank.png",
  "Wells Fargo": "wellsfargo.jpg"
};

function getIssuerStyle(issuer: string) {
  return issuerColors[issuer.toLowerCase()] || { bg: "#e5e7eb", text: "#111827" };
}

function getBankLogoPath(issuer: string): string | null {
  const file = bankLogoFiles[issuer];
  return file ? `/logos/banks/${file}` : null;
}

function getRewardModelLabel(rewardModel: string): string {
  const r = (rewardModel || "").toLowerCase();
  if (r === "travel" || r === "airline" || r === "hotel") return "Travel";
  if (r === "cashback") return "Cashback";
  return rewardModel ? rewardModel.charAt(0).toUpperCase() + rewardModel.slice(1) : "";
}

function parseMinSpend(raw: string | undefined): number {
  if (!raw || !raw.trim()) return 0;
  const cleaned = raw.replace(/[$,]/g, "").trim();
  const n = parseInt(cleaned, 10);
  return Number.isNaN(n) ? 0 : n;
}

function formatBonusDisplay(card: Card): string | null {
  const value = parseInt(card.estimated_bonus_value_usd || "0", 10);
  if (!value) return null;
  const minSpendRaw = (card.minimum_spend_amount || "").trim();
  const timeFrame = (card.spend_time_frame || "").trim();
  const minSpendNum = parseMinSpend(minSpendRaw);
  const months = parseInt(timeFrame, 10);
  let text = `Worth $${value.toLocaleString()} estimated value`;
  if (minSpendNum > 0 && !Number.isNaN(months) && months > 0) {
    const spendFormatted = minSpendRaw.includes("$") ? minSpendRaw : `$${Number(minSpendRaw.replace(/[,]/g, "")).toLocaleString()}`;
    text += `, if you spend ${spendFormatted} in ${months} month${months === 1 ? "" : "s"}`;
  }
  return text;
}

export default function ProChurnerPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [maxSpend, setMaxSpend] = useState<string>("20000");
  const [maxCards, setMaxCards] = useState<string>("5");
  const [plan, setPlan] = useState<ReturnType<typeof computeOptimalPlan> | null>(null);

  useEffect(() => {
    fetch("/cards.csv")
      .then((r) => r.text())
      .then((cardsText) => {
        const parsed = Papa.parse<Card>(cardsText, { header: true, skipEmptyLines: true });
        const enriched = parsed.data.map((c: Card) => ({
          ...c,
          estimated_bonus_value_usd: String(getEstimatedBonusValueUsd(c))
        }));
        setCards(enriched);
      })
      .catch(() => setCards([]));
  }, []);

  const runOptimizer = () => {
    const budget = Math.max(0, parseInt(maxSpend, 10) || 0);
    const max = Math.max(1, Math.min(20, parseInt(maxCards, 10) || 5));
    if (budget <= 0 || cards.length === 0) {
      setPlan(null);
      return;
    }
    const result = computeOptimalPlan(cards, budget, max);
    setPlan(result);
  };

  const theme = getTheme("personal");

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)", padding: "24px", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ color: theme.primary, fontWeight: 600, textDecoration: "none" }}>← Back</Link>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>Pro churner</h1>
        </div>

        <p style={{ margin: "0 0 20px", color: "var(--text-muted)", fontSize: 14 }}>
          Enter how much you can spend and the max number of cards. We’ll suggest which cards to apply for to maximize total signup bonus.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", marginBottom: 24 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Max spending ($)</span>
            <input
              type="number"
              min={1}
              max={500000}
              value={maxSpend}
              onChange={(e) => setMaxSpend(e.target.value)}
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 16, width: 160 }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Max number of cards</span>
            <input
              type="number"
              min={1}
              max={20}
              value={maxCards}
              onChange={(e) => setMaxCards(e.target.value)}
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 16, width: 120 }}
            />
          </label>
          <button
            type="button"
            onClick={runOptimizer}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: theme.primary,
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Get optimal plan
          </button>
        </div>

        {plan && (
          <>
            <div
              style={{
                marginBottom: 24,
                padding: 16,
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--surface-elevated)"
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Your optimal plan</div>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 14, color: "var(--text-secondary)" }}>
                <span><strong>Total bonus:</strong> ${plan.totalBonus.toLocaleString()}</span>
                <span><strong>Spend used:</strong> ${plan.totalSpendUsed.toLocaleString()}</span>
                <span><strong>Cards:</strong> {plan.chosenCards.length}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {plan.allocation.map(({ card, minSpend, bonus }) => {
                const c = card as Card;
                const style = getIssuerStyle(c.issuer);
                const bankLogo = getBankLogoPath(c.issuer);
                const bonusDisplay = formatBonusDisplay(c);
                const rewardLabel = getRewardModelLabel(c.reward_model || "");

                return (
                  <div
                    key={c.card_name}
                    style={{
                      display: "flex",
                      gap: 16,
                      background: "var(--surface-elevated)",
                      borderRadius: 14,
                      padding: 16,
                      border: "2px solid var(--card-tile-border)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                    }}
                  >
                    <div
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
                        overflow: "hidden"
                      }}
                    >
                      {bankLogo ? <img src={bankLogo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : null}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>
                        {c.card_name}
                      </h3>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 8 }}>
                        <span style={{ background: style.bg, color: style.text, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                          {c.issuer}
                        </span>
                        {c.card_type === "business" && (
                          <span style={{ background: theme.businessBadge.bg, color: theme.businessBadge.text, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                            Business card
                          </span>
                        )}
                        {rewardLabel && (
                          <span style={{ background: "var(--pill-bg)", color: "var(--pill-text)", padding: "4px 8px", borderRadius: 6, fontSize: 11 }}>
                            {rewardLabel}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 12, color: "var(--bonus-text)", background: "var(--bonus-bg)", padding: "6px 10px", borderRadius: 6, display: "inline-block", marginBottom: 8 }}>
                        Put <strong>${minSpend.toLocaleString()}</strong> here → <strong>${bonus.toLocaleString()}</strong> bonus
                      </div>
                      {bonusDisplay && (
                        <div style={{ marginBottom: 8, fontSize: 12, color: "var(--text-muted)" }}>{bonusDisplay}</div>
                      )}
                      {c.best_for && (
                        <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.4 }}>{c.best_for}</p>
                      )}

                      <div style={{ paddingTop: 12, borderTop: "1px solid var(--pill-bg)" }}>
                        {c.application_link ? (
                          <a
                            href={c.application_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "8px 16px",
                              borderRadius: 8,
                              background: theme.primary,
                              color: "#ffffff",
                              fontSize: 13,
                              fontWeight: 600,
                              textDecoration: "none"
                            }}
                          >
                            Apply for this card →
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {cards.length === 0 && (
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading cards…</p>
        )}
      </div>
    </div>
  );
}
