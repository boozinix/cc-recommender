"use client";

import { useState, useEffect } from "react";
import { CardScoutLogo } from "../components/CardScoutLogo";
import { FAQButton } from "../components/FAQButton";
import { useRouter } from "next/navigation";
import { STORAGE_KEY } from "../lib/friends";
import { getTheme } from "../lib/theme";

export default function LoginPage() {
  const [status, setStatus] = useState<"assigning" | "assigned" | "atLimit" | "error">("assigning");
  const [userNumber, setUserNumber] = useState<number | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) {
      router.replace("/");
      return;
    }
    fetch("/api/next-user")
      .then((res) => res.json())
      .then((data) => {
        if (data.atLimit) {
          setStatus("atLimit");
        } else if (data.userNumber) {
          setUserNumber(data.userNumber);
          setStatus("assigned");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [router]);

  function handleContinue() {
    if (!userNumber) return;
    const entered = passwordInput.trim();
    const num = parseInt(entered, 10);
    if (entered !== String(userNumber) && num !== userNumber) {
      setPasswordError("Please enter your client number correctly.");
      return;
    }
    setPasswordError(null);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, `Client ${userNumber}`);
    }
    router.push("/");
    router.refresh();
  }

  const passwordCorrect = passwordInput.trim() === String(userNumber) || parseInt(passwordInput.trim(), 10) === userNumber;
  const theme = getTheme("personal");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui",
        padding: 24,
        background: theme.backgroundGradient,
        color: "var(--foreground, #171717)",
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <CardScoutLogo
          width={286}
          height={156}
          mode="personal"
          style={{ flexShrink: 0 }}
        />
      </div>
      <p style={{ color: "#64748b", marginBottom: 32, fontSize: 15, textAlign: "center" }}>
        One stop shop to find your next credit card
      </p>

      {status === "assigning" && (
        <p style={{ color: "#64748b", marginTop: 16 }}>Assigning your number…</p>
      )}

      {status === "assigned" && userNumber && (
        <div style={{ textAlign: "center", width: "100%", maxWidth: 360, marginTop: 16 }}>
          <p style={{ fontSize: 18, marginBottom: 12 }}>
            Welcome! You are <strong>Client #{userNumber}</strong>.
          </p>
          <p style={{ color: "#64748b", marginBottom: 16, fontSize: 15 }}>
            Enter <strong>{userNumber}</strong> below to continue.
          </p>
          <input
            type="text"
            inputMode="numeric"
            value={passwordInput}
            onChange={(e) => {
              setPasswordInput(e.target.value.replace(/\D/g, ""));
              setPasswordError(null);
            }}
            placeholder="Enter your client number"
            autoFocus
            style={{
              width: "100%",
              padding: "14px 18px",
              fontSize: 16,
              borderRadius: 10,
              border: passwordError ? "2px solid #dc2626" : "1px solid #ccc",
              marginBottom: 12,
              boxSizing: "border-box",
            }}
          />
          {passwordError && (
            <p style={{ color: "#dc2626", fontSize: 14, marginBottom: 12 }}>{passwordError}</p>
          )}
          <button
            type="button"
            onClick={handleContinue}
            disabled={!passwordCorrect}
            style={{
              width: "100%",
              padding: "14px 24px",
              borderRadius: 10,
              background: passwordCorrect ? theme.primary : "#94a3b8",
              color: "white",
              border: "none",
              fontSize: 16,
              fontWeight: 600,
              cursor: passwordCorrect ? "pointer" : "not-allowed",
            }}
          >
            Continue
          </button>
        </div>
      )}

      {status === "atLimit" && (
        <p style={{ color: "#dc2626", marginTop: 32, textAlign: "center" }}>
          We've reached the limit of 500 test users.
        </p>
      )}

      {status === "error" && (
        <p style={{ color: "#dc2626", marginTop: 32, textAlign: "center" }}>
          Something went wrong. Please refresh the page.
        </p>
      )}

      <FAQButton />
    </div>
  );
}
