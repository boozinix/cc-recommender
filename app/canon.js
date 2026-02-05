THis is a new thread to simplify memory. I am working on a website for credit card recommendation. Here is the csv of all the cards i want. I will give you files next and thse will be canon.
Again, these files are canon. I will give you:
1. CSV file for all the credit cards.
2. app/page.tsx
3. app/wizard/page.tsx
4. app/results/page.tsx

every time you give me code, you will give me code for the ENTIRE file. Including making sure that the sections are spaced, labeled properly, and not segments. 

Here are files: pages.tsx:

/* =====================================================
   FILE: app/page.tsx
   PURPOSE: Homepage / entry point
   ===================================================== */

   export default function Home() {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "system-ui"
        }}
      >
        <h1 style={{ fontSize: 36, marginBottom: 16 }}>
          What Credit Card Should I Get?
        </h1>
  
        <p style={{ marginBottom: 32, color: "#555" }}>
          Answer 4 simple questions to get personalized recommendations.
        </p>
  
        <a
          href="/wizard"
          style={{
            padding: "14px 28px",
            borderRadius: 10,
            background: "#2563eb",
            color: "white",
            textDecoration: "none",
            fontSize: 18,
            fontWeight: "bold"
          }}
        >
          Start →
        </a>
      </div>
    );
  }
  


  wizard/page.tsx:


"use client";

// =======================
// Imports
// =======================
import { useState } from "react";



// =======================
// Questions Config
// =======================
const questions = [
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
    helper:
      "Don’t worry — we’ll try to help you offset annual fees with benefits where possible.",
    options: [
      { value: "None", label: "❌ No annual fee" },
      { value: "Low", label: "🙂 Up to $100" },
      { value: "Medium", label: "😐 $100–$400" },
      { value: "High", label: "😎 Doesn't matter" }
    ]
  },
  {
    id: "spend_comfort",
    question:
      "How comfortable are you meeting an initial spending requirement to earn a sign-up bonus?",
    options: [
      { value: "None", label: "Don’t want a bonus" },
      { value: "Low", label: "Under $1,000" },
      { value: "Medium", label: "Up to $5,000" },
      { value: "High", label: "Above $5,000" }
    ]
  },
  {
    id: "travel_frequency",
    question: "How often do you travel?",
    options: [
      { value: "Low", label: "Rarely" },
      { value: "Medium", label: "A few times a year" },
      { value: "High", label: "Frequently" }
    ]
  }
];



// =======================
// Fade Animation CSS
// =======================
const fadeInStyle = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;



