"use client";



// =========================================================
// Imports
// =========================================================
import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";





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
  barclays: { bg: "#e0f2fe", text: "#075985" }
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
  "U.S. Bank": "us-bank.svg"
};

function getBankLogoPath(issuer: string): string | null {
  const file = bankLogoFiles[issuer];
  return file ? `/logos/banks/${file}` : null;
}

// Brand logos (airline/hotel): public/logos/brands/ — only for branded cards
const brandLogoFiles: Record<string, string> = {
  "alaska": "alaska.svg",
  "american": "american.png",
  "delta": "delta.svg",
  "frontier": "frontier.svg",
  "hilton": "hilton.svg",
  "hyatt": "hyatt.png",
  "ihg": "ihg.svg",
  "jetblue": "jetblue.svg",
  "marriott": "marriott.svg",
  "southwest": "southwest.svg",
  "united": "united.svg"
};

function getBrandLogoPath(card: Card): string | null {
  const isBranded = card.reward_model === "airline" || card.reward_model === "hotel";
  if (!isBranded) return null;
  const family = (card.card_family || "").trim().toLowerCase();
  if (family && brandLogoFiles[family]) return `/logos/brands/${brandLogoFiles[family]}`;
  // Fallback: detect from card name (e.g. Frontier, Hyatt when card_family is empty)
  const name = card.card_name.toLowerCase();
  if (name.includes("frontier")) return "/logos/brands/frontier.svg";
  if (name.includes("hyatt")) return "/logos/brands/hyatt.png";
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
// Refinement Questions Config
// =========================================================
// Same schema as wizard: id, question, optional helper, options: { value, label }[]
const refinementQuestions = [
  {
    id: "cards_24mo",
    question: "How many credit cards have you opened in the last 24 months?",
    dependsOn: () => true,
    options: [
      { value: "0–4", label: "0–4" },
      { value: "5", label: "5" },
      { value: "6", label: "6" },
      { value: "7+", label: "7+" }
    ]
  },
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
  }
];





// =========================================================
// Helper Functions
// =========================================================
function hasIntroAPR(card: Card) {
  return card.intro_apr_purchase?.trim().startsWith("0%");
}



