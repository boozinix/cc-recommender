/**
 * Results-page scoring engine: rank cards by user answers.
 * Used by /results and /sandbox/sandbox-results so logic lives in one place.
 */

import type { Card } from "./cardTypes";
import { parseMinSpend } from "./cardDisplay";

export type Answers = { [key: string]: unknown };

export function getGoalRanks(answers: Answers): { primary?: string; secondary?: string; tertiary?: string } {
  if (Array.isArray(answers.primary_goal_ranked)) {
    const [first, second, third] = answers.primary_goal_ranked;
    return { primary: first, secondary: second, tertiary: third };
  }
  return { primary: answers.primary_goal as string, secondary: undefined, tertiary: undefined };
}

function hasIntroAPR(card: Card): boolean {
  return (card.intro_apr_purchase || "").trim().startsWith("0%");
}

export function issuerExcluded(issuer: string, answers: Answers): boolean {
  const rules: string[] = Array.isArray(answers.issuer_approval_rules) ? (answers.issuer_approval_rules as string[]) : [];
  const i = issuer.toLowerCase();
  if (rules.includes("5_in_24mo") && i === "chase") return true;
  if (rules.includes("6_in_24mo") && (i === "chase" || i === "barclays")) return true;
  if (rules.includes("2_in_60_days") && (i === "citi" || i === "amex")) return true;
  if (rules.includes("2_in_90_days") && i === "amex") return true;
  return false;
}

export function cardMatchesAirline(card: Card, airline: string): boolean {
  if (!airline || airline === "No strong preference") return false;
  const key = airline.trim().toLowerCase();
  const family = (card.card_family || "").trim().toLowerCase();
  const name = (card.card_name || "").toLowerCase();
  return family.includes(key) || name.includes(key);
}

export function cardMatchesHotel(card: Card, hotel: string): boolean {
  if (!hotel || hotel === "No strong preference") return false;
  const key = hotel.trim().toLowerCase();
  const family = (card.card_family || "").trim().toLowerCase();
  const name = (card.card_name || "").toLowerCase();
  if (family.includes(key) || name.includes(key)) return true;
  if (key === "expedia" && (name.includes("one key") || name.includes("hotels.com") || name.includes("vrbo") || name.includes("expedia"))) return true;
  return false;
}

export function cardMatchesBrandKey(card: Card, brandKey: string): boolean {
  const family = (card.card_family || "").trim().toLowerCase();
  const name = (card.card_name || "").toLowerCase();
  if (family.includes(brandKey) || name.includes(brandKey)) return true;
  if (brandKey === "expedia" && (name.includes("one key") || name.includes("hotels.com") || name.includes("vrbo"))) return true;
  return false;
}

export function cardMatchesBank(card: Card, bank: string): boolean {
  if (!bank || bank === "No preference") return false;
  const issuer = (card.issuer || "").trim().toLowerCase();
  const key = bank.trim().toLowerCase();
  if (issuer === key) return true;
  if (key === "amex" && (issuer === "amex" || issuer === "american express")) return true;
  if (key === "american express" && (issuer === "amex" || issuer === "american express")) return true;
  return false;
}

export function isPremiumTierCard(card: Card): boolean {
  const name = (card.card_name || "").toLowerCase();
  const fee = parseInt(card.annual_fee || "0", 10);
  const premiumNames = [
    "reserve", "venture x", "platinum", "infinite", "aspire", "brilliant",
    "performance", "premier", "club infinite", "club business",
    "world mastercard", "privileges select", "one key+", "earner plus",
    "executive", "signature"
  ];
  if (premiumNames.some((p) => name.includes(p))) return true;
  if (fee >= 395) return true;
  return false;
}

export function isGenericTravelCard(card: Card): boolean {
  return (card.reward_model || "").toLowerCase() === "travel";
}

export function isVeryPremiumTravelCard(card: Card): boolean {
  const name = (card.card_name || "").toLowerCase();
  const issuer = (card.issuer || "").toLowerCase();
  if (name.includes("sapphire reserve")) return true;
  if (name.includes("venture x")) return true;
  if (issuer === "amex" && name.includes("platinum") && !name.includes("delta")) return true;
  return false;
}

export function isMidTierTravelCard(card: Card): boolean {
  const name = (card.card_name || "").toLowerCase();
  const issuer = (card.issuer || "").toLowerCase();
  if (name.includes("sapphire preferred")) return true;
  if (name.includes("venture") && !name.includes("venture x")) return true;
  if (issuer === "amex" && name.includes("gold") && !name.includes("delta")) return true;
  return false;
}

export function dedupeByFamily(items: { card: Card; score: number }[]): { card: Card; score: number }[] {
  const bestByFamily = new Map<string, { card: Card; score: number }>();
  for (const entry of items) {
    const familyKey =
      entry.card.card_family && entry.card.card_family.trim().length > 0
        ? entry.card.card_family.trim()
        : entry.card.card_name;
    const existing = bestByFamily.get(familyKey);
    if (!existing || entry.score > existing.score) bestByFamily.set(familyKey, entry);
  }
  return Array.from(bestByFamily.values());
}

