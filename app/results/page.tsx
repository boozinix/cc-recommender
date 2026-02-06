"use client";



// =========================================================
// Imports
// =========================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { getTheme, type CardMode } from "@/app/lib/theme";





// =========================================================
// Types
// =========================================================
type Card = {
  card_name: string;
  issuer: string;
  card_type: string;
  annual_fee: string;
  reward_model: string;
  card_family: string;
  cashback_rate_display?: string;
  cashback_rate_effective: string;
  estimated_bonus_value_usd: string;
  minimum_spend_amount?: string;
  spend_time_frame?: string;
  intro_apr_purchase: string;
  best_for: string;
  pros: string;
  cons: string;
  signup_bonus: string;
  signup_bonus_type: string;
  bank_rules?: string;
  application_link?: string;
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
  citi: { bg: "#2563eb", text: "#ffffff" },
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

// =========================================================
// Refinement Questions Config
// =========================================================
// Same schema as wizard: id, question, optional helper, options: { value, label }[]
const refinementQuestions = [
  {
    id: "travel_rewards_type",
    question: "What kind of travel rewards do you prefer?",
    dependsOn: (answers: Answers) => {
      const { primary } = getGoalRanks(answers);
      return primary === "Travel";
    },
    options: [
      { value: "General", label: "General" },
      { value: "Airline", label: "Airline" },
      { value: "Hotel", label: "Hotel" }
    ]
  },
  {
    id: "preferred_airline",
    question: "Which airline do you usually fly?",
    dependsOn: (answers: Answers) =>
      answers.travel_rewards_type === "Airline",
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
    dependsOn: (answers: Answers) =>
      answers.travel_rewards_type === "Hotel",
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
      return primary === "Travel";
    },
    options: [
      { value: "Premium", label: "Premium" },
      { value: "Mid-tier", label: "Mid-tier" },
      { value: "No preference", label: "No preference" }
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
      { value: "Yes, I plan to carry a balance", label: "Yes, I plan to carry a balance" },
      { value: "No, I pay in full", label: "No, I pay in full" },
      { value: "Doesn't matter", label: "Doesn't matter" }
    ]
  },
  {
    id: "exclude_travel_cards",
    question: "Exclude travel cards?",
    helper: "When bonus is your main goal, results often include travel cards. Choose to see only cashback and other non-travel cards.",
    dependsOn: (answers: Answers) => {
      const { primary } = getGoalRanks(answers);
      return primary === "Bonus";
    },
    options: [
      { value: "No", label: "No, include travel cards" },
      { value: "Yes", label: "Yes, exclude all travel cards" }
    ]
  },
  {
    id: "issuer_approval_rules",
    question: "Do any of these approval rules apply to you?",
    helper: "Select all that apply. We’ll exclude cards from issuers that may not approve you.",
    dependsOn: () => true,
    multiSelect: true,
    options: [
      { value: "5_in_24mo", label: "5+ cards in 24 months (exclude Chase)" },
      { value: "6_in_24mo", label: "6+ cards in 24 months (exclude Chase & Barclays)" },
      { value: "2_in_60_days", label: "2+ cards in 60 days (exclude Citi & Amex)" },
      { value: "2_in_90_days", label: "2+ cards in 90 days (exclude Amex)" }
    ]
  },
  {
    id: "boa_bank_account",
    question: "Do you have a Bank of America checking or savings account?",
    helper: "BoA approvals and Preferred Rewards benefits are stronger with an existing BoA relationship.",
    dependsOn: () => true,
    options: [
      { value: "No", label: "No" },
      { value: "Yes", label: "Yes" }
    ]
  },
  {
    id: "wells_fargo_account_1yr",
    question: "Have you had a Wells Fargo checking or savings account for 1 year or more?",
    helper: "Some Wells Fargo cards favor applicants with an existing WF banking relationship.",
    dependsOn: () => true,
    options: [
      { value: "No", label: "No" },
      { value: "Yes", label: "Yes" }
    ]
  }
];





