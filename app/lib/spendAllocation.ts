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
 * Uses separate prev/curr layers so we only read from "before adding this item" — each item at most once.
 */
function knapsackMaxValue(
  items: { weight: number; value: number; index: number }[],
  capacity: number,
  maxItems: number
): { totalValue: number; chosenIndices: number[] } {
  const maxK = Math.min(maxItems, items.length);
  if (maxK <= 0 || capacity <= 0) return { totalValue: 0, chosenIndices: [] };

  function makeGrid(): number[][] {
    const grid: number[][] = [];
    for (let w = 0; w <= capacity; w++) grid[w] = Array(maxK + 1).fill(0);
    return grid;
  }
  function makeBackGrid(): number[][] {
    const grid: number[][] = [];
    for (let w = 0; w <= capacity; w++) grid[w] = Array(maxK + 1).fill(-1);
    return grid;
  }

  let dp = makeGrid();
  let backRef = makeBackGrid();

  for (let i = 0; i < items.length; i++) {
    const { weight, value, index: cardIndex } = items[i];
    const nextDp = makeGrid();
    const nextBack = makeBackGrid();
    for (let w = 0; w <= capacity; w++) {
      for (let k = 0; k <= maxK; k++) {
        nextDp[w][k] = dp[w][k];
        nextBack[w][k] = backRef[w][k];
        if (w >= weight && k >= 1) {
          const prevVal = dp[w - weight][k - 1];
          const candidate = prevVal + value;
          if (candidate > nextDp[w][k]) {
            nextDp[w][k] = candidate;
            nextBack[w][k] = cardIndex;
          }
        }
      }
    }
    dp = nextDp;
    backRef = nextBack;
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
  const used = new Set<number>();
  while (k > 0 && w > 0) {
    const cardIndex = backRef[w][k];
    if (cardIndex < 0) break;
    const item = items.find((it) => it.index === cardIndex);
    if (!item || used.has(cardIndex)) break;
    used.add(cardIndex);
    chosenIndices.push(cardIndex);
    w -= item.weight;
    k -= 1;
  }

  const capped = chosenIndices.slice(0, maxItems);
  const cappedValue = capped.reduce((sum, idx) => sum + (items.find((it) => it.index === idx)?.value ?? 0), 0);
  return { totalValue: cappedValue, chosenIndices: capped };
}

/**
 * Deduplicate cards by card_name so each card can be selected at most once.
 * Keeps the row with highest estimated_bonus_value_usd per name (then first occurrence).
 */
function dedupeCardsByName(cards: CardForAllocation[]): CardForAllocation[] {
  const byName = new Map<string, CardForAllocation>();
  for (const card of cards) {
    const name = (card.card_name || "").trim();
    if (!name) continue;
    const existing = byName.get(name);
    const bonus = parseBonus(card.estimated_bonus_value_usd);
    const existingBonus = existing ? parseBonus(existing.estimated_bonus_value_usd) : 0;
    if (!existing || bonus > existingBonus) byName.set(name, card);
  }
  return Array.from(byName.values());
}

/**
 * Compute optimal plan: which cards to apply for to maximize total bonus
 * given a spend budget and max number of cards.
 * Each card (by card_name) is considered at most once.
 */
export function computeOptimalPlan(
  cards: CardForAllocation[],
  budgetDollars: number,
  maxCards: number
): OptimalPlan {
  const capacity = Math.floor(Math.max(0, budgetDollars));
  const maxItems = Math.max(1, Math.min(maxCards, 20));

  const deduped = dedupeCardsByName(cards);
  const items = buildItems(deduped);
  const { totalValue, chosenIndices } = knapsackMaxValue(items, capacity, maxItems);

  const chosenCards: CardForAllocation[] = [];
  const allocation: AllocationItem[] = [];
  let totalSpendUsed = 0;
  const seenCardName = new Set<string>();

  chosenIndices.forEach((index) => {
    const card = deduped[index];
    const name = (card.card_name || "").trim();
    if (seenCardName.has(name)) return; // never show the same card twice
    seenCardName.add(name);
    const minSpend = parseMinSpend(card.minimum_spend_amount);
    const bonus = parseBonus(card.estimated_bonus_value_usd);
    chosenCards.push(card);
    allocation.push({ card, minSpend, bonus });
    totalSpendUsed += minSpend;
  });

  const actualBonus = allocation.reduce((sum, a) => sum + a.bonus, 0);

  return {
    chosenCards,
    totalBonus: actualBonus,
    allocation,
    totalSpendUsed
  };
}
