"use client";

// All Cards page: shows every card from cards.csv using the shared CardTile.
// Styling/theme matches results page (cardMode + getTheme + globals.css tokens).

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { getTheme, type CardMode, type Theme } from "@/app/lib/theme";
import type { Card } from "@/app/lib/cardTypes";
import { getEstimatedBonusValueUsd } from "@/app/lib/pointValues";
import { CardTile } from "@/app/components/CardTile";

type MultiSelectDropdownProps = {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  theme: Theme;
  open: boolean;
  onToggleOpen: () => void;
};

function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  theme,
  open,
  onToggleOpen,
}: MultiSelectDropdownProps) {
  const allSelected = options.length > 0 && selected.length === options.length;

  const toggleOption = (opt: string) => {
    onChange(
      selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt],
    );
  };

  const handleSelectAll = () => {
    onChange(allSelected ? [] : options);
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="results-tap-target"
        onClick={onToggleOpen}
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "var(--surface-elevated)",
          color: "var(--text-primary)",
          fontSize: 13,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          minWidth: 160,
          justifyContent: "space-between",
        }}
      >
        <span>
          {label}
          {selected.length > 0 ? ` (${selected.length})` : ""}
        </span>
        <span style={{ fontSize: 10 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            left: 0,
            zIndex: 40,
            minWidth: 220,
            maxHeight: 320,
            overflowY: "auto",
            background: "var(--surface-elevated)",
            borderRadius: 12,
            border: "1px solid var(--border)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              {label}
            </span>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                color: "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              <input type="checkbox" checked={allSelected} onChange={handleSelectAll} />
              <span>Select all</span>
            </label>
          </div>
          <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
            {options.map((opt) => {
              const isChecked = selected.includes(opt);
              return (
                <label
                  key={opt}
                  className="results-tap-target"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "4px 6px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 13,
                    background: isChecked ? theme.primaryLight : "transparent",
                    color: isChecked ? theme.primaryDark : "var(--text-primary)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleOption(opt)}
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AllCardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [cardMode, setCardMode] = useState<CardMode>("personal");
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [onlyZeroApr, setOnlyZeroApr] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"banks" | "programs" | null>(null);

  // Load card_mode (personal/business) from localStorage so accent matches results.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedMode = (localStorage.getItem("card_mode") as CardMode | null) || "personal";
    setCardMode(storedMode);
  }, []);

  // Load all cards (same enrichment as results page so values stay consistent).
  useEffect(() => {
    Promise.all([fetch("/cards.csv").then((r) => r.text()), fetch("/banks.csv").then((r) => r.text())])
      .then(([cardsText, banksText]) => {
        const bankRows = Papa.parse<{ issuer: string; bank_rules: string }>(banksText, {
          header: true,
          skipEmptyLines: true,
        }).data;
        const bankRulesMap: Record<string, string> = {};
        bankRows.forEach((b) => {
          if (b.issuer) bankRulesMap[b.issuer] = b.bank_rules || "";
        });

        const parsed = Papa.parse<Card>(cardsText, { header: true, skipEmptyLines: true });
        const enriched = parsed.data.map((c) => {
          const base = { ...c, bank_rules: bankRulesMap[c.issuer] ?? c.bank_rules ?? "" };
          return { ...base, estimated_bonus_value_usd: String(getEstimatedBonusValueUsd(base)) };
        });
        setCards(enriched);
      })
      .catch(() => setCards([]));
  }, []);

  const theme = getTheme(cardMode);

  // Unique banks for filter dropdown
  const banks = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((c) => {
      const issuer = (c.issuer || "").trim();
      if (issuer) set.add(issuer);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [cards]);

  // Combined airline + hotel programs for filter dropdown
  const airlineHotelPrograms = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((c) => {
      const model = (c.reward_model || "").toLowerCase();
      if (model === "airline" || model === "hotel") {
        const key = (c.rewards_type || c.card_family || c.issuer || "").trim();
        if (key) set.add(key);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [cards]);

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // Bank filter
      if (selectedBanks.length > 0 && !selectedBanks.includes(card.issuer)) {
        return false;
      }

      // Airline/Hotel program filter
      if (selectedPrograms.length > 0) {
        const model = (card.reward_model || "").toLowerCase();
        if (model === "airline" || model === "hotel") {
          const key = (card.rewards_type || card.card_family || card.issuer || "").trim();
          if (!selectedPrograms.includes(key)) return false;
        } else {
          // If user is filtering by programs, non-travel cards are excluded
          return false;
        }
      }

      // 0% APR filter
      if (onlyZeroApr) {
        const intro = (card.intro_apr_purchase || "").trim();
        if (!intro.startsWith("0%")) return false;
      }

      return true;
    });
  }, [cards, selectedBanks, selectedPrograms, onlyZeroApr]);

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--surface)", padding: 24, boxSizing: "border-box" }}
      data-card-mode={cardMode}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        {/* Back + heading */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <button
            type="button"
            className="results-tap-target"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.href = "/results";
              }
            }}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "none",
              background: "#111827",
              color: "#ffffff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ← Back to results
          </button>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            All cards ({filteredCards.length}/{cards.length})
          </h1>
          <span style={{ width: 140 }} aria-hidden />
        </div>

        {/* Filters */}
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <MultiSelectDropdown
            label="Banks"
            options={banks}
            selected={selectedBanks}
            onChange={setSelectedBanks}
            theme={theme}
            open={openDropdown === "banks"}
            onToggleOpen={() =>
              setOpenDropdown((prev) => (prev === "banks" ? null : "banks"))
            }
          />
          <MultiSelectDropdown
            label="Airline / Hotel programs"
            options={airlineHotelPrograms}
            selected={selectedPrograms}
            onChange={setSelectedPrograms}
            theme={theme}
            open={openDropdown === "programs"}
            onToggleOpen={() =>
              setOpenDropdown((prev) => (prev === "programs" ? null : "programs"))
            }
          />

          {/* 0% APR filter (simple toggle) */}
          <div
            style={{
              padding: 8,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface-elevated)",
              minWidth: 200,
            }}
          >
            <label
              className="results-tap-target"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                color: "var(--text-primary)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={onlyZeroApr}
                onChange={(e) => setOnlyZeroApr(e.target.checked)}
              />
              <span>Show only cards with 0% intro APR</span>
            </label>
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          {filteredCards.map((card) => (
            <CardTile
              key={card.card_name}
              card={card}
              showProsCons={false}
              showCompareCheckbox={false}
              showOwnedCheckbox={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

