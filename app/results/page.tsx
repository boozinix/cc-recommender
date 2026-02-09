"use client";



// =========================================================
// Imports
// =========================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Papa from "papaparse";
import { getTheme, type CardMode } from "@/app/lib/theme";
import { getEstimatedBonusValueUsd } from "@/app/lib/pointValues";
import { FeedbackButton } from "@/app/components/FeedbackButton";
import { FAQButton } from "@/app/components/FAQButton";
import {
  ENABLE_CARD_DETAIL_OPTION_1_MODAL,
  ENABLE_CARD_DETAIL_OPTION_2_EXPAND,
  CardDetailOption1Modal,
  CardDetailOption2Expand,
} from "@/app/components/card-detail";





// =========================================================
// Types
// =========================================================
type Card = {
  card_name: string;
  issuer: string;
  card_type: string;
  annual_fee: string;
  reward_model: string;
  rewards_type?: string;
  card_family: string;
  cashback_rate_display?: string;
  cashback_rate_effective: string;
  estimated_bonus_value_usd: string;
  minimum_spend_amount?: string;
  bonus_to_spend_ratio?: string;
  spend_time_frame?: string;
  intro_apr_purchase: string;
  best_for: string;
  pros: string;
  cons: string;
  signup_bonus: string;
  signup_bonus_type: string;
  bank_rules?: string;
  application_link?: string;
  special_feature_1?: string;
  special_feature_2?: string;
  lounge?: string;
  ge_tsa_precheck?: string;
};



type Answers = {
  [key: string]: any;
};





// =========================================================
// Issuer Color Map
// =========================================================
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



function getIssuerStyle(issuer: string) {
  return issuerColors[issuer.toLowerCase()] || {
    bg: "#e5e7eb",
    text: "#111827"
  };
}

// Bank logos: public/logos/banks/ (lowercase, hyphenated filenames)
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

// Brand logos (airline/hotel): public/logos/brands/ — only for branded cards
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



function getGoalRanks(answers: Answers): { primary?: string; secondary?: string; tertiary?: string } {
  if (Array.isArray(answers.primary_goal_ranked)) {
    const [first, second, third] = answers.primary_goal_ranked;
    return { primary: first, secondary: second, tertiary: third };
  }
  return { primary: answers.primary_goal, secondary: undefined, tertiary: undefined };
}





// =========================================================
// Initial Questionnaire (mirrors wizard Q1–Q3 for display)
// =========================================================
const initialQuestions = [
  {
    id: "primary_goal",
    question: "Rank what you want this card to be best at",
    options: [
      { value: "Cashback", label: "💰 Cashback" },
      { value: "Travel", label: "✈️ Travel rewards" },
      { value: "Bonus", label: "🎁 Signup bonus" },
      { value: "Everyday", label: "🧾 Everyday spending" }
    ]
  },
  {
    id: "annual_fee_tolerance",
    question: "How do you feel about annual fees?",
    options: [
      { value: "None", label: "❌ No annual fee" },
      { value: "Low", label: "🙂 Up to $100" },
      { value: "Medium", label: "😐 $100–$400" },
      { value: "High", label: "😎 Doesn't matter" }
    ]
  },
  {
    id: "spend_comfort",
    question: "How comfortable are you meeting an initial spending requirement to earn a sign-up bonus?",
    options: [
      { value: "None", label: "Don't want a bonus" },
      { value: "Low", label: "Under $1,000" },
      { value: "Medium", label: "Up to $5,000" },
      { value: "High", label: "Above $5,000" }
    ]
  }
];

function getInitialAnswerDisplay(questionId: string, answerValue: unknown): string {
  const q = initialQuestions.find(x => x.id === questionId);
  if (!q) return "";
  if (questionId === "primary_goal" && Array.isArray(answerValue)) {
    const top2 = answerValue.slice(0, 2);
    return top2.map((val: string, idx: number) => {
      const opt = q.options.find(o => o.value === val);
      return `${idx + 1}. ${opt?.label || val}`;
    }).join(" • ");
  }
  const opt = q.options.find(o => o.value === answerValue);
  return opt?.label || String(answerValue ?? "");
}

// =========================================================
// Feature: card enter/leave animation when refinement changes results
// =========================================================
const ENABLE_CARD_ANIMATIONS = true; // set false to disable (lighter code path)

// Toggle: show Pros/Cons on result card tiles. Set to true to bring them back.
const SHOW_PROSCONS_ON_RESULTS_TILES = false;

// =========================================================
// Refinement Questions Config
// =========================================================
// Same schema as wizard: id, question, optional helper, options: { value, label }[]
const refinementQuestions = [
  {
    id: "exclude_travel_cards",
    question: "Exclude travel and hotel branded cards?",
    helper: "When bonus is your main goal, results often include travel cards. Choose to see only cashback and other non-travel cards.",
    dependsOn: (answers: Answers) => {
      const { primary } = getGoalRanks(answers);
      return primary === "Bonus";
    },
    options: [
      { value: "No", label: "No, include travel cards" },
      { value: "Yes", label: "Yes, exclude all travel and hotel cards" }
    ]
  },
  {
    id: "travel_rewards_type",
    question: "What kind of travel rewards do you prefer?",
    dependsOn: (answers: Answers) => {
      const { primary } = getGoalRanks(answers);
      return (primary === "Travel" || primary === "Bonus") && answers.exclude_travel_cards !== "Yes";
    },
    options: [
      { value: "General", label: "Bank Rewards" },
      { value: "Airline", label: "Airline" },
      { value: "Hotel", label: "Hotel" },
      { value: "No Preference", label: "No Preference" }
    ]
  },
  {
    id: "preferred_bank",
    question: "Any bank preference?",
    helper: "We'll prioritize cards from the bank you pick (Bank Rewards = flexible points like Chase UR, Amex MR, Citi TYP).",
    dependsOn: (answers: Answers) => {
      const { primary } = getGoalRanks(answers);
      return (primary === "Travel" || primary === "Bonus") && answers.travel_rewards_type === "General" && answers.exclude_travel_cards !== "Yes";
    },
    options: [
      { value: "Chase", label: "Chase" },
      { value: "Amex", label: "Amex" },
      { value: "Citi", label: "Citi" },
      { value: "Capital One", label: "Capital One" },
      { value: "Bank of America", label: "Bank of America" },
      { value: "U.S. Bank", label: "U.S. Bank" },
      { value: "Barclays", label: "Barclays" },
      { value: "Wells Fargo", label: "Wells Fargo" },
      { value: "No preference", label: "No preference" }
    ]
  },
  {
    id: "preferred_airline",
    question: "Which airline do you usually fly?",
    dependsOn: (answers: Answers) => {
      const { primary } = getGoalRanks(answers);
      return (primary === "Travel" || primary === "Bonus") && answers.travel_rewards_type === "Airline" && answers.exclude_travel_cards !== "Yes";
    },
    options: [
      { value: "United", label: "United" },
      { value: "Delta", label: "Delta" },
      { value: "American", label: "American" },
      { value: "Alaska", label: "Alaska" },
      { value: "JetBlue", label: "JetBlue" },
      { value: "Southwest", label: "Southwest" },
      { value: "Frontier", label: "Frontier" },
      { value: "Spirit", label: "Spirit" },
      { value: "Breeze", label: "Breeze" },
      { value: "No strong preference", label: "No strong preference" }
    ]
  },
  {
    id: "preferred_hotel",
    question: "Which hotel brand do you prefer?",
    dependsOn: (answers: Answers) => {
      const { primary } = getGoalRanks(answers);
      return (primary === "Travel" || primary === "Bonus") && answers.travel_rewards_type === "Hotel" && answers.exclude_travel_cards !== "Yes";
    },
    options: [
      { value: "Marriott", label: "Marriott" },
      { value: "Hilton", label: "Hilton" },
      { value: "Hyatt", label: "Hyatt" },
      { value: "IHG", label: "IHG" },
      { value: "Wyndham", label: "Wyndham" },
      { value: "Choice", label: "Choice" },
      { value: "Expedia", label: "Expedia" },
      { value: "No strong preference", label: "No strong preference" }
    ]
  },
  {
    id: "travel_tier_preference",
    question: "Do you prefer a premium or mid-tier travel card?",
    helper: "Premium cards offer stronger benefits with higher annual fees; mid-tier cards have lower fees and solid rewards.",
    dependsOn: (answers: Answers) => {
      const { primary } = getGoalRanks(answers);
      return primary === "Travel" && answers.exclude_travel_cards !== "Yes";
    },
    options: [
      { value: "Premium", label: "Premium" },
      { value: "Mid-tier", label: "Mid-tier" },
      { value: "No preference", label: "No preference" }
    ]
  },
  {
    id: "travel_perks",
    question: "Prefer cards with TSA PreCheck/Global Entry credit or lounge access?",
    helper: "Select one or both. We'll prioritize cards that include these benefits.",
    dependsOn: (answers: Answers) => {
      const { primary } = getGoalRanks(answers);
      return primary === "Travel" && answers.exclude_travel_cards !== "Yes";
    },
    multiSelect: true,
    options: [
      { value: "tsa_ge", label: "TSA PreCheck / Global Entry credit" },
      { value: "lounge", label: "Lounge access" }
    ]
  },
  {
    id: "needs_0_apr",
    question: "Do you need a 0% intro APR?",
    helper: "We’ll prioritize cards with 0% intro APR when this matters to you.",
    dependsOn: (answers: Answers) => {
      const { primary } = getGoalRanks(answers);
      return primary === "Everyday" || primary === "Cashback";
    },
    options: [
      { value: "Yes", label: "Yes, 0% APR is important to me" },
      { value: "No", label: "No, I don't care about intro APR" }
    ]
  },
  {
    id: "issuer_approval_rules",
    question: "Do any of these approval rules apply to you?",
    helper: "Select all that apply. We’ll exclude cards from issuers that may not approve you.",
    dependsOn: () => true,
    multiSelect: true,
    options: [
      { value: "5_in_24mo", label: "5+ cards in 24 months (excludes Chase)" },
      { value: "6_in_24mo", label: "6+ cards in 24 months (excludes Chase & Barclays)" },
      { value: "2_in_60_days", label: "2+ cards in 60 days (excludes Citi & Amex)" },
      { value: "2_in_90_days", label: "2+ cards in 90 days (excludes Amex)" }
    ]
  }
];





