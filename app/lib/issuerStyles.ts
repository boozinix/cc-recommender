/**
 * Shared issuer colors and logo paths for card tiles and comparison.
 * Single place to change bank/brand styling across all pages.
 */

import type { Card } from "./cardTypes";

export const issuerColors: Record<string, { bg: string; text: string }> = {
  chase: { bg: "#1e3a8a", text: "#ffffff" },
  amex: { bg: "#e5e7eb", text: "#0f172a" },
  citi: { bg: "#0e7490", text: "#ffffff" },
  "bank of america": { bg: "#dc2626", text: "#ffffff" },
  "capital one": { bg: "#dc2626", text: "#ffffff" },
  barclays: { bg: "#e0f2fe", text: "#075985" },
  "u.s. bank": { bg: "#0f172a", text: "#ffffff" },
  "wells fargo": { bg: "#d71e28", text: "#ffffff" },
};

export function getIssuerStyle(issuer: string): { bg: string; text: string } {
  return issuerColors[issuer.toLowerCase()] ?? { bg: "#e5e7eb", text: "#111827" };
}

const bankLogoFiles: Record<string, string> = {
  Chase: "chase.svg",
  Citi: "citi.svg",
  "Capital One": "capital-one.svg",
  "Bank of America": "bank-of-america.svg",
  Amex: "american-express.svg",
  Barclays: "barclays.svg",
  "U.S. Bank": "usbank.png",
  "Wells Fargo": "wellsfargo.jpg",
};

export function getBankLogoPath(issuer: string): string | null {
  const file = bankLogoFiles[issuer];
  return file ? `/logos/banks/${file}` : null;
}

const brandLogoFiles: Record<string, string> = {
  alaska: "alaska.svg",
  american: "american.svg",
  breeze: "breeze.svg",
  choice: "choice.svg",
  delta: "delta.svg",
  expedia: "expedia.svg",
  frontier: "frontier.svg",
  hilton: "hilton.svg",
  hyatt: "hyatt.png",
  ihg: "ihg.svg",
  jetblue: "jetblue.svg",
  marriott: "marriott.svg",
  southwest: "southwest.svg",
  spirit: "spirit.svg",
  united: "united.svg",
  wyndham: "wyndham.svg",
};

export function getBrandLogoPath(card: Card): string | null {
  const model = (card.reward_model || "").toLowerCase();
  const isBranded = model === "airline" || model === "hotel" || model === "travel";
  if (!isBranded) return null;
  const family = (card.card_family || "").trim().toLowerCase();
  if (family && brandLogoFiles[family]) return `/logos/brands/${brandLogoFiles[family]}`;
  const name = card.card_name.toLowerCase();
  if (name.includes("frontier")) return "/logos/brands/frontier.svg";
  if (name.includes("hyatt")) return "/logos/brands/hyatt.png";
  if (name.includes("spirit")) return "/logos/brands/spirit.svg";
  if (name.includes("breeze")) return "/logos/brands/breeze.svg";
  if (name.includes("choice") || name.includes("privileges")) return "/logos/brands/choice.svg";
  if (name.includes("wyndham")) return "/logos/brands/wyndham.svg";
  if (name.includes("expedia") || name.includes("one key") || name.includes("hotels.com")) return "/logos/brands/expedia.svg";
  return null;
}
