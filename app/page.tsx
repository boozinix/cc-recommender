/* =====================================================
   FILE: app/page.tsx
   PURPOSE: Homepage / entry point
   - Option 1: Answer questions (wizard)
   - Option 2: Describe what you want (prompt → keyword-based results)
   ===================================================== */

"use client";

import { useState } from "react";
import { promptToAnswers } from "./lib/promptToAnswers";

export default function Home() {
  const [prompt, setPrompt] = useState("");

  function handlePromptSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = prompt.trim();
    const answers = promptToAnswers(trimmed);
    localStorage.setItem("answers", JSON.stringify(answers));
    localStorage.setItem("card_mode", (answers.card_mode as string) || "personal");
    window.location.href = "/results";
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui",
        padding: 24
      }}
    >
      <h1 style={{ fontSize: 36, marginBottom: 16 }}>
        What Credit Card Should I Get?
      </h1>

      <p style={{ marginBottom: 24, color: "#555", textAlign: "center", maxWidth: 420 }}>
        Get recommendations by answering a few questions, or describe what you want in your own words.
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
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. travel card with higher rewards, no annual fee cashback"
          style={{
            width: "100%",
            padding: "14px 18px",
            fontSize: 16,
            borderRadius: 10,
            border: "1px solid #ccc",
            marginBottom: 12
          }}
          aria-label="Describe the card you want"
        />
        <button
          type="submit"
          disabled={!prompt.trim()}
          style={{
            padding: "12px 24px",
            borderRadius: 10,
            background: prompt.trim() ? "#2563eb" : "#94a3b8",
            color: "white",
            border: "none",
            fontSize: 16,
            fontWeight: 600,
            cursor: prompt.trim() ? "pointer" : "not-allowed"
          }}
        >
          Get recommendations
        </button>
      </form>

      <p style={{ marginBottom: 12, color: "#888", fontSize: 14 }}>
        or
      </p>

      <a
        href="/wizard"
        style={{
          padding: "14px 28px",
          borderRadius: 10,
          background: "transparent",
          color: "#2563eb",
          textDecoration: "none",
          fontSize: 18,
          fontWeight: "bold",
          border: "2px solid #2563eb"
        }}
      >
        Answer questions instead →
      </a>
    </div>
  );
}
