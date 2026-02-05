"use client";


// =======================
// Imports
// =======================
import { useEffect, useState } from "react";




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
  // Restore From Local Storage
  // -----------------------
  useEffect(() => {
    try {
      const storedMode = localStorage.getItem("card_mode");
      const storedAnswers = localStorage.getItem("answers");
      const storedStep = localStorage.getItem("wizard_step");

      if (storedMode === "personal" || storedMode === "business") {
        setCardMode(storedMode);
      }

      if (storedAnswers) {
        const parsed = JSON.parse(storedAnswers);
        setAnswers(parsed);

        if (
          Array.isArray(parsed.primary_goal_ranked) &&
          parsed.primary_goal_ranked.length === questions[0].options.length
        ) {
          setRankedGoals(parsed.primary_goal_ranked);
        }
      }

      if (storedStep !== null) {
        const parsedStep = parseInt(storedStep, 10);
        if (!Number.isNaN(parsedStep) && parsedStep >= 0 && parsedStep < questions.length) {
          setStep(parsedStep);
        }
      }
    } catch {
      // ignore parse errors and just start fresh
    }
  }, []);




  // -----------------------
  // Handle Card Mode Toggle
  // -----------------------
  function handleModeChange(mode: "personal" | "business") {
    if (cardMode && cardMode !== mode) {
      setStep(0);
      setAnswers({});
      setRankedGoals(questions[0].options.map(o => o.value));
      localStorage.removeItem("answers");
      localStorage.removeItem("wizard_step");
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
      localStorage.setItem("wizard_step", step.toString());
      window.location.href = "/results";
    } else {
      const nextStep = step + 1;
      setStep(nextStep);
      localStorage.setItem("answers", JSON.stringify(updatedAnswers));
      localStorage.setItem("wizard_step", nextStep.toString());
    }
  }


  function handleBack() {
    if (step > 0) {
      const prevStep = step - 1;
      setStep(prevStep);
      localStorage.setItem("wizard_step", prevStep.toString());
    }
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
                      answers[currentQuestion.id] === option.value
                        ? "2px solid #2563eb"
                        : "2px solid #ccc",
                    background:
                      answers[currentQuestion.id] === option.value
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
