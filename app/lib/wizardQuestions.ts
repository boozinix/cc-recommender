export type WizardOption = {
  value: string;
  label: string;
};

export type WizardQuestion = {
  id: string;
  question: string;
  helper?: string;
  options: WizardOption[];
};

export const wizardQuestions: WizardQuestion[] = [
  {
    id: "primary_goal",
    question: "Rank what you want this card to be best at",
    options: [
      { value: "Cashback", label: "💰 Cashback" },
      { value: "Travel", label: "✈️ Travel rewards" },
      { value: "Bonus", label: "🎁 Signup bonus" },
      { value: "Everyday", label: "🧾 Everyday spending" },
    ],
  },
  {
    id: "annual_fee_tolerance",
    question: "How do you feel about annual fees?",
    helper:
      "Don’t worry — we’ll try to help you offset annual fees with benefits where possible.",
    options: [
      { value: "None", label: "❌ No annual fee" },
      { value: "Low", label: "🙂 Up to $100" },
      { value: "Medium", label: "😐 $100–$400" },
      { value: "High", label: "😎 Doesn't matter" },
    ],
  },
  {
    id: "spend_comfort",
    question:
      "How comfortable are you meeting an initial spending requirement to earn a sign-up bonus?",
    options: [
      { value: "None", label: "Don’t want a bonus" },
      { value: "Low", label: "Under $1,000" },
      { value: "Medium", label: "Up to $5,000" },
      { value: "High", label: "Above $5,000" },
    ],
  },
];

