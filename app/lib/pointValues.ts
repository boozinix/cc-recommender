/**
 * Point and mile valuations (cents per point/mile).
 * Used to compute estimated bonus value in USD from signup_bonus + rewards_type.
 * Update these when you want to change how much each program is worth.
 *
 * Unit: cents per point (cpp). Example: 1.25 = 1.25¢ per point = $12.50 per 1,000 points.
 * Old default was 1.0 cpp (100 points = $1).
 */

export type PointValueKey =
  // Bank / transferable points
  | "Ultimate Rewards (UR)"
  | "Membership Rewards (MR)"
  | "Thank You Points (TYP)"
  | "Bank of America Points"
  | "U.S. Bank Points"
  | "Wells Fargo Rewards"
  | "Capital One Miles"
  // Airlines
  | "United Miles"
  | "Southwest Rapid Rewards"
  | "Delta SkyMiles"
  | "AAdvantage Miles"
  | "Alaska Miles"
  | "JetBlue TrueBlue"
  | "BreezePoints"
  | "Atmos Miles"
  | "Airline Miles"
  // Hotels
  | "Marriott Bonvoy Points"
  | "Hilton Honors Points"
  | "World of Hyatt Points"
  | "IHG One Rewards"
  | "Wyndham Rewards"
  | "Choice Privileges"
  // Cash (for consistency; not used for conversion)
  | "Cash";

/** Cents per point by program. Edit this table to update valuations. */
export const POINT_VALUES_CPP: Record<PointValueKey, number> = {
  "Ultimate Rewards (UR)": 1.25,
  "Membership Rewards (MR)": 1.25,
  "Thank You Points (TYP)": 1.0,
  "Bank of America Points": 0.6,
  "U.S. Bank Points": 1.0,
  "Wells Fargo Rewards": 1.0,
  "Capital One Miles": 1.0,

  "United Miles": 1.2,
  "Southwest Rapid Rewards": 1.3,
  "Delta SkyMiles": 1.0,
  "AAdvantage Miles": 1.0,
  "Alaska Miles": 1.1,
  "JetBlue TrueBlue": 1.3,
  "BreezePoints": 1.0,
  "Atmos Miles": 1.1,
  "Airline Miles": 1.1,

  "Marriott Bonvoy Points": 0.8,
  "Hilton Honors Points": 0.5,
  "World of Hyatt Points": 1.5,
  "IHG One Rewards": 0.6,
  "Wyndham Rewards": 0.6,
  "Choice Privileges": 0.6,

  Cash: 1.0,
};

const DEFAULT_CPP = 1.0;

/** Get cents per point for a rewards_type string (from CSV). Uses POINT_VALUES_CPP; falls back to DEFAULT_CPP. */
export function getCentsPerPoint(rewardsType: string | undefined): number {
  if (!rewardsType || !rewardsType.trim()) return DEFAULT_CPP;
  const key = rewardsType.trim() as PointValueKey;
  if (key in POINT_VALUES_CPP) return POINT_VALUES_CPP[key];
  return DEFAULT_CPP;
}

export type CardLike = {
  signup_bonus?: string;
  signup_bonus_type?: string;
  rewards_type?: string;
  estimated_bonus_value_usd?: string;
};

/**
 * Compute estimated bonus value in USD for a card.
 * - If signup_bonus_type is "dollars", uses CSV estimated_bonus_value_usd or signup_bonus.
 * - If points/miles, uses signup_bonus × (cents per point from POINT_VALUES_CPP) / 100.
 */
export function getEstimatedBonusValueUsd(card: CardLike): number {
  const bonusType = (card.signup_bonus_type || "").toLowerCase().trim();
  const rawBonus = (card.signup_bonus || "").replace(/[,]/g, "").trim();
  const bonusNum = parseInt(rawBonus, 10) || 0;

  if (bonusType === "dollars") {
    const fromCsv = (card.estimated_bonus_value_usd || "").replace(/[^0-9]/g, "");
    return parseInt(fromCsv, 10) || bonusNum;
  }

  const cpp = getCentsPerPoint(card.rewards_type);
  return Math.round((bonusNum * cpp) / 100);
}
