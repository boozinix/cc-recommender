/**
 * Shared text parsing: bonus, spend requirement, annual fee.
 * Keeps raw text when parsing fails; used across bank crawlers.
 */

export interface ParsedBonus {
  amount?: number;
  currency?: string; // "points" | "miles" | "dollars" | "cash"
  raw: string;
}

export interface ParsedSpend {
  amount?: number;
  windowDays?: number;
  raw: string;
}

export interface ParsedFee {
  amount?: number;
  waivedFirstYear?: boolean;
  raw: string;
}

/** e.g. "Earn 60,000 bonus points", "60,000 Ultimate Rewards", "$200 bonus", "200 cash back" */
export function parseSignupBonus(text: string): ParsedBonus {
  const raw = (text || "").trim();
  if (!raw) return { raw: "" };

  const normalized = raw.replace(/,/g, "");
  let amount: number | undefined;
  let currency: string | undefined;

  // Prefer explicit "$200" or "200 dollars/cash" for cash bonuses
  const cashMatch = normalized.match(/\$(\d+)|(\d+)\s*(dollars?|cash\s*back?)/i);
  if (cashMatch) {
    const candidate = parseInt(cashMatch[1] || cashMatch[2], 10);
    if (candidate <= 1000) {
      amount = candidate;
      currency = "dollars";
    }
  }

  // Prefer "X bonus points" or "X points" / "X miles" (points/miles are usually 4+ digits)
  const pointsMatch = raw.replace(/,/g, "").match(/(\d{2,})\s*(bonus\s*)?(points?|miles?)/i);
  if (pointsMatch) {
    const candidate = parseInt(pointsMatch[1], 10);
    if (candidate >= 1000) {
      amount = candidate;
      currency = /miles?/i.test(pointsMatch[3]) ? "miles" : "points";
    }
  }

  if (!amount && /\d{2,}/.test(normalized)) {
    const anyNum = normalized.match(/(\d{2,})/);
    if (anyNum) {
      amount = parseInt(anyNum[1], 10);
      currency = /mile|point|dollar|cash/i.test(raw) ? (/\$|dollar|cash/i.test(raw) ? "dollars" : (/mile/i.test(raw) ? "miles" : "points")) : "points";
    }
  }

  return { amount, currency, raw };
}

/** e.g. "after you spend $4,000 in the first 3 months", "$500 in 3 months" */
export function parseSpendRequirement(text: string): ParsedSpend {
  const raw = (text || "").trim();
  if (!raw) return { raw: "" };

  const normalized = raw.replace(/,/g, "");
  let amount: number | undefined;
  let windowDays: number | undefined;

  const dollarMatch = normalized.match(/\$?(\d+)\s*(in\s*)?(\d+)\s*months?/i) ?? normalized.match(/spend\s*\$?(\d+)/i);
  if (dollarMatch) {
    const n = parseInt(dollarMatch[1], 10);
    if (n < 2020 || n > 2030) amount = n; // Exclude years
    const months = dollarMatch[3] ? parseInt(dollarMatch[3], 10) : undefined;
    if (months) windowDays = months * 30;
  }

  if (!amount) {
    const onlyAmount = normalized.match(/\$?(\d{3,})/);
    if (onlyAmount) {
      const n = parseInt(onlyAmount[1], 10);
      if (n < 2020 || n > 2030) amount = n; // Exclude years like 2025
    }
  }

  return { amount, windowDays, raw };
}

/** e.g. "$95 annual fee", "$0 intro annual fee", "No annual fee", "waived first year" */
export function parseAnnualFee(text: string): ParsedFee {
  const raw = (text || "").trim();
  if (!raw) return { raw: "" };

  const lower = raw.toLowerCase();
  let amount: number | undefined;
  let waivedFirstYear = false;

  if (/no\s*annual\s*fee|you won't have to pay an annual fee|\$0\s*\[†\s*\]?/.test(lower)) {
    amount = 0;
  } else if (/\$0\s*annual\s*fee/.test(lower)) {
    amount = 0;
  } else {
    const withDollar = raw.replace(/,/g, "").match(/\$(\d+)\s*(?:annual\s*fee|for\s*each)/i);
    if (withDollar) {
      const n = parseInt(withDollar[1], 10);
      if (n <= 1000) amount = n;
    }
    if (amount == null) {
      const anyFee = raw.replace(/,/g, "").match(/annual\s*fee[^$]*\$(\d+)/i);
      if (anyFee) {
        const n = parseInt(anyFee[1], 10);
        if (n <= 1000) amount = n;
      }
    }
  }
  if (/waived\s*(the\s*)?first\s*year|no\s*fee\s*first\s*year|intro.*fee/i.test(lower)) {
    waivedFirstYear = true;
  }

  return { amount, waivedFirstYear, raw };
}

/** Parse annual fee with year 1 vs year 2+ (e.g. "$0 intro for first year, then $95"). */
export interface ParsedFeeYears {
  year1?: number;
  year2Plus?: number;
  raw: string;
}

export function parseAnnualFeeWithYears(text: string): ParsedFeeYears {
  const raw = (text || "").trim();
  if (!raw) return { raw: "" };

  const lower = raw.toLowerCase();
  let year1: number | undefined;
  let year2Plus: number | undefined;

  if (/no\s*annual\s*fee|\$0\s*annual\s*fee/i.test(lower)) {
    year1 = 0;
    year2Plus = 0;
  } else {
    const introThen = raw.match(/\$0\s*(?:intro|first\s*year)[^$]*?(?:then|after)\s*\$?(\d+)/i)
      ?? raw.match(/\$0\s*(?:for\s*the\s*)?first\s*year[^$]*\$(\d+)/i)
      ?? raw.match(/first\s*year\s*(?:free| waived)[^$]*\$(\d+)/i);
    if (introThen) {
      year1 = 0;
      year2Plus = parseInt(introThen[1], 10);
      if (year2Plus > 1000) year2Plus = undefined;
    }
  }

  if (year1 == null || year2Plus == null) {
    const base = parseAnnualFee(text);
    if (base.amount != null) {
      year2Plus = base.amount;
      year1 = base.waivedFirstYear ? 0 : base.amount;
    }
  }

  return { year1, year2Plus, raw };
}