// =======================
// Main Wizard Page
// =======================
export default function Wizard() {

  // -----------------------
  // State
  // -----------------------
  const [cardMode, setCardMode] = useState<"personal" | "business" | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<any>({});

  const [rankedGoals, setRankedGoals] = useState(
    questions[0].options.map(o => o.value)
  );

  const currentQuestion = questions[step];
  const isRankingStep = currentQuestion.id === "primary_goal";
  const selectedValue = answers[currentQuestion.id];



  // -----------------------
  // Handle Card Mode Toggle
  // -----------------------
  function handleModeChange(mode: "personal" | "business") {
    if (cardMode && cardMode !== mode) {
      setStep(0);
      setAnswers({});
      setRankedGoals(questions[0].options.map(o => o.value));
      localStorage.removeItem("answers");
    }

    setCardMode(mode);
    localStorage.setItem("card_mode", mode);
  }



  // -----------------------
  // Drag & Drop Handlers
  // -----------------------
  function handleDragStart(e: React.DragEvent<HTMLDivElement>, index: number) {
    e.dataTransfer.setData("dragIndex", index.toString());
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>, dropIndex: number) {
    const dragIndex = parseInt(e.dataTransfer.getData("dragIndex"), 10);
    if (dragIndex === dropIndex) return;

    const updated = [...rankedGoals];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(dropIndex, 0, moved);

    setRankedGoals(updated);
  }



  // -----------------------
  // Navigation Handlers
  // -----------------------
  function handleContinue() {
    let updatedAnswers = { ...answers };

    if (isRankingStep) {
      updatedAnswers.primary_goal_ranked = rankedGoals;
    }

    setAnswers(updatedAnswers);

    if (step === questions.length - 1) {
      localStorage.setItem("answers", JSON.stringify(updatedAnswers));
      window.location.href = "/results";
    } else {
      setStep(step + 1);
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }



  // =======================
  // UI
  // =======================
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 20px",
        fontFamily: "system-ui",
        background: "radial-gradient(circle at top, #eef2ff, #ffffff)"
      }}
    >
      <style>{fadeInStyle}</style>



      {/* =======================
          Personal / Business Toggle
         ======================= */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        {["personal", "business"].map(mode => (
          <button
            key={mode}
            onClick={() => handleModeChange(mode as any)}
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              border: "2px solid #2563eb",
              background: cardMode === mode ? "#2563eb" : "#fff",
              color: cardMode === mode ? "#fff" : "#2563eb",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>



      {!cardMode && (
        <div style={{ color: "#6b7280", marginBottom: 24 }}>
          Select Personal or Business to begin.
        </div>
      )}



      {cardMode && (
        <div style={{ width: 300, marginBottom: 24 }}>
          <div style={{ fontSize: 14, marginBottom: 6 }}>
            Step {step + 1} of {questions.length}
          </div>
          <div style={{ height: 6, background: "#e5e7eb", borderRadius: 4 }}>
            <div
              style={{
                height: 6,
                width: `${((step + 1) / questions.length) * 100}%`,
                background: "#2563eb",
                borderRadius: 4
              }}
            />
          </div>
        </div>
      )}



      {cardMode && (
        <div
          key={step}
          style={{
            animation: "fadeIn 0.3s ease",
            textAlign: "center",
            width: "100%",
            maxWidth: 420
          }}
        >
          <h2 style={{ marginBottom: 12 }}>
            {currentQuestion.question}
          </h2>

          {currentQuestion.helper && (
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
              {currentQuestion.helper}
            </div>
          )}



          {/* =======================
              Ranking Question
             ======================= */}
          {isRankingStep && (
            <div style={{ display: "grid", gap: 12 }}>
              {rankedGoals.map((goal, index) => {
                const label =
                  questions[0].options.find(o => o.value === goal)?.label;

                return (
                  <div
                    key={goal}
                    draggable
                    onDragStart={e => handleDragStart(e, index)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDrop(e, index)}
                    style={{
                      padding: "14px 18px",
                      borderRadius: 10,
                      border: "2px solid #c7d2fe",
                      background: "#ffffff",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "grab"
                    }}
                  >
                    {index + 1}. {label}
                  </div>
                );
              })}
            </div>
          )}



          {/* =======================
              Standard Questions
             ======================= */}
          {!isRankingStep && (
            <div style={{ display: "grid", gap: 16 }}>
              {currentQuestion.options.map(option => (
                <button
                  key={option.value}
                  onClick={() =>
                    setAnswers(prev => ({
                      ...prev,
                      [currentQuestion.id]: option.value
                    }))
                  }
                  style={{
                    padding: "16px 24px",
                    fontSize: 18,
                    borderRadius: 10,
                    border:
                      selectedValue === option.value
                        ? "2px solid #2563eb"
                        : "2px solid #ccc",
                    background:
                      selectedValue === option.value
                        ? "#eef2ff"
                        : "#ffffff",
                    cursor: "pointer"
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}



          {/* =======================
              Navigation Buttons
             ======================= */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 32
            }}
          >
            <button
              onClick={handleBack}
              disabled={step === 0}
              style={{
                padding: "12px 20px",
                borderRadius: 999,
                background: step === 0 ? "#e5e7eb" : "#111827",
                color: "#ffffff",
                border: "none",
                cursor: step === 0 ? "not-allowed" : "pointer"
              }}
            >
              ← Back
            </button>

            <button
              onClick={handleContinue}
              disabled={!isRankingStep && !selectedValue}
              style={{
                padding: "12px 24px",
                borderRadius: 999,
                background:
                  !isRankingStep && !selectedValue ? "#c7d2fe" : "#2563eb",
                color: "#ffffff",
                border: "none",
                fontWeight: 600,
                cursor:
                  !isRankingStep && !selectedValue
                    ? "not-allowed"
                    : "pointer"
              }}
            >
              Continue →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}




results/page.tsx:

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
  cashback_rate_effective: string;
  estimated_bonus_value_usd: string;
  intro_apr_purchase: string;
  best_for: string;
  pros: string;
  cons: string;
};

type Answers = {
  [key: string]: string;
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
    dependsOn: (answers: Answers) => answers.primary_goal === "Travel",
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
    dependsOn: (answers: Answers) => answers.primary_goal !== "Travel",
    options: ["Yes, I plan to carry a balance", "No, I pay in full", "Doesn't matter"]
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



// =========================================================
// Scoring Engine
// =========================================================
function scoreCard(card: Card, answers: Answers, ownedCards: string[]) {
  if (ownedCards.includes(card.card_name)) return -9999;
  if (issuerExcluded(card.issuer, answers.cards_24mo)) return -9999;

  let score = 0;

  if (
    answers.needs_0_apr === "Yes, I plan to carry a balance" &&
    answers.primary_goal !== "Travel"
  ) {
    if (!hasIntroAPR(card)) return -9999;
    score += parseFloat(card.cashback_rate_effective || "0") * 10;
    score -= parseInt(card.annual_fee || "0", 10) / 10;
    return score;
  }

  if (answers.primary_goal === "Travel") {
    score += card.reward_model === "Travel" ? 60 : -25;
  }

  if (
    answers.preferred_airline &&
    answers.preferred_airline !== "No strong preference" &&
    card.card_name.includes(answers.preferred_airline)
  ) score += 40;

  if (
    answers.preferred_hotel &&
    answers.preferred_hotel !== "No strong preference" &&
    card.card_name.includes(answers.preferred_hotel)
  ) score += 40;

  score += Math.min(
    parseInt(card.estimated_bonus_value_usd || "0", 10) / 100,
    20
  );

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
  const [showMoreMain, setShowMoreMain] = useState(false);



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
  // Live Re-Scoring (Primary Type)
  // ---------------------
  useEffect(() => {
    const scored = [...cards]
      .filter(c => c.card_type === answers.card_mode)
      .map(card => ({
        card,
        score: scoreCard(card, answers, ownedCards)
      }))
      .sort((a, b) => b.score - a.score)
      .map(x => x.card);

    setRankedCards(scored);
  }, [cards, answers, ownedCards]);



  // ---------------------
  // Other Card Type Ranking (Top 3)
  // ---------------------
  const otherTypeCards = useMemo(() => {
    if (!answers.card_mode) return [];

    const otherType =
      answers.card_mode === "personal" ? "business" : "personal";

    return [...cards]
      .filter(c => c.card_type === otherType)
      .map(card => ({
        card,
        score: scoreCard(card, answers, ownedCards)
      }))
      .filter(x => x.score > -9999)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(x => x.card);
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
        <h2 style={{ marginBottom: 20 }}>Best cards for you</h2>

        {rankedCards.slice(0, showMoreMain ? 6 : 3).map(card => {
          const style = getIssuerStyle(card.issuer);

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
                  I already have this
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

        {/* SHOW MORE – OWN LINE */}
        {rankedCards.length > 3 && (
          <div style={{ marginBottom: 24 }}>
            <button
              onClick={() => setShowMoreMain(prev => !prev)}
              style={{
                padding: "10px 18px",
                borderRadius: 999,
                border: "1px solid #c7d2fe",
                background: "#eef2ff",
                color: "#1e3a8a",
                fontWeight: 600
              }}
            >
              {showMoreMain
                ? "Hide extra recommendations"
                : "Show more recommendations"}
            </button>
          </div>
        )}

        {/* SEPARATOR */}
        <hr
          style={{
            border: "none",
            borderTop: "1px solid #e2e8f0",
            margin: "24px 0"
          }}
        />

        {/* OTHER CARD TYPE – OWN LINE */}
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
                      I already have this
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


Now , I want you to read back to me the entire 3 files, to establish you understand, no changes , no error, just establishing canon: