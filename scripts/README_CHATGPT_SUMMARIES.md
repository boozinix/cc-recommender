# ChatGPT card summaries

These scripts use the **OpenAI API** (same models as ChatGPT) to generate a short paragraph per card: why it’s great, plus high-level pros and cons.

## 1. Get an API key

Your ChatGPT Plus subscription does **not** automatically give API access. You need a separate key:

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in (same account as ChatGPT is fine)
3. Create an API key and copy it

You pay per use (cents per run for ~100 cards with `gpt-4o-mini`). Keep the key private.

## 2. Install dependencies

From the repo root or from `scripts/`:

```bash
pip install -r scripts/requirements-chatgpt.txt
```

## 3. Set your API key

In the terminal (same session where you’ll run the scripts):

```bash
export OPENAI_API_KEY="sk-your-key-here"
```

On Windows (PowerShell):

```powershell
$env:OPENAI_API_KEY="sk-your-key-here"
```

## 4. Run the scripts

**Single card (test):**

```bash
python scripts/get_card_summary.py "Chase Sapphire Preferred"
```

**All cards → CSV (default):**

```bash
python scripts/run_all_cards_chatgpt.py
```

Output: `scripts/chatgpt_card_summaries.csv` with columns `card_name` and `summary`.

**All cards → Excel:**

```bash
pip install openpyxl
python scripts/run_all_cards_chatgpt.py --output scripts/chatgpt_summaries.xlsx
```

**Resume after a stop** (skips cards already in the output file):

```bash
python scripts/run_all_cards_chatgpt.py --resume
```

**Slower (fewer rate limits):**

```bash
python scripts/run_all_cards_chatgpt.py --delay 1
```

## Output

- **CSV**: `card_name`, `summary` (UTF-8).
- **Excel**: Same columns in a sheet named “Summaries”.

Summaries are one short paragraph per card (2–4 sentences), written by the model.

---

## Troubleshooting

**"OpenAI package not installed"**  
Run: `pip install openai` or `pip3 install openai` (from the repo root or from `scripts/`).

**"OPENAI_API_KEY is not set"**  
You must set the key in the **same terminal** where you run the script:
```bash
export OPENAI_API_KEY="sk-your-key-here"
```
Then run the script again in that same terminal.

**"Could not import get_card_summary"**  
Run the batch script from the **repo root** (the folder that contains `public/` and `scripts/`):
```bash
cd /path/to/cc-recommender
python scripts/run_all_cards_chatgpt.py
```

**API errors (401, invalid key, auth)**  
- Create a new key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).  
- Make sure there are no extra spaces when you paste: `export OPENAI_API_KEY="sk-..."`.

**Rate limit (429)**  
Use a longer delay: `python scripts/run_all_cards_chatgpt.py --delay 1.5`
