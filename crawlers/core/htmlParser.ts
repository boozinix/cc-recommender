/**
 * Thin wrapper around cheerio for loading and querying HTML.
 */

import * as cheerio from "cheerio";

export function loadHtml(html: string): cheerio.CheerioAPI {
  return cheerio.load(html);
}
