"use client";

import Link from "next/link";
import { getTheme } from "@/app/lib/theme";
import { POINT_VALUES_CPP } from "@/app/lib/pointValues";

const theme = getTheme("personal");

const FAQ_SECTIONS = [
  {
    id: "what-is",
    question: "What is Card Scout?",
    answer:
      "A free tool to find credit cards that fit your goals. You answer a few questions or type what you want—cashback, travel, signup bonus, whatever. We rank cards and show top picks with pros, cons, and estimated bonus value.",
  },
  {
    id: "what-are-we-doing",
    question: "What are we doing?",
    answer:
      "Asking what you care about (annual fees, bonus spend, travel vs cashback, airline/hotel loyalty), then scoring cards against that. You get ranked results, can refine with more questions, compare a few cards, or use Maximize Rewards to plan which cards to apply for if you have a spend budget.",
  },
  {
    id: "important-questions",
    question: "What are the important questions?",
    answer:
      "Main ones: what you want the card best at (rank cashback, travel, bonus, everyday), how you feel about annual fees, and how much you can spend for a bonus. For travel we ask bank vs airline vs hotel, premium vs mid-tier, preferred airline/hotel, and stuff like TSA PreCheck or lounge. We also ask approval rules (e.g. 5+ cards in 24 months) so we can skip issuers that might not approve you.",
  },
  {
    id: "card-types",
    question: "What kind of cards can it handle?",
    answer:
      "Travel (bank points, airline miles, hotel points), cashback, and mix of both. Personal and business. You can narrow by rewards type, annual fee, intro APR, and approval rules.",
  },
  {
    id: "database-size",
    question: "How big is the database of cards?",
    answer:
      "100+ U.S. cards from the main issuers—Chase, Amex, Citi, Capital One, BoA, U.S. Bank, Barclays, Wells Fargo, etc. We add and update over time. If a card’s missing, we probably don’t have it yet.",
  },
  {
    id: "points-evaluation",
    question: "How are points and miles evaluated?",
    answer:
      "We use a cents-per-point (cpp) table. So 1.25 cpp = 1.25¢ per point → 80k points ≈ $1,000. Table below. These are ballpark numbers—your real value can be way higher or lower depending on how you redeem.",
  },
  {
    id: "ranking",
    question: "How do we rank cards?",
    answer:
      "Internal scoring based on your answers. We combine your preferences into a score per card; better matches rank higher. No fancy formula to share—just “we score them and show the best fits.”",
  },
  {
    id: "max-rewards-mode",
    question: "What is Maximize Rewards mode?",
    answer:
      "You tell us how much you can spend (e.g. $20k) and how many cards you’re open to (e.g. 5). We suggest a set of cards and an order to apply so you can hit each minimum spend and get the most bonus value. Handy when you have a big purchase or planned spend and want to stack bonuses.",
  },
  {
    id: "free",
    question: "Is Card Scout free?",
    answer:
      "Yes. Recommendations, comparison, Maximize Rewards—all free. We may use affiliate links when you apply; that doesn’t change what we show or the order.",
  },
  {
    id: "data",
    question: "Do you store my answers or data?",
    answer:
      "Answers live in your browser so you can refine without redoing everything. No account needed. Feedback or prompts you send might go to our systems to improve things—check our privacy stuff for details.",
  },
];

function PointsTable() {
  const rows = Object.entries(POINT_VALUES_CPP).filter(([k]) => k !== "Cash");
  const bank = rows.filter(([k]) =>
    ["Ultimate Rewards (UR)", "Membership Rewards (MR)", "Thank You Points (TYP)", "Bank of America Points", "U.S. Bank Points", "Wells Fargo Rewards", "Capital One Miles"].includes(k)
  );
  const airline = rows.filter(([k]) =>
    ["United Miles", "Southwest Rapid Rewards", "Delta SkyMiles", "AAdvantage Miles", "Alaska Miles", "JetBlue TrueBlue", "BreezePoints", "Atmos Miles", "Airline Miles"].includes(k)
  );
  const hotel = rows.filter(([k]) =>
    ["Marriott Bonvoy Points", "Hilton Honors Points", "World of Hyatt Points", "IHG One Rewards", "Wyndham Rewards", "Choice Privileges"].includes(k)
  );

  const TableBlock = ({ title, data }: { title: string; data: [string, number][] }) => (
    <div style={{ marginBottom: 20 }}>
      <div className="faq-table-title" style={{ fontWeight: 600, marginBottom: 8, color: theme.primaryDark }}>{title}</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--border)" }}>
            <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--text-muted)" }}>Program</th>
            <th style={{ textAlign: "right", padding: "8px 12px", color: "var(--text-muted)" }}>Cents per point</th>
          </tr>
        </thead>
        <tbody>
          {data.map(([program, cpp]) => (
            <tr key={program} style={{ borderBottom: "1px solid var(--border-light)" }}>
              <td style={{ padding: "8px 12px", color: "var(--text-primary)" }}>{program}</td>
              <td style={{ padding: "8px 12px", textAlign: "right", color: "var(--text-secondary)" }}>{cpp}¢</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ marginTop: 12, marginBottom: 16 }}>
      <TableBlock title="Bank / transferable points" data={bank} />
      <TableBlock title="Airline miles" data={airline} />
      <TableBlock title="Hotel points" data={hotel} />
    </div>
  );
}

export default function FAQPage() {
  return (
    <div
      className="faq-page"
      style={{
        minHeight: "100vh",
        background: theme.backgroundGradient,
        fontFamily: "system-ui",
        padding: "24px 20px 48px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link
          href="/"
          className="faq-back-link"
          style={{
            display: "inline-block",
            marginBottom: 24,
            fontSize: 14,
            fontWeight: 600,
            color: theme.primary,
            textDecoration: "none",
          }}
        >
          ← Back to Card Scout
        </Link>

        <h1
          className="faq-main-title"
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          Frequently Asked Questions
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-muted)", marginBottom: 32 }}>
          How it works, what we cover, how we rank and value cards.
        </p>

        {FAQ_SECTIONS.map((section) => (
          <section
            key={section.id}
            id={section.id}
            style={{
              marginBottom: 32,
              padding: "20px 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <h2
              className="faq-section-title"
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: theme.primaryDark,
                marginBottom: 10,
                lineHeight: 1.35,
              }}
            >
              {section.question}
            </h2>
            <div style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {section.answer}
            </div>
            {section.id === "points-evaluation" && (
              <>
                <PointsTable />
                <div
                  style={{
                    padding: "12px 14px",
                    background: "var(--surface-subtle)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "var(--text-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  <strong>Heads up:</strong> These are rough approximations. Your value can be way different depending on how you redeem and your situation. Use as a guide, not a guarantee.
                </div>
              </>
            )}
          </section>
        ))}

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Link
            href="/"
            className="faq-cta-button"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              borderRadius: 10,
              background: theme.primary,
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Get started with Card Scout
          </Link>
        </div>
      </div>
    </div>
  );
}
