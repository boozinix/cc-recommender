#!/usr/bin/env python3
"""
Get a one-paragraph ChatGPT summary for a single credit card: why it's great,
high-level pros and cons. Uses OpenAI API (same models as ChatGPT).

Requires: OPENAI_API_KEY in environment.
Usage: python get_card_summary.py "Chase Sapphire Preferred"
"""

import os
import sys

try:
    from openai import OpenAI
except ImportError:
    print(
        "OpenAI package not installed. Run one of:\n"
        "  pip install openai\n"
        "  pip3 install openai\n"
        "  pip install -r scripts/requirements-chatgpt.txt",
        file=sys.stderr,
    )
    sys.exit(1)


def get_card_summary(card_name: str, model: str = "gpt-4o-mini") -> str:
    """
    Call OpenAI (ChatGPT) to get a one-paragraph summary for a credit card.
    Returns the summary text, or raises on API error.
    """
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Set OPENAI_API_KEY in your environment. "
            "Get a key at https://platform.openai.com/api-keys"
        )

    client = OpenAI(api_key=api_key)
    prompt = (
        f"In about one short paragraph (2–4 sentences), explain why the "
        f'"{card_name}" credit card is a good fit for someone, with high-level '
        "pros and cons. Be concise, neutral, and factual. No bullet lists—flow as a paragraph."
    )
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a concise credit card reviewer. Reply with a single short paragraph only."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=300,
    )
    return (response.choices[0].message.content or "").strip()


def main():
    if len(sys.argv) < 2:
        print("Usage: python get_card_summary.py \"Card Name\"", file=sys.stderr)
        sys.exit(1)
    card_name = " ".join(sys.argv[1:]).strip()
    if not card_name:
        print("Usage: python get_card_summary.py \"Card Name\"", file=sys.stderr)
        sys.exit(1)

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key or not api_key.strip():
        print(
            "Error: OPENAI_API_KEY is not set.\n"
            "Set it in this terminal, then run again:\n"
            "  export OPENAI_API_KEY=\"sk-your-key-here\"\n"
            "Get a key at https://platform.openai.com/api-keys",
            file=sys.stderr,
        )
        sys.exit(1)

    try:
        summary = get_card_summary(card_name)
        print(summary)
    except Exception as e:
        err = str(e).lower()
        print(f"Error: {e}", file=sys.stderr)
        if "api_key" in err or "auth" in err or "invalid" in err or "401" in err:
            print("Check that your API key is correct and has not been revoked.", file=sys.stderr)
        elif "rate" in err or "429" in err:
            print("Rate limit hit. Wait a minute or use --delay 1 with the batch script.", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
