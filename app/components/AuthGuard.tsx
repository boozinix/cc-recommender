"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Watermark } from "./Watermark";
import { STORAGE_KEY } from "../lib/friends";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [friendName, setFriendName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname === "/login") {
      setFriendName(null);
      setReady(true);
      return;
    }
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!stored) {
      router.replace("/login");
      setReady(true);
      return;
    }
    setFriendName(stored);
    setReady(true);
  }, [pathname, router]);

  // Avoid flash of wrong content
  if (!ready) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui",
        }}
      >
        Loading…
      </div>
    );
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {friendName && <Watermark friendName={friendName} />}
    </>
  );
}
