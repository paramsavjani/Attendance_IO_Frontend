import { useState } from "react";
import { Bug, Lightbulb, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { API_CONFIG, authenticatedFetch } from "@/lib/api";

type Kind = "bug" | "feedback" | "suggestion";

const KINDS: { id: Kind; label: string; hint: string; icon: typeof Bug; tone: string }[] = [
  { id: "bug", label: "Bug", hint: "Something is broken or wrong", icon: Bug, tone: "text-rose-400 bg-rose-500/15 ring-rose-500/30" },
  { id: "feedback", label: "Feedback", hint: "Tell us what you think", icon: MessageSquare, tone: "text-sky-400 bg-sky-500/15 ring-sky-500/30" },
  { id: "suggestion", label: "Idea", hint: "A feature you would like", icon: Lightbulb, tone: "text-amber-400 bg-amber-500/15 ring-amber-500/30" },
];

const PLACEHOLDERS: Record<Kind, { title: string; body: string }> = {
  bug: { title: "Lab slot shows the wrong time", body: "What happened, and what you expected instead. Which screen?" },
  feedback: { title: "Love the new analytics", body: "What is working, what is not, what feels off." },
  suggestion: { title: "Add a widget for today's classes", body: "What would you like, and how would you use it?" },
};

/**
 * The "send feedback" sheet. Used from Profile and from the feedback screen, so both submit the
 * same way. [onSent] fires after the server accepts it, so a list can refresh itself.
 */
export function FeedbackComposer({
  open,
  onOpenChange,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent?: () => void;
}) {
  const [kind, setKind] = useState<Kind>("feedback");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const ready = title.trim().length > 0 && body.trim().length > 0;
  const placeholder = PLACEHOLDERS[kind];

  async function send() {
    if (!ready) {
      toast.error("Add a title and a few words about it");
      return;
    }
    setSending(true);
    try {
      const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.SUBMIT_FEEDBACK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: kind, title: title.trim(), description: body.trim() }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "" }));
        throw new Error(error.message || "Could not send your feedback");
      }
      const result = await response.json().catch(() => ({}));
      toast.success(result.message || "Sent. You'll see the reply in Your feedback.");
      setTitle("");
      setBody("");
      setKind("feedback");
      onOpenChange(false);
      onSent?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send your feedback");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !sending && onOpenChange(v)}>
      <DialogContent className="max-h-[92svh] max-w-[92vw] overflow-y-auto rounded-[28px] border border-white/10 bg-card p-0 sm:max-w-md [&>button]:hidden">
        <div className="px-5 pt-6">
          <DialogTitle className="text-[19px] font-bold tracking-tight">Send feedback</DialogTitle>
          <DialogDescription className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
            It goes straight to the person who builds this app, and the reply shows up in Your feedback.
          </DialogDescription>
        </div>

        <div className="grid grid-cols-3 gap-2 px-5 pt-4">
          {KINDS.map((k) => {
            const active = kind === k.id;
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => setKind(k.id)}
                disabled={sending}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 transition-all active:scale-[0.97]",
                  active ? "border-transparent ring-1 " + k.tone : "border-white/[0.07] bg-white/[0.03] text-white/50"
                )}
              >
                <k.icon className="h-5 w-5" />
                <span className="text-[12px] font-semibold">{k.label}</span>
              </button>
            );
          })}
        </div>
        <p className="px-5 pt-2 text-center text-[11.5px] text-white/40">{KINDS.find((k) => k.id === kind)?.hint}</p>

        <div className="space-y-3 px-5 pt-3">
          <div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              disabled={sending}
              placeholder={placeholder.title}
              className="h-11 rounded-xl border-white/10 bg-white/[0.03] placeholder:text-white/25"
            />
            <p className="mt-1 text-right text-[10.5px] text-white/30">{title.length}/100</p>
          </div>
          <div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={500}
              rows={4}
              disabled={sending}
              placeholder={placeholder.body}
              className="resize-none rounded-xl border-white/10 bg-white/[0.03] placeholder:text-white/25"
            />
            <p className="mt-1 text-right text-[10.5px] text-white/30">{body.length}/500</p>
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={sending}
            className="min-h-[46px] flex-1 rounded-2xl text-[13.5px] text-white/55 active:bg-white/[0.05] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={send}
            disabled={sending || !ready}
            className="flex min-h-[46px] flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-primary text-[14px] font-semibold text-primary-foreground active:scale-[0.99] disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