export function selectTopBrandOnly(
  items: { card: Card; score: number }[],
  brand: string,
  topBrandCount: number
): { card: Card; score: number }[] {
  const brandKey = brand.trim().toLowerCase();
  const brandCards = items.filter((x) => (x.card.card_family || "").toLowerCase().includes(brandKey));
  return brandCards.sort((a, b) => b.score - a.score).slice(0, topBrandCount);
}

export function getBonusToMinSpendRatio(bonusValue: number, minSpend: number): number {
  if (minSpend <= 0 || bonusValue <= 0) return 0;
  return bonusValue / minSpend;
}

/**
 * Score a single card against user answers and owned list. Higher = better match.
 * Returns -9999 for hard exclusions.
 */
export function scoreCard(card: Card, answers: Answers, ownedCards: string[]): number {
  if (ownedCards.includes(card.card_name)) return -9999;
  if (issuerExcluded(card.issuer, answers)) return -9999;
  const rewardModel = (card.reward_model || "").toLowerCase();
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

  if (answers.needs_0_apr === "Yes" && primary !== "Travel") {
    if (!hasIntroAPR(card)) return -9999;
    score += cashbackRate * 10;
    score -= cardFee / 10;
    return score;
  }

  const feeTolerance = answers.annual_fee_tolerance as string | undefined;
  if (feeTolerance === "None" && cardFee > 0) score -= 50;
  else if (feeTolerance === "Low" && cardFee > 100) score -= 30;
  else if (feeTolerance === "Medium" && cardFee > 400) score -= 30;

  const isPremium = isPremiumTierCard(card);
  if (feeTolerance === "High" || feeTolerance === "Medium") {
    if (isPremium) score += 20;
  } else if (feeTolerance === "None" || feeTolerance === "Low") {
    if (isPremium) score -= 15;
  }

  if (primary === "Travel") {
    if (isTravelCard) {
      score += 80;
      if (answers.travel_frequency === "High") score += 15;
      else if (answers.travel_frequency === "Medium") score += 8;
      else if (answers.travel_frequency === "Low") score -= 10;
    } else score -= 40;
  } else if (primary === "Cashback") {
    if (isCashbackCard) {
      score += 50;
      const ratioFromCsv = parseFloat((card.bonus_to_spend_ratio as string) || "");
      const bonusToSpendRatio = !Number.isNaN(ratioFromCsv) && ratioFromCsv >= 0 ? ratioFromCsv : bonusRatio;
      score += 0.6 * Math.min(cashbackRate * 20, 100) + 0.4 * Math.min(bonusToSpendRatio * 100, 100);
    } else score += cashbackRate * 25;
  } else if (primary === "Everyday") {
    score += cashbackRate * 15;
    if (hasIntroAPR(card)) score += 35;
  } else if (primary === "Bonus") {
    if (answers.spend_comfort !== "None") {
      score += Math.min(bonusValue / 25, 80);
      if (bonusRatio > 0) score += Math.min(bonusRatio * 25, 15);
    } else score -= 20;
  }

  if (secondary === "Travel") {
    if (isTravelCard) {
      score += 30;
      if (answers.travel_frequency === "High") score += 8;
      else if (answers.travel_frequency === "Low") score -= 5;
    } else score -= 15;
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

  if (tertiary === "Travel") {
    if (isTravelCard) {
      score += 12;
      if (answers.travel_frequency === "High") score += 3;
    } else score -= 5;
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

  const caresAboutTravel = primary === "Travel" || secondary === "Travel" || tertiary === "Travel";
  const wantsGenericTravel = answers.travel_rewards_type === "General" || !answers.travel_rewards_type;

  if (caresAboutTravel) {
    if (wantsGenericTravel && isGenericTravelCard(card)) score += 30;
    const preferredBank = answers.preferred_bank as string | undefined;
    if (wantsGenericTravel && preferredBank && preferredBank !== "No preference") {
      const cardIssuer = (card.issuer || "").trim().toLowerCase();
      const bankKey = preferredBank.trim().toLowerCase();
      if (cardIssuer === bankKey || (bankKey === "amex" && cardIssuer === "american express")) score += 40;
    }
    const tierPref = answers.travel_tier_preference as string | undefined;
    if (tierPref === "Premium") {
      if (isVeryPremiumTravelCard(card)) score += 35;
      else if (isTravelCard && cardFee >= 350) score += 25;
    } else if (tierPref === "Mid-tier") {
      if (isMidTierTravelCard(card)) score += 35;
      else if (isTravelCard && cardFee >= 300) score -= 35;
    }
    if (cardMatchesAirline(card, (answers.preferred_airline as string) || "")) score += 40;
    if (cardMatchesHotel(card, (answers.preferred_hotel as string) || "")) score += 40;
    const travelPerks: string[] = Array.isArray(answers.travel_perks) ? (answers.travel_perks as string[]) : [];
    if (travelPerks.includes("tsa_ge") && (card.ge_tsa_precheck || "").trim().length > 0) score += 25;
    if (travelPerks.includes("lounge") && (card.lounge || "").trim().length > 0) score += 25;
  }

  if (answers.spend_comfort !== "None") {
    score += Math.min(bonusValue / 100, 20);
    if (bonusRatio > 0) score += Math.min(bonusRatio * 8, 6);
  } else {
    if (bonusValue > 500) score -= 5;
  }

  if (cardFee > 0 && cardFee > 400 && score < 50) score -= 10;

  return score;
}