// =========================================================
// Helper Functions
// =========================================================
function hasIntroAPR(card: Card) {
  return card.intro_apr_purchase?.trim().startsWith("0%");
}



/** Split pros/cons string into line items (handles ";" or "•" separators). Returns all items. */
function splitProsCons(text: string | undefined): string[] {
  if (!text || !text.trim()) return [];
  return text.split(/\s*[;•]\s*/).map(s => s.trim()).filter(Boolean);
}

/** Exclude issuer based on selected approval rules (one question, multi-select). */
function issuerExcluded(issuer: string, answers: Answers): boolean {
  const rules: string[] = Array.isArray(answers.issuer_approval_rules) ? answers.issuer_approval_rules : [];
  const i = issuer.toLowerCase();
  if (rules.includes("5_in_24mo") && i === "chase") return true;
  if (rules.includes("6_in_24mo") && (i === "chase" || i === "barclays")) return true;
  if (rules.includes("2_in_60_days") && (i === "citi" || i === "amex")) return true;
  if (rules.includes("2_in_90_days") && i === "amex") return true;
  return false;
}



/** Reward program name for bonus display: UR, MR, TYP, United miles, Cash, etc. */
function getBonusRewardsLabel(card: Card): string {
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

function formatBonusDisplay(card: Card) {
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

/** Human-readable label for reward_model (travel, cashback, airline, hotel, etc.) */
/** All airline/hotel cards display as Travel. */
function getRewardModelLabel(rewardModel: string): string {
  const r = (rewardModel || "").toLowerCase();
  if (r === "travel" || r === "airline" || r === "hotel") return "Travel";
  if (r === "cashback") return "Cashback";
  if (r === "balance_transfer") return "Balance transfer";
  if (r === "credit_building") return "Credit building";
  return rewardModel ? rewardModel.charAt(0).toUpperCase() + rewardModel.slice(1) : "";
}

/** Cashback rate for display: always show as % style (e.g. "5% / 3% / 1.5%" or "1.5%") */
function getCashbackDisplay(card: Card): string | null {
  const display = card.cashback_rate_display?.trim();
  if (display) {
    const parts = display.split(/\s*\/\s*/).map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) return null;
    const withPercent = parts.map(p => {
      const n = parseFloat(p);
      return Number.isNaN(n) ? p : `${n}%`;
    });
    return withPercent.join(" / ");
  }
  const effective = card.cashback_rate_effective?.trim();
  if (effective && parseFloat(effective) >= 0) return `${effective}%`;
  return null;
}

/** Match airline by card_family or card_name (e.g. American = family "American"; Alaska = family "Alaska" or name "Alaska") */
function cardMatchesAirline(card: Card, airline: string): boolean {
  if (!airline || airline === "No strong preference") return false;
  const key = airline.trim().toLowerCase();
  const family = (card.card_family || "").trim().toLowerCase();
  const name = (card.card_name || "").toLowerCase();
  return family.includes(key) || name.includes(key);
}

/** Match hotel by card_family or card_name (Expedia also matches One Key, Hotels.com, Vrbo). */
function cardMatchesHotel(card: Card, hotel: string): boolean {
  if (!hotel || hotel === "No strong preference") return false;
  const key = hotel.trim().toLowerCase();
  const family = (card.card_family || "").trim().toLowerCase();
  const name = (card.card_name || "").toLowerCase();
  if (family.includes(key) || name.includes(key)) return true;
  if (key === "expedia" && (name.includes("one key") || name.includes("hotels.com") || name.includes("vrbo") || name.includes("expedia"))) return true;
  return false;
}

/** Match card to a brand key (airline or hotel) by card_family or card_name – used for filtering main/other lists */
function cardMatchesBrandKey(card: Card, brandKey: string): boolean {
  const family = (card.card_family || "").trim().toLowerCase();
  const name = (card.card_name || "").toLowerCase();
  if (family.includes(brandKey) || name.includes(brandKey)) return true;
  if (brandKey === "expedia" && (name.includes("one key") || name.includes("hotels.com") || name.includes("vrbo"))) return true;
  return false;
}

/** Match card to preferred bank (issuer). Normalizes Amex / American Express. */
function cardMatchesBank(card: Card, bank: string): boolean {
  if (!bank || bank === "No preference") return false;
  const issuer = (card.issuer || "").trim().toLowerCase();
  const key = bank.trim().toLowerCase();
  if (issuer === key) return true;
  if (key === "amex" && (issuer === "amex" || issuer === "american express")) return true;
  if (key === "american express" && (issuer === "amex" || issuer === "american express")) return true;
  return false;
}

/** True if card is premium tier within its family (e.g. Reserve vs Preferred, Venture X vs Venture; airline/hotel mid vs premium). */
function isPremiumTierCard(card: Card): boolean {
  const name = (card.card_name || "").toLowerCase();
  const fee = parseInt(card.annual_fee || "0", 10);
  const premiumNames = [
    "reserve", "venture x", "platinum", "infinite", "aspire", "brilliant",
    "performance", "premier", "club infinite", "club business",
    "world mastercard", "privileges select", "one key+", "earner plus",
    "executive", "signature"
  ];
  if (premiumNames.some(p => name.includes(p))) return true;
  if (fee >= 395) return true; // Venture X / Reserve tier and above
  return false;
}

/** True if card is generic travel (Sapphire, Venture, Amex MR) rather than airline/hotel co-brand. */
function isGenericTravelCard(card: Card): boolean {
  return (card.reward_model || "").toLowerCase() === "travel";
}

/** Very premium travel: Sapphire Reserve, Amex Platinum, Venture X (higher fees, best benefits). */
function isVeryPremiumTravelCard(card: Card): boolean {
  const name = (card.card_name || "").toLowerCase();
  const issuer = (card.issuer || "").toLowerCase();
  if (name.includes("sapphire reserve")) return true;
  if (name.includes("venture x")) return true;
  if (issuer === "amex" && name.includes("platinum") && !name.includes("delta")) return true;
  return false;
}

/** Premium (mid-tier) travel: Sapphire Preferred, Amex Gold, Venture (not X). */
function isMidTierTravelCard(card: Card): boolean {
  const name = (card.card_name || "").toLowerCase();
  const issuer = (card.issuer || "").toLowerCase();
  if (name.includes("sapphire preferred")) return true;
  if (name.includes("venture") && !name.includes("venture x")) return true;
  if (issuer === "amex" && name.includes("gold") && !name.includes("delta")) return true;
  return false;
}

/**
 * De-duplicate cards by card_family: keep the highest-score card per family.
 * Used when no specific airline/hotel brand is selected.
 */
function dedupeByFamily(
  items: { card: Card; score: number }[]
): { card: Card; score: number }[] {
  const bestByFamily = new Map<string, { card: Card; score: number }>();


  for (const entry of items) {
    const familyKey =
      entry.card.card_family && entry.card.card_family.trim().length > 0
        ? entry.card.card_family.trim()
        : entry.card.card_name;


    const existing = bestByFamily.get(familyKey);
    if (!existing || entry.score > existing.score) {
      bestByFamily.set(familyKey, entry);
    }
  }


  return Array.from(bestByFamily.values());
}



/**
 * Hard brand filter helper (currently unused directly, kept for future tweaks):
 * Return only the top N cards whose card_family contains the brand string.
 */
function selectTopBrandOnly(
  items: { card: Card; score: number }[],
  brand: string,
  topBrandCount: number
): { card: Card; score: number }[] {
  const brandKey = brand.trim().toLowerCase();


  const brandCards = items.filter(x => {
    const fam = (x.card.card_family || "").toLowerCase();
    return fam.includes(brandKey);
  });


  return brandCards
    .sort((a, b) => b.score - a.score)
    .slice(0, topBrandCount);
}





// =========================================================
// Parse minimum spend from CSV (e.g. "$500", "$4,000" -> 500, 4000)
function parseMinSpend(raw: string | undefined): number {
  if (!raw || !raw.trim()) return 0;
  const cleaned = raw.replace(/[$,]/g, "").trim();
  const n = parseInt(cleaned, 10);
  return Number.isNaN(n) ? 0 : n;
}

// Bonus-to-min-spend ratio (efficiency). Returns 0 if no min spend or no bonus.
function getBonusToMinSpendRatio(bonusValue: number, minSpend: number): number {
  if (minSpend <= 0 || bonusValue <= 0) return 0;
  return bonusValue / minSpend;
}

// =========================================================
// Scoring Engine - Restructured for Better Logic
// =========================================================
function scoreCard(card: Card, answers: Answers, ownedCards: string[]) {
  // =========================================================
  // STEP 1: Hard Exclusions (immediate disqualification)
  // =========================================================
  if (ownedCards.includes(card.card_name)) return -9999;
  if (issuerExcluded(card.issuer, answers)) return -9999;
  const rewardModel = card.reward_model.toLowerCase();
  const isTravelCard = rewardModel === "travel" || rewardModel === "airline" || rewardModel === "hotel";
  if (answers.exclude_travel_cards === "Yes" && isTravelCard) return -9999;

  const { primary, secondary, tertiary } = getGoalRanks(answers);
  const cardFee = parseInt(card.annual_fee || "0", 10);
  const bonusValue = parseInt(card.estimated_bonus_value_usd || "0", 10);
  const minSpend = parseMinSpend(card.minimum_spend_amount);
  const bonusRatio = getBonusToMinSpendRatio(bonusValue, minSpend);
  const cashbackRate = parseFloat(card.cashback_rate_effective || "0");
  const isCashbackCard = rewardModel === "cashback";

  let score = 0;

  // =========================================================
  // STEP 2: Special Case - 0% APR Requirement
  // =========================================================
  if (
    answers.needs_0_apr === "Yes" &&
    primary !== "Travel"
  ) {
    if (!hasIntroAPR(card)) return -9999;
    score += cashbackRate * 10;
    score -= cardFee / 10;
    return score;
  }

  // =========================================================
  // STEP 3: Annual Fee Tolerance Filtering
  // =========================================================
  const feeTolerance = answers.annual_fee_tolerance;
  if (feeTolerance === "None" && cardFee > 0) {
    score -= 50;
  } else if (feeTolerance === "Low" && cardFee > 100) {
    score -= 30;
  } else if (feeTolerance === "Medium" && cardFee > 400) {
    score -= 30;
  }

  // =========================================================
  // STEP 3b: Tier awareness (premium vs mid within same family)
  // =========================================================
  const isPremium = isPremiumTierCard(card);
  if (feeTolerance === "High" || feeTolerance === "Medium") {
    if (isPremium) score += 20; // Prefer Reserve, Venture X, Platinum when OK with fees
  } else if (feeTolerance === "None" || feeTolerance === "Low") {
    if (isPremium) score -= 15; // Don't push $400+ cards to no-fee / low-fee seekers
  }

  // =========================================================
  // STEP 4: Primary Goal Scoring (key metric per goal)
  // =========================================================

  if (primary === "Travel") {
    // High priority: travel cards should be displayed
    if (isTravelCard) {
      score += 80; // Strong base so travel cards rise to top
      if (answers.travel_frequency === "High") score += 15;
      else if (answers.travel_frequency === "Medium") score += 8;
      else if (answers.travel_frequency === "Low") score -= 10;
    } else {
      score -= 40; // Heavy penalty so non-travel cards don't crowd results
    }
  } else if (primary === "Cashback") {
    // 60% weight: cashback rate. 40% weight: bonus_to_spend_ratio (from CSV when present, else computed).
    if (isCashbackCard) {
      score += 50; // Base for being cashback
      const ratioFromCsv = parseFloat(card.bonus_to_spend_ratio || "");
      const bonusToSpendRatio = !Number.isNaN(ratioFromCsv) && ratioFromCsv >= 0 ? ratioFromCsv : bonusRatio;
      const cashbackComponent = Math.min(cashbackRate * 20, 100);
      const ratioComponent = Math.min(bonusToSpendRatio * 100, 100);
      score += 0.6 * cashbackComponent + 0.4 * ratioComponent;
    } else {
      score += cashbackRate * 25;
    }
  } else if (primary === "Everyday") {
    // Mixture of cashback rate and 0% APR
    score += cashbackRate * 15; // Cashback rate matters
    if (hasIntroAPR(card)) {
      score += 35; // 0% APR is important for everyday spending
    }
  } else if (primary === "Bonus") {
    // Primary: bonus value; secondary: bonus-to-min-spend ratio (efficiency)
    if (answers.spend_comfort !== "None") {
      score += Math.min(bonusValue / 25, 80); // Bonus value is key (strong weight)
      if (bonusRatio > 0) score += Math.min(bonusRatio * 25, 15); // Lower weight – prefer efficient bonuses
    } else {
      score -= 20;
    }
  }

  // =========================================================
  // STEP 5: Secondary Goal Scoring (Medium Weight)
  // =========================================================
  if (secondary === "Travel") {
    if (isTravelCard) {
      score += 30;
      if (answers.travel_frequency === "High") score += 8;
      else if (answers.travel_frequency === "Low") score -= 5;
    } else {
      score -= 15;
    }
  } else if (secondary === "Cashback") {
    if (isCashbackCard) {
      score += 15;
      if (bonusRatio > 0) score += Math.min(bonusRatio * 5, 4);
    }
    score += cashbackRate * 5;
  } else if (secondary === "Everyday") {
    score += cashbackRate * 4;
    if (hasIntroAPR(card)) score += 10;
  } else if (secondary === "Bonus") {
    if (answers.spend_comfort !== "None") {
      score += Math.min(bonusValue / 80, 15);
      if (bonusRatio > 0) score += Math.min(bonusRatio * 8, 5);
    }
  }

  // =========================================================
  // STEP 5b: Tertiary Goal Scoring (Low Weight - 3rd rank)
  // =========================================================
  if (tertiary === "Travel") {
    if (isTravelCard) {
      score += 12;
      if (answers.travel_frequency === "High") score += 3;
    } else {
      score -= 5;
    }
  } else if (tertiary === "Cashback") {
    if (isCashbackCard) {
      score += 8;
      if (bonusRatio > 0) score += Math.min(bonusRatio * 3, 2);
    }
    score += cashbackRate * 2;
  } else if (tertiary === "Everyday") {
    score += cashbackRate * 2;
    if (hasIntroAPR(card)) score += 5;
  } else if (tertiary === "Bonus") {
    if (answers.spend_comfort !== "None") {
      score += Math.min(bonusValue / 150, 8);
      if (bonusRatio > 0) score += Math.min(bonusRatio * 4, 3);
    }
  }

  // =========================================================
  // STEP 6: Travel-Specific Preferences
  // =========================================================
  const caresAboutTravel = primary === "Travel" || secondary === "Travel" || tertiary === "Travel";
  const wantsGenericTravel =
    answers.travel_rewards_type === "General" ||
    !answers.travel_rewards_type;

  if (caresAboutTravel) {
    // When user wants generic/flexible travel, boost Sapphire, Venture, Amex (not airline/hotel co-brands)
    if (wantsGenericTravel && isGenericTravelCard(card)) {
      score += 30; // So Chase Sapphire, Capital One Venture, Amex MR cards show up
    }

    // Bank preference when user chose Bank Rewards (General)
    const preferredBank = answers.preferred_bank;
    if (wantsGenericTravel && preferredBank && preferredBank !== "No preference") {
      const cardIssuer = (card.issuer || "").trim().toLowerCase();
      const bankKey = preferredBank.trim().toLowerCase();
      if (cardIssuer === bankKey || (bankKey === "amex" && cardIssuer === "american express")) {
        score += 40;
      }
    }

    // Travel tier: Premium vs Mid-tier (use both named cards and fee so airline/hotel co-brands are covered)
    const tierPref = answers.travel_tier_preference;
    if (tierPref === "Premium") {
      if (isVeryPremiumTravelCard(card)) score += 35; // Reserve, Platinum, Venture X
      else if (isTravelCard && cardFee >= 350) score += 25; // e.g. Atmos Summit, other premium co-brands
    } else if (tierPref === "Mid-tier") {
      if (isMidTierTravelCard(card)) score += 35; // Preferred, Gold, Venture
      else if (isTravelCard && cardFee >= 300) score -= 35; // penalize high-fee cards (e.g. Atmos Summit $395)
    }

    // Airline preference matching (by card_family or card_name: American, Alaska, etc.)
    if (cardMatchesAirline(card, answers.preferred_airline)) {
      score += 40;
    }

    // Hotel preference matching (by card_family or card_name)
    if (cardMatchesHotel(card, answers.preferred_hotel)) {
      score += 40;
    }

    // TSA/GE and lounge: boost cards that have the selected perks
    const travelPerks: string[] = Array.isArray(answers.travel_perks) ? answers.travel_perks : [];
    const hasLounge = (card.lounge || "").trim().length > 0;
    const hasTsaGe = (card.ge_tsa_precheck || "").trim().length > 0;
    if (travelPerks.includes("tsa_ge") && hasTsaGe) score += 25;
    if (travelPerks.includes("lounge") && hasLounge) score += 25;
  }

  // =========================================================
  // STEP 7: Baseline Bonus Value (if user wants bonuses)
  // =========================================================
  if (answers.spend_comfort !== "None") {
    score += Math.min(bonusValue / 100, 20);
    if (bonusRatio > 0) score += Math.min(bonusRatio * 8, 6); // Small global nudge for efficient bonuses
  } else {
    // User doesn't want bonus - small penalty for high bonus cards
    if (bonusValue > 500) score -= 5;
  }

  // =========================================================
  // STEP 8: Annual Fee Value Adjustment
  // =========================================================
  // If card has annual fee, ensure it's justified by other benefits
  if (cardFee > 0) {
    // Small penalty for high fees relative to benefits
    if (cardFee > 400 && score < 50) {
      score -= 10; // High fee card with low overall score
    }
  }

  return score;
}





// =========================================================
// Main Results Page
// =========================================================
export default function ResultsPage() {



  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [ownedCards, setOwnedCards] = useState<string[]>([]);
  const [compareCards, setCompareCards] = useState<string[]>([]);
  const [rankedCards, setRankedCards] = useState<Card[]>([]);
  const [showOtherType, setShowOtherType] = useState(false);
  const [showMoreMain, setShowMoreMain] = useState<3 | 6 | 9>(3);
  const [hoveredAnswerIndex, setHoveredAnswerIndex] = useState<number | null>(null);
  const [refinementOpen, setRefinementOpen] = useState(false);
  const [advancedModeOpen, setAdvancedModeOpen] = useState(false);

  // Enter/leave animation when refinement changes the result set (optional)
  const previousVisibleRef = useRef<Card[]>([]);
  const [leavingCards, setLeavingCards] = useState<Card[]>([]);
  const [enteringCardNames, setEnteringCardNames] = useState<Set<string>>(new Set());
  const [detailModalCard, setDetailModalCard] = useState<Card | null>(null);
  const [secondCardExpanded, setSecondCardExpanded] = useState(false);
  const [otherTypeLeavingCards, setOtherTypeLeavingCards] = useState<Card[]>([]);
  const [otherTypeEnteringCardNames, setOtherTypeEnteringCardNames] = useState<Set<string>>(new Set());
  const otherTypePrevRef = useRef<boolean>(false);

  useEffect(() => {
    if (!ENABLE_CARD_ANIMATIONS) return;
    const visible = rankedCards.slice(0, showMoreMain);
    const prev = previousVisibleRef.current;
    const leaving = prev.filter(p => !visible.some(r => r.card_name === p.card_name));
    const entering = visible.filter(c => !prev.some(p => p.card_name === c.card_name));
    // Keep cards already leaving so their animation isn't cut short when refinement changes again (e.g. toggling approval rules)
    setLeavingCards(prevLeaving => {
      const visibleNames = new Set(visible.map(c => c.card_name));
      const stillLeaving = prevLeaving.filter(p => !visibleNames.has(p.card_name));
      const newLeaving = leaving.filter(l => !stillLeaving.some(s => s.card_name === l.card_name));
      return [...stillLeaving, ...newLeaving];
    });
    setEnteringCardNames(prev.length > 0 ? new Set(entering.map(c => c.card_name)) : new Set());
    const tid = setTimeout(() => {
      setLeavingCards([]);
      setEnteringCardNames(new Set());
      previousVisibleRef.current = visible;
    }, 600);
    return () => clearTimeout(tid);
  }, [rankedCards, showMoreMain]);

  // ---------------------
  // Load Initial Data
  // ---------------------
  useEffect(() => {
    const storedAnswers = JSON.parse(localStorage.getItem("answers") || "{}");
    const cardMode = localStorage.getItem("card_mode");
    setAnswers({ ...storedAnswers, card_mode: cardMode || "" });


    Promise.all([fetch("/cards.csv").then(r => r.text()), fetch("/banks.csv").then(r => r.text())])
      .then(([cardsText, banksText]) => {
        const bankRows = Papa.parse<{ issuer: string; bank_rules: string }>(banksText, { header: true, skipEmptyLines: true }).data;
        const bankRulesMap: Record<string, string> = {};
        bankRows.forEach(b => { if (b.issuer) bankRulesMap[b.issuer] = b.bank_rules || ""; });
        const parsed = Papa.parse<Card>(cardsText, { header: true, skipEmptyLines: true });
        const enriched = parsed.data.map(c => {
          const base = { ...c, bank_rules: bankRulesMap[c.issuer] ?? c.bank_rules ?? "" };
          return { ...base, estimated_bonus_value_usd: String(getEstimatedBonusValueUsd(base)) };
        });
        setCards(enriched);
      });
  }, []);





  // ---------------------
  // Live Re-Scoring (Primary Type) with brand + rest
  // ---------------------
  useEffect(() => {
    const scoredRaw = [...cards]
      .filter(c => c.card_type === answers.card_mode)
      .map(card => ({
        card,
        score: scoreCard(card, answers, ownedCards)
      }))
      .filter(x => x.score > -9999);

    // When user excludes travel, pool is already non-travel only (via -9999). When including travel, show both airline and hotel cards (no filter by type).
    const travelType = answers.travel_rewards_type;
    let pool = scoredRaw;

    let finalCards: Card[] = [];

    const wantsAirlineBrand =
      travelType === "Airline" &&
      answers.preferred_airline &&
      answers.preferred_airline !== "No strong preference";

    const wantsHotelBrand =
      travelType === "Hotel" &&
      answers.preferred_hotel &&
      answers.preferred_hotel !== "No strong preference";

    const wantsBankBrand =
      travelType === "General" &&
      answers.preferred_bank &&
      answers.preferred_bank !== "No preference";

    if (wantsAirlineBrand || wantsHotelBrand) {
      const brand = wantsAirlineBrand
        ? answers.preferred_airline
        : answers.preferred_hotel;
      const brandKey = brand.trim().toLowerCase();

      const brandCards = pool
        .filter(x => cardMatchesBrandKey(x.card, brandKey))
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);

      const nonBrandCards = pool.filter(x => !cardMatchesBrandKey(x.card, brandKey));
      const generalCards = dedupeByFamily(nonBrandCards)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);

      finalCards = [
        ...brandCards.map(x => x.card),
        ...generalCards.map(x => x.card)
      ];
    } else if (wantsBankBrand) {
      const bank = answers.preferred_bank!.trim();

      const bankCards = pool
        .filter(x => cardMatchesBank(x.card, bank))
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);

      const nonBankCards = pool.filter(x => !cardMatchesBank(x.card, bank));
      const restCards = dedupeByFamily(nonBankCards)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);

      finalCards = [
        ...bankCards.map(x => x.card),
        ...restCards.map(x => x.card)
      ];
    } else {
      const selected = dedupeByFamily(pool)
        .sort((a, b) => b.score - a.score)
        .slice(0, 9);
      finalCards = selected.map(x => x.card);
    }

    setRankedCards(finalCards);
  }, [cards, answers, ownedCards]);





  // ---------------------
  // Other Card Type Ranking (Top 3) — same scoring + same brand priority as main list
  // ---------------------
  const wantsAirlineBrand =
    answers.travel_rewards_type === "Airline" &&
    answers.preferred_airline &&
    answers.preferred_airline !== "No strong preference";
  const wantsHotelBrand =
    answers.travel_rewards_type === "Hotel" &&
    answers.preferred_hotel &&
    answers.preferred_hotel !== "No strong preference";
  const wantsBankBrand =
    answers.travel_rewards_type === "General" &&
    answers.preferred_bank &&
    answers.preferred_bank !== "No preference";

  const otherTypeCards = useMemo(() => {
    if (!answers.card_mode) return [];

    const otherType =
      answers.card_mode === "personal" ? "business" : "personal";

    let pool = [...cards]
      .filter(c => c.card_type === otherType)
      .map(card => ({
        card,
        score: scoreCard(card, answers, ownedCards)
      }))
      .filter(x => x.score > -9999);

    const travelType = answers.travel_rewards_type;
    // No filter by airline/hotel — show all travel cards when including travel.

    if (wantsAirlineBrand || wantsHotelBrand) {
      const brand = wantsAirlineBrand
        ? answers.preferred_airline
        : answers.preferred_hotel;
      const brandKey = brand.trim().toLowerCase();

      const brandCards = pool
        .filter(x => cardMatchesBrandKey(x.card, brandKey))
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);

      const nonBrandCards = pool.filter(x => !cardMatchesBrandKey(x.card, brandKey));
      const generalCards = dedupeByFamily(nonBrandCards)
        .sort((a, b) => b.score - a.score)
        .slice(0, 1);

      return [
        ...brandCards.map(x => x.card),
        ...generalCards.map(x => x.card)
      ].slice(0, 3);
    }

    if (wantsBankBrand) {
      const bank = answers.preferred_bank!.trim();

      const bankCards = pool
        .filter(x => cardMatchesBank(x.card, bank))
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);

      const nonBankCards = pool.filter(x => !cardMatchesBank(x.card, bank));
      const restCards = dedupeByFamily(nonBankCards)
        .sort((a, b) => b.score - a.score)
        .slice(0, 1);

      return [
        ...bankCards.map(x => x.card),
        ...restCards.map(x => x.card)
      ].slice(0, 3);
    }

    const deduped = dedupeByFamily(pool)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(x => x.card);

    return deduped;
  }, [cards, answers, ownedCards, wantsAirlineBrand, wantsHotelBrand, wantsBankBrand]);

  // Other-type section: enter/leave animation when toggling Show/Hide business or personal cards
  useEffect(() => {
    if (!ENABLE_CARD_ANIMATIONS || otherTypeCards.length === 0) return;
    const wasOpen = otherTypePrevRef.current;
    otherTypePrevRef.current = showOtherType;
    if (showOtherType && !wasOpen) {
      setOtherTypeEnteringCardNames(new Set(otherTypeCards.map(c => c.card_name)));
      const t = setTimeout(() => setOtherTypeEnteringCardNames(new Set()), 600);
      return () => clearTimeout(t);
    }
    if (!showOtherType && wasOpen) {
      setOtherTypeLeavingCards([...otherTypeCards]);
      const t = setTimeout(() => {
        setOtherTypeLeavingCards([]);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [showOtherType, otherTypeCards]);





  // ---------------------
  // Refinement Visibility
  // ---------------------
  const visibleRefinements = refinementQuestions.filter(q =>
    q.dependsOn ? q.dependsOn(answers) : true
  );





  // =========================================================
  // Theme: accents only (no background change). Shared with wizard – edit app/lib/theme.ts to change scheme.
  // =========================================================
  const theme = getTheme((answers.card_mode as CardMode) || "personal");

  // =========================================================
  // UI
  // =========================================================
  return (
    <div className="results-page">



      {/* LEFT PANEL – own scroll when content is tall */}
      <div className="results-left" style={{ background: "var(--surface-elevated)", borderRadius: 12, padding: 20 }}>

        <a
          href="/"
          className="results-tap-target"
          onClick={(e) => {
            e.preventDefault();
            localStorage.removeItem("answers");
            localStorage.removeItem("card_mode");
            localStorage.removeItem("wizard_step");
            window.location.href = "/";
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            marginBottom: 20,
            padding: "10px 18px",
            borderRadius: 8,
            background: "#111827",
            color: "#ffffff",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
            border: "none",
            cursor: "pointer"
          }}
        >
          ← Back
        </a>

        {/* Personal / Business – highest-level hierarchy; selection matches mode from wizard */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["personal", "business"] as const).map(mode => (
            <button
              key={mode}
              type="button"
              className={`results-tap-target results-mode-btn ${(answers.card_mode || "personal") !== mode ? "results-mode-btn-unselected" : ""}`}
              onClick={() => {
                setAnswers(prev => ({ ...prev, card_mode: mode }));
                if (typeof localStorage !== "undefined") {
                  localStorage.setItem("card_mode", mode);
                }
              }}
              style={{
                padding: "10px 20px",
                borderRadius: 6,
                border: `2px solid ${(answers.card_mode || "personal") === mode ? theme.primary : theme.primaryLighter}`,
                background: (answers.card_mode || "personal") === mode ? theme.primary : "var(--surface-elevated)",
                color: (answers.card_mode || "personal") === mode ? "#ffffff" : theme.primaryDark,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer"
              }}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {/* ========== REVERSIBLE: Your answers box (hierarchy, pills, accent, hover, microcopy) ========== */}
        <div
          style={{
            marginBottom: 24,
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text-secondary)",
              padding: "12px 14px",
              background: "var(--gradient-header)",
              borderBottom: "1px solid var(--border)"
            }}
          >
            Your answers
          </div>
          <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ margin: "0 0 6px", fontSize: 11, color: "var(--text-muted-light)" }}>
              Click any answer to change it.
            </p>
            {initialQuestions.map((q, stepIndex) => {
              const answer = q.id === "primary_goal" ? answers.primary_goal_ranked : answers[q.id];
              const display = getInitialAnswerDisplay(q.id, answer);
              if (!display) return null;
              const isHovered = hoveredAnswerIndex === stepIndex;
              return (
                <div
                  key={q.id}
                  className="results-left-answer-box"
                  onClick={() => {
                    if (typeof localStorage !== "undefined") {
                      localStorage.setItem("wizard_step", String(stepIndex));
                    }
                    window.location.href = "/wizard";
                  }}
                  onMouseEnter={() => setHoveredAnswerIndex(stepIndex)}
                  onMouseLeave={() => setHoveredAnswerIndex(null)}
                  style={{
                    fontSize: 13,
                    padding: "10px 14px",
                    background: isHovered ? theme.primaryLighter : theme.primaryLight,
                    borderRadius: 8,
                    border: `1px solid ${theme.primaryLighter}`,
                    borderLeft: `3px solid ${theme.primary}`,
                    boxShadow: isHovered ? `0 2px 6px ${theme.primary}26` : "0 1px 2px rgba(0,0,0,0.04)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    transform: isHovered ? "translateY(-2px)" : "translateY(0)"
                  }}
                >
                  <span
                    className="results-left-q-pill"
                    style={{
                      display: "inline-block",
                      fontWeight: 700,
                      color: theme.primaryDark,
                      background: "rgba(255,255,255,0.8)",
                      padding: "2px 8px",
                      borderRadius: 6,
                      marginRight: 8,
                      fontSize: 12
                    }}
                  >
                    Q{stepIndex + 1}
                  </span>
                  <span className="results-left-answer-text" style={{ color: "var(--pill-text)" }}>{display}</span>
                  {isHovered && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: theme.primary, fontWeight: 600 }}>Edit</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ========== REVERSIBLE: Refine box (same style as Your answers, card per question) ========== */}
        <div
          className="results-refine-box"
          style={{
            marginBottom: 24,
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text-secondary)",
              padding: "12px 14px",
              background: "var(--gradient-header)",
              borderBottom: refinementOpen ? "1px solid var(--border)" : "none"
            }}
          >
            <span>Refine your results</span>
            <button
              type="button"
              className="refinement-mobile-toggle tap-target"
              onClick={() => setRefinementOpen((prev) => !prev)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface-elevated)",
                color: "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {refinementOpen ? "Hide" : "Show refinement questions"}
            </button>
          </div>
          <div className={`refinement-content ${refinementOpen ? "" : "refinement-content-collapsed"}`} style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 14 }}>
            {visibleRefinements.map(q => (
              <div
                key={q.id}
                style={{
                  background: "var(--surface-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "14px 16px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
                }}
              >
                <div className="results-refine-question" style={{ fontWeight: 600, color: theme.primaryDark, fontSize: 14, marginBottom: 6 }}>
                  {q.question}
                </div>
                {"helper" in q && q.helper && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
                    {q.helper}
                  </div>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {"multiSelect" in q && q.multiSelect ? (
                    q.options.map((option: { value: string; label: string }) => {
                      const selected: string[] = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                      const isChecked = selected.includes(option.value);
                      return (
                        <label
                          key={option.value}
                          className="tap-target"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 12px",
                            borderRadius: 8,
                            border: `1px solid ${isChecked ? theme.primary : theme.primaryLighter}`,
                            background: isChecked ? theme.primaryLight : "var(--surface-elevated)",
                            cursor: "pointer",
                            fontSize: 13
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setAnswers(prev => {
                                const current: string[] = Array.isArray(prev[q.id]) ? prev[q.id] : [];
                                const next = current.includes(option.value)
                                  ? current.filter(v => v !== option.value)
                                  : [...current, option.value];
                                return { ...prev, [q.id]: next };
                              });
                            }}
                          />
                          <span style={{ color: isChecked ? theme.primaryDark : "var(--pill-text)" }}>{option.label}</span>
                        </label>
                      );
                    })
                  ) : (
                    q.options.map(option => (
                      <button
                        key={option.value}
                        className={`tap-target results-refine-option-btn ${answers[q.id] === option.value ? "selected" : ""}`}
                        onClick={() =>
                          setAnswers(prev => ({ ...prev, [q.id]: option.value }))
                        }
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          border: `1px solid ${theme.primaryLighter}`,
                          background:
                            answers[q.id] === option.value ? theme.primary : "var(--surface-elevated)",
                          color:
                            answers[q.id] === option.value ? "#ffffff" : theme.primaryDark,
                          fontSize: 13
                        }}
                      >
                        {option.label}
                      </button>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========== Advanced Mode (left panel, same style as Refine) ========== */}
        <div
          className="results-advanced-mode-box"
          style={{
            marginBottom: 24,
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text-secondary)",
              padding: "12px 14px",
              background: "var(--gradient-header)",
              borderBottom: advancedModeOpen ? "1px solid var(--border)" : "none"
            }}
          >
            <span>Advanced Mode</span>
            <button
              type="button"
              className="refinement-mobile-toggle tap-target"
              onClick={() => setAdvancedModeOpen((prev) => !prev)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface-elevated)",
                color: "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {advancedModeOpen ? "Hide" : "Show"}
            </button>
          </div>
          <div className={`advanced-mode-content ${advancedModeOpen ? "" : "refinement-content-collapsed"}`} style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "14px 16px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
              }}
            >
              <div style={{ fontWeight: 600, color: theme.primaryDark, fontSize: 14, marginBottom: 8 }}>
                Do you want to maximize rewards for a specific spend?
              </div>
              <Link
                href="/max-rewards-mode"
                className="tap-target"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: `2px solid ${theme.primary}`,
                  background: theme.primaryLight,
                  color: theme.primaryDark,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  cursor: "pointer"
                }}
              >
                Maximize rewards mode →
              </Link>
            </div>
          </div>
        </div>
      </div>





      {/* RIGHT PANEL */}
      <div className="results-right">
        {ENABLE_CARD_ANIMATIONS && (
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes cardEnter {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes cardLeave {
              from { opacity: 1; transform: translateY(0); }
              to { opacity: 0; transform: translateY(24px); }
            }
            .card-enter { animation: cardEnter 0.55s ease-out forwards; }
            .card-leave { animation: cardLeave 0.55s ease-out forwards; }
          `}} />
        )}
        <h2
          style={{
            marginBottom: 20,
            fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
            fontWeight: 700,
            fontSize: 26,
            letterSpacing: "-0.03em",
            lineHeight: 1.25,
            color: "var(--text-primary)"
          }}
        >
          Your top picks — based on your answers
        </h2>



        {rankedCards.slice(0, showMoreMain).map((card, index) => {
          const style = getIssuerStyle(card.issuer);
          const bonusDisplay = formatBonusDisplay(card);
          const rewardLabel = getRewardModelLabel(card.reward_model);
          const cashbackDisplay = getCashbackDisplay(card);
          const bankLogo = getBankLogoPath(card.issuer);
          const brandLogo = getBrandLogoPath(card);
          const isEntering = ENABLE_CARD_ANIMATIONS && enteringCardNames.has(card.card_name);
          const isFirstCard = index === 0;
          const isSecondCard = index === 1;

          return (
            <div
              key={card.card_name}
              className={`results-card-wrap ${isEntering ? "card-enter" : ""}`}
              style={{ marginBottom: 20 }}
            >
              <div
                className="results-card-tile"
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
                  overflow: "hidden"
                }}
              >
                {bankLogo ? (
                  <img src={bankLogo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : null}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  {isFirstCard && ENABLE_CARD_DETAIL_OPTION_1_MODAL ? (
                    <button
                      type="button"
                      onClick={() => setDetailModalCard(card)}
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
                        textUnderlineOffset: 2
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
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <label style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        <input
                          type="checkbox"
                          checked={ownedCards.includes(card.card_name)}
                          onChange={() =>
                            setOwnedCards(prev =>
                              prev.includes(card.card_name)
                                ? prev.filter(c => c !== card.card_name)
                                : [...prev, card.card_name]
                            )
                          }
                        />{" "}
                        Have it / Not interested
                      </label>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, alignItems: "center" }}>
                  <span style={{ background: style.bg, color: style.text, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                    {card.issuer}
                  </span>
                  {card.card_type === "business" && (
                    <span style={{ background: theme.businessBadge.bg, color: theme.businessBadge.text, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                      Business card
                    </span>
                  )}
                  {rewardLabel && (
                    <span style={{ background: "var(--pill-bg)", color: "var(--pill-text)", padding: "4px 8px", borderRadius: 6, fontSize: 11 }}>
                      {rewardLabel}
                    </span>
                  )}
                  {card.intro_apr_purchase && (
                    <span style={{ color: "var(--text-muted)", fontSize: 11 }}>APR {card.intro_apr_purchase}</span>
                  )}
                  {cashbackDisplay && (
                    <span style={{ color: "var(--text-muted)", fontSize: 11 }}>• Expected cashback {cashbackDisplay}</span>
                  )}
                </div>

                {bonusDisplay && (
                  <div className="results-card-bonus" style={{ marginTop: 8, fontSize: 12, color: "var(--bonus-text)", background: "var(--bonus-bg)", padding: "6px 10px", borderRadius: 6, display: "inline-block" }}>
                    {bonusDisplay}
                  </div>
                )}

                {card.best_for && (
                  <p className="results-card-best-for" style={{ margin: "8px 0 0", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.4 }}>
                    This card is best for: {card.best_for}
                  </p>
                )}

                {SHOW_PROSCONS_ON_RESULTS_TILES && (
                  <div className="results-card-pros-cons">
                    {card.pros && (
                      <div style={{ background: "var(--pros-bg)", padding: 10, borderRadius: 8, borderLeft: "4px solid var(--pros-text)" }}>
                        <div style={{ fontWeight: 600, fontSize: 11, color: "var(--pros-text)", marginBottom: 4 }}>Pros</div>
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--pros-list)", lineHeight: 1.5 }}>
                          {splitProsCons(card.pros).map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {card.cons && (
                      <div style={{ background: "var(--cons-bg)", padding: 10, borderRadius: 8, borderLeft: "4px solid var(--cons-text)" }}>
                        <div style={{ fontWeight: 600, fontSize: 11, color: "var(--cons-text)", marginBottom: 4 }}>Cons</div>
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--cons-list)", lineHeight: 1.5 }}>
                          {splitProsCons(card.cons).map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="results-card-tile-actions" style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--pill-bg)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    {card.application_link && (
                      <a
                        href={card.application_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="results-apply-btn tap-target"
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
                    )}
                  </div>
                  <label
                    className="tap-target"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 8,
                      background: compareCards.includes(card.card_name) ? theme.primaryLight : "var(--surface)",
                      border: `1px solid ${compareCards.includes(card.card_name) ? theme.primaryLighter : "var(--border)"}`,
                      fontSize: 12,
                      color: compareCards.includes(card.card_name) ? theme.primaryDark : "var(--text-muted)",
                      cursor: "pointer"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={compareCards.includes(card.card_name)}
                      onChange={() => {
                        if (compareCards.includes(card.card_name)) {
                          setCompareCards(prev => prev.filter(c => c !== card.card_name));
                        } else if (compareCards.length < 4) {
                          setCompareCards(prev => [...prev, card.card_name]);
                        }
                      }}
                    />
                    {compareCards.includes(card.card_name) ? "✓ In compare" : "Add to compare"}
                  </label>
                </div>

                {isSecondCard && (
                  <CardDetailOption2Expand
                    card={card}
                    theme={theme}
                    expanded={secondCardExpanded}
                    onToggle={() => setSecondCardExpanded(prev => !prev)}
                  />
                )}
              </div>
            </div>
            </div>
          );
        })}

        <CardDetailOption1Modal
          card={detailModalCard}
          theme={theme}
          onClose={() => setDetailModalCard(null)}
        />

        {ENABLE_CARD_ANIMATIONS && leavingCards.length > 0 && leavingCards.map(card => {
          const style = getIssuerStyle(card.issuer);
          const bonusDisplay = formatBonusDisplay(card);
          const rewardLabel = getRewardModelLabel(card.reward_model);
          const cashbackDisplay = getCashbackDisplay(card);
          const bankLogo = getBankLogoPath(card.issuer);
          const brandLogo = getBrandLogoPath(card);
          return (
            <div key={card.card_name} className="card-leave" style={{ marginBottom: 20 }}>
              <div
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
                {bankLogo ? (
                  <img src={bankLogo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : null}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>
                    {card.card_name}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {brandLogo && (
                      <img src={brandLogo} alt="" style={{ width: 40, height: 40, objectFit: "contain" }} />
                    )}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <label style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        <input
                          type="checkbox"
                          checked={ownedCards.includes(card.card_name)}
                          onChange={() =>
                            setOwnedCards(prev =>
                              prev.includes(card.card_name)
                                ? prev.filter(c => c !== card.card_name)
                                : [...prev, card.card_name]
                            )
                          }
                        />{" "}
                        Have it / Not interested
                      </label>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, alignItems: "center" }}>
                  <span style={{ background: style.bg, color: style.text, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                    {card.issuer}
                  </span>
                  {card.card_type === "business" && (
                    <span style={{ background: theme.businessBadge.bg, color: theme.businessBadge.text, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                      Business card
                    </span>
                  )}
                  {rewardLabel && (
                    <span style={{ background: "var(--pill-bg)", color: "var(--pill-text)", padding: "4px 8px", borderRadius: 6, fontSize: 11 }}>
                      {rewardLabel}
                    </span>
                  )}
                  {card.intro_apr_purchase && (
                    <span style={{ color: "var(--text-muted)", fontSize: 11 }}>APR {card.intro_apr_purchase}</span>
                  )}
                  {cashbackDisplay && (
                    <span style={{ color: "var(--text-muted)", fontSize: 11 }}>• Expected cashback {cashbackDisplay}</span>
                  )}
                </div>
                {bonusDisplay && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "var(--bonus-text)", background: "var(--bonus-bg)", padding: "6px 10px", borderRadius: 6, display: "inline-block" }}>
                    {bonusDisplay}
                  </div>
                )}
                {card.best_for && (
                  <p className="results-card-best-for" style={{ margin: "8px 0 0", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.4 }}>
                    This card is best for: {card.best_for}
                  </p>
                )}
                {SHOW_PROSCONS_ON_RESULTS_TILES && (
                  <div className="results-card-pros-cons">
                    {card.pros && (
                      <div style={{ background: "var(--pros-bg)", padding: 10, borderRadius: 8, borderLeft: "4px solid var(--pros-text)" }}>
                        <div style={{ fontWeight: 600, fontSize: 11, color: "var(--pros-text)", marginBottom: 4 }}>Pros</div>
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--pros-list)", lineHeight: 1.5 }}>
                          {splitProsCons(card.pros).map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {card.cons && (
                      <div style={{ background: "var(--cons-bg)", padding: 10, borderRadius: 8, borderLeft: "4px solid var(--cons-text)" }}>
                        <div style={{ fontWeight: 600, fontSize: 11, color: "var(--cons-text)", marginBottom: 4 }}>Cons</div>
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--cons-list)", lineHeight: 1.5 }}>
                          {splitProsCons(card.cons).map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--pill-bg)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    {card.application_link && (
                      <a
                        href={card.application_link}
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
                    )}
                  </div>
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 8,
                      background: compareCards.includes(card.card_name) ? theme.primaryLight : "var(--surface)",
                      border: `1px solid ${compareCards.includes(card.card_name) ? theme.primaryLighter : "var(--border)"}`,
                      fontSize: 12,
                      color: compareCards.includes(card.card_name) ? theme.primaryDark : "var(--text-muted)",
                      cursor: "pointer"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={compareCards.includes(card.card_name)}
                      onChange={() => {
                        if (compareCards.includes(card.card_name)) {
                          setCompareCards(prev => prev.filter(c => c !== card.card_name));
                        } else if (compareCards.length < 4) {
                          setCompareCards(prev => [...prev, card.card_name]);
                        }
                      }}
                    />
                    {compareCards.includes(card.card_name) ? "✓ In compare" : "Add to compare"}
                  </label>
                </div>
              </div>
              </div>
            </div>
          );
        })}


        {rankedCards.length > 3 && (
          <div style={{ marginBottom: 24 }}>
            {showMoreMain === 3 && rankedCards.length > 3 && (
              <button
                onClick={() => setShowMoreMain(6)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: `1px solid ${theme.primaryLighter}`,
                  background: theme.primaryLight,
                  color: theme.primaryDark,
                  fontWeight: 600,
                  marginRight: 12
                }}
              >
                Show 3 more recommendations
              </button>
            )}
            {showMoreMain === 6 && (
              <>
                {rankedCards.length > 6 && (
                  <button
                    onClick={() => setShowMoreMain(9)}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 8,
                      border: `1px solid ${theme.primaryLighter}`,
                      background: theme.primaryLight,
                      color: theme.primaryDark,
                      fontWeight: 600,
                      marginRight: 12
                    }}
                  >
                    Show 3 more recommendations
                  </button>
                )}
                <button
                  onClick={() => setShowMoreMain(3)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 8,
                    border: `1px solid ${theme.primaryLighter}`,
                    background: theme.primaryLight,
                    color: theme.primaryDark,
                    fontWeight: 600
                  }}
                >
                  Show fewer options
                </button>
              </>
            )}
            {showMoreMain === 9 && (
              <button
                onClick={() => setShowMoreMain(3)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: `1px solid ${theme.primaryLighter}`,
                  background: theme.primaryLight,
                  color: theme.primaryDark,
                  fontWeight: 600
                }}
              >
                Show fewer options
              </button>
            )}
          </div>
        )}



        <hr
          style={{
            border: "none",
            borderTop: "2px solid var(--border)",
            margin: "24px 0"
          }}
        />



        <button
          onClick={() => {
            if (showOtherType && ENABLE_CARD_ANIMATIONS && otherTypeCards.length > 0) {
              setOtherTypeLeavingCards([...otherTypeCards]);
            }
            setShowOtherType(prev => !prev);
          }}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: `1px solid ${theme.primaryLighter}`,
            background: theme.primaryLight,
            color: theme.primaryDark,
            fontWeight: 600
          }}
        >
          {showOtherType
            ? `Hide ${answers.card_mode === "personal" ? "business" : "personal"} cards`
            : `Show ${
                answers.card_mode === "personal" ? "business" : "personal"
              } cards too`}
        </button>


        {compareCards.length >= 2 && (
          <div style={{ marginTop: 24 }}>
            <button
              onClick={() => {
                const q = compareCards.map(c => encodeURIComponent(c)).join(",");
                router.push(`/comparison?cards=${q}`);
              }}
              style={{
                padding: "12px 28px",
                borderRadius: 8,
                border: "none",
                background: theme.primary,
                color: "#ffffff",
                fontWeight: 600,
                fontSize: 15,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}
            >
              Compare {compareCards.length} cards →
            </button>
          </div>
        )}


        {(showOtherType && otherTypeCards.length > 0) || (ENABLE_CARD_ANIMATIONS && otherTypeLeavingCards.length > 0) ? (
          <>
            <h3 style={{ marginTop: 28, marginBottom: 12 }}>
              Top{" "}
              {answers.card_mode === "personal" ? "Business" : "Personal"} Cards
            </h3>

            {otherTypeLeavingCards.length > 0 ? (
              otherTypeLeavingCards.map(card => {
                const style = getIssuerStyle(card.issuer);
                const bonusDisplay = formatBonusDisplay(card);
                const rewardLabel = getRewardModelLabel(card.reward_model);
                const cashbackDisplay = getCashbackDisplay(card);
                const bankLogo = getBankLogoPath(card.issuer);
                const brandLogo = getBrandLogoPath(card);
                return (
                  <div key={card.card_name} className="card-leave" style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", gap: 16, background: "var(--surface-elevated)", borderRadius: 14, padding: 16, marginBottom: 20, border: "2px solid var(--card-tile-border)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                      <div style={{ width: 72, minWidth: 72, height: 72, borderRadius: 10, background: bankLogo ? "transparent" : "linear-gradient(145deg, var(--pill-bg) 0%, var(--border) 100%)", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {bankLogo ? <img src={bankLogo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : null}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>{card.card_name}</h3>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            {brandLogo && <img src={brandLogo} alt="" style={{ width: 40, height: 40, objectFit: "contain" }} />}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, alignItems: "center" }}>
                          <span style={{ background: style.bg, color: style.text, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{card.issuer}</span>
                          {rewardLabel && <span style={{ background: "var(--pill-bg)", color: "var(--pill-text)", padding: "4px 8px", borderRadius: 6, fontSize: 11 }}>{rewardLabel}</span>}
                        </div>
                        {bonusDisplay && <div style={{ marginTop: 8, fontSize: 12, color: "var(--bonus-text)", background: "var(--bonus-bg)", padding: "6px 10px", borderRadius: 6, display: "inline-block" }}>{bonusDisplay}</div>}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
            otherTypeCards.map((card) => {
              const isEntering = ENABLE_CARD_ANIMATIONS && otherTypeEnteringCardNames.has(card.card_name);
              const style = getIssuerStyle(card.issuer);
              const bonusDisplay = formatBonusDisplay(card);
              const rewardLabel = getRewardModelLabel(card.reward_model);
              const cashbackDisplay = getCashbackDisplay(card);
              const bankLogo = getBankLogoPath(card.issuer);
              const brandLogo = getBrandLogoPath(card);

              return (
                <div
                  key={card.card_name}
                  className={isEntering ? "card-enter" : ""}
                  style={{
                    marginBottom: 20
                  }}
                >
                <div
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
                  <div style={{ width: 72, minWidth: 72, height: 72, borderRadius: 10, background: bankLogo ? "transparent" : "linear-gradient(145deg, var(--pill-bg) 0%, var(--border) 100%)", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {bankLogo ? <img src={bankLogo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>{card.card_name}</h3>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        {brandLogo && <img src={brandLogo} alt="" style={{ width: 40, height: 40, objectFit: "contain" }} />}
                        <label style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          <input type="checkbox" checked={ownedCards.includes(card.card_name)} onChange={() => setOwnedCards(prev => prev.includes(card.card_name) ? prev.filter(c => c !== card.card_name) : [...prev, card.card_name])} />{" "}
                          Have it / Not interested
                        </label>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, alignItems: "center" }}>
                      <span style={{ background: style.bg, color: style.text, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{card.issuer}</span>
                      {card.card_type === "business" && (
                        <span style={{ background: theme.businessBadge.bg, color: theme.businessBadge.text, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>Business card</span>
                      )}
                      {rewardLabel && <span style={{ background: "var(--pill-bg)", color: "var(--pill-text)", padding: "4px 8px", borderRadius: 6, fontSize: 11 }}>{rewardLabel}</span>}
                      {card.intro_apr_purchase && <span style={{ color: "var(--text-muted)", fontSize: 11 }}>APR {card.intro_apr_purchase}</span>}
                      {cashbackDisplay && <span style={{ color: "var(--text-muted)", fontSize: 11 }}>• Expected cashback {cashbackDisplay}</span>}
                    </div>
                    {bonusDisplay && <div style={{ marginTop: 8, fontSize: 12, color: "var(--bonus-text)", background: "var(--bonus-bg)", padding: "6px 10px", borderRadius: 6, display: "inline-block" }}>{bonusDisplay}</div>}
                    {card.best_for && <p className="results-card-best-for" style={{ margin: "8px 0 0", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.4 }}>This card is best for: {card.best_for}</p>}
                    {SHOW_PROSCONS_ON_RESULTS_TILES && (
                      <div className="results-card-pros-cons">
                        {card.pros && (
                          <div style={{ background: "var(--pros-bg)", padding: 10, borderRadius: 8, borderLeft: "4px solid var(--pros-text)" }}>
                            <div style={{ fontWeight: 600, fontSize: 11, color: "var(--pros-text)", marginBottom: 4 }}>Pros</div>
                            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--pros-list)", lineHeight: 1.5 }}>{splitProsCons(card.pros).map((p, i) => <li key={i}>{p}</li>)}</ul>
                          </div>
                        )}
                        {card.cons && (
                          <div style={{ background: "var(--cons-bg)", padding: 10, borderRadius: 8, borderLeft: "4px solid var(--cons-text)" }}>
                            <div style={{ fontWeight: 600, fontSize: 11, color: "var(--cons-text)", marginBottom: 4 }}>Cons</div>
                            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--cons-list)", lineHeight: 1.5 }}>{splitProsCons(card.cons).map((c, i) => <li key={i}>{c}</li>)}</ul>
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--pill-bg)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        {card.application_link && (
                          <a
                            href={card.application_link}
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
                        )}
                      </div>
                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          borderRadius: 8,
                          background: compareCards.includes(card.card_name) ? theme.primaryLight : "var(--surface)",
                          border: `1px solid ${compareCards.includes(card.card_name) ? theme.primaryLighter : "var(--border)"}`,
                          fontSize: 12,
                          color: compareCards.includes(card.card_name) ? theme.primaryDark : "var(--text-muted)",
                          cursor: "pointer"
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={compareCards.includes(card.card_name)}
                          onChange={() => {
                            if (compareCards.includes(card.card_name)) {
                              setCompareCards(prev => prev.filter(c => c !== card.card_name));
                            } else if (compareCards.length < 4) {
                              setCompareCards(prev => [...prev, card.card_name]);
                            }
                          }}
                        />
                        {compareCards.includes(card.card_name) ? "✓ In compare" : "Add to compare"}
                      </label>
                    </div>
                  </div>
                </div>
                </div>
              );
            })
            )}
          </>
        ) : null}



        {ownedCards.length > 0 && (
          <>
            <h3 style={{ marginTop: 32, marginBottom: 12 }}>
              Cards you already have
            </h3>



            {ownedCards.map(name => {
              const card = cards.find(c => c.card_name === name);
              if (!card) return null;
              const style = getIssuerStyle(card.issuer);
              const bonusDisplay = formatBonusDisplay(card);
              const rewardLabel = getRewardModelLabel(card.reward_model);
              const cashbackDisplay = getCashbackDisplay(card);
              const bankLogo = getBankLogoPath(card.issuer);
              const brandLogo = getBrandLogoPath(card);

              return (
                <div
                  key={name}
                  style={{
                    display: "flex",
                    gap: 16,
                    background: "var(--surface)",
                    borderRadius: 14,
                    padding: 16,
                    marginBottom: 16,
                    border: "2px solid var(--card-tile-border)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
                  }}
                >
                  <div style={{ width: 72, minWidth: 72, height: 72, borderRadius: 10, background: bankLogo ? "transparent" : "linear-gradient(145deg, var(--border) 0%, #cbd5e1 100%)", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {bankLogo ? <img src={bankLogo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>{card.card_name}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        {brandLogo && <img src={brandLogo} alt="" style={{ width: 40, height: 40, objectFit: "contain" }} />}
                        <label style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          <input type="checkbox" checked onChange={() => setOwnedCards(prev => prev.filter(c => c !== name))} />{" "}
                          Remove
                        </label>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, alignItems: "center" }}>
                      <span style={{ background: style.bg, color: style.text, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{card.issuer}</span>
                      {card.card_type === "business" && (
                        <span style={{ background: theme.businessBadge.bg, color: theme.businessBadge.text, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>Business card</span>
                      )}
                      {rewardLabel && <span style={{ background: "var(--border)", color: "var(--pill-text)", padding: "4px 8px", borderRadius: 6, fontSize: 11 }}>{rewardLabel}</span>}
                      {card.intro_apr_purchase && <span style={{ color: "var(--text-muted)", fontSize: 11 }}>APR {card.intro_apr_purchase}</span>}
{cashbackDisplay && <span style={{ color: "var(--text-muted)", fontSize: 11 }}>• Expected cashback {cashbackDisplay}</span>}
                      </div>
                    {bonusDisplay && <div style={{ marginTop: 8, fontSize: 12, color: "var(--bonus-text)", background: "var(--bonus-bg)", padding: "6px 10px", borderRadius: 6, display: "inline-block" }}>{bonusDisplay}</div>}
                    {card.best_for && <p className="results-card-best-for" style={{ margin: "8px 0 0", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.4 }}>This card is best for: {card.best_for}</p>}
                    {SHOW_PROSCONS_ON_RESULTS_TILES && (
                      <div className="results-card-pros-cons">
                        {card.pros && (
                          <div style={{ background: "var(--pros-bg)", padding: 10, borderRadius: 8, borderLeft: "4px solid var(--pros-text)" }}>
                            <div style={{ fontWeight: 600, fontSize: 11, color: "var(--pros-text)", marginBottom: 4 }}>Pros</div>
                            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--pros-list)", lineHeight: 1.5 }}>{splitProsCons(card.pros).map((p, i) => <li key={i}>{p}</li>)}</ul>
                          </div>
                        )}
                        {card.cons && (
                          <div style={{ background: "var(--cons-bg)", padding: 10, borderRadius: 8, borderLeft: "4px solid var(--cons-text)" }}>
                            <div style={{ fontWeight: 600, fontSize: 11, color: "var(--cons-text)", marginBottom: 4 }}>Cons</div>
                            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--cons-list)", lineHeight: 1.5 }}>{splitProsCons(card.cons).map((c, i) => <li key={i}>{c}</li>)}</ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
      <FeedbackButton />
      <FAQButton aboveFeedback />
    </div>
  );
}