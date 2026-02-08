"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { STORAGE_KEY } from "../lib/friends";

export default function LoginPage() {
  const [status, setStatus] = useState<"assigning" | "assigned" | "atLimit" | "error">("assigning");
  const [userNumber, setUserNumber] = useState<number | null>(null);
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
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, `Client ${userNumber}`);
    }
    router.push("/");
    router.refresh();
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
        padding: 24,
        background: "var(--background, #fff)",
        color: "var(--foreground, #171717)",
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Credit Card Recommender</h1>

      {status === "assigning" && (
        <p style={{ color: "#64748b", marginTop: 32 }}>Assigning your number…</p>
      )}

      {status === "assigned" && userNumber && (
        <div style={{ textAlign: "center", width: "100%", maxWidth: 360, marginTop: 32 }}>
          <p style={{ fontSize: 18, marginBottom: 12 }}>
            Welcome! You are <strong>Client #{userNumber}</strong>.
          </p>
          <p style={{ color: "#64748b", marginBottom: 24, fontSize: 15 }}>
            Please use <strong>{userNumber}</strong> as the password to login.
          </p>
          <button
            type="button"
            onClick={handleContinue}
            style={{
              width: "100%",
              padding: "14px 24px",
              borderRadius: 10,
              background: "#2563eb",
              color: "white",
              border: "none",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Continue
          </button>
        </div>
      )}

      {status === "atLimit" && (
        <p style={{ color: "#dc2626", marginTop: 32, textAlign: "center" }}>
          We've reached the limit of 100 test users.
        </p>
      )}

      {status === "error" && (
        <p style={{ color: "#dc2626", marginTop: 32, textAlign: "center" }}>
          Something went wrong. Please refresh the page.
        </p>
      )}
    </div>
  );
}
