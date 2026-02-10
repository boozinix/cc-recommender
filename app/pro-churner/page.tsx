"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { computeOptimalPlan, type CardForAllocation } from "@/app/lib/spendAllocation";
import { getTheme } from "@/app/lib/theme";
import { CardTile } from "@/app/components/CardTile";
import { getEstimatedBonusValueUsd } from "@/app/lib/pointValues";
import type { Card } from "@/app/lib/cardTypes";

export default function ProChurnerPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [maxSpend, setMaxSpend] = useState<string>("20000");
  const [maxCards, setMaxCards] = useState<string>("5");
  const [plan, setPlan] = useState<ReturnType<typeof computeOptimalPlan> | null>(null);

  useEffect(() => {
    fetch("/cards.csv")
      .then((r) => r.text())
      .then((cardsText) => {
        const parsed = Papa.parse<Record<string, string>>(cardsText, { header: true, skipEmptyLines: true });
        const enriched: Card[] = parsed.data.map((row) => {
          const c = { ...row } as Card;
          return {
            ...c,
            cashback_rate_effective: c.cashback_rate_effective ?? "",
            intro_apr_purchase: c.intro_apr_purchase ?? "",
            pros: c.pros ?? "",
            cons: c.cons ?? "",
            best_for: c.best_for ?? "",
            estimated_bonus_value_usd: String(getEstimatedBonusValueUsd(c))
          };
        });
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
    <div style={{ minHeight: "100vh", background: "var(--surface)", padding: "24px", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }} data-card-mode="personal">
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
                const fullCard = cards.find((x) => x.card_name === card.card_name);
                if (!fullCard) return null;
                return (
                  <CardTile
                    key={fullCard.card_name}
                    card={fullCard}
                    showMaxRewardsLine
                    minSpendOverride={minSpend}
                    bonusOverride={bonus}
                  />
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
