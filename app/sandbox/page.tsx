"use client";

/**
 * Sandbox page — try ideas here without touching the main app.
 * Link: /sandbox
 *
 * Use this to:
 * - Prototype new UI or logic
 * - Test refactored components before swapping them into home/wizard/results
 * - Experiment with different layouts or copy
 *
 * Nothing on this page affects the real flows until you choose to copy code back.
 */

export default function SandboxPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        fontFamily: "system-ui",
        background: "var(--surface, #f8fafc)",
        color: "var(--text-primary, #0f172a)",
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Sandbox</h1>
      <p style={{ color: "var(--text-muted, #64748b)", marginBottom: 24 }}>
        Try ideas here. Changes on this page don’t affect the main app.
      </p>
      <p style={{ fontSize: 14 }}>
        <a href="/sandbox/sandbox-results" style={{ color: "#2563eb", textDecoration: "underline", marginRight: 16 }}>
          Sandbox results (copy of /results) →
        </a>
        <a href="/" style={{ color: "#2563eb", textDecoration: "underline" }}>
          ← Back to app
        </a>
      </p>
    </div>
  );
}
