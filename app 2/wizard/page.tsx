"use client";

/* =====================================================
   FILE: app/wizard/page.tsx
   PURPOSE: Guided question flow
   ===================================================== */

/* =======================
   SECTION A — Imports
   ======================= */
import { useState } from "react";

/* =======================
   SECTION B — Questions
   ======================= */
const questions = [
  {
    id: "primary_goal",
    question: "What do you want this card to be best at?",
    options: [
      { value: "Cashback", label: "💵 Cashback" },
      { value: "Travel", label: "✈️ Travel rewards" },
      { value: "Bonus", label: "🎁 Big signup bonus" }
    ]
  },
  {
    id: "spend_comfort",
    question: "How comfortable are you meeting a spending requirement?",
    options: [
      { value: "Low", label: "Low ($1k or less)" },
      { value: "Medium", label: "Medium ($3k)" },
      { value: "High", label: "High ($5k+)" }
    ]
  },
  {
    id: "annual_fee_tolerance",
    question: "How do you feel about annual fees?",
    options: [
      { value: "Low", label: "Prefer $0" },
      { value: "Medium", label: "Up to $100" },
      { value: "High", label: "$300+ is fine" }
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

/* =======================
   SECTION C — Animations
   ======================= */
const fadeInStyle = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

/* =======================
   SECTION D — Component
   ======================= */
export default function Wizard() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<any>({});

  const currentQuestion = questions[step];

  function handleAnswer(value: string) {
    const updated = {
      ...answers,
      [currentQuestion.id]: value
    };

    setAnswers(updated);

    if (step === questions.length - 1) {
      localStorage.setItem("answers", JSON.stringify(updated));
      window.location.href = "/results";
    } else {
      setStep(step + 1);
    }
  }

  /* =======================
     SECTION E — UI
     ======================= */
  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui",
        background: "radial-gradient(circle at top, #eef2ff, #ffffff)"
      }}
    >
      <style>{fadeInStyle}</style>

      {/* Progress Bar */}
      <div style={{ width: 300, marginBottom: 24, zIndex: 2 }}>
        <div style={{ fontSize: 14 }}>
          Step {step + 1} of {questions.length}
        </div>
        <div style={{ height: 6, background: "#ddd", borderRadius: 4 }}>
          <div
            style={{
              height: 6,
              width: `${((step + 1) / questions.length) * 100}%`,
              background: "#2563eb",
              borderRadius: 4,
              transition: "width 0.3s ease"
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div
        key={step}
        style={{
          animation: "fadeIn 0.3s ease",
          textAlign: "center",
          zIndex: 2
        }}
      >
        <h2 style={{ marginBottom: 32 }}>
          {currentQuestion.question}
        </h2>

        <div style={{ display: "grid", gap: 16 }}>
          {currentQuestion.options.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleAnswer(opt.value)}
              style={{
                padding: "16px 24px",
                fontSize: 18,
                borderRadius: 10,
                border: "2px solid #ccc",
                background: "#fff",
                cursor: "pointer"
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
