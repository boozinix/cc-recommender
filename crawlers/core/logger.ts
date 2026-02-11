/**
 * Simple console logger for crawlers; can be extended for file logging later.
 */

export function logInfo(message: string, meta?: Record<string, unknown>): void {
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  console.log(`[crawl] ${message}${metaStr}`);
}

export function logWarn(message: string, meta?: Record<string, unknown>): void {
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  console.warn(`[crawl] WARN ${message}${metaStr}`);
}

export function logError(message: string, meta?: Record<string, unknown>): void {
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  console.error(`[crawl] ERROR ${message}${metaStr}`);
}
