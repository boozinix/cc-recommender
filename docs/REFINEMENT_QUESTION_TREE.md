# Refinement questions: how wizard Q1 affects what appears on the results page

The **first wizard question** is: **"Rank what you want this card to be best at"** with four options: Cashback, Travel, Signup bonus, Everyday spending.

The **primary goal** is the **top-ranked** choice. It controls which refinement questions appear in the **"Refine your results"** panel on the results page.

---

## Tree: Primary goal → refinement questions shown

```
Wizard Q1: Rank goals (1st = primary)
    │
    ├── Primary = 💰 Cashback
    │       │
    │       ├── Do you need a 0% intro APR?  [Yes / No]
    │       └── Do any of these approval rules apply to you?  [always shown]
    │
    ├── Primary = ✈️ Travel
    │       │
    │       ├── What kind of travel rewards do you prefer?  [Bank Rewards / Airline / Hotel]
    │       │       ├── If Bank Rewards → Any bank preference?  [Chase, Amex, Citi, …]
    │       │       ├── If Airline → Which airline do you usually fly?  [United, Delta, …]
    │       │       └── If Hotel  → Which hotel brand do you prefer?  [Marriott, Hilton, …]
    │       ├── Do you prefer a premium or mid-tier travel card?  [Premium / Mid-tier / No preference]
    │       ├── Prefer cards with TSA PreCheck/GE credit or lounge access?  [multi-select: TSA PreCheck/Global Entry credit, Lounge access]
    │       └── Do any of these approval rules apply to you?  [always shown]
    │
    ├── Primary = 🎁 Signup bonus
    │       │
    │       ├── Exclude travel and hotel branded cards?  [No, include / Yes, exclude]
    │       │       ├── If "No, include" → What kind of travel rewards?  [Bank Rewards / Airline / Hotel]
    │       │       │       ├── If Bank Rewards → Any bank preference?  [Chase, Amex, Citi, …]
    │       │       │       ├── If Airline → Which airline do you usually fly?  [United, Delta, …]
    │       │       │       └── If Hotel  → Which hotel brand do you prefer?  [Marriott, Hilton, …]
    │       │       └── If "Yes, exclude" → no travel-type or airline/hotel questions
    │       └── Do any of these approval rules apply to you?  [always shown]
    │
    └── Primary = 🧾 Everyday spending
            │
            ├── Do you need a 0% intro APR?  [Yes / No]
            └── Do any of these approval rules apply to you?  [always shown]
```

---

## Summary table

| Primary (wizard Q1 #1) | Refinement questions shown (results page) |
|------------------------|-------------------------------------------|
| **Cashback**           | 0% intro APR? • Approval rules            |
| **Travel**             | Travel rewards type? → (if Bank Rewards: bank? \| if Airline: airline? \| if Hotel: hotel?) • Premium/mid-tier? • TSA PreCheck/lounge? (multi-select) • Approval rules |
| **Bonus**              | Exclude travel and hotel cards? • (if include travel) Travel rewards type? → airline? / hotel? • Approval rules |
| **Everyday**           | 0% intro APR? • Approval rules            |

**Approval rules** (“Do any of these approval rules apply to you?”) is shown for every primary goal.

---

## Notes

- **Travel** and **Bonus** never show the 0% APR question.
- **Travel** shows travel-type and premium/mid-tier only when the user did not choose “Exclude travel and hotel” (that question is Bonus-only).
- **Bonus** shows “Exclude travel and hotel branded cards?” first. If they choose “No, include travel cards”, they then see “What kind of travel rewards?” and (if Airline/Hotel) airline or hotel preference, so they can target high-bonus airline/hotel cards.
