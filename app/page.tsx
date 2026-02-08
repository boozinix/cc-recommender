/* =====================================================
   FILE: app/page.tsx
   PURPOSE: Homepage / entry point
   - Option 1: Answer questions (wizard)
   - Option 2: Describe what you want (prompt → keyword-based results)
   ===================================================== */

"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { promptToAnswers } from "./lib/promptToAnswers";
import { STORAGE_KEY } from "./lib/friends";
import { getTheme } from "./lib/theme";

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

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { results: Iterable<{ isFinal: boolean; item: (i: number) => { transcript: string } }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const SR = typeof window !== "undefined" && (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;
    if (!SR) return;
    setSpeechSupported(true);
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (e: { results: Iterable<{ isFinal: boolean; item: (i: number) => { transcript: string } }> }) => {
      const transcript = Array.from(e.results)
        .filter((r) => r.isFinal)
        .map((r) => r.item(0).transcript)
        .join("")
        .trim();
      if (transcript) {
        setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, []);

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setError(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  }

  const theme = getTheme("personal");

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
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui",
        padding: 24,
        background: theme.backgroundGradient
      }}
    >
      <Image
        src="/card-scout-logo.png"
        alt="Card Scout"
        width={286}
        height={156}
        priority
        style={{ marginBottom: 20, objectFit: "contain" }}
      />

      <p style={{ marginBottom: 24, color: "var(--text-muted)", textAlign: "center", maxWidth: 420 }}>
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
        <div style={{ position: "relative", width: "100%", marginBottom: 12 }}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => { setPrompt(e.target.value); setError(null); }}
            placeholder="e.g. travel card with higher rewards, no annual fee cashback"
            style={{
              width: "100%",
              padding: "14px 18px",
              paddingRight: 48,
              fontSize: 16,
              borderRadius: 10,
              border: error ? "2px solid #dc2626" : `2px solid ${theme.primaryLighter}`,
              background: "var(--input-bg)",
              boxSizing: "border-box"
            }}
            aria-label="Describe the card you want"
          />
          {speechSupported && (
            <button
              type="button"
              className="home-voice-btn"
              onClick={toggleListening}
              title={isListening ? "Stop listening" : "Voice input"}
              aria-label={isListening ? "Stop listening" : "Start voice input"}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "none",
                background: isListening ? "#dc2626" : theme.primaryLight,
                color: isListening ? "#fff" : theme.primary,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
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
            padding: "12px 24px",
            borderRadius: 10,
            background: prompt.trim() ? theme.primary : theme.primaryLighter,
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
        Answer questions instead →
      </a>
    </div>
  );
}