function issuerExcluded(issuer: string, cards24mo: string) {
  const i = issuer.toLowerCase();
  if (cards24mo === "5") return i === "chase";
  if (cards24mo === "6") return i === "chase" || i === "citi";
  if (cards24mo === "7+") return i === "chase" || i === "citi" || i === "amex";
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

/** Match hotel by card_family or card_name */
function cardMatchesHotel(card: Card, hotel: string): boolean {
  if (!hotel || hotel === "No strong preference") return false;
  const key = hotel.trim().toLowerCase();
  const family = (card.card_family || "").trim().toLowerCase();
  const name = (card.card_name || "").toLowerCase();
  return family.includes(key) || name.includes(key);
}

/** True if card is premium tier within its family (e.g. Reserve vs Preferred, Venture X vs Venture, Amex Platinum vs Gold). */
function isPremiumTierCard(card: Card): boolean {
  const name = (card.card_name || "").toLowerCase();
  const fee = parseInt(card.annual_fee || "0", 10);
  const premiumNames = [
    "reserve", "venture x", "platinum", "infinite", "aspire", "brilliant",
    "performance", "premier", "club infinite", "club business"
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
  if (issuerExcluded(card.issuer, answers.cards_24mo)) return -9999;

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

  return score;
}





// =========================================================
// Main Results Page
// =========================================================
export default function ResultsPage() {



  const [cards, setCards] = useState<Card[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [ownedCards, setOwnedCards] = useState<string[]>([]);
  const [rankedCards, setRankedCards] = useState<Card[]>([]);
  const [showOtherType, setShowOtherType] = useState(false);
  const [showMoreMain, setShowMoreMain] = useState<3 | 6 | 9>(3);
  const [hoveredAnswerIndex, setHoveredAnswerIndex] = useState<number | null>(null);





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

    let finalCards: Card[] = [];

    const wantsAirlineBrand =
      answers.travel_rewards_type === "Airline" &&
      answers.preferred_airline &&
      answers.preferred_airline !== "No strong preference";

    const wantsHotelBrand =
      answers.travel_rewards_type === "Hotel" &&
      answers.preferred_hotel &&
      answers.preferred_hotel !== "No strong preference";

    if (wantsAirlineBrand || wantsHotelBrand) {
      const brand = wantsAirlineBrand
        ? answers.preferred_airline
        : answers.preferred_hotel;
      const brandKey = brand.trim().toLowerCase();

      // Get top 2 branded cards
      const brandCards = scoredRaw
        .filter(x => (x.card.card_family || "").toLowerCase().includes(brandKey))
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);

      // Get remaining general cards (excluding branded ones)
      const nonBrandCards = scoredRaw.filter(x =>
        !(x.card.card_family || "").toLowerCase().includes(brandKey)
      );
      const generalCards = dedupeByFamily(nonBrandCards)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4); // Get 4 more general cards for positions 3-6

      // Combine: 2 branded + 4 general = 6 total
      finalCards = [
        ...brandCards.map(x => x.card),
        ...generalCards.map(x => x.card)
      ];
    } else {
      // No brand preference - use regular deduplication and scoring
      const selected = dedupeByFamily(scoredRaw)
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

    const scoredRaw = [...cards]
      .filter(c => c.card_type === otherType)
      .map(card => ({
        card,
        score: scoreCard(card, answers, ownedCards)
      }))
      .filter(x => x.score > -9999);

    if (wantsAirlineBrand || wantsHotelBrand) {
      const brand = wantsAirlineBrand
        ? answers.preferred_airline
        : answers.preferred_hotel;
      const brandKey = brand.trim().toLowerCase();

      const brandCards = scoredRaw
        .filter(x => (x.card.card_family || "").toLowerCase().includes(brandKey))
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);

      const nonBrandCards = scoredRaw.filter(x =>
        !(x.card.card_family || "").toLowerCase().includes(brandKey)
      );
      const generalCards = dedupeByFamily(nonBrandCards)
        .sort((a, b) => b.score - a.score)
        .slice(0, 1);

      return [
        ...brandCards.map(x => x.card),
        ...generalCards.map(x => x.card)
      ].slice(0, 3);
    }

    const deduped = dedupeByFamily(scoredRaw)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(x => x.card);

    return deduped;
  }, [cards, answers, ownedCards, wantsAirlineBrand, wantsHotelBrand]);





  // ---------------------
  // Issuer Warnings
  // ---------------------
  const issuerWarnings = useMemo(() => {
    if (!answers.cards_24mo) return [];
    if (answers.cards_24mo === "5")
      return ["Chase cards may not be available due to Chase 5/24 rules."];
    if (answers.cards_24mo === "6")
      return ["Chase and Citi cards may not be available due to issuer approval rules."];
    if (answers.cards_24mo === "7+")
      return ["Chase, Citi, and Amex cards may not be available due to issuer approval rules."];
    return [];
  }, [answers.cards_24mo]);





  // ---------------------
  // Refinement Visibility
  // ---------------------
  const hasAnsweredCards24mo = Boolean(answers.cards_24mo);
  const visibleRefinements = refinementQuestions.filter(q => {
    if (q.id === "cards_24mo") return true;
    if (!hasAnsweredCards24mo) return false;
    return q.dependsOn ? q.dependsOn(answers) : true;
  });





  // =========================================================
  // UI
  // =========================================================
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "360px 1fr",
        gap: 40,
        padding: 40,
        background: "#f8fafc"
      }}
    >



      {/* LEFT PANEL */}
      <div style={{ background: "#ffffff", borderRadius: 12, padding: 20 }}>

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
                    background: isHovered ? "#c7d2fe" : "#eef2ff",
                    borderRadius: 8,
                    border: "1px solid #c7d2fe",
                    borderLeft: "3px solid #2563eb",
                    boxShadow: isHovered ? "0 2px 6px rgba(37,99,235,0.15)" : "0 1px 2px rgba(0,0,0,0.04)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    transform: isHovered ? "translateY(-2px)" : "translateY(0)"
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      fontWeight: 700,
                      color: "#1e3a8a",
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
                    <span style={{ marginLeft: 8, fontSize: 11, color: "#2563eb", fontWeight: 600 }}>Edit</span>
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
                <div style={{ fontWeight: 600, color: "#1e3a8a", fontSize: 14, marginBottom: 6 }}>
                  {q.question}
                </div>
                {"helper" in q && q.helper && (
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
                    {q.helper}
                  </div>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {q.options.map(option => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setAnswers(prev => ({ ...prev, [q.id]: option.value }))
                      }
                      style={{
                        padding: "6px 14px",
                        borderRadius: 999,
                        border: "1px solid #c7d2fe",
                        background:
                          answers[q.id] === option.value ? "#2563eb" : "#ffffff",
                        color:
                          answers[q.id] === option.value ? "#ffffff" : "#1e3a8a",
                        fontSize: 13
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>





      {/* RIGHT PANEL */}
      <div>
        {/* Optional debug line (you can delete later) */}
        <div
          style={{
            fontSize: 11,
            color: "#6b7280",
            marginBottom: 8,
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
          }}
        >
          debug – mode={answers.card_mode || "-"}; cards_24mo={answers.cards_24mo || "-"};
          travel_type={answers.travel_rewards_type || "-"};
          airline={answers.preferred_airline || "-"};
          hotel={answers.preferred_hotel || "-"}
        </div>


        <h2 style={{ marginBottom: 20 }}>Best cards for you</h2>



        {rankedCards.slice(0, showMoreMain).map(card => {
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

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, alignItems: "center" }}>
                  <span style={{ background: style.bg, color: style.text, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                    {card.issuer}
                  </span>
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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
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
                  border: "1px solid #c7d2fe",
                  background: "#eef2ff",
                  color: "#1e3a8a",
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
                      border: "1px solid #c7d2fe",
                      background: "#eef2ff",
                      color: "#1e3a8a",
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
                    border: "1px solid #c7d2fe",
                    background: "#eef2ff",
                    color: "#1e3a8a",
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
                  border: "1px solid #c7d2fe",
                  background: "#eef2ff",
                  color: "#1e3a8a",
                  fontWeight: 600
                }}
              >
                Hide extra recommendations
              </button>
            )}
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
            border: "1px solid #c7d2fe",
            background: "#eef2ff",
            color: "#1e3a8a",
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
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        {brandLogo && <img src={brandLogo} alt="" style={{ width: 40, height: 40, objectFit: "contain" }} />}
                        <label style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                          <input type="checkbox" checked={ownedCards.includes(card.card_name)} onChange={() => setOwnedCards(prev => prev.includes(card.card_name) ? prev.filter(c => c !== card.card_name) : [...prev, card.card_name])} />{" "}
                          Have it / Not interested
                        </label>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, alignItems: "center" }}>
                      <span style={{ background: style.bg, color: style.text, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{card.issuer}</span>
                      {rewardLabel && <span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 8px", borderRadius: 6, fontSize: 11 }}>{rewardLabel}</span>}
                      {card.intro_apr_purchase && <span style={{ color: "#64748b", fontSize: 11 }}>APR {card.intro_apr_purchase}</span>}
                      {cashbackDisplay && <span style={{ color: "#64748b", fontSize: 11 }}>• Expected cashback {cashbackDisplay}</span>}
                    </div>
                    {bonusDisplay && <div style={{ marginTop: 8, fontSize: 12, color: "#0c4a6e", background: "#e0f2fe", padding: "6px 10px", borderRadius: 6, display: "inline-block" }}>{bonusDisplay}</div>}
                    {card.best_for && <p style={{ margin: "8px 0 0", fontSize: 13, color: "#64748b", lineHeight: 1.4 }}>{card.best_for}</p>}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
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
                      {rewardLabel && <span style={{ background: "#e2e8f0", color: "#475569", padding: "4px 8px", borderRadius: 6, fontSize: 11 }}>{rewardLabel}</span>}
                      {card.intro_apr_purchase && <span style={{ color: "#64748b", fontSize: 11 }}>APR {card.intro_apr_purchase}</span>}
{cashbackDisplay && <span style={{ color: "#64748b", fontSize: 11 }}>• Expected cashback {cashbackDisplay}</span>}
                      </div>
                    {bonusDisplay && <div style={{ marginTop: 8, fontSize: 12, color: "#0c4a6e", background: "#e0f2fe", padding: "6px 10px", borderRadius: 6, display: "inline-block" }}>{bonusDisplay}</div>}
                    {card.best_for && <p style={{ margin: "8px 0 0", fontSize: 13, color: "#64748b", lineHeight: 1.4 }}>{card.best_for}</p>}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
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