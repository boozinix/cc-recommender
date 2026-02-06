"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FRIEND_PASSWORDS, STORAGE_KEY } from "../lib/friends";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = password.trim();
    const friendName = FRIEND_PASSWORDS[trimmed];
    if (!friendName) {
      setError("Invalid password. Check with the person who shared this link.");
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, friendName);
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
      <p style={{ color: "#64748b", marginBottom: 32, fontSize: 15 }}>
        Enter your access password
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: 320,
        }}
      >
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          placeholder="Password"
          autoFocus
          style={{
            width: "100%",
            padding: "14px 18px",
            fontSize: 16,
            borderRadius: 10,
            border: error ? "2px solid #dc2626" : "1px solid #ccc",
            marginBottom: 16,
            boxSizing: "border-box",
          }}
        />
        {error && (
          <p style={{ color: "#dc2626", fontSize: 14, marginBottom: 12 }}>
            {error}
          </p>
        )}
        <button
          type="submit"
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
      </form>
    </div>
  );
}
