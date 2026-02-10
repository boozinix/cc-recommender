import { useMemo } from "react";
import type { Card } from "./cardTypes";
import {
  scoreCard,
  cardMatchesBrandKey,
  cardMatchesBank,
  dedupeByFamily,
  type Answers,
} from "./resultsScoring";

export type ResultsRanking = {
  rankedCards: Card[];
  otherTypeCards: Card[];
};

/**
 * Shared ranking logic for the results page:
 * - rankedCards: primary card type (matches answers.card_mode)
 * - otherTypeCards: opposite card type (personal vs business)
 */
export function useResultsRanking(
  cards: Card[],
  answers: Answers,
  ownedCards: string[]
): ResultsRanking {
  const rankedCards = useMemo<Card[]>(() => {
    if (!answers.card_mode) return [];

    const scoredRaw = [...cards]
      .filter((c) => c.card_type === answers.card_mode)
      .map((card) => ({
        card,
        score: scoreCard(card, answers, ownedCards),
      }))
      .filter((x) => x.score > -9999);

    const travelType = answers.travel_rewards_type;
    const pool = scoredRaw;

    let finalCards: Card[] = [];

    const wantsAirlineBrand =
      travelType === "Airline" &&
      answers.preferred_airline &&
      answers.preferred_airline !== "No strong preference";

    const wantsHotelBrand =
      travelType === "Hotel" &&
      answers.preferred_hotel &&
      answers.preferred_hotel !== "No strong preference";

    const wantsBankBrand =
      travelType === "General" &&
      answers.preferred_bank &&
      answers.preferred_bank !== "No preference";

    if (wantsAirlineBrand || wantsHotelBrand) {
      const brand = (wantsAirlineBrand
        ? answers.preferred_airline
        : answers.preferred_hotel) as string;
      const brandKey = brand.trim().toLowerCase();

      const brandCards = pool
        .filter((x) => cardMatchesBrandKey(x.card, brandKey))
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);

      const nonBrandCards = pool.filter(
        (x) => !cardMatchesBrandKey(x.card, brandKey)
      );
      const generalCards = dedupeByFamily(nonBrandCards)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);

      finalCards = [
        ...brandCards.map((x) => x.card),
        ...generalCards.map((x) => x.card),
      ];
    } else if (wantsBankBrand) {
      const bank = (answers.preferred_bank as string).trim();

      const bankCards = pool
        .filter((x) => cardMatchesBank(x.card, bank))
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);

      const nonBankCards = pool.filter(
        (x) => !cardMatchesBank(x.card, bank)
      );
      const restCards = dedupeByFamily(nonBankCards)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);

      finalCards = [
        ...bankCards.map((x) => x.card),
        ...restCards.map((x) => x.card),
      ];
    } else {
      const sorted = dedupeByFamily(pool).sort((a, b) => b.score - a.score);

      // If user chose a general travel preference (airline or hotel) but no specific brand,
      // keep that type on top while still allowing a mix of strong general travel cards.
      if (travelType === "Hotel" || travelType === "Airline") {
        const preferredModel = travelType.toLowerCase(); // "hotel" or "airline"
        const primary = sorted.filter(
          (x) => (x.card.reward_model || "").toLowerCase() === preferredModel
        );
        const others = sorted.filter(
          (x) => (x.card.reward_model || "").toLowerCase() !== preferredModel
        );
        finalCards = [...primary, ...others].slice(0, 9).map((x) => x.card);
      } else {
        finalCards = sorted.slice(0, 9).map((x) => x.card);
      }
    }

    return finalCards;
  }, [cards, answers, ownedCards]);

  const otherTypeCards = useMemo<Card[]>(() => {
    if (!answers.card_mode) return [];

    const travelType = answers.travel_rewards_type;

    const wantsAirlineBrand =
      travelType === "Airline" &&
      answers.preferred_airline &&
      answers.preferred_airline !== "No strong preference";
    const wantsHotelBrand =
      travelType === "Hotel" &&
      answers.preferred_hotel &&
      answers.preferred_hotel !== "No strong preference";
    const wantsBankBrand =
      travelType === "General" &&
      answers.preferred_bank &&
      answers.preferred_bank !== "No preference";

    const otherType =
      answers.card_mode === "personal" ? "business" : "personal";

    const pool = [...cards]
      .filter((c) => c.card_type === otherType)
      .map((card) => ({
        card,
        score: scoreCard(card, answers, ownedCards),
      }))
      .filter((x) => x.score > -9999);

    // No filter by airline/hotel — show all travel cards when including travel.

    if (wantsAirlineBrand || wantsHotelBrand) {
      const brand = (wantsAirlineBrand
        ? answers.preferred_airline
        : answers.preferred_hotel) as string;
      const brandKey = brand.trim().toLowerCase();

      const brandCards = pool
        .filter((x) => cardMatchesBrandKey(x.card, brandKey))
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);

      const nonBrandCards = pool.filter(
        (x) => !cardMatchesBrandKey(x.card, brandKey)
      );
      const generalCards = dedupeByFamily(nonBrandCards)
        .sort((a, b) => b.score - a.score)
        .slice(0, 1);

      return [
        ...brandCards.map((x) => x.card),
        ...generalCards.map((x) => x.card),
      ].slice(0, 3);
    }

    if (wantsBankBrand) {
      const bank = (answers.preferred_bank as string).trim();

      const bankCards = pool
        .filter((x) => cardMatchesBank(x.card, bank))
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);

      const nonBankCards = pool.filter(
        (x) => !cardMatchesBank(x.card, bank)
      );
      const restCards = dedupeByFamily(nonBankCards)
        .sort((a, b) => b.score - a.score)
        .slice(0, 1);

      return [
        ...bankCards.map((x) => x.card),
        ...restCards.map((x) => x.card),
      ].slice(0, 3);
    }

    const sorted = dedupeByFamily(pool).sort((a, b) => b.score - a.score);

    if (travelType === "Hotel" || travelType === "Airline") {
      const preferredModel = travelType.toLowerCase();
      const primary = sorted.filter(
        (x) => (x.card.reward_model || "").toLowerCase() === preferredModel
      );
      const others = sorted.filter(
        (x) => (x.card.reward_model || "").toLowerCase() !== preferredModel
      );
      return [...primary, ...others].slice(0, 3).map((x) => x.card);
    }

    return sorted.slice(0, 3).map((x) => x.card);
  }, [cards, answers, ownedCards]);

  return { rankedCards, otherTypeCards };
}

