/**
 * Refinement questions config for results and sandbox-results.
 * Single source of truth: add or change questions here.
 */

import { getGoalRanks, type Answers } from "./resultsScoring";

export type RefinementQuestion = {
  id: string;
  question: string;
  helper?: string;
  dependsOn: (answers: Answers) => boolean;
  options: { value: string; label: string }[];
  multiSelect?: boolean;
};

export const refinementQuestions: RefinementQuestion[] = [
  {
    id: "exclude_travel_cards",
    question: "Exclude travel and hotel branded cards?",
    helper: "When bonus is your main goal, results often include travel cards. Choose to see only cashback and other non-travel cards.",
    dependsOn: (answers: Answers) => {
      const { primary } = getGoalRanks(answers);
      return primary === "Bonus";
    },
    options: [
      { value: "No", label: "No, include travel cards" },
      { value: "Yes", label: "Yes, exclude all travel and hotel cards" }
    ]
  },
  {
    id: "travel_rewards_type",
    question: "What kind of travel rewards do you prefer?",
    dependsOn: (answers: Answers) => {
      const { primary } = getGoalRanks(answers);
      return (primary === "Travel" || primary === "Bonus") && answers.exclude_travel_cards !== "Yes";
    },
    options: [
      { value: "General", label: "Bank Rewards" },
      { value: "Airline", label: "Airline" },
      { value: "Hotel", label: "Hotel" },
      { value: "No Preference", label: "No Preference" }
    ]
  },
  {
    id: "preferred_bank",
    question: "Any bank preference?",
    helper: "We'll prioritize cards from the bank you pick (Bank Rewards = flexible points like Chase UR, Amex MR, Citi TYP).",
    dependsOn: (answers: Answers) => {
      const { primary } = getGoalRanks(answers);
      return (primary === "Travel" || primary === "Bonus") && answers.travel_rewards_type === "General" && answers.exclude_travel_cards !== "Yes";
    },
    options: [
      { value: "Chase", label: "Chase" },
      { value: "Amex", label: "Amex" },
      { value: "Citi", label: "Citi" },
      { value: "Capital One", label: "Capital One" },
      { value: "Bank of America", label: "Bank of America" },
      { value: "U.S. Bank", label: "U.S. Bank" },
      { value: "Barclays", label: "Barclays" },
      { value: "Wells Fargo", label: "Wells Fargo" },
      { value: "No preference", label: "No preference" }
    ]
  },
  {
    id: "preferred_airline",
    question: "Which airline do you usually fly?",
    dependsOn: (answers: Answers) => {
      const { primary } = getGoalRanks(answers);
      return (primary === "Travel" || primary === "Bonus") && answers.travel_rewards_type === "Airline" && answers.exclude_travel_cards !== "Yes";
    },
    options: [
      { value: "United", label: "United" },
      { value: "Delta", label: "Delta" },
      { value: "American", label: "American" },
      { value: "Alaska", label: "Alaska" },
      { value: "JetBlue", label: "JetBlue" },
      { value: "Southwest", label: "Southwest" },
      { value: "Frontier", label: "Frontier" },
      { value: "Spirit", label: "Spirit" },
      { value: "Breeze", label: "Breeze" },
      { value: "No strong preference", label: "No strong preference" }
    ]
  },
  {
    id: "preferred_hotel",
    question: "Which hotel brand do you prefer?",
    dependsOn: (answers: Answers) => {
      const { primary } = getGoalRanks(answers);
      return (primary === "Travel" || primary === "Bonus") && answers.travel_rewards_type === "Hotel" && answers.exclude_travel_cards !== "Yes";
    },
    options: [
      { value: "Marriott", label: "Marriott" },
      { value: "Hilton", label: "Hilton" },
      { value: "Hyatt", label: "Hyatt" },
      { value: "IHG", label: "IHG" },
      { value: "Wyndham", label: "Wyndham" },
      { value: "Choice", label: "Choice" },
      { value: "Expedia", label: "Expedia" },
      { value: "No strong preference", label: "No strong preference" }
    ]
  },
  {
    id: "travel_tier_preference",
    question: "Do you prefer a premium or mid-tier travel card?",
    helper: "Premium cards offer stronger benefits with higher annual fees; mid-tier cards have lower fees and solid rewards.",
    dependsOn: (answers: Answers) => {
      const { primary } = getGoalRanks(answers);
      return primary === "Travel" && answers.exclude_travel_cards !== "Yes";
    },
    options: [
      { value: "Premium", label: "Premium" },
      { value: "Mid-tier", label: "Mid-tier" },
      { value: "No preference", label: "No preference" }
    ]
  },
  {
    id: "travel_perks",
    question: "Prefer cards with TSA PreCheck/Global Entry credit or lounge access?",
    helper: "Select one or both. We'll prioritize cards that include these benefits.",
    dependsOn: (answers: Answers) => {
      const { primary } = getGoalRanks(answers);
      return primary === "Travel" && answers.exclude_travel_cards !== "Yes";
    },
    multiSelect: true,
    options: [
      { value: "tsa_ge", label: "TSA PreCheck / Global Entry credit" },
      { value: "lounge", label: "Lounge access" }
    ]
  },
  {
    id: "needs_0_apr",
    question: "Do you need a 0% intro APR?",
    helper: "We'll prioritize cards with 0% intro APR when this matters to you.",
    dependsOn: (answers: Answers) => {
      const { primary } = getGoalRanks(answers);
      return primary === "Everyday" || primary === "Cashback";
    },
    options: [
      { value: "Yes", label: "Yes, 0% APR is important to me" },
      { value: "No", label: "No, I don't care about intro APR" }
    ]
  },
  {
    id: "issuer_approval_rules",
    question: "Do any of these approval rules apply to you?",
    helper: "Select all that apply. We'll exclude cards from issuers that may not approve you.",
    dependsOn: () => true,
    multiSelect: true,
    options: [
      { value: "5_in_24mo", label: "5+ cards in 24 months (excludes Chase)" },
      { value: "6_in_24mo", label: "6+ cards in 24 months (excludes Chase & Barclays)" },
      { value: "2_in_60_days", label: "2+ cards in 60 days (excludes Citi & Amex)" },
      { value: "2_in_90_days", label: "2+ cards in 90 days (excludes Amex)" }
    ]
  }
];
