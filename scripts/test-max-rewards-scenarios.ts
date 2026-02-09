/**
 * Test script: Maximize Spend Mode allocation invariant.
 *
 * For each budget from $5k to $95k (step $5k), and for maxCards in [2, 4, 6, 8, 10],
 * we run computeOptimalPlan and assert: as maxCards increases, total bonus must be
 * non-decreasing (same or higher). More cards should never yield a lower total bonus.
 *
 * Run from project root: npx tsx scripts/test-max-rewards-scenarios.ts (Maximize Spend Mode)
 */

import * as fs from "fs";
import * as path from "path";
import Papa from "papaparse";
import { computeOptimalPlan, type CardForAllocation } from "../app/lib/spendAllocation";

const ALL_BUDGETS = [5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000, 60000, 65000, 70000, 75000, 80000, 85000, 90000, 95000];
const BUDGETS = process.env.FAST
  ? [5000, 20000]
  : process.env.QUICK
    ? ALL_BUDGETS.filter((_, i) => i % 3 === 0)
    : ALL_BUDGETS;
const CARD_COUNTS = process.env.FAST ? [2, 4] : [2, 4, 6, 8, 10];

function loadCards(): CardForAllocation[] {
  const csvPath = path.join(process.cwd(), "public", "cards.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");
  const parsed = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true });
  return parsed.data.map((row) => ({
    card_name: row.card_name ?? "",
    minimum_spend_amount: row.minimum_spend_amount,
    estimated_bonus_value_usd: row.estimated_bonus_value_usd,
    ...row,
  }));
}

function main() {
  const cards = loadCards();
  console.log(`Loaded ${cards.length} cards from public/cards.csv\n`);

  let failed = 0;
  const results: { budget: number; byCards: Record<number, number>; ok: boolean }[] = [];

  for (const budget of BUDGETS) {
    const byCards: Record<number, number> = {};
    let prevBonus = -1;
    let ok = true;

    for (const maxCards of CARD_COUNTS) {
      const plan = computeOptimalPlan(cards, budget, maxCards);
      byCards[maxCards] = plan.totalBonus;
      if (plan.totalBonus < prevBonus) {
        ok = false;
        failed++;
      }
      prevBonus = plan.totalBonus;
    }

    results.push({ budget, byCards, ok });
  }

  // Print table: budget x card count -> total bonus
  const header = ["Budget", ...CARD_COUNTS.map((c) => `${c} cards`)].join("\t");
  console.log(header);
  console.log("-".repeat(header.length));
  for (const r of results) {
    const row = [
      `$${r.budget.toLocaleString()}`,
      ...CARD_COUNTS.map((c) => r.byCards[c].toLocaleString()),
    ].join("\t");
    console.log(row + (r.ok ? "" : "  ⚠ FAIL"));
  }

  // Invariant check summary
  console.log("\n--- Invariant: more cards => total bonus same or higher ---");
  if (failed === 0) {
    console.log("PASS: For every budget, total bonus was non-decreasing as max cards increased.");
  } else {
    console.log(`FAIL: ${failed} budget/card-count combinations violated the invariant.`);
    process.exit(1);
  }
}

main();
