"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Papa from "papaparse";
import Link from "next/link";

// =========================================================
// Types
// =========================================================
type Card = {
  card_name: string;
  issuer: string;
  card_type: string;
  reward_model: string;
  card_family?: string;
  intro_apr_purchase: string;
  signup_bonus: string;
  signup_bonus_type: string;
  minimum_spend_amount?: string;
  spend_time_frame?: string;
  bank_rules?: string;
  pros?: string;
  cons?: string;
};

/** General rewards, or specific airline/hotel brand */
function getRewardsType(card: Card): string {
  const r = (card.reward_model || "").toLowerCase();
  const family = (card.card_family || "").trim();
  if (r === "airline") return family || "Airline";
  if (r === "hotel") return family || "Hotel";
  return "General rewards";
}

function formatNumberWithCommas(numStr: string): string {
  const n = parseInt(String(numStr).replace(/[^0-9]/g, ""), 10);
  if (Number.isNaN(n)) return numStr;
  return n.toLocaleString();
}

// =========================================================
// Helpers
// =========================================================
function formatSignupBonus(card: Card): string {
  const bonus = (card.signup_bonus || "").trim();
  const type = (card.signup_bonus_type || "").trim().toLowerCase();
  if (!bonus) return "—";
  if (type === "dollars") return `$${formatNumberWithCommas(bonus)}`;
  if (type === "points") return `${formatNumberWithCommas(bonus)} points`;
  if (type === "miles") return `${formatNumberWithCommas(bonus)} miles`;
  return formatNumberWithCommas(bonus);
}

function formatSpendRequirement(card: Card): string {
  const amount = (card.minimum_spend_amount || "").trim();
  const months = (card.spend_time_frame || "").trim();
  if (!amount || amount === "$0") return "—";
  const amountFormatted = amount.includes("$") ? amount : `$${amount.replace(/[,]/g, "")}`;
  const monthsNum = parseInt(months, 10);
  if (!Number.isNaN(monthsNum) && monthsNum > 0) {
    return `${amountFormatted} in ${monthsNum} month${monthsNum === 1 ? "" : "s"}`;
  }
  return amountFormatted;
}

