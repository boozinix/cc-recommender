/**
 * Converts a free-text user prompt (e.g. "travel card with higher rewards")
 * into the same Answers shape the results page expects, so we can reuse
 * the existing scoring without any AI or API calls.
 */

export type Answers = { [key: string]: string | string[] | undefined };

const GOALS = ["Travel", "Cashback", "Bonus", "Everyday"] as const;

export function promptToAnswers(prompt: string): Answers {
  const text = prompt.trim().toLowerCase();
  if (!text) {
    return getDefaultAnswers();
  }

  const answers: Answers = getDefaultAnswers();

  // ---- Card mode ----
  if (/\b(business|biz)\b/.test(text)) {
    answers.card_mode = "business";
  }

  // ---- Primary goal (and ranking) ----
  const goalHits: Array<{ goal: typeof GOALS[number]; index: number }> = [];
  const travelMatch = text.match(/\b(travel|flight|fly|flying|airline|hotel|trip|vacation)\b/);
  if (travelMatch) goalHits.push({ goal: "Travel", index: travelMatch.index ?? 0 });
  const cashbackMatch = text.match(/\b(cashback|cash back|cash-back|2%|flat rate)\b/);
  if (cashbackMatch) goalHits.push({ goal: "Cashback", index: cashbackMatch.index ?? 0 });
  const bonusMatch = text.match(/\b(bonus|signup|sign up|sign-up|welcome offer|sub)\b/);
  if (bonusMatch) goalHits.push({ goal: "Bonus", index: bonusMatch.index ?? 0 });
  const everydayMatch = text.match(/\b(everyday|daily|general|simple|no category)\b/);
  if (everydayMatch) goalHits.push({ goal: "Everyday", index: everydayMatch.index ?? 0 });

  // "rewards" or "higher rewards" without other goal → treat as Travel first, then Bonus
  const rewardsOnly = /(higher|best|max|more)\s*rewards?/.test(text) && goalHits.length === 0;
  if (rewardsOnly) {
    answers.primary_goal_ranked = ["Travel", "Bonus", "Cashback", "Everyday"];
  } else if (goalHits.length > 0) {
    goalHits.sort((a, b) => a.index - b.index);
    const ordered = goalHits.map(h => h.goal);
    const rest = GOALS.filter(g => !ordered.includes(g));
    answers.primary_goal_ranked = [...ordered, ...rest];
  }

  // ---- Annual fee tolerance ----
  if (/\b(no annual fee|no fee|zero fee|free card|no af)\b/.test(text)) {
    answers.annual_fee_tolerance = "None";
  } else if (/\b(low fee|cheap|under \s*\$?100|budget)\b/.test(text)) {
    answers.annual_fee_tolerance = "Low";
  } else if (/\b(premium|luxury|lounge|don't care|doesn't matter|high fee|ok with fee)\b/.test(text)) {
    answers.annual_fee_tolerance = "High";
  } else if (/\b(mid|medium|moderate)\b/.test(text)) {
    answers.annual_fee_tolerance = "Medium";
  } else if (goalHits.some(h => h.goal === "Travel") || rewardsOnly) {
    // Default for "travel" or "rewards" to allow premium cards
    answers.annual_fee_tolerance = "Medium";
  }

  // ---- Spend comfort (for signup bonus) ----
  if (/\b(bonus|signup|welcome)\b/.test(text) && !/\b(don't|do not|no bonus)\b/.test(text)) {
    if (/\b(high spend|5k|5000|above 5)\b/.test(text)) answers.spend_comfort = "High";
    else if (/\b(1k|1000|2k|2000|3k|3000|4k|4000)\b/.test(text)) answers.spend_comfort = "Medium";
    else answers.spend_comfort = "Medium";
  }

  // ---- Travel sub-preferences ----
  const airlines: Record<string, string> = {
    united: "United",
    american: "American",
    delta: "Delta",
    southwest: "Southwest",
    jetblue: "JetBlue",
    alaska: "Alaska"
  };
  const hotels: Record<string, string> = {
    marriott: "Marriott",
    hyatt: "Hyatt",
    hilton: "Hilton",
    ihg: "IHG"
  };

  for (const [key, value] of Object.entries(airlines)) {
    if (text.includes(key)) {
      answers.travel_rewards_type = "Airline";
      answers.preferred_airline = value;
      break;
    }
  }
  for (const [key, value] of Object.entries(hotels)) {
    if (text.includes(key)) {
      answers.travel_rewards_type = "Hotel";
      answers.preferred_hotel = value;
      break;
    }
  }

  if (/\b(premium|luxury|lounge|first class)\b/.test(text)) {
    answers.travel_tier_preference = "Premium";
  } else if (/\b(mid-tier|mid tier|affordable travel|cheap travel)\b/.test(text)) {
    answers.travel_tier_preference = "Mid-tier";
  } else if (answers.primary_goal_ranked && (answers.primary_goal_ranked as string[])[0] === "Travel") {
    answers.travel_tier_preference = "No preference";
  }

  if (/\b(frequent|weekly|often|a lot)\b/.test(text)) {
    answers.travel_frequency = "High";
  } else if (/\b(occasional|sometimes|few times)\b/.test(text)) {
    answers.travel_frequency = "Low";
  }

  // ---- 0% APR ----
  if (/\b(0% apr|intro apr|balance transfer|carry a balance)\b/.test(text)) {
    answers.needs_0_apr = "Yes, I plan to carry a balance";
  }

  return answers;
}

function getDefaultAnswers(): Answers {
  return {
    card_mode: "personal",
    primary_goal_ranked: ["Travel", "Cashback", "Bonus", "Everyday"],
    annual_fee_tolerance: "Medium",
    spend_comfort: "Medium"
  };
}
