"use client";

/* =====================================================
   FILE: app/results/page.tsx
   PURPOSE: Score cards + show 1 hero + 2 secondary
   ===================================================== */

/* =======================
   SECTION A — Imports
   ======================= */
import { useEffect, useState } from "react";
import Papa from "papaparse";

/* =======================
   SECTION B — Scoring Logic
   ======================= */
function scoreCard(card: any, user: any) {
  let score = 0;

  // Weights
  const W_GOAL = 40;
  const W_BONUS = 25;
  const W_FEE = 20;
  const W_TRAVEL = 15;

  // Q1: Primary goal
  if (user.primary_goal === "Cashback") {
    score += card.reward_model === "cashback"
      ? card.cashback_rate_effective * 20
      : 5;
  }

  if (user.primary_goal === "Bonus") {
    score += card.estimated_bonus_value_usd / 50;
  }

  if (user.primary_goal === "Travel") {
    score += card.reward_model === "travel" ? W_GOAL : 10;
  }

  // Q2: Spend comfort
  const spendMap: any = { Low: 1000, Medium: 3000, High: 999999 };
  score += card.signup_bonus <= spendMap[user.spend_comfort]
    ? W_BONUS
    : 5;

  // Q3: Annual fee tolerance
  const feeMap: any = { Low: 0, Medium: 100, High: 999 };
  score += card.annual_fee <= feeMap[user.annual_fee_tolerance]
    ? W_FEE
    : 5;

  // Q4: Travel frequency
  if (user.travel_frequency === "High" && card.reward_model === "travel") {
    score += W_TRAVEL;
  }

  return Math.round(score);
}

/* =======================
   SECTION C — Component
   ======================= */
export default function Results() {
  const [ranked, setRanked] = useState<any[]>([]);

  useEffect(() => {
    const answers = JSON.parse(localStorage.getItem("answers") || "{}");

    fetch("/cards.csv")
      .then(res => res.text())
      .then(text => {
        const parsed = Papa.parse(text, { header: true });

        const normalized = (parsed.data as any[]).map(c => ({
          ...c,
          annual_fee: Number(c.annual_fee),
          cashback_rate_effective: Number(c.cashback_rate_effective),
          estimated_bonus_value_usd: Number(c.estimated_bonus_value_usd)
        }));

        const scored = normalized
          .map(card => ({
            ...card,
            score: scoreCard(card, answers)
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);   // <-- ONLY TOP 3

        setRanked(scored);
      });
  }, []);

  const hero = ranked[0];
  const secondary = ranked.slice(1);

  /* =======================
     SECTION D — UI
     ======================= */
  return (
    <div
      style={{
        padding: 40,
        maxWidth: 1000,
        margin: "0 auto",
        fontFamily: "system-ui"
      }}
    >
      <h1 style={{ fontSize: 32, marginBottom: 24 }}>
        Your Best Credit Cards
      </h1>

      {/* =======================
          HERO CARD
         ======================= */}
      {hero && (
        <div
          style={{
            padding: 28,
            borderRadius: 16,
            background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
            color: "white",
            boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
            marginBottom: 32
          }}
        >
          <h2 style={{ fontSize: 28, marginBottom: 8 }}>
            {hero.card_name}
          </h2>

          <p><strong>Issuer:</strong> {hero.issuer}</p>
          <p><strong>Cashback:</strong> {hero.cashback_rate_display}</p>
          <p><strong>Effective Rate:</strong> {hero.cashback_rate_effective}%</p>
          <p><strong>Signup Bonus:</strong> ${hero.estimated_bonus_value_usd}</p>
          <p><strong>Annual Fee:</strong> ${hero.annual_fee}</p>
          <p><strong>Why:</strong> {hero.best_for}</p>
          <p><strong>Score:</strong> {hero.score}</p>
        </div>
      )}

      {/* =======================
          SECONDARY CARDS
         ======================= */}
      <div style={{ display: "flex", gap: 24 }}>
        {secondary.map(card => (
          <div
            key={card.card_name}
            style={{
              flex: 1,
              padding: 20,
              borderRadius: 12,
              border: "1px solid #ddd",
              boxShadow: "0 6px 14px rgba(0,0,0,0.1)",
              background: "white"
            }}
          >
            <h3 style={{ marginBottom: 6 }}>
              {card.card_name}
            </h3>

            <p><strong>Issuer:</strong> {card.issuer}</p>
            <p><strong>Cashback:</strong> {card.cashback_rate_display}</p>
            <p><strong>Effective:</strong> {card.cashback_rate_effective}%</p>
            <p><strong>Bonus:</strong> ${card.estimated_bonus_value_usd}</p>
            <p><strong>Fee:</strong> ${card.annual_fee}</p>
            <p><strong>Score:</strong> {card.score}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
