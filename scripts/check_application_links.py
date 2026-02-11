import csv
import sys
import time
from typing import Optional
from urllib.error import URLError, HTTPError
from urllib.parse import urlparse
from urllib.request import Request, urlopen


CSV_PATH = "public/cards.csv"


def check_url(url: str, timeout: float = 10.0) -> Optional[int]:
    """
    Returns the final HTTP status code for the URL, or None if the request fails.
    Treats any 2xx/3xx status as "working".
    """
    if not url:
        return None

    # Some issuers may dislike HEAD, but try it first to reduce bandwidth.
    # Fall back to GET if HEAD fails with a method-related error.
    for method in ("HEAD", "GET"):
        try:
            req = Request(url, method=method, headers={"User-Agent": "cc-recommender-link-checker/1.0"})
            with urlopen(req, timeout=timeout) as resp:
                return resp.getcode()
        except HTTPError as e:
            # HTTPError is both an exception and has a status code
            return e.code
        except URLError as e:
            # For method-related failures (e.g., 405 on HEAD), try GET once
            if method == "HEAD":
                # Try GET next iteration
                continue
            # For other URL / network errors, give up
            return None
        except Exception:
            # Any other unexpected error – treat as broken
            return None

    return None


def main() -> int:
    broken = []

    try:
        with open(CSV_PATH, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                card_name = row.get("card_name", "").strip()
                url = row.get("application_link", "").strip()

                if not url:
                    continue

                status = check_url(url)

                # Consider 2xx, 3xx and 403 as OK.
                # Many issuers (especially Citi/AA) return 403 to bots
                # even when the link works fine in a real browser session.
                # Additionally, Bank of America business card URLs can return
                # a 404 from this environment even though they work fine
                # in a normal browser session.
                host = urlparse(url).netloc.lower()
                if status is not None and (
                    200 <= status < 400
                    or status == 403
                    or (status == 404 and host.endswith("business.bankofamerica.com"))
                ):
                    continue

                # Everything else is treated as "broken"
                broken.append((card_name, url, status))
                # Small sleep to avoid hammering issuers if many are broken
                time.sleep(0.2)
    except FileNotFoundError:
        print(f"Could not find CSV at {CSV_PATH}", file=sys.stderr)
        return 1

    if not broken:
        print("All application_link URLs responded with 2xx/3xx status codes.")
    else:
        print("Broken or non-2xx/3xx application_link URLs:")
        for card_name, url, status in broken:
            print(f"- {card_name or '(unknown card)'} | {url} | status={status}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

