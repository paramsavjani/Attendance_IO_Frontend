import { Bug, Lightbulb, MessageSquare } from "lucide-react";

/** One place for how each feedback type looks, so the inbox and the thread agree. */
export const FEEDBACK_KIND = {
  BUG: { noun: "Bug report", icon: Bug, glyph: "bg-rose-500/15 text-rose-400" },
  FEEDBACK: { noun: "Feedback", icon: MessageSquare, glyph: "bg-sky-500/15 text-sky-400" },
  SUGGESTION: { noun: "Idea", icon: Lightbulb, glyph: "bg-amber-500/15 text-amber-400" },
} as const;

export type FeedbackKindKey = keyof typeof FEEDBACK_KIND;

export function kindOf(type: string) {
  return FEEDBACK_KIND[type as FeedbackKindKey] ?? FEEDBACK_KIND.FEEDBACK;
}
