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
  card_family: string;            // matches CSV header
  cashback_rate_effective: string;
  estimated_bonus_value_usd: string;
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



function getGoalRanks(answers: Answers): { primary?: string; secondary?: string } {
  if (Array.isArray(answers.primary_goal_ranked)) {
    const [first, second] = answers.primary_goal_ranked;
    return { primary: first, secondary: second };
  }
  return { primary: answers.primary_goal, secondary: undefined };
}





// =========================================================
// Refinement Questions Config
// =========================================================
const refinementQuestions = [
  {
    id: "cards_24mo",
    label: "How many credit cards have you opened in the last 24 months?",
    dependsOn: () => true,
    options: ["0–4", "5", "6", "7+"]
  },
  {
    id: "travel_rewards_type",
    label: "What kind of travel rewards do you prefer?",
    dependsOn: (answers: Answers) => {
      const { primary } = getGoalRanks(answers);
      return primary === "Travel";
    },
    options: ["Generic / flexible travel", "Airline-specific", "Hotel-specific"]
  },
  {
    id: "preferred_airline",
    label: "Which airline do you usually fly?",
    dependsOn: (answers: Answers) =>
      answers.travel_rewards_type === "Airline-specific",
    options: [
      "United",
      "Delta",
      "American",
      "Alaska",
      "JetBlue",
      "Southwest",
      "No strong preference"
    ]
  },
  {
    id: "preferred_hotel",
    label: "Which hotel brand do you prefer?",
    dependsOn: (answers: Answers) =>
      answers.travel_rewards_type === "Hotel-specific",
    options: ["Marriott", "Hilton", "Hyatt", "IHG", "No strong preference"]
  },
  {
    id: "needs_0_apr",
    label: "Do you need a 0% intro APR?",
    dependsOn: (answers: Answers) => {
      const { primary } = getGoalRanks(answers);
      return primary === "Everyday" || primary === "Cashback";
    },
    options: [
      "Yes, I plan to carry a balance",
      "No, I pay in full",
      "Doesn't matter"
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
  
  if (bonusType === "miles") {
    typeLabel = "miles";
  } else if (bonusType === "points") {
    typeLabel = "points";
  } else if (bonusType === "dollars") {
    typeLabel = "dollars";
  } else {
    // Fallback if type is missing or unknown
    typeLabel = bonusType || "rewards";
  }

  return `Worth $${value.toLocaleString()} estimated value in ${typeLabel}`;
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
// Scoring Engine - Restructured for Better Logic
// =========================================================
function scoreCard(card: Card, answers: Answers, ownedCards: string[]) {
  // =========================================================
  // STEP 1: Hard Exclusions (immediate disqualification)
  // =========================================================
  if (ownedCards.includes(card.card_name)) return -9999;
  if (issuerExcluded(card.issuer, answers.cards_24mo)) return -9999;

  const { primary, secondary } = getGoalRanks(answers);
  const cardFee = parseInt(card.annual_fee || "0", 10);
  const bonusValue = parseInt(card.estimated_bonus_value_usd || "0", 10);
  const cashbackRate = parseFloat(card.cashback_rate_effective || "0");
  const isTravelCard = card.reward_model.toLowerCase() === "travel";
  const isCashbackCard = card.reward_model.toLowerCase() === "cashback";

  let score = 0;

  // =========================================================
  // STEP 2: Special Case - 0% APR Requirement
  // =========================================================
  if (
    answers.needs_0_apr === "Yes, I plan to carry a balance" &&
    primary !== "Travel"
  ) {
    if (!hasIntroAPR(card)) return -9999;
    // For 0% APR seekers, prioritize cashback rate and low/no fees
    score += cashbackRate * 10;
    score -= cardFee / 10;
    return score;
  }

  // =========================================================
  // STEP 3: Annual Fee Tolerance Filtering
  // =========================================================
  const feeTolerance = answers.annual_fee_tolerance;
  if (feeTolerance === "None" && cardFee > 0) {
    // User wants no fee - heavily penalize cards with fees
    score -= 50;
  } else if (feeTolerance === "Low" && cardFee > 100) {
    // User wants low fee - penalize cards over $100
    score -= 30;
  } else if (feeTolerance === "Medium" && cardFee > 400) {
    // User wants medium fee - penalize cards over $400
    score -= 30;
  }
  // "High" tolerance means no penalty

  // =========================================================
  // STEP 4: Primary Goal Scoring (Highest Weight)
  // =========================================================
  if (primary === "Travel") {
    if (isTravelCard) {
      score += 60;
      // Boost for travel frequency
      if (answers.travel_frequency === "High") score += 15;
      else if (answers.travel_frequency === "Medium") score += 8;
      else if (answers.travel_frequency === "Low") score -= 10; // Penalize if rarely travel
    } else {
      score -= 25; // Penalize non-travel cards
    }
  } else if (primary === "Cashback") {
    if (isCashbackCard) {
      score += 40;
    }
    // No penalty for non-cashback if not primary
  } else if (primary === "Everyday") {
    // Everyday spending = prioritize cashback rate
    score += cashbackRate * 8;
  } else if (primary === "Bonus") {
    // Only prioritize bonus if user is comfortable with spending
    if (answers.spend_comfort !== "None") {
      score += Math.min(bonusValue / 50, 40);
    } else {
      // User doesn't want bonus - penalize bonus-focused cards
      score -= 20;
    }
  }

  // =========================================================
  // STEP 5: Secondary Goal Scoring (Medium Weight)
  // =========================================================
  if (secondary === "Travel") {
    if (isTravelCard) {
      score += 25;
      // Smaller boost for travel frequency
      if (answers.travel_frequency === "High") score += 8;
      else if (answers.travel_frequency === "Low") score -= 5;
    } else {
      score -= 10;
    }
  } else if (secondary === "Cashback") {
    if (isCashbackCard) {
      score += 15;
    }
  } else if (secondary === "Everyday") {
    score += cashbackRate * 3;
  } else if (secondary === "Bonus") {
    if (answers.spend_comfort !== "None") {
      score += Math.min(bonusValue / 100, 15);
    }
  }

  // =========================================================
  // STEP 6: Travel-Specific Preferences
  // =========================================================
  const caresAboutTravel = primary === "Travel" || secondary === "Travel";
  
  if (caresAboutTravel) {
    // Airline preference matching
    if (
      answers.preferred_airline &&
      answers.preferred_airline !== "No strong preference" &&
      card.card_name.includes(answers.preferred_airline)
    ) {
      score += 40;
    }

    // Hotel preference matching
    if (
      answers.preferred_hotel &&
      answers.preferred_hotel !== "No strong preference" &&
      card.card_name.includes(answers.preferred_hotel)
    ) {
      score += 40;
    }
  }

  // =========================================================
  // STEP 7: Baseline Bonus Value (if user wants bonuses)
  // =========================================================
  if (answers.spend_comfort !== "None") {
    score += Math.min(bonusValue / 100, 20);
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
      answers.travel_rewards_type === "Airline-specific" &&
      answers.preferred_airline &&
      answers.preferred_airline !== "No strong preference";

    const wantsHotelBrand =
      answers.travel_rewards_type === "Hotel-specific" &&
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
  // Other Card Type Ranking (Top 3) — family de-duplication
  // ---------------------
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


    const deduped = dedupeByFamily(scoredRaw)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(x => x.card);


    return deduped;
  }, [cards, answers, ownedCards]);





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



        {/* BACK BUTTON */}
        <button
          onClick={() => (window.location.href = "/wizard")}
          style={{
            marginBottom: 20,
            padding: "8px 14px",
            borderRadius: 999,
            border: "1px solid #c7d2fe",
            background: "#eef2ff",
            color: "#1e3a8a",
            fontWeight: 600
          }}
        >
          ← Back to questionnaire
        </button>



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



        <h3 style={{ marginBottom: 16 }}>Refine your results</h3>



        {visibleRefinements.map(q => (
          <div key={q.id} style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>
              {q.label}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {q.options.map(option => (
                <button
                  key={option}
                  onClick={() =>
                    setAnswers(prev => ({ ...prev, [q.id]: option }))
                  }
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: "1px solid #c7d2fe",
                    background:
                      answers[q.id] === option ? "#2563eb" : "#eef2ff",
                    color:
                      answers[q.id] === option ? "#ffffff" : "#1e3a8a"
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
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



          return (
            <div
              key={card.card_name}
              style={{
                background:
                  "linear-gradient(180deg, #f8fafc 0%, #ffffff 40%)",
                borderRadius: 14,
                padding: 18,
                marginBottom: 20,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start"
                }}
              >
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600 }}>
                    {card.card_name}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#475569",
                      marginTop: 6
                    }}
                  >
                    <span
                      style={{
                        background: style.bg,
                        color: style.text,
                        padding: "3px 10px",
                        borderRadius: 999,
                        fontSize: 12
                      }}
                    >
                      {card.issuer}
                    </span>
                    {card.intro_apr_purchase
                      ? ` • ${card.intro_apr_purchase}`
                      : ""}
                  </div>


                  {bonusDisplay && (
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 13,
                        color: "#0f172a",
                        background: "#e0f2fe",
                        padding: "6px 10px",
                        borderRadius: 8,
                        display: "inline-block"
                      }}
                    >
                      <strong>Bonus:</strong> {bonusDisplay}
                    </div>
                  )}
                </div>



                <label style={{ fontSize: 13 }}>
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
                  I already have this, or I am not interested
                </label>
              </div>



              {card.best_for && (
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 14,
                    background: "#f1f5f9",
                    padding: 10,
                    borderRadius: 8
                  }}
                >
                  <strong>Best for:</strong> {card.best_for}
                </div>
              )}



              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginTop: 14
                }}
              >
                {card.pros && (
                  <div
                    style={{
                      background: "#ecfeff",
                      padding: 12,
                      borderRadius: 10
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        marginBottom: 6,
                        color: "#0f766e"
                      }}
                    >
                      Pros
                    </div>
                    <ul
                      style={{
                        paddingLeft: 18,
                        fontSize: 13,
                        color: "#134e4a"
                      }}
                    >
                      {card.pros.split(";").map(p => (
                        <li key={p}>{p.trim()}</li>
                      ))}
                    </ul>
                  </div>
                )}



                {card.cons && (
                  <div
                    style={{
                      background: "#fff1f2",
                      padding: 12,
                      borderRadius: 10
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        marginBottom: 6,
                        color: "#9f1239"
                      }}
                    >
                      Cons
                    </div>
                    <ul
                      style={{
                        paddingLeft: 18,
                        fontSize: 13,
                        color: "#881337"
                      }}
                    >
                      {card.cons.split(";").map(c => (
                        <li key={c}>{c.trim()}</li>
                      ))}
                    </ul>
                  </div>
                )}
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



              return (
                <div
                  key={card.card_name}
                  style={{
                    background:
                      "linear-gradient(180deg, #f8fafc 0%, #ffffff 40%)",
                    borderRadius: 14,
                    padding: 18,
                    marginBottom: 20,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 600 }}>
                        {card.card_name}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#475569",
                          marginTop: 6
                        }}
                      >
                        <span
                          style={{
                            background: style.bg,
                            color: style.text,
                            padding: "3px 10px",
                            borderRadius: 999,
                            fontSize: 12
                          }}
                        >
                          {card.issuer}
                        </span>
                        {card.intro_apr_purchase
                          ? ` • ${card.intro_apr_purchase}`
                          : ""}
                      </div>


                      {bonusDisplay && (
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 13,
                            color: "#0f172a",
                            background: "#e0f2fe",
                            padding: "6px 10px",
                            borderRadius: 8,
                            display: "inline-block"
                          }}
                        >
                          <strong>Bonus:</strong> {bonusDisplay}
                        </div>
                      )}
                    </div>



                    <label style={{ fontSize: 13 }}>
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
                      I already have this, or I am not interested
                    </label>
                  </div>



                  {card.best_for && (
                    <div
                      style={{
                        marginTop: 12,
                        fontSize: 14,
                        background: "#f1f5f9",
                        padding: 10,
                        borderRadius: 8
                      }}
                    >
                      <strong>Best for:</strong> {card.best_for}
                    </div>
                  )}



                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                      marginTop: 14
                    }}
                  >
                    {card.pros && (
                      <ul style={{ paddingLeft: 18, fontSize: 13 }}>
                        {card.pros.split(";").map(p => (
                          <li key={p}>{p.trim()}</li>
                        ))}
                      </ul>
                    )}



                    {card.cons && (
                      <ul style={{ paddingLeft: 18, fontSize: 13 }}>
                        {card.cons.split(";").map(c => (
                          <li key={c}>{c.trim()}</li>
                        ))}
                      </ul>
                    )}
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



              return (
                <div
                  key={name}
                  style={{
                    background: "#f1f5f9",
                    borderRadius: 12,
                    padding: 18,
                    marginBottom: 16,
                    border: "1px solid #e2e8f0"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 600 }}>
                        {card.card_name}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#475569",
                          marginTop: 6
                        }}
                      >
                        <span
                          style={{
                            background: style.bg,
                            color: style.text,
                            padding: "3px 10px",
                            borderRadius: 999,
                            fontSize: 12
                          }}
                        >
                          {card.issuer}
                        </span>
                        {card.intro_apr_purchase
                          ? ` • ${card.intro_apr_purchase}`
                          : ""}
                      </div>


                      {bonusDisplay && (
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 13,
                            color: "#0f172a",
                            background: "#e0f2fe",
                            padding: "6px 10px",
                            borderRadius: 8,
                            display: "inline-block"
                          }}
                        >
                          <strong>Bonus:</strong> {bonusDisplay}
                        </div>
                      )}
                    </div>



                    <label style={{ fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() =>
                          setOwnedCards(prev =>
                            prev.filter(c => c !== name)
                          )
                        }
                      />{" "}
                      Remove
                    </label>
                  </div>



                  {card.best_for && (
                    <div style={{ marginTop: 12, fontSize: 14 }}>
                      <strong>Best for:</strong> {card.best_for}
                    </div>
                  )}



                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                      marginTop: 14
                    }}
                  >
                    {card.pros && (
                      <ul style={{ paddingLeft: 18, fontSize: 13 }}>
                        {card.pros.split(";").map(p => (
                          <li key={p}>{p.trim()}</li>
                        ))}
                      </ul>
                    )}



                    {card.cons && (
                      <ul style={{ paddingLeft: 18, fontSize: 13 }}>
                        {card.cons.split(";").map(c => (
                          <li key={c}>{c.trim()}</li>
                        ))}
                      </ul>
                    )}
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
