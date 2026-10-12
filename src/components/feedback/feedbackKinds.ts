import { Bug, Lightbulb, MessageSquare } from "lucide-react";

/**
 * One place for how each feedback type looks, so the inbox and the thread agree. The tile is the
 * same rounded-xl tinted square the Profile rows use, so the feedback screens read as part of it.
 */
export const FEEDBACK_KIND = {
  BUG: { noun: "Bug report", icon: Bug, tile: "bg-rose-500/15 text-rose-400" },
  FEEDBACK: { noun: "Feedback", icon: MessageSquare, tile: "bg-sky-500/15 text-sky-400" },
  SUGGESTION: { noun: "Idea", icon: Lightbulb, tile: "bg-amber-500/15 text-amber-400" },
} as const;

export type FeedbackKindKey = keyof typeof FEEDBACK_KIND;

export function kindOf(type: string) {
  return FEEDBACK_KIND[type as FeedbackKindKey] ?? FEEDBACK_KIND.FEEDBACK;
}
