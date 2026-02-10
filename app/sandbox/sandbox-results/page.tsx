"use client";

/**
 * SANDBOX: Copy of the results page for experimenting.
 * URL: /sandbox/sandbox-results
 * Uses the same localStorage (answers, card_mode) as the real app, so run the wizard
 * or go to /results first to have data, then open this page to play with the UI/logic here.
 * Changes in this file do not affect the real /results page.
 */

// =========================================================
// Imports
// =========================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Papa from "papaparse";
import { getTheme, type CardMode } from "@/app/lib/theme";
import { getEstimatedBonusValueUsd } from "@/app/lib/pointValues";
import type { Card } from "@/app/lib/cardTypes";
import { formatBonusDisplay, getRewardModelLabel, getCashbackDisplay, splitProsCons } from "@/app/lib/cardDisplay";
import { getIssuerStyle, getBankLogoPath, getBrandLogoPath } from "@/app/lib/issuerStyles";
import { type Answers } from "@/app/lib/resultsScoring";
import { wizardQuestions } from "@/app/lib/wizardQuestions";
import { refinementQuestions } from "@/app/lib/refinementQuestions";
import { useResultsRanking } from "@/app/lib/useResultsRanking";
import { FeedbackButton } from "@/app/components/FeedbackButton";
import { ResultsLeftPanel } from "@/app/components/ResultsLeftPanel";
import { CardTile } from "@/app/components/CardTile";
import { CardDetailsContent, type CardDetailData, type CardDetailTheme } from "@/app/components/card-detail/CardDetailsContent";





