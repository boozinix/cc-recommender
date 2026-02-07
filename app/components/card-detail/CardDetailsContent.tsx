"use client";

import type React from "react";

/** Minimal card shape for the detail view (matches results/comparison card). */
export interface CardDetailData {
  card_name: string;
  issuer: string;
  card_type: string;
  reward_model: string;
  rewards_type?: string;
  card_family?: string;
  signup_bonus: string;
  signup_bonus_type: string;
  estimated_bonus_value_usd?: string;
  minimum_spend_amount?: string;
  spend_time_frame?: string;
  intro_apr_purchase?: string;
  pros?: string;
  cons?: string;
  bank_rules?: string;
  application_link?: string;
  special_feature_1?: string;
  special_feature_2?: string;
}

export interface CardDetailTheme {
  primary: string;
  primaryDark: string;
}

const bankLogoFiles: Record<string, string> = {
  Chase: "chase.svg",
  Citi: "citi.svg",
  "Capital One": "capital-one.svg",
  "Bank of America": "bank-of-america.svg",
  Amex: "american-express.svg",
  Barclays: "barclays.jpeg",
  "U.S. Bank": "usbank.png",
  "Wells Fargo": "wellsfargo.jpg",
};

function getBankLogoPath(issuer: string): string | null {
  const file = bankLogoFiles[issuer];
  return file ? `/logos/banks/${file}` : null;
}

function splitProsCons(text: string | undefined): string[] {
  if (!text || !text.trim()) return [];
  return text.split(/\s*[;•]\s*/).map((s) => s.trim()).filter(Boolean);
}

function getRewardsTypeDisplay(card: CardDetailData): string {
  if (card.rewards_type?.trim()) return card.rewards_type.trim();
  const r = (card.reward_model || "").toLowerCase();
  const family = (card.card_family || "").trim();
  if (r === "airline") return family || "Airline";
  if (r === "hotel") return family || "Hotel";
  if (r === "cashback") return "Cash";
  return "—";
}

function getBonusRewardsLabel(card: CardDetailData): string {
  const bonusType = (card.signup_bonus_type || "").toLowerCase();
  if (bonusType === "dollars") return "cash";
  const rt = (card.rewards_type || "").trim();
  if (rt) {
    if (rt.toLowerCase() === "cash") return "cash";
    if (/\bmiles\b/i.test(rt)) return rt.replace(/\bmiles\b/i, "miles");
    if (/\bpoints\b/i.test(rt)) return rt;
    return rt + " points";
  }
  const issuer = (card.issuer || "").toLowerCase();
  if (issuer === "chase") return "Ultimate Rewards (UR) points";
  if (issuer === "american express" || issuer === "amex") return "Membership Rewards (MR) points";
  if (issuer === "citi") return "Thank You Points (TYP)";
  if (issuer === "bank of america") return "Bank of America points";
  if (issuer === "u.s. bank") return "U.S. Bank points";
  if (issuer === "wells fargo") return "Wells Fargo points";
  if (issuer === "capital one") return bonusType === "miles" ? "Capital One miles" : "Capital One points";
  if (bonusType === "miles") return "miles";
  if (bonusType === "points") return "points";
  return "points";
}

function formatNumberWithCommas(numStr: string): string {
  const n = parseInt(String(numStr).replace(/[^0-9]/g, ""), 10);
  if (Number.isNaN(n)) return numStr;
  return n.toLocaleString();
}

function formatSignupBonusForDetail(card: CardDetailData): React.ReactNode {
  const bonus = (card.signup_bonus || "").trim();
  const type = (card.signup_bonus_type || "").trim().toLowerCase();
  const estValue = parseInt((card.estimated_bonus_value_usd || "").replace(/[^0-9]/g, ""), 10);
  const hasValue = !Number.isNaN(estValue) && estValue > 0;
  if (!bonus) return "—";
  const rewardLabel = getBonusRewardsLabel(card);
  let main = "";
  if (type === "dollars" || rewardLabel === "cash") {
    main = `$${formatNumberWithCommas(bonus)} cash`;
  } else {
    main = `${formatNumberWithCommas(bonus)} ${rewardLabel}`;
  }
  if (hasValue && type !== "dollars")
    return (
      <>
        {main} <span style={{ color: "var(--text-muted)", fontSize: 13 }}>(worth ${estValue.toLocaleString()})</span>
      </>
    );
  return main;
}

