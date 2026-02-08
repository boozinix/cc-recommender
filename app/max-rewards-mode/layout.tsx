import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Max Rewards Mode",
  description: "Maximize signup bonuses with your spend budget and card limit.",
};

export default function MaxRewardsModeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
