/**
 * Single source of truth for personal vs business card mode colors.
 * Used by: wizard, results, comparison, sandbox-results.
 * To change the business card scheme later, edit BUSINESS below and it applies everywhere.
 *
 * CSS variables (globals.css): set data-card-mode="personal" or data-card-mode="business"
 * on a wrapper (e.g. the page root) so that --accent, --accent-light, --business-badge-bg etc.
 * apply everywhere; CardTile and buttons then use var(--accent) for consistent theming.
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

/** Logo/background: #F6F8FE. Primary: middle blue between #2563eb (original) and #0A1249 (logo dark) */
const PERSONAL: Theme = {
  primary: "#1E40AF",
  primaryLight: "#dbeafe",
  primaryLighter: "#eff6ff",
  primaryDark: "#1E3A8A",
  backgroundGradient: "#F6F8FE",
  businessBadge: { bg: "#fce7f3", text: "#be185d" },
};

const BUSINESS: Theme = {
  primary: "#9d8468",
  primaryLight: "#e8dfd4",
  primaryLighter: "#d4c4b0",
  primaryDark: "#5c4a3d",
  backgroundGradient: "#F6F8FE",
  businessBadge: { bg: "#e8dfd4", text: "#5c4a3d" },
};

export function getTheme(mode: CardMode | null | undefined): Theme {
  return mode === "business" ? BUSINESS : PERSONAL;
}
