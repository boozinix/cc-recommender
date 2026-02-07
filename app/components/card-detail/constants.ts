/**
 * Card "more details" on results page — feature flags
 *
 * Both are OFF by default. To turn one back on later, set it to true in this file.
 *
 * - ENABLE_CARD_DETAIL_OPTION_1_MODAL: first result card title becomes a link;
 *   click → popup modal with full card details (pros/cons, bank rules, etc.).
 * - ENABLE_CARD_DETAIL_OPTION_2_EXPAND: second result card gets a "▼ More details"
 *   button at bottom; click → tile expands in place with same details.
 *
 * No other code changes needed; results page already uses these flags.
 */
export const ENABLE_CARD_DETAIL_OPTION_1_MODAL = false;
export const ENABLE_CARD_DETAIL_OPTION_2_EXPAND = false;
