"use client";

import { useRouter } from "next/navigation";
import { STORAGE_KEY } from "../lib/friends";

type Props = {
  friendName: string;
};

export function Watermark({ friendName }: Props) {
  const router = useRouter();

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <>
      {/* Subtle watermark — visible in screenshots to trace sharing */}
      <div
        style={{
          position: "fixed",
          top: 12,
          right: 12,
          fontSize: 11,
          color: "rgba(100, 116, 139, 0.5)",
          pointerEvents: "none",
          userSelect: "none",
          zIndex: 9998,
        }}
      >
        {friendName}
      </div>
      {/* Log out link — small, low profile */}
      <button
        onClick={handleLogout}
        type="button"
        aria-label="Log out"
        style={{
          position: "fixed",
          bottom: 10,
          left: 12,
          fontSize: 11,
          color: "rgba(100, 116, 139, 0.6)",
          background: "none",
          border: "none",
          cursor: "pointer",
          zIndex: 9999,
          textDecoration: "underline",
        }}
      >
        Log out
      </button>
    </>
  );
}
