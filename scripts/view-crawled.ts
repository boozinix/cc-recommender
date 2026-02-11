/**
 * View crawled card data from crawled/*.json.
 * Run: npx tsx scripts/view-crawled.ts [bankId]
 * If bankId is omitted, shows all crawled banks.
 */

import {
  loadCrawledCards,
  loadCrawledCardsByBank,
  mapCrawlerResultToCard,
} from "@/app/lib/crawledDataLoader";

function main(): void {
  const bankId = process.argv[2]?.toLowerCase().trim();

  if (bankId) {
    const cards = loadCrawledCardsByBank(bankId);
    console.log(`\n=== Crawled cards: ${bankId} (${cards.length}) ===\n`);
    cards.forEach((c) => {
      const mapped = mapCrawlerResultToCard(c);
      console.log(`  ${mapped.card_name}`);
      console.log(`    Bonus: ${c.signupBonusAmount ?? "?"} ${c.signupBonusCurrency ?? ""} | Min spend: $${c.minimumSpendAmount ?? "?"} | Fee: $${c.annualFee ?? "?"}`);
      console.log(`    Est value: $${mapped.estimated_bonus_value_usd} | Status: ${c.parseStatus}`);
      console.log("");
    });
  } else {
    const all = loadCrawledCards();
    const byBank = new Map<string, number>();
    for (const c of all) {
      byBank.set(c.bankId, (byBank.get(c.bankId) ?? 0) + 1);
    }
    console.log("\n=== Crawled banks ===\n");
    for (const [bid, count] of byBank) {
      console.log(`  ${bid}: ${count} cards`);
    }
    console.log("\nRun with a bank id to see details, e.g. npx tsx scripts/view-crawled.ts chase\n");
  }
}

main();
