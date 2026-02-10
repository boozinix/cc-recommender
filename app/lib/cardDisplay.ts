/**
 * Shared card display helpers: bonus formatting, labels, pros/cons, min spend.
 * Used by CardTile and by results/sandbox-results/comparison.
 */

import type { Card } from "./cardTypes";

export function parseMinSpend(raw: string | undefined): number {
  if (!raw || !raw.trim()) return 0;
  const cleaned = raw.replace(/[$,]/g, "").trim();
  const n = parseInt(cleaned, 10);
  return Number.isNaN(n) ? 0 : n;
}

/** Split pros/cons string into line items (handles ";" or "•" separators). */
export function splitProsCons(text: string | undefined): string[] {
  if (!text || !text.trim()) return [];
  return text.split(/\s*[;•]\s*/).map((s) => s.trim()).filter(Boolean);
}

/** Reward program name for bonus display: UR, MR, TYP, United miles, Cash, etc. */
export function getBonusRewardsLabel(card: Card): string {
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

export function formatBonusDisplay(card: Card): string | null {
  const value = parseInt(card.estimated_bonus_value_usd || "0", 10);
  if (!value) return null;

  const rewardsLabel = getBonusRewardsLabel(card);
  const inPhrase = rewardsLabel === "cash" ? "in cash" : `in ${rewardsLabel}`;
  let text = `Worth $${value.toLocaleString()} estimated value ${inPhrase}`;
  const minSpendRaw = (card.minimum_spend_amount || "").trim();
  const timeFrame = (card.spend_time_frame || "").trim();
  const minSpendNum = parseMinSpend(minSpendRaw);
  const months = parseInt(timeFrame, 10);
  if (minSpendNum > 0 && !Number.isNaN(months) && months > 0) {
    const spendFormatted = minSpendRaw.includes("$") ? minSpendRaw : `$${Number(minSpendRaw.replace(/[,]/g, "")).toLocaleString()}`;
    text += `, if you spend ${spendFormatted} in ${months} month${months === 1 ? "" : "s"}`;
  }
  return text;
}

/** Human-readable label for reward_model (Travel, Cashback, etc.). */
export function getRewardModelLabel(rewardModel: string): string {
  const r = (rewardModel || "").toLowerCase();
  if (r === "travel" || r === "airline" || r === "hotel") return "Travel";
  if (r === "cashback") return "Cashback";
  if (r === "balance_transfer") return "Balance transfer";
  if (r === "credit_building") return "Credit building";
  return rewardModel ? rewardModel.charAt(0).toUpperCase() + rewardModel.slice(1) : "";
}

/** Cashback rate for display (e.g. "5% / 3% / 1.5%" or "1.5%"). */
export function getCashbackDisplay(card: Card): string | null {
  const display = card.cashback_rate_display?.trim();
  if (display) {
    const parts = display.split(/\s*\/\s*/).map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return null;
    const withPercent = parts.map((p) => {
      const n = parseFloat(p);
      return Number.isNaN(n) ? p : `${n}%`;
    });
    return withPercent.join(" / ");
  }
  const effective = card.cashback_rate_effective?.trim();
  if (effective && parseFloat(effective) >= 0) return `${effective}%`;
  return null;
}