function formatSpendRequirementForDetail(card: CardDetailData): string {
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

function DetailCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--pill-text)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{value}</div>
    </div>
  );
}

/** Single-card detail block: wide layout, pros/cons side by side, no scrolling. */
export function CardDetailsContent({ card, theme }: { card: CardDetailData; theme: CardDetailTheme }) {
  const bankLogo = getBankLogoPath(card.issuer);
  const prosItems = splitProsCons(card.pros);
  const consItems = splitProsCons(card.cons);
  const bankRulesRaw = (card.bank_rules || "").trim();
  const bankRulesParts = bankRulesRaw ? bankRulesRaw.split(/\s*\|\s*/).filter(Boolean) : [];
  const sf1 = (card.special_feature_1 || "").trim();
  const sf2 = (card.special_feature_2 || "").trim();
  const hasSpecialFeatures = !!(sf1 || sf2);

  const prosBlock = (
    <div
      style={{
        background: "var(--pros-bg)",
        padding: 10,
        borderRadius: 10,
        border: "1px solid var(--pros-text)",
        height: "100%",
        minHeight: 44,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--pros-text)", marginBottom: 6 }}>PROS</div>
      {prosItems.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: 14, fontSize: 12, color: "var(--pros-list)", lineHeight: 1.5 }}>
          {prosItems.slice(0, 6).map((item, i) => (
            <li key={i} style={{ marginBottom: 2 }}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <span style={{ fontSize: 12, color: "var(--text-muted-light)" }}>—</span>
      )}
    </div>
  );
  const consBlock = (
    <div
      style={{
        background: "var(--cons-bg)",
        padding: 10,
        borderRadius: 10,
        border: "1px solid var(--cons-text)",
        height: "100%",
        minHeight: 44,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--cons-text)", marginBottom: 6 }}>CONS</div>
      {consItems.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: 14, fontSize: 12, color: "var(--cons-list)", lineHeight: 1.5 }}>
          {consItems.slice(0, 6).map((item, i) => (
            <li key={i} style={{ marginBottom: 2 }}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <span style={{ fontSize: 12, color: "var(--text-muted-light)" }}>—</span>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px 20px" }}>
        <DetailCell label="Type" value={(card.card_type || "").toLowerCase() === "business" ? "Business" : "Personal"} />
        <DetailCell
          label="Bank"
          value={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {bankLogo && <img src={bankLogo} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />}
              <span>{card.issuer}</span>
            </span>
          }
        />
        <DetailCell label="Rewards" value={getRewardsTypeDisplay(card)} />
        <DetailCell label="Intro APR" value={card.intro_apr_purchase?.trim() || "None"} />
        <DetailCell label="Sign-up bonus" value={formatSignupBonusForDetail(card)} />
        <DetailCell label="Spend requirement" value={formatSpendRequirementForDetail(card)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {prosBlock}
        {consBlock}
      </div>

      {hasSpecialFeatures && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {sf1 && (
            <span style={{ background: "var(--bonus-bg)", color: "var(--bonus-text)", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
              {sf1}
            </span>
          )}
          {sf2 && (
            <span style={{ background: "var(--bonus-bg)", color: "var(--bonus-text)", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
              {sf2}
            </span>
          )}
        </div>
      )}

      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--pill-text)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
          Bank rules
        </div>
        <div
          style={{
            background: "var(--surface)",
            padding: 8,
            borderRadius: 8,
            border: "1px solid var(--border)",
            fontSize: 11,
            color: "var(--pill-text)",
            lineHeight: 1.4,
          }}
        >
          {!bankRulesRaw ? "—" : bankRulesParts.length > 1 ? (
            <ul style={{ margin: 0, paddingLeft: 14 }}>
              {bankRulesParts.slice(0, 4).map((p, i) => (
                <li key={i}>{p.trim()}</li>
              ))}
            </ul>
          ) : bankRulesRaw.length > 120 ? (
            `${bankRulesRaw.slice(0, 120)}…`
          ) : (
            bankRulesRaw
          )}
        </div>
      </div>

      <div style={{ marginTop: 4 }}>
        {card.application_link ? (
          <a
            href={card.application_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              borderRadius: 8,
              background: theme.primary,
              color: "#fff",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Apply here →
          </a>
        ) : null}
      </div>
    </div>
  );
}
