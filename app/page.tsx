/* =====================================================
   FILE: app/page.tsx
   PURPOSE: Homepage / entry point
   - Option 1: Answer questions (wizard)
   - Option 2: Describe what you want (prompt → keyword-based results)
   ===================================================== */

"use client";

import { useState, useRef, useEffect } from "react";
import { CardScoutLogo } from "./components/CardScoutLogo";
import { FAQButton } from "./components/FAQButton";
import { promptToAnswers } from "./lib/promptToAnswers";
import { STORAGE_KEY } from "./lib/friends";
import { getTheme } from "./lib/theme";

const SUGGESTIONS = [
  "cash back, groceries",
  "travel rewards, no annual fee",
  "big signup bonus",
  "no annual fee",
  "business card"
];

const FORMSPREE_ENDPOINT = process.env.NEXT_PUBLIC_FORMSPREE_ID
  ? `https://formspree.io/f/${process.env.NEXT_PUBLIC_FORMSPREE_ID}`
  : null;

function logPrompt(prompt: string, outcome: "success" | "error", errorMessage?: string) {
  if (!FORMSPREE_ENDPOINT) return;
  const friendId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) || "Unknown" : "Unknown";
  fetch(FORMSPREE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      _subject: `Prompt: ${outcome}`,
      prompt,
      outcome,
      error_message: errorMessage || "",
      friend_identifier: friendId,
    }),
  }).catch(() => {});
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const theme = getTheme("personal");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handlePromptSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = prompt.trim();
    const result = promptToAnswers(trimmed);
    if (!result.ok) {
      logPrompt(trimmed, "error", result.error);
      setError(result.error);
      return;
    }
    logPrompt(trimmed, "success");
    localStorage.setItem("answers", JSON.stringify(result.answers));
    localStorage.setItem("card_mode", (result.answers.card_mode as string) || "personal");
    window.location.href = "/results";
  }

  return (
    <div
      className="home-page"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        fontFamily: "system-ui",
        padding: 24,
        paddingTop: 60,
        background: theme.backgroundGradient
      }}
    >
      {/* Temporary: test CardScout_logo_light_transparent.svg — revert to <CardScoutLogo ... /> if you prefer the original SVG logo */}
      <img
        src="/CardScout_logo_light_transparent.svg"
        alt="Card Scout"
        width={286}
        height={156}
        style={{ marginBottom: 20, flexShrink: 0, objectFit: "contain" }}
      />

      <p style={{ marginBottom: 24, color: "var(--text-muted)", textAlign: "center", maxWidth: 420 }}>
        One stop shop to find your next credit card. We'll help you find within less than 30 seconds.
      </p>

      {/* Chat-style prompt */}
      <form
        onSubmit={handlePromptSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: 420,
          marginBottom: 32
        }}
      >
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8, textAlign: "center", width: "100%" }}>
          Beta mode — please use simple words or phrases only.
        </p>
        <div ref={suggestionRef} style={{ position: "relative", width: "100%", marginBottom: 12 }}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => { setPrompt(e.target.value); setError(null); }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="e.g. travel card with higher rewards, no annual fee cashback"
            style={{
              width: "100%",
              padding: "14px 18px",
              fontSize: 16,
              borderRadius: 10,
              border: error ? "2px solid #dc2626" : `2px solid ${theme.primaryLighter}`,
              background: "var(--input-bg)",
              boxSizing: "border-box"
            }}
            aria-label="Describe the card you want"
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
            autoComplete="off"
          />
          {showSuggestions && (
            <ul
              role="listbox"
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                margin: 0,
                marginTop: 4,
                padding: 4,
                listStyle: "none",
                background: "var(--surface-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                zIndex: 10,
                maxHeight: 240,
                overflowY: "auto"
              }}
            >
              {SUGGESTIONS.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    role="option"
                    onClick={() => {
                      setPrompt(suggestion);
                      setError(null);
                      setShowSuggestions(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      textAlign: "left",
                      border: "none",
                      borderRadius: 6,
                      background: "transparent",
                      color: "var(--text-primary)",
                      fontSize: 14,
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.primaryLight;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {error && (
          <p style={{ color: "#dc2626", fontSize: 14, marginBottom: 12, textAlign: "center" }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          className="home-primary-btn"
          disabled={!prompt.trim()}
          style={{
            padding: "14px 28px",
            borderRadius: 10,
            background: prompt.trim() ? theme.primaryDark : "#94a3b8",
            color: "white",
            border: "none",
            fontSize: 16,
            fontWeight: 700,
            cursor: prompt.trim() ? "pointer" : "not-allowed",
            boxShadow: prompt.trim() ? `0 2px 8px ${theme.primaryDark}99` : "0 2px 4px rgba(0,0,0,0.1)"
          }}
        >
          Get recommendations
        </button>
      </form>

      <p style={{ marginBottom: 12, color: "var(--text-muted-light)", fontSize: 14 }}>
        or
      </p>

      <a
        href="/wizard"
        className="home-wizard-link"
        style={{
          padding: "14px 28px",
          borderRadius: 10,
          background: "transparent",
          color: theme.primary,
          textDecoration: "none",
          fontSize: 18,
          fontWeight: "bold",
          border: `2px solid ${theme.primary}`
        }}
      >
        Answer 3 simple questions!
      </a>

      <FAQButton />
    </div>
  );
}
