/**
 * HTTP client for crawlers: fetch with retries and timeout.
 */

import axios, { type AxiosRequestConfig } from "axios";

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_RETRIES = 2;
const DEFAULT_DELAY_MS = 1000;

export async function fetchHtml(
  url: string,
  options: { timeoutMs?: number; retries?: number; delayMs?: number } = {}
): Promise<string> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_RETRIES;
  const delayMs = options.delayMs ?? DEFAULT_DELAY_MS;

  const config: AxiosRequestConfig = {
    timeout: timeoutMs,
    responseType: "text",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    validateStatus: (status) => status === 200,
  };

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await axios.get<string>(url, config);
      return res.data;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastError ?? new Error("fetchHtml failed");
}