// =========================================================
// Comparison Page
// =========================================================
export default function ComparisonPage() {
  const searchParams = useSearchParams();
  const [cards, setCards] = useState<Card[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cardNamesParam = searchParams.get("cards") || "";

  useEffect(() => {
    fetch("/cards.csv")
      .then((res) => res.text())
      .then((text) => {
        const parsed = Papa.parse<Card>(text, {
          header: true,
          skipEmptyLines: true
        });
        setAllCards(parsed.data);
      })
      .catch(() => setError("Could not load cards."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (allCards.length === 0 || !cardNamesParam) return;

    const names = cardNamesParam
      .split(",")
      .map((n) => decodeURIComponent(n.trim()))
      .filter(Boolean);

    if (names.length < 2 || names.length > 4) {
      setError("Select 2–4 cards to compare.");
      setCards([]);
      return;
    }

    const matched = names
      .map((name) => allCards.find((c) => c.card_name === name))
      .filter((c): c is Card => !!c);

    if (matched.length !== names.length) {
      setError("One or more cards could not be found.");
      setCards([]);
      return;
    }

    setError(null);
    setCards(matched);
  }, [allCards, cardNamesParam]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "system-ui" }}>
        Loading…
      </div>
    );
  }

  if (error || cards.length === 0) {
    return (
      <div style={{ padding: 40, fontFamily: "system-ui", maxWidth: 600 }}>
        <h1 style={{ fontSize: 24, marginBottom: 16 }}>Compare cards</h1>
        <p style={{ color: "#64748b", marginBottom: 24 }}>{error || "No cards selected."}</p>
        <Link
          href="/results"
          style={{
            display: "inline-block",
            padding: "10px 18px",
            borderRadius: 999,
            background: "#2563eb",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 600
          }}
        >
          ← Back to results
        </Link>
      </div>
    );
  }

  const bankRulesCell = (text: string | undefined) => {
    const raw = (text || "").trim();
    if (!raw) return <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>;
    const parts = raw.split(/\s*\|\s*/).filter(Boolean);
    return (
      <div
        style={{
          background: "#f8fafc",
          padding: 10,
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          maxHeight: 100,
          overflowY: "auto",
          fontSize: 12,
          color: "#475569",
          lineHeight: 1.5
        }}
      >
        {parts.length > 1 ? (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {parts.map((p, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{p.trim()}</li>
            ))}
          </ul>
        ) : (
          <span>{raw}</span>
        )}
      </div>
    );
  };

  const prosConsCell = (pros: string | undefined, cons: string | undefined, isPros: boolean) => {
    const text = isPros ? (pros || "—") : (cons || "—");
    const items = text.split(";").map(s => s.trim()).filter(Boolean);
    const bg = isPros ? "#f0fdfa" : "#fef2f2";
    const borderColor = isPros ? "#99f6e4" : "#fecaca";
    const color = isPros ? "#134e4a" : "#881337";
    const headerColor = isPros ? "#0f766e" : "#9f1239";
    return (
      <div style={{ background: bg, padding: 12, borderRadius: 10, border: `1px solid ${borderColor}` }}>
        <div style={{ fontWeight: 600, fontSize: 11, color: headerColor, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.03em" }}>{isPros ? "Pros" : "Cons"}</div>
        {items.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color, lineHeight: 1.6 }}>
            {items.slice(0, 5).map((item, i) => <li key={i} style={{ marginBottom: 4 }}>{item}</li>)}
          </ul>
        ) : (
          <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
        )}
      </div>
    );
  };

  const columns = [
    { key: "name", label: "Name", render: (c: Card) => c.card_name },
    { key: "type", label: "Personal / Business", render: (c: Card) => (c.card_type || "").toLowerCase() === "business" ? "Business" : "Personal" },
    { key: "bank", label: "Bank", render: (c: Card) => c.issuer },
    { key: "rewards_type", label: "Rewards", render: getRewardsType },
    { key: "bank_rules", label: "Bank rules", render: (c: Card) => bankRulesCell(c.bank_rules) },
    { key: "intro_apr", label: "Intro APR", render: (c: Card) => c.intro_apr_purchase?.trim() || "None" },
    { key: "signup_bonus", label: "Sign-up bonus", render: formatSignupBonus },
    { key: "spend", label: "Spending requirements", render: formatSpendRequirement },
    { key: "pros", label: "Pros", render: (c: Card) => prosConsCell(c.pros, c.cons, true) },
    { key: "cons", label: "Cons", render: (c: Card) => prosConsCell(c.pros, c.cons, false) }
  ];

  return (
    <div style={{ padding: 40, fontFamily: "system-ui", maxWidth: 1400, margin: "0 auto", background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 120px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, margin: 0, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>Compare cards</h1>
        <Link
          href="/results"
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "1px solid #c7d2fe",
            background: "#ffffff",
            color: "#1e3a8a",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 14,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}
        >
          ← Back to results
        </Link>
      </div>

      <div
        style={{
          overflowX: "auto",
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
          border: "1px solid #e2e8f0",
          background: "#ffffff"
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 14
          }}
        >
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: "16px 20px",
                    textAlign: "left",
                    background: "linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)",
                    fontWeight: 600,
                    fontSize: 11,
                    color: "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    borderBottom: "2px solid #cbd5e1"
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cards.map((card, rowIndex) => (
              <tr
                key={card.card_name}
                style={{
                  background: rowIndex % 2 === 0 ? "#ffffff" : "#fafbfc",
                  transition: "background 0.15s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = rowIndex % 2 === 0 ? "#ffffff" : "#fafbfc";
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: "18px 20px",
                      fontSize: 14,
                      color: "#334155",
                      borderBottom: rowIndex < cards.length - 1 ? "1px solid #f1f5f9" : "none",
                      verticalAlign: "top",
                      minWidth: col.key === "pros" || col.key === "cons" ? 200 : col.key === "bank_rules" ? 180 : undefined
                    }}
                  >
                    {col.key === "name" ? (
                      <span style={{ fontWeight: 600, fontSize: 15, color: "#0f172a" }}>{col.render(card)}</span>
                    ) : (
                      col.render(card)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
