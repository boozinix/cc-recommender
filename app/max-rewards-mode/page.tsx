"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { computeOptimalPlan, type CardForAllocation, type AllocationItem } from "@/app/lib/spendAllocation";
import { getTheme } from "@/app/lib/theme";
import { FAQButton } from "@/app/components/FAQButton";
import { getEstimatedBonusValueUsd } from "@/app/lib/pointValues";

type Card = CardForAllocation & {
  issuer: string;
  card_type: string;
  reward_model: string;
  card_family?: string;
  spend_time_frame?: string;
  best_for?: string;
  application_link?: string;
  annual_fee?: string;
};

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

function getIssuerStyle(issuer: string) {
  return issuerColors[issuer.toLowerCase()] || { bg: "#e5e7eb", text: "#111827" };
}

function getBankLogoPath(issuer: string): string | null {
  const file = bankLogoFiles[issuer];
  return file ? `/logos/banks/${file}` : null;
}

function getRewardModelLabel(rewardModel: string): string {
  const r = (rewardModel || "").toLowerCase();
  if (r === "travel" || r === "airline" || r === "hotel") return "Travel";
  if (r === "cashback") return "Cashback";
  return rewardModel ? rewardModel.charAt(0).toUpperCase() + rewardModel.slice(1) : "";
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

function formatBonusDisplay(card: Card): string | null {
  const value = parseInt(card.estimated_bonus_value_usd || "0", 10);
  if (!value) return null;
  const minSpendRaw = (card.minimum_spend_amount || "").trim();
  const timeFrame = (card.spend_time_frame || "").trim();
  const minSpendNum = parseMinSpend(minSpendRaw);
  const months = parseInt(timeFrame, 10);
  let text = `Worth $${value.toLocaleString()} estimated value`;
  if (minSpendNum > 0 && !Number.isNaN(months) && months > 0) {
    const spendFormatted = minSpendRaw.includes("$") ? minSpendRaw : `$${Number(minSpendRaw.replace(/[,]/g, "")).toLocaleString()}`;
    text += `, if you spend ${spendFormatted} in ${months} month${months === 1 ? "" : "s"}`;
  }
  return text;
}

type RewardFilter = "All" | "General" | "Airline" | "Hotel";
type CardTypeFilter = "personal" | "business" | "both";

function filterCardsByRewardType(cards: Card[], rewardType: RewardFilter): Card[] {
  if (rewardType === "All") return cards;
  const r = (s: string) => (s || "").toLowerCase();
  return cards.filter((c) => {
    const model = r(c.reward_model);
    if (rewardType === "General") return model === "travel" || model === "cashback";
    if (rewardType === "Airline") return model === "airline";
    if (rewardType === "Hotel") return model === "hotel";
    return true;
  });
}

function filterCardsByType(cards: Card[], cardType: CardTypeFilter): Card[] {
  if (cardType === "both") return cards;
  return cards.filter((c) => (c.card_type || "").toLowerCase() === cardType);
}

/** Chase first, Amex second, others middle, Capital One last */
function getIssuerRank(issuer: string): number {
  const i = (issuer || "").toLowerCase();
  if (i === "chase") return 0;
  if (i === "amex") return 1;
  if (i === "capital one") return 999;
  return 2;
}

function sortAllocationByIssuer<T extends { card: CardForAllocation }>(allocation: T[]): T[] {
  return [...allocation].sort((a, b) => {
    const ra = getIssuerRank((a.card as Card).issuer);
    const rb = getIssuerRank((b.card as Card).issuer);
    return ra - rb;
  });
}

const ANIMATION_DURATION_MS = 600;

export default function MaxRewardsModePage() {
  const theme = getTheme("personal");
  const [cards, setCards] = useState<Card[]>([]);
  const [rewardType, setRewardType] = useState<RewardFilter>("All");
  const [cardTypeFilter, setCardTypeFilter] = useState<CardTypeFilter>("both");
  const [spendAmount, setSpendAmount] = useState("");
  const [maxCards, setMaxCards] = useState("");
  const [plan, setPlan] = useState<ReturnType<typeof computeOptimalPlan> | null>(null);
  const [leavingAllocation, setLeavingAllocation] = useState<AllocationItem[]>([]);
  const [enteringCardNames, setEnteringCardNames] = useState<Set<string>>(new Set());
  const [ownedCards, setOwnedCards] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const previousAllocationRef = useRef<AllocationItem[]>([]);

  useEffect(() => {
    fetch("/cards.csv")
      .then((r) => r.text())
      .then((cardsText) => {
        const parsed = Papa.parse<Card>(cardsText, { header: true, skipEmptyLines: true });
        const enriched = parsed.data.map((c: Card) => ({
          ...c,
          estimated_bonus_value_usd: String(getEstimatedBonusValueUsd(c))
        }));
        setCards(enriched);
      })
      .catch(() => setCards([]));
  }, []);

  const filteredCards = useMemo(
    () => filterCardsByType(filterCardsByRewardType(cards, rewardType), cardTypeFilter),
    [cards, rewardType, cardTypeFilter]
  );

  // Excluded = Have it / Not interested. Re-optimize from remaining pool so we still show same number of cards (next best).
  const cardsForOptimizer = useMemo(
    () => filteredCards.filter((c) => !ownedCards.includes(c.card_name)),
    [filteredCards, ownedCards]
  );

  // When filter or excluded cards change and we already have a plan, re-run optimizer after a short delay (debounce) so UI stays responsive.
  const ownedCardsKey = JSON.stringify(ownedCards);
  const filterKey = `${rewardType}-${cardTypeFilter}-${filteredCards.length}`;
  const reoptimizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (plan === null) return;
    if (reoptimizeTimeoutRef.current) clearTimeout(reoptimizeTimeoutRef.current);
    reoptimizeTimeoutRef.current = setTimeout(() => {
      reoptimizeTimeoutRef.current = null;
      const budget = Math.max(0, parseInt(spendAmount.replace(/[$,]/g, ""), 10) || 0);
      const max = maxCards.trim() === "" ? 20 : Math.max(1, Math.min(20, parseInt(maxCards, 10) || 5));
      const pool = filteredCards.filter((c) => !ownedCards.includes(c.card_name));
      if (budget <= 0 || pool.length === 0) {
        setPlan(null);
        setLeavingAllocation([]);
        setEnteringCardNames(new Set());
        previousAllocationRef.current = [];
        return;
      }
      const result = computeOptimalPlan(pool, budget, max);
      setPlan(result);
    }, 250);
    return () => {
      if (reoptimizeTimeoutRef.current) clearTimeout(reoptimizeTimeoutRef.current);
    };
  }, [filterKey, ownedCardsKey]);

  // Enter/leave animation when plan allocation changes
  useEffect(() => {
    if (!plan) return;
    const current = plan.allocation;
    const prev = previousAllocationRef.current;
    const currentNames = new Set(current.map((a) => (a.card as Card).card_name));
    const leaving = prev.filter((p) => !currentNames.has((p.card as Card).card_name));
    const entering = current.filter((c) => !prev.some((p) => (p.card as Card).card_name === (c.card as Card).card_name));
    setLeavingAllocation((prevLeaving) => {
      const stillLeaving = prevLeaving.filter((p) => !currentNames.has((p.card as Card).card_name));
      const newLeaving = leaving.filter((l) => !stillLeaving.some((s) => (s.card as Card).card_name === (l.card as Card).card_name));
      return [...stillLeaving, ...newLeaving];
    });
    setEnteringCardNames(prev.length > 0 ? new Set(entering.map((a) => (a.card as Card).card_name)) : new Set(current.map((a) => (a.card as Card).card_name)));
    const tid = setTimeout(() => {
      setLeavingAllocation([]);
      setEnteringCardNames(new Set());
      previousAllocationRef.current = current;
    }, ANIMATION_DURATION_MS);
    return () => clearTimeout(tid);
  }, [plan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const budget = Math.max(0, parseInt(spendAmount.replace(/[$,]/g, ""), 10) || 0);
    const max = maxCards.trim() === "" ? 20 : Math.max(1, Math.min(20, parseInt(maxCards, 10) || 5));
    if (budget <= 0 || cardsForOptimizer.length === 0) {
      setPlan(null);
      return;
    }
    setIsCalculating(true);
    setTimeout(() => {
      try {
        const result = computeOptimalPlan(cardsForOptimizer, budget, max);
        setPlan(result);
      } finally {
        setIsCalculating(false);
      }
    }, 0);
  };

  return (
    <div className="max-rewards-page min-h-screen bg-[var(--surface)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/results"
            className="font-semibold no-underline hover:opacity-90"
            style={{ color: theme.primary }}
          >
            ← Back
          </Link>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Maximize Spend Mode</h1>
          <span className="w-12" aria-hidden />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes maxRewardsCardEnter {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes maxRewardsCardLeave {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(24px); }
          }
          @keyframes maxRewardsSpinner {
            to { transform: rotate(360deg); }
          }
          .max-rewards-card-enter { animation: maxRewardsCardEnter 0.55s ease-out forwards; }
          .max-rewards-card-leave { animation: maxRewardsCardLeave 0.55s ease-out forwards; }
          .max-rewards-spinner { animation: maxRewardsSpinner 0.8s linear infinite; }
        `}} />
        <p className="mb-6 text-[var(--text-secondary)]">
          To maximize rewards, tell us how much you can spend and (optionally) how many cards you can apply for. We’ll show the best card plan in order.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-sm"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-[var(--text-muted)]">
                To maximize rewards, how much are you willing to spend? <span className="text-[var(--cons-text)]">*</span>
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="e.g. 20000"
                value={spendAmount}
                onChange={(e) => setSpendAmount(e.target.value)}
                className="max-rewards-input w-full max-w-[200px] rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-[var(--text-muted)]">
                Max number of cards you can apply for (optional)
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="e.g. 5 or leave blank"
                value={maxCards}
                onChange={(e) => setMaxCards(e.target.value)}
                className="max-rewards-input w-full max-w-[200px] rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg border-0 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95"
              style={{ background: theme.primary }}
            >
              Submit
            </button>
          </div>
        </form>

        <div className="mb-8 flex flex-col gap-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-sm">
            <div className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
              What kind of rewards do you want to maximize?
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: "All" as const, label: "All cards" },
                  { value: "General" as const, label: "Bank Rewards (General)" },
                  { value: "Airline" as const, label: "Airline" },
                  { value: "Hotel" as const, label: "Hotel" }
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRewardType(opt.value)}
                  className="rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors"
                  style={{
                    borderColor: rewardType === opt.value ? theme.primary : "var(--border)",
                    background: rewardType === opt.value ? theme.primary : "var(--surface-elevated)",
                    color: rewardType === opt.value ? "#ffffff" : "var(--text-primary)"
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-sm">
            <div className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
              Personal only, business only, or both?
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: "both" as const, label: "Personal or Business" },
                  { value: "personal" as const, label: "Personal only" },
                  { value: "business" as const, label: "Business only" }
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCardTypeFilter(opt.value)}
                  className="rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors"
                  style={{
                    borderColor: cardTypeFilter === opt.value ? theme.primary : "var(--border)",
                    background: cardTypeFilter === opt.value ? theme.primary : "var(--surface-elevated)",
                    color: cardTypeFilter === opt.value ? "#ffffff" : "var(--text-primary)"
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isCalculating && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-6 py-5">
            <span className="max-rewards-spinner inline-block h-6 w-6 shrink-0 rounded-full border-2 border-[var(--border)] border-t-[var(--text-primary)]" aria-hidden />
            <span className="text-[var(--text-secondary)]">Calculating…</span>
          </div>
        )}

        {plan && !isCalculating && (() => {
          const sortedLeaving = sortAllocationByIssuer(leavingAllocation);
          const sortedAllocation = sortAllocationByIssuer(plan.allocation);
          const mainAllocation = sortedAllocation.filter(({ card }) => !ownedCards.includes((card as Card).card_name));
          return (
          <>
            <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
              <div className="mb-2 text-sm font-bold text-[var(--text-primary)]">Your optimal plan</div>
              {(() => {
                const totalFees = plan.allocation.reduce((sum, { card }) => sum + parseInt((card as Card).annual_fee || "0", 10), 0);
                const netBonus = plan.totalBonus - totalFees;
                return (
                  <>
                    <div className="flex flex-wrap gap-6 text-sm text-[var(--text-secondary)]">
                      <span><strong>Total bonus:</strong> ${plan.totalBonus.toLocaleString()}</span>
                      <span><strong>Spend used:</strong> ${plan.totalSpendUsed.toLocaleString()}</span>
                      <span><strong>Fees:</strong> ${totalFees.toLocaleString()}</span>
                      <span><strong>Cards:</strong> {plan.chosenCards.length}</span>
                    </div>
                    <div className="mt-3 border-t border-[var(--border)] pt-3 text-sm">
                      <strong className="font-bold text-[var(--text-primary)]">Net bonus: ${netBonus.toLocaleString()}</strong>
                      <span className="text-[var(--text-secondary)]"> (bonus minus annual fees)</span>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="flex flex-col gap-5">
              {sortedLeaving.map(({ card, minSpend, bonus }, idx) => {
                const c = card as Card;
                const style = getIssuerStyle(c.issuer);
                const bankLogo = getBankLogoPath(c.issuer);
                const rewardLabel = getRewardModelLabel(c.reward_model || "");
                return (
                  <div key={`leave-${idx}-${c.card_name}`} className="max-rewards-card-leave" style={{ marginBottom: 4 }}>
                    <div className="flex gap-4 rounded-xl border-2 border-[var(--card-tile-border)] bg-[var(--surface-elevated)] p-4 shadow-sm">
                      <div
                        className="flex h-[72px] w-[72px] min-w-[72px] flex-shrink-0 items-center justify-center overflow-hidden rounded-lg"
                        style={{
                          background: bankLogo ? "transparent" : "linear-gradient(145deg, var(--pill-bg) 0%, var(--border) 100%)"
                        }}
                      >
                        {bankLogo ? <img src={bankLogo} alt="" className="h-full w-full object-contain" /> : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="mb-2 text-lg font-bold leading-tight text-[var(--text-primary)]">{c.card_name}</h3>
                        <div className="mb-2 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md px-2.5 py-1 text-[11px] font-semibold" style={{ background: style.bg, color: style.text }}>{c.issuer}</span>
                          {c.card_type === "business" && (
                            <span className="rounded-md px-2.5 py-1 text-[11px] font-semibold" style={{ background: theme.businessBadge.bg, color: theme.businessBadge.text }}>Business card</span>
                          )}
                          {rewardLabel && <span className="rounded-md bg-[var(--pill-bg)] px-2 py-1 text-[11px] text-[var(--pill-text)]">{rewardLabel}</span>}
                        </div>
                        <div className="mb-2 inline-block rounded-md bg-[var(--bonus-bg)] px-2.5 py-1.5 text-xs text-[var(--bonus-text)]">
                          Put <strong>${minSpend.toLocaleString()}</strong> here → <strong>${bonus.toLocaleString()}</strong> bonus
                        </div>
                        {c.application_link ? (
                          <a href={c.application_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold text-white no-underline" style={{ background: theme.primary }}>
                            Apply for this card →
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
              {mainAllocation.map(({ card, minSpend, bonus }, idx) => {
                const c = card as Card;
                const style = getIssuerStyle(c.issuer);
                const bankLogo = getBankLogoPath(c.issuer);
                const rewardLabel = getRewardModelLabel(c.reward_model || "");
                const isEntering = enteringCardNames.has(c.card_name);

                return (
                  <div
                    key={`alloc-${idx}-${c.card_name}`}
                    className={isEntering ? "max-rewards-card-enter" : ""}
                    style={isEntering ? { marginBottom: 4 } : undefined}
                  >
                    <div className="flex gap-4 rounded-xl border-2 border-[var(--card-tile-border)] bg-[var(--surface-elevated)] p-4 shadow-sm">
                    <div
                      className="flex h-[72px] w-[72px] min-w-[72px] flex-shrink-0 items-center justify-center overflow-hidden rounded-lg"
                      style={{
                        background: bankLogo ? "transparent" : "linear-gradient(145deg, var(--pill-bg) 0%, var(--border) 100%)"
                      }}
                    >
                      {bankLogo ? <img src={bankLogo} alt="" className="h-full w-full object-contain" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h3 className="text-lg font-bold leading-tight text-[var(--text-primary)]">
                          {c.card_name}
                        </h3>
                        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-[var(--text-muted)] whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="h-4 w-4 cursor-pointer"
                            checked={ownedCards.includes(c.card_name)}
                            onChange={(e) => {
                              e.stopPropagation();
                              setOwnedCards((prev) =>
                                prev.includes(c.card_name)
                                  ? prev.filter((n) => n !== c.card_name)
                                  : [...prev, c.card_name]
                              );
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          Have it / Not interested
                        </label>
                      </div>
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <span
                          className="rounded-md px-2.5 py-1 text-[11px] font-semibold"
                          style={{ background: style.bg, color: style.text }}
                        >
                          {c.issuer}
                        </span>
                        {c.card_type === "business" && (
                          <span
                            className="rounded-md px-2.5 py-1 text-[11px] font-semibold"
                            style={{ background: theme.businessBadge.bg, color: theme.businessBadge.text }}
                          >
                            Business card
                          </span>
                        )}
                        {rewardLabel && (
                          <span className="rounded-md bg-[var(--pill-bg)] px-2 py-1 text-[11px] text-[var(--pill-text)]">
                            {rewardLabel}
                          </span>
                        )}
                      </div>
                      <div className="mb-2 inline-block rounded-md bg-[var(--bonus-bg)] px-2.5 py-1.5 text-xs text-[var(--bonus-text)]">
                        Put <strong>${minSpend.toLocaleString()}</strong> here → <strong>${bonus.toLocaleString()}</strong> bonus
                      </div>
                      {c.best_for && (
                        <p className="mb-3 text-[13px] leading-snug text-[var(--text-muted)]">{c.best_for}</p>
                      )}
                      <div className="border-t border-[var(--pill-bg)] pt-3">
                        {c.application_link ? (
                          <a
                            href={c.application_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold text-white no-underline"
                            style={{ background: theme.primary }}
                          >
                            Apply for this card →
                          </a>
                        ) : null}
                      </div>
                    </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
          );
        })()}

        {/* Floating section at bottom: cards user marked "Have it / Not interested" — same as results page, with Remove to bring back */}
        {ownedCards.length > 0 && (
          <>
            <h3 className="mt-10 mb-3 text-base font-bold text-[var(--text-primary)]">
              Cards you already have / not interested
            </h3>
            <p className="mb-4 text-sm text-[var(--text-muted)]">
              These are excluded from your plan. Remove one to consider it again in the next best plan.
            </p>
            <div className="flex flex-col gap-5">
              {ownedCards.map((cardName) => {
                const c = filteredCards.find((x) => x.card_name === cardName) as Card | undefined;
                if (!c) return null;
                const style = getIssuerStyle(c.issuer);
                const bankLogo = getBankLogoPath(c.issuer);
                const rewardLabel = getRewardModelLabel(c.reward_model || "");
                const minSpend = parseMinSpend(c.minimum_spend_amount);
                const bonus = parseBonus(c.estimated_bonus_value_usd);
                return (
                  <div
                    key={`excluded-${cardName}`}
                    className="flex gap-4 rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
                  >
                    <div
                      className="flex h-[72px] w-[72px] min-w-[72px] flex-shrink-0 items-center justify-center overflow-hidden rounded-lg"
                      style={{
                        background: bankLogo ? "transparent" : "linear-gradient(145deg, var(--pill-bg) 0%, var(--border) 100%)"
                      }}
                    >
                      {bankLogo ? <img src={bankLogo} alt="" className="h-full w-full object-contain" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h3 className="text-lg font-bold leading-tight text-[var(--text-primary)]">{c.card_name}</h3>
                        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-[var(--text-muted)] whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="h-4 w-4 cursor-pointer"
                            checked
                            onChange={(e) => {
                              e.stopPropagation();
                              setOwnedCards((prev) => prev.filter((n) => n !== cardName));
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          Remove
                        </label>
                      </div>
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md px-2.5 py-1 text-[11px] font-semibold" style={{ background: style.bg, color: style.text }}>{c.issuer}</span>
                        {c.card_type === "business" && (
                          <span className="rounded-md px-2.5 py-1 text-[11px] font-semibold" style={{ background: theme.businessBadge.bg, color: theme.businessBadge.text }}>Business card</span>
                        )}
                        {rewardLabel && <span className="rounded-md bg-[var(--pill-bg)] px-2 py-1 text-[11px] text-[var(--pill-text)]">{rewardLabel}</span>}
                      </div>
                      <div className="mb-2 inline-block rounded-md bg-[var(--bonus-bg)] px-2.5 py-1.5 text-xs text-[var(--bonus-text)]">
                        Put <strong>${minSpend.toLocaleString()}</strong> here → <strong>${bonus.toLocaleString()}</strong> bonus
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {cards.length === 0 && !plan && (
          <p className="text-sm text-[var(--text-muted)]">Loading cards…</p>
        )}
        {cards.length > 0 && filteredCards.length === 0 && !plan && (
          <p className="text-sm text-[var(--text-muted)]">No cards with signup bonuses match the selected reward type. Try “All cards” or a different type.</p>
        )}
      </main>
      <FAQButton />
    </div>
  );
}
