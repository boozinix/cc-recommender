"use client";

import { useState } from "react";
import { STORAGE_KEY } from "../lib/friends";
import { getTheme } from "../lib/theme";

const FORMSPREE_ENDPOINT = process.env.NEXT_PUBLIC_FORMSPREE_ID
  ? `https://formspree.io/f/${process.env.NEXT_PUBLIC_FORMSPREE_ID}`
  : null;

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const friendName =
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) || "Unknown" : "Unknown";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!feedback.trim() || !FORMSPREE_ENDPOINT) return;

    setStatus("sending");
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback: feedback.trim(),
          friend_identifier: friendName,
          _subject: `Card Scout Feedback from ${friendName}`,
        }),
      });
      if (res.ok) {
        setStatus("success");
        setFeedback("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      {/* Floating chat icon */}
      <button
        type="button"
        className="fixed-bottom-safe fixed-right-safe tap-target"
        onClick={() => setOpen(!open)}
        aria-label="Give feedback"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: getTheme("personal").primary,
          color: "white",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(30, 64, 175, 0.4)",
          zIndex: 9997,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Feedback modal */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: 16,
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              background: "var(--background, #fff)",
              borderRadius: 12,
              padding: 24,
              maxWidth: 400,
              width: "100%",
              boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 32,
                height: 32,
                padding: 0,
                border: "none",
                background: "transparent",
                color: "#64748b",
                cursor: "pointer",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>Send feedback</h3>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>
              Your feedback helps improve the recommendations. It will be linked to your access so we know who sent it.
            </p>

            {!FORMSPREE_ENDPOINT ? (
              <>
                <p style={{ fontSize: 14, color: "#dc2626", marginBottom: 16 }}>
                  Feedback form not configured. Add NEXT_PUBLIC_FORMSPREE_ID to your environment. See README.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    background: getTheme("personal").primary,
                    color: "white",
                    border: "none",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="What worked? What didn't? Any suggestions?"
                  rows={4}
                  disabled={status === "sending"}
                  style={{
                    width: "100%",
                    padding: 12,
                    fontSize: 15,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    marginBottom: 16,
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <button
                    type="submit"
                    disabled={!feedback.trim() || status === "sending"}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 8,
                      background: feedback.trim() && status !== "sending" ? getTheme("personal").primary : "#94a3b8",
                      color: "white",
                      border: "none",
                      fontWeight: 600,
                      cursor: feedback.trim() && status !== "sending" ? "pointer" : "not-allowed",
                    }}
                  >
                    {status === "sending" ? "Sending…" : "Send"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 8,
                      background: "transparent",
                      color: "#64748b",
                      border: "1px solid #e2e8f0",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
                {status === "success" && (
                  <p style={{ marginTop: 12, color: "#16a34a", fontSize: 14 }}>Thanks! Feedback sent.</p>
                )}
                {status === "error" && (
                  <p style={{ marginTop: 12, color: "#dc2626", fontSize: 14 }}>Failed to send. Try again.</p>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
