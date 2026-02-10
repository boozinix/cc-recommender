"use client";

import Link from "next/link";
import { useState } from "react";
import { refinementQuestions } from "@/app/lib/refinementQuestions";
import type { Answers } from "@/app/lib/resultsScoring";
import type { Theme } from "@/app/lib/theme";

export type InitialQuestion = {
  id: string;
  question: string;
  options: { value: string; label: string }[];
};

type ResultsLeftPanelProps = {
  answers: Answers;
  setAnswers: React.Dispatch<React.SetStateAction<Answers>>;
  initialQuestions: InitialQuestion[];
  getInitialAnswerDisplay: (questionId: string, answerValue: unknown) => string;
  theme: Theme;
  backHref?: string;
  backLabel?: string;
  resetStorageOnBack?: boolean;
};

export function ResultsLeftPanel({
  answers,
  setAnswers,
  initialQuestions,
  getInitialAnswerDisplay,
  theme,
  backHref,
  backLabel,
  resetStorageOnBack,
}: ResultsLeftPanelProps) {
  const [hoveredAnswerIndex, setHoveredAnswerIndex] = useState<number | null>(null);
  const [refinementOpen, setRefinementOpen] = useState(false);
  const [advancedModeOpen, setAdvancedModeOpen] = useState(false);

  const visibleRefinements = refinementQuestions.filter(q =>
    q.dependsOn ? q.dependsOn(answers) : true
  );

  return (
    <div className="results-left" style={{ background: "var(--surface-elevated)", borderRadius: 12, padding: 20 }}>
      <a
        href={backHref || "/"}
        className="results-tap-target"
        onClick={(e) => {
          e.preventDefault();
          if (resetStorageOnBack !== false) {
            localStorage.removeItem("answers");
            localStorage.removeItem("card_mode");
            localStorage.removeItem("wizard_step");
          }
          window.location.href = backHref || "/";
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          marginBottom: 20,
          padding: "10px 18px",
          borderRadius: 8,
          background: "#111827",
          color: "#ffffff",
          textDecoration: "none",
          fontSize: 14,
          fontWeight: 600,
          border: "none",
          cursor: "pointer"
        }}
        >
          {backLabel || "← Back"}
      </a>

      {/* Personal / Business */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["personal", "business"] as const).map(mode => (
          <button
            key={mode}
            type="button"
            className={`results-tap-target results-mode-btn ${(answers.card_mode || "personal") !== mode ? "results-mode-btn-unselected" : ""}`}
            onClick={() => {
              setAnswers(prev => ({ ...prev, card_mode: mode }));
              if (typeof localStorage !== "undefined") {
                localStorage.setItem("card_mode", mode);
              }
            }}
            style={{
              padding: "10px 20px",
              borderRadius: 6,
              border: `2px solid ${(answers.card_mode || "personal") === mode ? theme.primary : theme.primaryLighter}`,
              background: (answers.card_mode || "personal") === mode ? theme.primary : "var(--surface-elevated)",
              color: (answers.card_mode || "personal") === mode ? "#ffffff" : theme.primaryDark,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer"
            }}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {/* Your answers */}
      <div
        style={{
          marginBottom: 24,
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--text-secondary)",
            padding: "12px 14px",
            background: "var(--gradient-header)",
            borderBottom: "1px solid var(--border)"
          }}
        >
          Your answers
        </div>
        <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, color: "var(--text-muted-light)" }}>
            Click any answer to change it.
          </p>
          {initialQuestions.map((q, stepIndex) => {
            const answer = q.id === "primary_goal" ? answers.primary_goal_ranked : answers[q.id];
            const display = getInitialAnswerDisplay(q.id, answer);
            if (!display) return null;
            const isHovered = hoveredAnswerIndex === stepIndex;
            return (
              <div
                key={q.id}
                className="results-left-answer-box"
                onClick={() => {
                  if (typeof localStorage !== "undefined") {
                    localStorage.setItem("wizard_step", String(stepIndex));
                  }
                  window.location.href = "/wizard";
                }}
                onMouseEnter={() => setHoveredAnswerIndex(stepIndex)}
                onMouseLeave={() => setHoveredAnswerIndex(null)}
                style={{
                  fontSize: 13,
                  padding: "10px 14px",
                  background: isHovered ? theme.primaryLighter : theme.primaryLight,
                  borderRadius: 8,
                  border: `1px solid ${theme.primaryLighter}`,
                  borderLeft: `3px solid ${theme.primary}`,
                  boxShadow: isHovered ? `0 2px 6px ${theme.primary}26` : "0 1px 2px rgba(0,0,0,0.04)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  transform: isHovered ? "translateY(-2px)" : "translateY(0)"
                }}
              >
                <span
                  className="results-left-q-pill"
                  style={{
                    display: "inline-block",
                    fontWeight: 700,
                    color: theme.primaryDark,
                    background: "rgba(255,255,255,0.8)",
                    padding: "2px 8px",
                    borderRadius: 6,
                    marginRight: 8,
                    fontSize: 12
                  }}
                >
                  Q{stepIndex + 1}
                </span>
                <span className="results-left-answer-text" style={{ color: "var(--pill-text)" }}>{display}</span>
                {isHovered && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: theme.primary, fontWeight: 600 }}>Edit</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Refine your results */}
      <div
        className="results-refine-box"
        style={{
          marginBottom: 24,
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            fontSize: 14,
            fontWeight: 700,
            color: "var(--text-secondary)",
            padding: "12px 14px",
            background: "var(--gradient-header)",
            borderBottom: refinementOpen ? "1px solid var(--border)" : "none"
          }}
        >
          <span>Refine your results</span>
          <button
            type="button"
            className="refinement-mobile-toggle tap-target"
            onClick={() => setRefinementOpen((prev) => !prev)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface-elevated)",
              color: "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {refinementOpen ? "Hide" : "Show refinement questions"}
          </button>
        </div>
        <div className={`refinement-content ${refinementOpen ? "" : "refinement-content-collapsed"}`} style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 14 }}>
          {visibleRefinements.map(q => (
            <div
              key={q.id}
              style={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "14px 16px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
              }}
            >
              <div className="results-refine-question" style={{ fontWeight: 600, color: theme.primaryDark, fontSize: 14, marginBottom: 6 }}>
                {q.question}
              </div>
              {"helper" in q && q.helper && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
                  {q.helper}
                </div>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {"multiSelect" in q && q.multiSelect ? (
                  q.options.map((option: { value: string; label: string }) => {
                    const selected: string[] = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : [];
                    const isChecked = selected.includes(option.value);
                    return (
                      <label
                        key={option.value}
                        className="tap-target"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: `1px solid ${isChecked ? theme.primary : theme.primaryLighter}`,
                          background: isChecked ? theme.primaryLight : "var(--surface-elevated)",
                          cursor: "pointer",
                          fontSize: 13
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setAnswers(prev => {
                              const current: string[] = Array.isArray(prev[q.id]) ? (prev[q.id] as string[]) : [];
                              const next = current.includes(option.value)
                                ? current.filter(v => v !== option.value)
                                : [...current, option.value];
                              return { ...prev, [q.id]: next };
                            });
                          }}
                        />
                        <span style={{ color: isChecked ? theme.primaryDark : "var(--pill-text)" }}>{option.label}</span>
                      </label>
                    );
                  })
                ) : (
                  q.options.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      className={`tap-target results-refine-option-btn ${answers[q.id] === option.value ? "selected" : ""}`}
                      onClick={() =>
                        setAnswers(prev => ({ ...prev, [q.id]: option.value }))
                      }
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: `1px solid ${theme.primaryLighter}`,
                        background:
                          answers[q.id] === option.value ? theme.primary : "var(--surface-elevated)",
                        color:
                          answers[q.id] === option.value ? "#ffffff" : theme.primaryDark,
                        fontSize: 13
                      }}
                    >
                      {option.label}
                    </button>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Mode */}
      <div
        className="results-advanced-mode-box"
        style={{
          marginBottom: 24,
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            fontSize: 14,
            fontWeight: 700,
            color: "var(--text-secondary)",
            padding: "12px 14px",
            background: "var(--gradient-header)",
            borderBottom: advancedModeOpen ? "1px solid var(--border)" : "none"
          }}
        >
          <span>Advanced Mode</span>
          <button
            type="button"
            className="refinement-mobile-toggle tap-target"
            onClick={() => setAdvancedModeOpen((prev) => !prev)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface-elevated)",
              color: "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {advancedModeOpen ? "Hide" : "Show"}
          </button>
        </div>
        <div className={`advanced-mode-content ${advancedModeOpen ? "" : "refinement-content-collapsed"}`} style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "14px 16px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
            }}
          >
            <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14, marginBottom: 8 }}>
              Do you want to maximize rewards for a specific spend?
            </div>
            <Link
              href="/max-rewards-mode"
              className="tap-target"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 16px",
                borderRadius: 8,
                border: `2px solid ${theme.primary}`,
                background: theme.primaryLight,
                color: theme.primaryDark,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                cursor: "pointer"
              }}
            >
              Maximize rewards mode →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
