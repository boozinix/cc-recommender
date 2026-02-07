/**
 * Spend allocation: 0/1 knapsack to maximize signup bonuses given a spend budget
 * and optional max number of cards. Used by the pro-churner sandbox page.
 * Not used by wizard, main page, or results.
 */

export interface CardForAllocation {
  card_name: string;
  minimum_spend_amount?: string;
  estimated_bonus_value_usd?: string;
  [key: string]: unknown;
}

function parseMinSpend(raw: string | undefined): number {
  if (!raw || !raw.trim()) return 0;
  const cleaned = raw.replace(/[$,]/g, "").trim();
  const n = parseInt(cleaned, 10);
  return Number.isNaN(n) ? 0 : n;
}

function parseBonus(raw: string | undefined): number {
  if (!raw || !raw.trim()) return 0;
  const cleaned = raw.replace(/[$,]/g, "").trim();
  const n = parseInt(cleaned, 10);
  return Number.isNaN(n) ? 0 : n;
}

export interface AllocationItem {
  card: CardForAllocation;
  minSpend: number;
  bonus: number;
}

export interface OptimalPlan {
  chosenCards: CardForAllocation[];
  totalBonus: number;
  allocation: AllocationItem[];
  totalSpendUsed: number;
}

/**
 * Build list of items eligible for knapsack: has positive min spend and bonus.
 */
function buildItems(cards: CardForAllocation[]): { weight: number; value: number; index: number }[] {
  const items: { weight: number; value: number; index: number }[] = [];
  cards.forEach((card, index) => {
    const weight = parseMinSpend(card.minimum_spend_amount);
    const value = parseBonus(card.estimated_bonus_value_usd);
    if (weight > 0 && value > 0) items.push({ weight, value, index });
  });
  return items;
}

/**
 * 0/1 knapsack with capacity (budget) and max number of items (maxCards).
 * Returns the set of item indices that maximize total value.
 * DP: dp[w][k] = max value with capacity w and at most k items.
 * We iterate over items and update; backRef[w][k] = index of last item taken to achieve (w,k).
 */
function knapsackMaxValue(
  items: { weight: number; value: number; index: number }[],
  capacity: number,
  maxItems: number
): { totalValue: number; chosenIndices: number[] } {
  const maxK = Math.min(maxItems, items.length);
  if (maxK <= 0 || capacity <= 0) return { totalValue: 0, chosenIndices: [] };

  const dp: number[][] = [];
  const backRef: number[][] = [];
  for (let w = 0; w <= capacity; w++) {
    dp[w] = Array(maxK + 1).fill(0);
    backRef[w] = Array(maxK + 1).fill(-1);
  }

  for (let i = 0; i < items.length; i++) {
    const { weight, value } = items[i];
    for (let w = capacity; w >= weight; w--) {
      for (let k = maxK; k >= 1; k--) {
        const prev = dp[w - weight][k - 1];
        const candidate = prev + value;
        if (candidate > dp[w][k]) {
          dp[w][k] = candidate;
          backRef[w][k] = i;
        }
      }
    }
  }

  let bestValue = 0;
  let bestK = 0;
  for (let k = 1; k <= maxK; k++) {
    if (dp[capacity][k] > bestValue) {
      bestValue = dp[capacity][k];
      bestK = k;
    }
  }

  const chosenIndices: number[] = [];
  let w = capacity;
  let k = bestK;
  while (k > 0 && w > 0) {
    const i = backRef[w][k];
    if (i < 0) break;
    const item = items[i];
    if (!item) break;
    chosenIndices.push(item.index);
    w -= item.weight;
    k -= 1;
  }

  return { totalValue: bestValue, chosenIndices };
}

/**
 * Compute optimal plan: which cards to apply for to maximize total bonus
 * given a spend budget and max number of cards.
 */
export function computeOptimalPlan(
  cards: CardForAllocation[],
  budgetDollars: number,
  maxCards: number
): OptimalPlan {
  const capacity = Math.floor(Math.max(0, budgetDollars));
  const maxItems = Math.max(1, Math.min(maxCards, 20));

  const items = buildItems(cards);
  const { totalValue, chosenIndices } = knapsackMaxValue(items, capacity, maxItems);

  const chosenCards: CardForAllocation[] = [];
  const allocation: AllocationItem[] = [];
  let totalSpendUsed = 0;

  chosenIndices.forEach((index) => {
    const card = cards[index];
    const minSpend = parseMinSpend(card.minimum_spend_amount);
    const bonus = parseBonus(card.estimated_bonus_value_usd);
    chosenCards.push(card);
    allocation.push({ card, minSpend, bonus });
    totalSpendUsed += minSpend;
  });

  return {
    chosenCards,
    totalBonus: totalValue,
    allocation,
    totalSpendUsed
  };
}
