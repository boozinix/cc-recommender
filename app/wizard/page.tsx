"use client";


// =======================
// Imports
// =======================
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getTheme } from "@/app/lib/theme";




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
  const [cardMode, setCardMode] = useState<"personal" | "business">("personal");
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

  // Theme from shared app/lib/theme.ts – change business/personal scheme there to apply everywhere
  const theme = getTheme(cardMode);




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
      } else {
        localStorage.setItem("card_mode", "personal");
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
    e.dataTransfer.setData("text/plain", index.toString()); // helps some browsers
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

  function moveRank(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= rankedGoals.length) return;
    const updated = [...rankedGoals];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
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


  const router = useRouter();

  function handleBack() {
    if (step === 0) {
      router.push("/");
      return;
    }
    const prevStep = step - 1;
    setStep(prevStep);
    localStorage.setItem("wizard_step", prevStep.toString());
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
        background: `radial-gradient(circle at top, ${theme.primaryLight}, var(--background))`
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
            className={cardMode !== mode ? "wizard-mode-btn-unselected" : ""}
            onClick={() => handleModeChange(mode as any)}
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              border: `2px solid ${theme.primary}`,
              background: cardMode === mode ? theme.primary : "var(--surface-elevated)",
              color: cardMode === mode ? "#fff" : theme.primary,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>




      <div style={{ width: 300, marginBottom: 24 }}>
        <div style={{ fontSize: 14, marginBottom: 6 }}>
          Step {step + 1} of {questions.length}
        </div>
        <div style={{ height: 6, background: "#e5e7eb", borderRadius: 4 }}>
          <div
            style={{
              height: 6,
              width: `${((step + 1) / questions.length) * 100}%`,
              background: theme.primary,
              borderRadius: 4
            }}
          />
        </div>
      </div>



      {/* =======================
          Previous Answers Summary (Floating)
         ======================= */}
      {SHOW_PREVIOUS_ANSWERS && step > 0 && previousAnswers.length > 0 && (
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            marginBottom: 20,
            padding: "12px 16px",
            background: "var(--surface-elevated)",
            borderRadius: 12,
            border: `1px solid ${theme.primaryLighter}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            animation: "fadeIn 0.3s ease"
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>
            Your answers so far:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {previousAnswers.map((item, idx) => (
              <div
                key={idx}
                className="wizard-prev-answer-row"
                onClick={() => handleJumpToQuestion(item.stepIndex)}
                style={{
                  fontSize: 13,
                  color: "var(--text-primary)",
                  padding: "8px 12px",
                  background: theme.primaryLight,
                  borderRadius: 6,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  border: `1px solid ${theme.primaryLighter}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.primary;
                  e.currentTarget.style.borderColor = theme.primary;
                  e.currentTarget.style.transform = "translateX(4px)";
                  e.currentTarget.style.boxShadow = `0 2px 8px ${theme.primary}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = theme.primaryLight;
                  e.currentTarget.style.borderColor = theme.primaryLighter;
                  e.currentTarget.style.transform = "translateX(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div>
                  <span className="wizard-prev-answer-q" style={{ fontWeight: 600, color: theme.primary }}>
                    Q{item.stepNumber}:
                  </span>{" "}
                  <span className="wizard-prev-answer-text" style={{ color: "var(--pill-text)" }}>{item.answer}</span>
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
            <div className="wizard-helper" style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
              {currentQuestion.helper}
            </div>
          )}




          {/* =======================
              Ranking Question
             ======================= */}
          {isRankingStep && (
            <>
              <div style={{ fontSize: 14, color: "var(--pill-text)", marginBottom: 16, textAlign: "left" }}>
                💡 Drag a row to reorder
                <span style={{ fontSize: 12, color: "var(--text-muted-light)", marginLeft: 8 }}>or use ↑↓ if needed</span>
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {rankedGoals.map((goal, index) => {
                  const label =
                    questions[0].options.find(o => o.value === goal)?.label;
                  const isDragging = draggedIndex === index;
                  const isDropTarget = dragOverIndex === index && draggedIndex !== index;
                  const canMoveUp = index > 0;
                  const canMoveDown = index < rankedGoals.length - 1;

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
                        padding: 0,
                        borderRadius: 10,
                        border: isDropTarget 
                          ? `2px solid ${theme.primary}` 
                          : `2px solid ${theme.primaryLighter}`,
                        background: isDropTarget 
                          ? theme.primaryLight 
                          : "var(--surface-elevated)",
                        display: "flex",
                        alignItems: "stretch",
                        cursor: isDragging ? "grabbing" : "grab",
                        opacity: isDragging ? 0.6 : 1,
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
                      {/* Big drag handle – easy to grab, full height */}
                      <div
                        style={{
                          width: 44,
                          minWidth: 44,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(0,0,0,0.04)",
                          borderRight: "1px solid var(--border)",
                          borderRadius: "8px 0 0 8px",
                          cursor: "grab",
                          flexShrink: 0
                        }}
                        title="Drag to reorder"
                      >
                        <span style={{ fontSize: 18, color: "var(--text-muted)", lineHeight: 1 }}>⋮⋮</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1, minWidth: 0, padding: "14px 14px 14px 16px" }}>
                        <span>{index + 1}. {label}</span>
                        <div
                          style={{ display: "flex", gap: 4, flexShrink: 0 }}
                          onClick={e => e.stopPropagation()}
                          onPointerDown={e => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            aria-label="Move up"
                            disabled={!canMoveUp}
                            onClick={() => moveRank(index, "up")}
                            style={{
                              padding: "6px 8px",
                              border: "1px solid var(--border)",
                              borderRadius: 6,
                              background: canMoveUp ? "var(--surface)" : "var(--pill-bg)",
                              color: canMoveUp ? "var(--text-muted)" : "var(--border)",
                              cursor: canMoveUp ? "pointer" : "default",
                              fontSize: 12
                            }}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            aria-label="Move down"
                            disabled={!canMoveDown}
                            onClick={() => moveRank(index, "down")}
                            style={{
                              padding: "6px 8px",
                              border: "1px solid var(--border)",
                              borderRadius: 6,
                              background: canMoveDown ? "var(--surface)" : "var(--pill-bg)",
                              color: canMoveDown ? "var(--text-muted)" : "var(--border)",
                              cursor: canMoveDown ? "pointer" : "default",
                              fontSize: 12
                            }}
                          >
                            ↓
                          </button>
                        </div>
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
                  className={answers[currentQuestion.id] === option.value ? "wizard-option-btn wizard-option-btn-selected" : "wizard-option-btn"}
                  onClick={() =>
                    setAnswers((prev: Record<string, string | string[]>) => ({
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
                        ? `2px solid ${theme.primary}`
                        : "2px solid var(--input-border)",
                    background:
                      answers[currentQuestion.id] === option.value
                        ? theme.primaryLight
                        : "var(--input-bg)",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
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
              style={{
                padding: "12px 20px",
                borderRadius: 8,
                background: "#111827",
                color: "#ffffff",
                border: "none",
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              ← Back
            </button>


            <button
              className="wizard-continue-btn"
              onClick={handleContinue}
              disabled={!isRankingStep && !selectedValue}
              style={{
                padding: "12px 24px",
                borderRadius: 999,
                background:
                  !isRankingStep && !selectedValue ? theme.primaryLighter : theme.primary,
                color: "var(--surface-elevated)",
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
