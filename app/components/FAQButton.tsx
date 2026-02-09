"use client";

import Link from "next/link";

/**
 * Floating FAQ link: bottom-right on desktop, bottom-center on mobile.
 * Uses a distinct teal color so it doesn’t blend with primary blue; respects light/dark OS mode.
 */
export function FAQButton({ aboveFeedback }: { aboveFeedback?: boolean }) {
  return (
    <Link
      href="/faq"
      target="_blank"
      rel="noopener noreferrer"
      className={`faq-float-btn tap-target${aboveFeedback ? " faq-above-feedback" : ""}`}
      aria-label="Frequently asked questions (opens in new tab)"
    >
      <span aria-hidden>❓</span>
      <span>FAQ</span>
    </Link>
  );
}