// =========================================================
// Initial Questionnaire (mirrors wizard Q1–Q3 for display)
// =========================================================
const initialQuestions = wizardQuestions.slice(0, 3).map(q => ({
  id: q.id,
  question: q.question,
  options: q.options,
}));

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
// Main Sandbox Results Page
// =========================================================
export default function ResultsPage() {

  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [ownedCards, setOwnedCards] = useState<string[]>([]);
  const [compareCards, setCompareCards] = useState<string[]>([]);
  const [showOtherType, setShowOtherType] = useState(false);
  const [showMoreMain, setShowMoreMain] = useState<3 | 6 | 9>(3);

  // Shared ranking hook (same logic as /results)
  const { rankedCards, otherTypeCards } = useResultsRanking(cards, answers, ownedCards);

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





  // (Ranking is now handled by useResultsRanking above)

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





  // =========================================================
  // Theme: shared with wizard, results, comparison – edit app/lib/theme.ts to change scheme.
  // =========================================================
  const theme = getTheme((answers.card_mode as CardMode) || "personal");
  const cardMode = (answers.card_mode as CardMode) || "personal";

  // =========================================================
  // UI (data-card-mode drives --accent / personal vs business in globals.css)
  // =========================================================
  return (
    <>
      <div style={{ background: "#fef3c7", color: "#92400e", padding: "8px 16px", fontSize: 13, textAlign: "center", borderBottom: "1px solid #fcd34d" }}>
        Sandbox — play here. Real results: <a href="/results" style={{ color: "#b45309", fontWeight: 600 }}>/results</a>
      </div>
    <div className="results-page" data-card-mode={cardMode}>



      {/* LEFT PANEL – own scroll when content is tall */}
      <ResultsLeftPanel
        answers={answers}
        setAnswers={setAnswers}
        initialQuestions={initialQuestions}
        getInitialAnswerDisplay={getInitialAnswerDisplay}
        theme={theme}
        backHref="/sandbox"
        backLabel="← Back to Sandbox"
        resetStorageOnBack={false}
      />





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
          const isEntering = ENABLE_CARD_ANIMATIONS && enteringCardNames.has(card.card_name);
          const isFirstCard = index === 0;
          const isSecondCard = index === 1;
          return (
            <CardTile
              key={card.card_name}
              card={card}
              showProsCons={SHOW_PROSCONS_ON_RESULTS_TILES}
              showCompareCheckbox
              compareChecked={compareCards.includes(card.card_name)}
              onCompareChange={(checked) => {
                if (checked && compareCards.length < 4) setCompareCards((p) => [...p, card.card_name]);
                if (!checked) setCompareCards((p) => p.filter((c) => c !== card.card_name));
              }}
              showOwnedCheckbox
              ownedCards={ownedCards}
              onOwnedChange={(cardName, haveIt) =>
                setOwnedCards((prev) => (haveIt ? [...prev, cardName] : prev.filter((c) => c !== cardName)))
              }
              titleAsButton={isFirstCard}
              onTitleClick={isFirstCard ? () => setDetailModalCard(card) : undefined}
              className={isEntering ? "card-enter" : ""}
            >
              {isSecondCard && (
                <>
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--pill-bg)", display: "flex", justifyContent: "center" }}>
                    <button
                      type="button"
                      onClick={() => setSecondCardExpanded((prev) => !prev)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "6px 14px",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        background: "var(--surface)",
                        color: "var(--text-muted)",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      {secondCardExpanded ? "▲ Less" : "▼ More details"}
                    </button>
                  </div>
                  <div
                    style={{
                      overflow: "hidden",
                      transition: "max-height 0.55s ease-out",
                      maxHeight: secondCardExpanded ? 2000 : 0,
                    }}
                  >
                    {secondCardExpanded && (
                      <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--pill-bg)", paddingBottom: 4 }}>
                        <CardDetailsContent card={card as CardDetailData} theme={theme as CardDetailTheme} />
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardTile>
          );
        })}

        {detailModalCard && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Card details"
            className="card-detail-modal-overlay"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              background: "rgba(0,0,0,0.5)",
            }}
            onClick={() => setDetailModalCard(null)}
          >
            <div
              className="card-detail-modal-content"
              style={{
                background: "var(--surface-elevated)",
                borderRadius: 16,
                border: "2px solid var(--card-tile-border)",
                maxWidth: 720,
                width: "100%",
                boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "18px 24px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{detailModalCard.card_name}</h3>
                <button
                  type="button"
                  className="card-detail-modal-close tap-target"
                  onClick={() => setDetailModalCard(null)}
                  style={{
                    padding: "8px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    background: "var(--surface)",
                    color: "var(--text-muted)",
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ padding: "20px 24px 24px" }}>
                <CardDetailsContent card={detailModalCard as CardDetailData} theme={theme as CardDetailTheme} />
              </div>
            </div>
          </div>
        )}

        {ENABLE_CARD_ANIMATIONS && leavingCards.length > 0 && leavingCards.map((card) => (
          <CardTile
            key={card.card_name}
            card={card}
            showProsCons={SHOW_PROSCONS_ON_RESULTS_TILES}
            showCompareCheckbox
            compareChecked={compareCards.includes(card.card_name)}
            onCompareChange={(checked) => {
              if (checked && compareCards.length < 4) setCompareCards((p) => [...p, card.card_name]);
              if (!checked) setCompareCards((p) => p.filter((c) => c !== card.card_name));
            }}
            showOwnedCheckbox
            ownedCards={ownedCards}
            onOwnedChange={(cardName, haveIt) =>
              setOwnedCards((prev) => (haveIt ? [...prev, cardName] : prev.filter((c) => c !== cardName)))
            }
            className="card-leave"
          />
        ))}


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
              otherTypeLeavingCards.map((card) => (
                <CardTile
                  key={card.card_name}
                  card={card}
                  showProsCons={SHOW_PROSCONS_ON_RESULTS_TILES}
                  showCompareCheckbox
                  compareChecked={compareCards.includes(card.card_name)}
                  onCompareChange={(checked) => {
                    if (checked && compareCards.length < 4) setCompareCards((p) => [...p, card.card_name]);
                    if (!checked) setCompareCards((p) => p.filter((c) => c !== card.card_name));
                  }}
                  showOwnedCheckbox
                  ownedCards={ownedCards}
                  onOwnedChange={(cardName, haveIt) =>
                    setOwnedCards((prev) => (haveIt ? [...prev, cardName] : prev.filter((c) => c !== cardName)))
                  }
                  className="card-leave"
                />
              ))
            ) : (
              otherTypeCards.map((card) => {
                const isEntering = ENABLE_CARD_ANIMATIONS && otherTypeEnteringCardNames.has(card.card_name);
                return (
                  <CardTile
                    key={card.card_name}
                    card={card}
                    showProsCons={SHOW_PROSCONS_ON_RESULTS_TILES}
                    showCompareCheckbox
                    compareChecked={compareCards.includes(card.card_name)}
                    onCompareChange={(checked) => {
                      if (checked && compareCards.length < 4) setCompareCards((p) => [...p, card.card_name]);
                      if (!checked) setCompareCards((p) => p.filter((c) => c !== card.card_name));
                    }}
                    showOwnedCheckbox
                    ownedCards={ownedCards}
                    onOwnedChange={(cardName, haveIt) =>
                      setOwnedCards((prev) => (haveIt ? [...prev, cardName] : prev.filter((c) => c !== cardName)))
                    }
                    className={isEntering ? "card-enter" : ""}
                  />
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
    </div>
    </>
  );
}