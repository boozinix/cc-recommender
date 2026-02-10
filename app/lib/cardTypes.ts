/**
 * Shared card type used across results, sandbox-results, comparison, max-rewards, pro-churner.
 * Single source of truth so all pages and CardTile stay in sync.
 */

export interface Card {
  card_name: string;
  issuer: string;
  card_type: string;
  annual_fee: string;
  reward_model: string;
  rewards_type?: string;
  card_family: string;
  cashback_rate_display?: string;
  cashback_rate_effective: string;
  estimated_bonus_value_usd: string;
  minimum_spend_amount?: string;
  bonus_to_spend_ratio?: string;
  spend_time_frame?: string;
  intro_apr_purchase: string;
  best_for: string;
  pros: string;
  cons: string;
  signup_bonus: string;
  signup_bonus_type: string;
  bank_rules?: string;
  application_link?: string;
  special_feature_1?: string;
  special_feature_2?: string;
  lounge?: string;
  ge_tsa_precheck?: string;
  [key: string]: unknown;
}
