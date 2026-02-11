/**
 * Link validation and search for correct URLs when links are broken.
 * Set SERP_API_KEY in env for web search (optional; otherwise provides search URL for manual lookup).
 */

import axios from "axios";
import type { LinkStatus } from "./types";

export interface LinkCheckResult {
  status: LinkStatus;
  statusCode?: number;
  error?: string;
}

/** Check if a URL is reachable. */
export async function checkLink(url: string): Promise<LinkCheckResult> {
  try {
    const res = await axios.get(url, {
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: (code) => code < 500,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    const code = res.status;
    if (code >= 400) {
      return { status: "broken", statusCode: code, error: `HTTP ${code}` };
    }
    const body = typeof res.data === "string" ? res.data : "";
    if (body.length < 500 && /page not found|404|this page has moved|access denied/i.test(body)) {
      return { status: "broken", statusCode: code, error: "Error page content" };
    }
    return { status: "ok", statusCode: code };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const isTimeout = /timeout|ETIMEDOUT|ECONNABORTED/i.test(msg);
    return {
      status: isTimeout ? "timeout" : "broken",
      error: msg,
    };
  }
}

export interface SearchResult {
  suggestedLink?: string;
  suggestedSearchQuery: string;
  suggestedSearchUrl: string;
}

const ALLOWED_DOMAINS: Record<string, string[]> = {
  chase: ["chase.com", "creditcards.chase.com"],
  citi: ["citi.com", "creditcards.aa.com", "aa.com"],
  "capital one": ["capitalone.com"],
};

function issuerToBankId(issuer: string): string {
  const s = issuer.toLowerCase().trim();
  if (s === "american express" || s === "amex") return "amex";
  if (s === "capital one") return "capital one";
  return s.replace(/\s+/g, "");
}

/** Search for correct application link when original is broken. */
export async function searchForCardLink(
  cardName: string,
  issuer: string,
  _originalUrl: string
): Promise<SearchResult> {
  const bankId = issuerToBankId(issuer);
  const domains = ALLOWED_DOMAINS[bankId] ?? ["chase.com", "citi.com", "creditcards.aa.com"];
  const query = `${cardName} ${issuer} credit card apply`;
  const suggestedSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  const apiKey = process.env.SERP_API_KEY?.trim();
  if (!apiKey) {
    return { suggestedSearchQuery: query, suggestedSearchUrl };
  }

  try {
    const res = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google",
        q: query,
        api_key: apiKey,
      },
      timeout: 10000,
    });
    const results = (res.data?.organic_results ?? []) as Array<{ link?: string; title?: string }>;
    for (const r of results) {
      const link = (r.link || "").trim();
      if (!link || !link.startsWith("http")) continue;
      const lower = link.toLowerCase();
      if (domains.some((d) => lower.includes(d))) {
        return {
          suggestedLink: link,
          suggestedSearchQuery: query,
          suggestedSearchUrl,
        };
      }
    }
  } catch {
    // Fall through to query-only result
  }
  return { suggestedSearchQuery: query, suggestedSearchUrl };
}