// =========================================================
// Helper Functions
// =========================================================
function hasIntroAPR(card: Card) {
  return card.intro_apr_purchase?.trim().startsWith("0%");
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



function formatBonusDisplay(card: Card) {
  const value = parseInt(card.estimated_bonus_value_usd || "0", 10);
  if (!value) return null;

  const bonusType = card.signup_bonus_type?.toLowerCase() || "";
  let typeLabel = "";
  if (bonusType === "miles") typeLabel = "miles";
  else if (bonusType === "points") typeLabel = "points";
  else if (bonusType === "dollars") typeLabel = "dollars";
  else typeLabel = bonusType || "rewards";

  let text = `Worth $${value.toLocaleString()} estimated value in ${typeLabel}`;
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

/** Cashback rate for display: prefer display string (e.g. "5/3/1"), else effective as % */
function getCashbackDisplay(card: Card): string | null {
  const display = card.cashback_rate_display?.trim();
  if (display) return display;
  const effective = card.cashback_rate_effective?.trim();
  if (effective && parseFloat(effective) > 0) return `${effective}%`;
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
  // Wells Fargo: only show WF cards when user has had a WF account 1+ year (approval odds)
  if ((card.issuer || "").toLowerCase() === "wells fargo" && answers.wells_fargo_account_1yr !== "Yes") return -9999;

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
    answers.needs_0_apr === "Yes, I plan to carry a balance" &&
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
    // Key metric: effective cashback rate; secondary: bonus-to-min-spend ratio
    if (isCashbackCard) {
      score += 50; // Base for being cashback
      if (bonusRatio > 0) score += Math.min(bonusRatio * 15, 12); // Lower weight – efficient bonus (e.g. $200/$500=0.4 → +6)
    }
    score += cashbackRate * 25; // Effective rate is the key number
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

  // =========================================================
  // STEP 9: Bank relationship boosts (BoA / Wells Fargo)
  // =========================================================
  const issuerLower = (card.issuer || "").toLowerCase();
  if (answers.boa_bank_account === "Yes" && issuerLower === "bank of america") score += 15;
  if (answers.wells_fargo_account_1yr === "Yes" && issuerLower === "wells fargo") score += 15;

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

  // Enter/leave animation when refinement changes the result set (optional)
  const previousVisibleRef = useRef<Card[]>([]);
  const [leavingCards, setLeavingCards] = useState<Card[]>([]);
  const [enteringCardNames, setEnteringCardNames] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!ENABLE_CARD_ANIMATIONS) return;
    const visible = rankedCards.slice(0, showMoreMain);
    const prev = previousVisibleRef.current;
    const leaving = prev.filter(p => !rankedCards.some(r => r.card_name === p.card_name));
    const entering = visible.filter(c => !prev.some(p => p.card_name === c.card_name));
    setLeavingCards(leaving);
    setEnteringCardNames(prev.length > 0 ? new Set(entering.map(c => c.card_name)) : new Set());
    const tid = setTimeout(() => {
      setLeavingCards([]);
      setEnteringCardNames(new Set());
      previousVisibleRef.current = visible;
    }, 400);
    return () => clearTimeout(tid);
  }, [rankedCards, showMoreMain]);

  // ---------------------
  // Load Initial Data
  // ---------------------
  useEffect(() => {
    const storedAnswers = JSON.parse(localStorage.getItem("answers") || "{}");
    const cardMode = localStorage.getItem("card_mode");
    setAnswers({ ...storedAnswers, card_mode: cardMode || "" });


    fetch("/cards.csv")
      .then(res => res.text())
      .then(text => {
        const parsed = Papa.parse<Card>(text, {
          header: true,
          skipEmptyLines: true
        });
        setCards(parsed.data);
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

    // When user chose Airline or Hotel (even without a specific brand), restrict to that card type
    const travelType = answers.travel_rewards_type;
    let pool = scoredRaw;
    if (travelType === "Airline") {
      pool = scoredRaw.filter(x => (x.card.reward_model || "").toLowerCase() === "airline");
    } else if (travelType === "Hotel") {
      pool = scoredRaw.filter(x => (x.card.reward_model || "").toLowerCase() === "hotel");
    }

    let finalCards: Card[] = [];

    const wantsAirlineBrand =
      travelType === "Airline" &&
      answers.preferred_airline &&
      answers.preferred_airline !== "No strong preference";

    const wantsHotelBrand =
      travelType === "Hotel" &&
      answers.preferred_hotel &&
      answers.preferred_hotel !== "No strong preference";

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
    } else {
      const selected = dedupeByFamily(pool)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);
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
    if (travelType === "Airline") {
      pool = pool.filter(x => (x.card.reward_model || "").toLowerCase() === "airline");
    } else if (travelType === "Hotel") {
      pool = pool.filter(x => (x.card.reward_model || "").toLowerCase() === "hotel");
    }

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

    const deduped = dedupeByFamily(pool)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(x => x.card);

    return deduped;
  }, [cards, answers, ownedCards, wantsAirlineBrand, wantsHotelBrand]);





  // ---------------------
  // Issuer Warnings
  // ---------------------
  const issuerWarnings = useMemo(() => {
    const rules: string[] = Array.isArray(answers.issuer_approval_rules) ? answers.issuer_approval_rules : [];
    const w: string[] = [];
    if (rules.includes("5_in_24mo")) w.push("Chase cards may not be available (5+ cards in 24 months).");
    if (rules.includes("6_in_24mo")) w.push("Chase and Barclays cards may not be available (6+ cards in 24 months).");
    if (rules.includes("2_in_60_days")) w.push("Citi and Amex cards may not be available (2+ cards in 60 days).");
    if (rules.includes("2_in_90_days")) w.push("Amex cards may not be available (2+ cards in 90 days).");
    return w;
  }, [answers.issuer_approval_rules]);





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
      <div className="results-left" style={{ background: "#ffffff", borderRadius: 12, padding: 20 }}>

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
            background: "#f1f5f9",
            color: "#475569",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
            border: "1px solid #e2e8f0"
          }}
        >
          ← Start over
        </a>

        {/* Personal / Business – highest-level hierarchy; selection matches mode from wizard */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["personal", "business"] as const).map(mode => (
            <button
              key={mode}
              type="button"
              className="results-tap-target"
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
                background: (answers.card_mode || "personal") === mode ? theme.primary : "#ffffff",
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
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#334155",
              padding: "12px 14px",
              background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
              borderBottom: "1px solid #e2e8f0"
            }}
          >
            Your answers
          </div>
          <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ margin: "0 0 6px", fontSize: 11, color: "#94a3b8" }}>
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
                  <span style={{ color: "#475569" }}>{display}</span>
                  {isHovered && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: theme.primary, fontWeight: 600 }}>Edit</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {issuerWarnings.length > 0 && (
          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #fdba74",
              padding: 12,
              borderRadius: 8,
              marginBottom: 20
            }}
          >
            {issuerWarnings.map(w => (
              <div key={w} style={{ fontSize: 14 }}>
                {w}
              </div>
            ))}
          </div>
        )}

        {/* ========== REVERSIBLE: Refine box (same style as Your answers, card per question) ========== */}
        <div
          style={{
            marginBottom: 24,
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#334155",
              padding: "12px 14px",
              background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
              borderBottom: "1px solid #e2e8f0"
            }}
          >
            Refine your results
          </div>
          <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 14 }}>
            {visibleRefinements.map(q => (
              <div
                key={q.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "14px 16px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
                }}
              >
                <div style={{ fontWeight: 600, color: theme.primaryDark, fontSize: 14, marginBottom: 6 }}>
                  {q.question}
                </div>
                {"helper" in q && q.helper && (
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
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
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 12px",
                            borderRadius: 8,
                            border: `1px solid ${isChecked ? theme.primary : theme.primaryLighter}`,
                            background: isChecked ? theme.primaryLight : "#ffffff",
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
                          <span style={{ color: isChecked ? theme.primaryDark : "#475569" }}>{option.label}</span>
                        </label>
                      );
                    })
                  ) : (
                    q.options.map(option => (
                      <button
                        key={option.value}
                        onClick={() =>
                          setAnswers(prev => ({ ...prev, [q.id]: option.value }))
                        }
                        style={{
                          padding: "6px 14px",
                          borderRadius: 999,
                          border: `1px solid ${theme.primaryLighter}`,
                          background:
                            answers[q.id] === option.value ? theme.primary : "#ffffff",
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
            .card-enter { animation: cardEnter 0.35s ease-out forwards; }
            .card-leave { animation: cardLeave 0.35s ease-out forwards; }
          `}} />
        )}
        <h2 style={{ marginBottom: 20 }}>Best cards for you</h2>



        {rankedCards.slice(0, showMoreMain).map(card => {
          const style = getIssuerStyle(card.issuer);
          const bonusDisplay = formatBonusDisplay(card);
          const rewardLabel = getRewardModelLabel(card.reward_model);
          const cashbackDisplay = getCashbackDisplay(card);
          const bankLogo = getBankLogoPath(card.issuer);
          const brandLogo = getBrandLogoPath(card);
          const isEntering = ENABLE_CARD_ANIMATIONS && enteringCardNames.has(card.card_name);

          return (
            <div
              key={card.card_name}
              className={isEntering ? "card-enter" : ""}
              style={{ marginBottom: 20 }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  background: "#ffffff",
                  borderRadius: 14,
                  padding: 16,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                }}
              >
              <div
                style={{
                  width: 72,
                  minWidth: 72,
                  height: 72,
                  borderRadius: 10,
                  background: bankLogo ? "transparent" : "linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%)",
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
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>
                    {card.card_name}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {brandLogo && (
                      <img src={brandLogo} alt="" style={{ width: 40, height: 40, objectFit: "contain" }} />
                    )}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <label style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
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
                    <span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 8px", borderRadius: 6, fontSize: 11 }}>
                      {rewardLabel}
                    </span>
                  )}
                  {card.intro_apr_purchase && (
                    <span style={{ color: "#64748b", fontSize: 11 }}>APR {card.intro_apr_purchase}</span>
                  )}
                  {cashbackDisplay && (
                    <span style={{ color: "#64748b", fontSize: 11 }}>• Expected cashback {cashbackDisplay}</span>
                  )}
                </div>

                {bonusDisplay && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#0c4a6e", background: "#e0f2fe", padding: "6px 10px", borderRadius: 6, display: "inline-block" }}>
                    {bonusDisplay}
                  </div>
                )}

                {card.best_for && (
                  <p style={{ margin: "8px 0 0", fontSize: 13, color: "#64748b", lineHeight: 1.4 }}>
                    {card.best_for}
                  </p>
                )}

                <div className="results-card-pros-cons">
                  {card.pros && (
                    <div style={{ background: "#f0fdfa", padding: 10, borderRadius: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 11, color: "#0f766e", marginBottom: 4 }}>Pros</div>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#134e4a", lineHeight: 1.5 }}>
                        {card.pros.split(";").slice(0, 3).map((p, i) => (
                          <li key={i}>{p.trim()}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {card.cons && (
                    <div style={{ background: "#fef2f2", padding: 10, borderRadius: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 11, color: "#9f1239", marginBottom: 4 }}>Cons</div>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#881337", lineHeight: 1.5 }}>
                        {card.cons.split(";").slice(0, 3).map((c, i) => (
                          <li key={i}>{c.trim()}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
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
                      background: compareCards.includes(card.card_name) ? theme.primaryLight : "#f8fafc",
                      border: `1px solid ${compareCards.includes(card.card_name) ? theme.primaryLighter : "#e2e8f0"}`,
                      fontSize: 12,
                      color: compareCards.includes(card.card_name) ? theme.primaryDark : "#64748b",
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
                  background: "#ffffff",
                  borderRadius: 14,
                  padding: 16,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                }}
              >
              <div
                style={{
                  width: 72,
                  minWidth: 72,
                  height: 72,
                  borderRadius: 10,
                  background: bankLogo ? "transparent" : "linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%)",
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
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>
                    {card.card_name}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {brandLogo && (
                      <img src={brandLogo} alt="" style={{ width: 40, height: 40, objectFit: "contain" }} />
                    )}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <label style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
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
                    <span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 8px", borderRadius: 6, fontSize: 11 }}>
                      {rewardLabel}
                    </span>
                  )}
                  {card.intro_apr_purchase && (
                    <span style={{ color: "#64748b", fontSize: 11 }}>APR {card.intro_apr_purchase}</span>
                  )}
                  {cashbackDisplay && (
                    <span style={{ color: "#64748b", fontSize: 11 }}>• Expected cashback {cashbackDisplay}</span>
                  )}
                </div>
                {bonusDisplay && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#0c4a6e", background: "#e0f2fe", padding: "6px 10px", borderRadius: 6, display: "inline-block" }}>
                    {bonusDisplay}
                  </div>
                )}
                {card.best_for && (
                  <p style={{ margin: "8px 0 0", fontSize: 13, color: "#64748b", lineHeight: 1.4 }}>
                    {card.best_for}
                  </p>
                )}
                <div className="results-card-pros-cons">
                  {card.pros && (
                    <div style={{ background: "#f0fdfa", padding: 10, borderRadius: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 11, color: "#0f766e", marginBottom: 4 }}>Pros</div>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#134e4a", lineHeight: 1.5 }}>
                        {card.pros.split(";").slice(0, 3).map((p, i) => (
                          <li key={i}>{p.trim()}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {card.cons && (
                    <div style={{ background: "#fef2f2", padding: 10, borderRadius: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 11, color: "#9f1239", marginBottom: 4 }}>Cons</div>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#881337", lineHeight: 1.5 }}>
                        {card.cons.split(";").slice(0, 3).map((c, i) => (
                          <li key={i}>{c.trim()}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
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
                      background: compareCards.includes(card.card_name) ? theme.primaryLight : "#f8fafc",
                      border: `1px solid ${compareCards.includes(card.card_name) ? theme.primaryLighter : "#e2e8f0"}`,
                      fontSize: 12,
                      color: compareCards.includes(card.card_name) ? theme.primaryDark : "#64748b",
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
                  borderRadius: 999,
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
                      borderRadius: 999,
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
                    borderRadius: 999,
                    border: `1px solid ${theme.primaryLighter}`,
                    background: theme.primaryLight,
                    color: theme.primaryDark,
                    fontWeight: 600
                  }}
                >
                  Hide extra recommendations
                </button>
              </>
            )}
            {showMoreMain === 9 && (
              <button
                onClick={() => setShowMoreMain(3)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 999,
                  border: `1px solid ${theme.primaryLighter}`,
                  background: theme.primaryLight,
                  color: theme.primaryDark,
                  fontWeight: 600
                }}
              >
                Hide extra recommendations
              </button>
            )}
          </div>
        )}



        {compareCards.length >= 2 && compareCards.length <= 4 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginTop: 28,
              marginBottom: 28,
              padding: "16px 20px",
              background: `linear-gradient(135deg, ${theme.primaryLight} 0%, ${theme.primaryLighter}40 100%)`,
              borderRadius: 12,
              border: `1px solid ${theme.primaryLighter}`
            }}
          >
            <button
              onClick={() => {
                const q = compareCards.map(c => encodeURIComponent(c)).join(",");
                router.push(`/comparison?cards=${q}`);
              }}
              style={{
                padding: "12px 28px",
                borderRadius: 999,
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



        <hr
          style={{
            border: "none",
            borderTop: "1px solid #e2e8f0",
            margin: "24px 0"
          }}
        />



        <button
          onClick={() => setShowOtherType(prev => !prev)}
          style={{
            padding: "10px 18px",
            borderRadius: 999,
            border: `1px solid ${theme.primaryLighter}`,
            background: theme.primaryLight,
            color: theme.primaryDark,
            fontWeight: 600
          }}
        >
          {showOtherType
            ? "Hide other card type"
            : `Show ${
                answers.card_mode === "personal" ? "business" : "personal"
              } cards too`}
        </button>



        {showOtherType && otherTypeCards.length > 0 && (
          <>
            <h3 style={{ marginTop: 28, marginBottom: 12 }}>
              Top{" "}
              {answers.card_mode === "personal" ? "Business" : "Personal"} Cards
            </h3>



            {otherTypeCards.map(card => {
              const style = getIssuerStyle(card.issuer);
              const bonusDisplay = formatBonusDisplay(card);
              const rewardLabel = getRewardModelLabel(card.reward_model);
              const cashbackDisplay = getCashbackDisplay(card);
              const bankLogo = getBankLogoPath(card.issuer);
              const brandLogo = getBrandLogoPath(card);

              return (
                <div
                  key={card.card_name}
                  style={{
                    display: "flex",
                    gap: 16,
                    background: "#ffffff",
                    borderRadius: 14,
                    padding: 16,
                    marginBottom: 20,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                  }}
                >
                  <div style={{ width: 72, minWidth: 72, height: 72, borderRadius: 10, background: bankLogo ? "transparent" : "linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%)", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {bankLogo ? <img src={bankLogo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>{card.card_name}</h3>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        {brandLogo && <img src={brandLogo} alt="" style={{ width: 40, height: 40, objectFit: "contain" }} />}
                        <label style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
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
                      {rewardLabel && <span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 8px", borderRadius: 6, fontSize: 11 }}>{rewardLabel}</span>}
                      {card.intro_apr_purchase && <span style={{ color: "#64748b", fontSize: 11 }}>APR {card.intro_apr_purchase}</span>}
                      {cashbackDisplay && <span style={{ color: "#64748b", fontSize: 11 }}>• Expected cashback {cashbackDisplay}</span>}
                    </div>
                    {bonusDisplay && <div style={{ marginTop: 8, fontSize: 12, color: "#0c4a6e", background: "#e0f2fe", padding: "6px 10px", borderRadius: 6, display: "inline-block" }}>{bonusDisplay}</div>}
                    {card.best_for && <p style={{ margin: "8px 0 0", fontSize: 13, color: "#64748b", lineHeight: 1.4 }}>{card.best_for}</p>}
                    <div className="results-card-pros-cons">
                      {card.pros && (
                        <div style={{ background: "#f0fdfa", padding: 10, borderRadius: 8 }}>
                          <div style={{ fontWeight: 600, fontSize: 11, color: "#0f766e", marginBottom: 4 }}>Pros</div>
                          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#134e4a", lineHeight: 1.5 }}>{card.pros.split(";").slice(0, 3).map((p, i) => <li key={i}>{p.trim()}</li>)}</ul>
                        </div>
                      )}
                      {card.cons && (
                        <div style={{ background: "#fef2f2", padding: 10, borderRadius: 8 }}>
                          <div style={{ fontWeight: 600, fontSize: 11, color: "#9f1239", marginBottom: 4 }}>Cons</div>
                          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#881337", lineHeight: 1.5 }}>{card.cons.split(";").slice(0, 3).map((c, i) => <li key={i}>{c.trim()}</li>)}</ul>
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
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
                          background: compareCards.includes(card.card_name) ? theme.primaryLight : "#f8fafc",
                          border: `1px solid ${compareCards.includes(card.card_name) ? theme.primaryLighter : "#e2e8f0"}`,
                          fontSize: 12,
                          color: compareCards.includes(card.card_name) ? theme.primaryDark : "#64748b",
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
              );
            })}
          </>
        )}



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
                    background: "#f8fafc",
                    borderRadius: 14,
                    padding: 16,
                    marginBottom: 16,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
                  }}
                >
                  <div style={{ width: 72, minWidth: 72, height: 72, borderRadius: 10, background: bankLogo ? "transparent" : "linear-gradient(145deg, #e2e8f0 0%, #cbd5e1 100%)", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {bankLogo ? <img src={bankLogo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>{card.card_name}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        {brandLogo && <img src={brandLogo} alt="" style={{ width: 40, height: 40, objectFit: "contain" }} />}
                        <label style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
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
                      {rewardLabel && <span style={{ background: "#e2e8f0", color: "#475569", padding: "4px 8px", borderRadius: 6, fontSize: 11 }}>{rewardLabel}</span>}
                      {card.intro_apr_purchase && <span style={{ color: "#64748b", fontSize: 11 }}>APR {card.intro_apr_purchase}</span>}
{cashbackDisplay && <span style={{ color: "#64748b", fontSize: 11 }}>• Expected cashback {cashbackDisplay}</span>}
                      </div>
                    {bonusDisplay && <div style={{ marginTop: 8, fontSize: 12, color: "#0c4a6e", background: "#e0f2fe", padding: "6px 10px", borderRadius: 6, display: "inline-block" }}>{bonusDisplay}</div>}
                    {card.best_for && <p style={{ margin: "8px 0 0", fontSize: 13, color: "#64748b", lineHeight: 1.4 }}>{card.best_for}</p>}
                    <div className="results-card-pros-cons">
                      {card.pros && (
                        <div style={{ background: "#f0fdfa", padding: 10, borderRadius: 8 }}>
                          <div style={{ fontWeight: 600, fontSize: 11, color: "#0f766e", marginBottom: 4 }}>Pros</div>
                          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#134e4a", lineHeight: 1.5 }}>{card.pros.split(";").slice(0, 3).map((p, i) => <li key={i}>{p.trim()}</li>)}</ul>
                        </div>
                      )}
                      {card.cons && (
                        <div style={{ background: "#fef2f2", padding: 10, borderRadius: 8 }}>
                          <div style={{ fontWeight: 600, fontSize: 11, color: "#9f1239", marginBottom: 4 }}>Cons</div>
                          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#881337", lineHeight: 1.5 }}>{card.cons.split(";").slice(0, 3).map((c, i) => <li key={i}>{c.trim()}</li>)}</ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}