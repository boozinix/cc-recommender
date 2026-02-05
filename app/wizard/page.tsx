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
  // Feature Flags
  // -----------------------
  // Set to false to hide the floating previous answers summary
  const SHOW_PREVIOUS_ANSWERS = true;

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

  // Helper function to get answer display text
  function getAnswerDisplay(questionId: string, answerValue: any): string {
    const question = questions.find(q => q.id === questionId);
    if (!question) return "";
    
    if (questionId === "primary_goal" && Array.isArray(answerValue)) {
      // For ranked goals, show top 2
      const top2 = answerValue.slice(0, 2);
      return top2.map((val: string, idx: number) => {
        const option = question.options.find(o => o.value === val);
        return `${idx + 1}. ${option?.label || val}`;
      }).join(" • ");
    }
    
    const option = question.options.find(o => o.value === answerValue);
    return option?.label || answerValue || "";
  }

  // Get previous answers for display (only show if step > 0)
  const previousAnswers = step > 0 
    ? questions.slice(0, step).map((q, idx) => {
        const answer = q.id === "primary_goal" 
          ? answers.primary_goal_ranked 
          : answers[q.id];
        return {
          question: q.question,
          answer: getAnswerDisplay(q.id, answer),
          stepNumber: idx + 1,
          stepIndex: idx // 0-based index for navigation
        };
      }).filter(item => item.answer) // Only show if answered
    : [];

  // Handle clicking on a previous answer to jump back to that question
  function handleJumpToQuestion(targetStepIndex: number) {
    setStep(targetStepIndex);
    localStorage.setItem("wizard_step", targetStepIndex.toString());
  }

  // Color theme: blue for personal, pink for business
  const primaryColor = cardMode === "business" ? "#ec4899" : "#2563eb";
  const primaryColorLight = cardMode === "business" ? "#fce7f3" : "#eef2ff";
  const primaryColorLighter = cardMode === "business" ? "#fbcfe8" : "#c7d2fe";
  const primaryColorDark = cardMode === "business" ? "#be185d" : "#1e3a8a";
  const backgroundGradient = cardMode === "business" 
    ? "radial-gradient(circle at top, #fce7f3, #ffffff)"
    : "radial-gradient(circle at top, #eef2ff, #ffffff)";




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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, index: number) {
    e.dataTransfer.setData("dragIndex", index.toString());
    e.dataTransfer.effectAllowed = "move";
    setDraggedIndex(index);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }

  function handleDragLeave() {
    setDragOverIndex(null);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>, dropIndex: number) {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("dragIndex"), 10);
    if (dragIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...rankedGoals];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(dropIndex, 0, moved);

    setRankedGoals(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
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
        background: backgroundGradient
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
              border: `2px solid ${primaryColor}`,
              background: cardMode === mode ? primaryColor : "#fff",
              color: cardMode === mode ? "#fff" : primaryColor,
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
                background: primaryColor,
                borderRadius: 4
              }}
            />
          </div>
        </div>
      )}




      {/* =======================
          Previous Answers Summary (Floating)
         ======================= */}
      {SHOW_PREVIOUS_ANSWERS && cardMode && step > 0 && previousAnswers.length > 0 && (
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            marginBottom: 20,
            padding: "12px 16px",
            background: "#ffffff",
            borderRadius: 12,
            border: `1px solid ${primaryColorLighter}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            animation: "fadeIn 0.3s ease"
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>
            Your answers so far:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {previousAnswers.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleJumpToQuestion(item.stepIndex)}
                style={{
                  fontSize: 13,
                  color: "#1e293b",
                  padding: "8px 12px",
                  background: primaryColorLight,
                  borderRadius: 6,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  border: `1px solid ${primaryColorLighter}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = primaryColor;
                  e.currentTarget.style.borderColor = primaryColor;
                  e.currentTarget.style.transform = "translateX(4px)";
                  e.currentTarget.style.boxShadow = `0 2px 8px ${primaryColor}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = primaryColorLight;
                  e.currentTarget.style.borderColor = primaryColorLighter;
                  e.currentTarget.style.transform = "translateX(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: primaryColor }}>
                    Q{item.stepNumber}:
                  </span>{" "}
                  <span style={{ color: "#475569" }}>{item.answer}</span>
                </div>
                <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 8 }}>
                  ←
                </span>
              </div>
            ))}
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
            <>
              <div style={{ fontSize: 14, color: "#475569", marginBottom: 16, textAlign: "left" }}>
                💡 Drag and drop to reorder your priorities
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {rankedGoals.map((goal, index) => {
                  const label =
                    questions[0].options.find(o => o.value === goal)?.label;
                  const isDragging = draggedIndex === index;
                  const isDropTarget = dragOverIndex === index && draggedIndex !== index;

                  return (
                    <div
                      key={goal}
                      draggable
                      onDragStart={e => handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={e => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={e => handleDrop(e, index)}
                      style={{
                        padding: "14px 18px",
                        borderRadius: 10,
                        border: isDropTarget 
                          ? `2px solid ${primaryColor}` 
                          : `2px solid ${primaryColorLighter}`,
                        background: isDropTarget 
                          ? primaryColorLight 
                          : "#ffffff",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: isDragging ? "grabbing" : "grab",
                        opacity: isDragging ? 0.5 : 1,
                        transform: isDragging ? "scale(1.02)" : "scale(1)",
                        transition: "all 0.2s ease",
                        boxShadow: isDragging 
                          ? "0 8px 16px rgba(0,0,0,0.15)" 
                          : "0 2px 4px rgba(0,0,0,0.05)",
                        userSelect: "none"
                      }}
                      onMouseEnter={(e) => {
                        if (!isDragging) {
                          e.currentTarget.style.transform = "scale(1.02)";
                          e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDragging) {
                          e.currentTarget.style.transform = "scale(1)";
                          e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                        }
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ 
                          fontSize: 18, 
                          color: "#94a3b8",
                          cursor: "grab",
                          lineHeight: 1
                        }}>
                          ⋮⋮
                        </span>
                        <span>{index + 1}. {label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
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
                        ? `2px solid ${primaryColor}`
                        : "2px solid #ccc",
                    background:
                      answers[currentQuestion.id] === option.value
                        ? primaryColorLight
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
                  !isRankingStep && !selectedValue ? primaryColorLighter : primaryColor,
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
