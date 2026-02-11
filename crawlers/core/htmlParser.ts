/**
 * Thin wrapper around cheerio for loading and querying HTML.
 */

import * as cheerio from "cheerio";

export function loadHtml(html: string): ReturnType<typeof cheerio.load> {
  return cheerio.load(html);
}
