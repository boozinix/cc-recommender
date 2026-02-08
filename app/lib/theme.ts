/**
 * Single source of truth for personal vs business card mode colors.
 * Used by: wizard, results, comparison, sandbox-results.
 * To change the business card scheme later, edit BUSINESS below and it applies everywhere.
 */

export type CardMode = "personal" | "business";

export type Theme = {
  primary: string;
  primaryLight: string;
  primaryLighter: string;
  primaryDark: string;
  /** Wizard page background gradient; results page does not use this */
  backgroundGradient: string;
  /** "Business card" pill on results – same in both modes so one place to change */
  businessBadge: { bg: string; text: string };
};

const PERSONAL: Theme = {
  primary: "#2563eb",
  primaryLight: "#eef2ff",
  primaryLighter: "#c7d2fe",
  primaryDark: "#1e3a8a",
  backgroundGradient: "radial-gradient(circle at top, #eef2ff, #ffffff)",
  businessBadge: { bg: "#fce7f3", text: "#be185d" },
};

const BUSINESS: Theme = {
  primary: "#9d8468",
  primaryLight: "#e8dfd4",
  primaryLighter: "#d4c4b0",
  primaryDark: "#5c4a3d",
  backgroundGradient: "radial-gradient(circle at top, #e8dfd4, #ffffff)",
  businessBadge: { bg: "#e8dfd4", text: "#5c4a3d" },
};

export function getTheme(mode: CardMode | null | undefined): Theme {
  return mode === "business" ? BUSINESS : PERSONAL;
}
