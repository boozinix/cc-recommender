"use client";

import type { ReactElement } from "react";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Papa from "papaparse";
import Link from "next/link";
import { getTheme, type CardMode } from "@/app/lib/theme";

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
  estimated_bonus_value_usd?: string;
  minimum_spend_amount?: string;
  spend_time_frame?: string;
  bank_rules?: string;
  pros?: string;
  cons?: string;
  application_link?: string;
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

function getBankLogoPath(issuer: string): string | null {
  const file = bankLogoFiles[issuer];
  return file ? `/logos/banks/${file}` : null;
}

const brandLogoFiles: Record<string, string> = {
  "alaska": "alaska.svg",
  "american": "american.png",
  "breeze": "breeze.svg",
  "choice": "choice.svg",
  "delta": "delta.svg",
  "expedia": "expedia.svg",
  "frontier": "frontier.svg",
  "hilton": "hilton.svg",
  "hyatt": "hyatt.png",
  "ihg": "ihg.svg",
  "jetblue": "jetblue.svg",
  "marriott": "marriott.svg",
  "southwest": "southwest.svg",
  "spirit": "spirit.svg",
  "united": "united.svg",
  "wyndham": "wyndham.svg"
};

function getBrandLogoPath(card: Card): string | null {
  const model = (card.reward_model || "").toLowerCase();
  const isBranded = model === "airline" || model === "hotel" || model === "travel";
  if (!isBranded) return null;
  const family = (card.card_family || "").trim().toLowerCase();
  if (family && brandLogoFiles[family]) return `/logos/brands/${brandLogoFiles[family]}`;
  const name = card.card_name.toLowerCase();
  if (name.includes("frontier")) return "/logos/brands/frontier.svg";
  if (name.includes("hyatt")) return "/logos/brands/hyatt.png";
  if (name.includes("spirit")) return "/logos/brands/spirit.svg";
  if (name.includes("breeze")) return "/logos/brands/breeze.svg";
  if (name.includes("choice") || name.includes("privileges")) return "/logos/brands/choice.svg";
  if (name.includes("wyndham")) return "/logos/brands/wyndham.svg";
  if (name.includes("expedia") || name.includes("one key") || name.includes("hotels.com")) return "/logos/brands/expedia.svg";
  return null;
}

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
function formatSignupBonus(card: Card): string | ReactElement {
  const bonus = (card.signup_bonus || "").trim();
  const type = (card.signup_bonus_type || "").trim().toLowerCase();
  const estValue = parseInt((card.estimated_bonus_value_usd || "").replace(/[^0-9]/g, ""), 10);
  const hasValue = !Number.isNaN(estValue) && estValue > 0;
  if (!bonus) return "—";
  let main = "";
  if (type === "dollars") main = `$${formatNumberWithCommas(bonus)}`;
  else if (type === "points") main = `${formatNumberWithCommas(bonus)} points`;
  else if (type === "miles") main = `${formatNumberWithCommas(bonus)} miles`;
  else main = formatNumberWithCommas(bonus);
  if (hasValue && type !== "dollars") return <>{main} <span style={{ color: "#64748b", fontSize: 13 }}>(worth ${estValue.toLocaleString()})</span></>;
  return main;
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
function ComparisonPageContent() {
  const searchParams = useSearchParams();
  const [cards, setCards] = useState<Card[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState<CardMode>("personal");
  const cardNamesParam = searchParams.get("cards") || "";

  useEffect(() => {
    const m = localStorage.getItem("card_mode") as CardMode | null;
    if (m === "personal" || m === "business") setFallbackMode(m);
  }, []);

  // Use first card in comparison for theme; fallback to localStorage when no cards (error state)
  const compareThemeMode: CardMode = cards.length > 0 && (cards[0].card_type || "").toLowerCase() === "business" ? "business" : fallbackMode;
  const theme = getTheme(compareThemeMode);

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
            background: theme.primary,
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

  const bankCell = (c: Card) => {
    const logo = getBankLogoPath(c.issuer);
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        {logo && <img src={logo} alt="" style={{ width: 32, height: 32, objectFit: "contain" }} />}
        <span>{c.issuer}</span>
      </span>
    );
  };

  const applyCell = (c: Card) => {
    const link = (c.application_link || "").trim();
    if (!link) return <span style={{ color: "#94a3b8", fontSize: 13 }}>—</span>;
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          padding: "8px 16px",
          borderRadius: 8,
          background: theme.primary,
          color: "#fff",
          textDecoration: "none",
          fontWeight: 600,
          fontSize: 13
        }}
      >
        Apply here
      </a>
    );
  };

  const rows = [
    { key: "type", label: "Personal / Business", render: (c: Card) => (c.card_type || "").toLowerCase() === "business" ? "Business" : "Personal" },
    { key: "bank", label: "Bank", render: bankCell },
    { key: "rewards_type", label: "Rewards", render: getRewardsType },
    { key: "bank_rules", label: "Bank rules", render: (c: Card) => bankRulesCell(c.bank_rules) },
    { key: "intro_apr", label: "Intro APR", render: (c: Card) => c.intro_apr_purchase?.trim() || "None" },
    { key: "signup_bonus", label: "Sign-up bonus", render: formatSignupBonus },
    { key: "spend", label: "Spending requirements", render: formatSpendRequirement },
    { key: "pros", label: "Pros", render: (c: Card) => prosConsCell(c.pros, c.cons, true) },
    { key: "cons", label: "Cons", render: (c: Card) => prosConsCell(c.pros, c.cons, false) },
    { key: "apply", label: "Apply", render: applyCell }
  ];

  const cellMinWidth = (key: string) => {
    if (key === "pros" || key === "cons") return 200;
    if (key === "bank_rules") return 180;
    return undefined;
  };

  return (
    <div style={{ padding: 40, fontFamily: "system-ui", maxWidth: 1400, margin: "0 auto", background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 120px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, margin: 0, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>Compare cards</h1>
        <Link
          href="/results"
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: `1px solid ${theme.primaryLighter}`,
            background: "#ffffff",
            color: theme.primaryDark,
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
              <th
                style={{
                  padding: "16px 20px",
                  textAlign: "left",
                  background: "linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)",
                  fontWeight: 600,
                  fontSize: 11,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "2px solid #cbd5e1",
                  borderRight: "1px solid #e2e8f0",
                  minWidth: 140
                }}
              >
                Feature
              </th>
              {cards.map((card) => {
                const brandLogo = getBrandLogoPath(card);
                return (
                  <th
                    key={card.card_name}
                    style={{
                      padding: "16px 20px",
                      textAlign: "left",
                      background: "linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)",
                      fontWeight: 600,
                      fontSize: 14,
                      color: "#0f172a",
                      borderBottom: "2px solid #cbd5e1",
                      borderRight: "1px solid #e2e8f0",
                      minWidth: 180
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                      {brandLogo && <img src={brandLogo} alt="" style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }} />}
                      <span>{card.card_name}</span>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={row.key}
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
                <td
                  style={{
                    padding: "14px 20px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    borderBottom: "1px solid #f1f5f9",
                    borderRight: "1px solid #e2e8f0",
                    verticalAlign: "top"
                  }}
                >
                  {row.label}
                </td>
                {cards.map((card) => (
                  <td
                    key={card.card_name}
                    style={{
                      padding: "16px 20px",
                      fontSize: 14,
                      color: "#334155",
                      borderBottom: "1px solid #f1f5f9",
                      borderRight: "1px solid #f1f5f9",
                      verticalAlign: "top",
                      minWidth: cellMinWidth(row.key)
                    }}
                  >
                    {row.render(card)}
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

export default function ComparisonPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", fontFamily: "system-ui" }}>Loading…</div>}>
      <ComparisonPageContent />
    </Suspense>
  );
}
