import { useMemo, useRef, useState } from "react";
import { Check, Loader2, Plus, VenetianMask, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { POLL_DURATIONS, POLL_LIMITS } from "@/lib/polls";
import type { CreatePollInput, Poll } from "@/types/poll";
import type { Subject } from "@/types/attendance";
import { Switch } from "@/components/ui/switch";

interface CreatePollFormProps {
  subjects: Subject[];
  /** Preselected subject, e.g. the student's next lecture today. */
  suggestedSubjectId?: string | null;
  createdToday: number;
  dailyLimit: number;
  onCreate: (input: CreatePollInput) => Promise<Poll>;
  onCreated: (poll: Poll) => void;
}

/** One-tap starting points for the questions classes actually ask each other. */
const STARTERS = [
  { label: "Lecture happening?", question: "Is the lecture happening today?", options: ["Yes", "No", "Not sure"] },
  { label: "Understood the topic?", question: "Did today's topic make sense?", options: ["Yes, clear", "Partly", "Not really"] },
  { label: "Extra class day", question: "Which day works for an extra class?", options: ["Mon", "Tue", "Wed", "Thu", "Fri"], multiple: true },
  { label: "Deadline extension?", question: "Should we ask for a deadline extension?", options: ["Yes", "No"] },
];

export function CreatePollForm({
  subjects,
  suggestedSubjectId,
  createdToday,
  dailyLimit,
  onCreate,
  onCreated,
}: CreatePollFormProps) {
  const [subjectId, setSubjectId] = useState<string | null>(
    suggestedSubjectId && subjects.some((s) => s.id === suggestedSubjectId)
      ? suggestedSubjectId
      : subjects.length === 1
        ? subjects[0].id
        : null,
  );
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [durationHours, setDurationHours] = useState(24);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const optionRefs = useRef<(HTMLInputElement | null)[]>([]);

  const subject = subjects.find((s) => s.id === subjectId) ?? null;
  const filledOptions = options.map((o) => o.trim()).filter(Boolean);
  const duplicate = useMemo(() => {
    const seen = new Set<string>();
    return filledOptions.some((o) => {
      const key = o.toLowerCase();
      if (seen.has(key)) return true;
      seen.add(key);
      return false;
    });
  }, [filledOptions]);

  const problem = !subjectId
    ? "Pick a subject"
    : question.trim().length < 3
      ? "Write your question"
      : filledOptions.length < POLL_LIMITS.minOptions
        ? "Add at least two options"
        : duplicate
          ? "Options must be different"
          : null;
  const limitReached = createdToday >= dailyLimit;

  const applyStarter = (starter: (typeof STARTERS)[number]) => {
    setQuestion(starter.question);
    setOptions([...starter.options]);
    setAllowMultiple(Boolean(starter.multiple));
  };

  const updateOption = (index: number, value: string) =>
    setOptions((prev) => prev.map((o, i) => (i === index ? value.slice(0, POLL_LIMITS.optionMax) : o)));

  const addOption = () => {
    if (options.length >= POLL_LIMITS.maxOptions) return;
    setOptions((prev) => [...prev, ""]);
    requestAnimationFrame(() => optionRefs.current[options.length]?.focus());
  };

  const removeOption = (index: number) => {
    if (options.length <= POLL_LIMITS.minOptions) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (problem || limitReached || submitting || !subjectId) return;
    setSubmitting(true);
    try {
      const poll = await onCreate({
        subjectId: Number(subjectId),
        question: question.trim(),
        options: filledOptions,
        allowMultiple,
        anonymous,
        durationHours,
      });
      toast.success(`Poll posted to ${poll.subject.name}`);
      onCreated(poll);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't post the poll");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
        {/* Subject */}
        <section>
          <SectionLabel>Subject</SectionLabel>
          {subjects.length === 0 ? (
            <p className="text-xs text-muted-foreground">Add your subjects first to ask a poll.</p>
          ) : (
            <div className="space-y-1.5" role="radiogroup" aria-label="Subject">
              {subjects.map((s) => {
                const active = s.id === subjectId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSubjectId(s.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                      active ? "border-foreground bg-secondary/60 font-semibold" : "border-border text-foreground/80",
                    )}
                  >
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: `hsl(${s.color})` }} />
                    <span className="min-w-0 flex-1 truncate">{s.name}</span>
                    {active && <Check className="h-4 w-4 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Question */}
        <section>
          <div className="flex items-baseline justify-between">
            <SectionLabel>Question</SectionLabel>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {question.length}/{POLL_LIMITS.questionMax}
            </span>
          </div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value.slice(0, POLL_LIMITS.questionMax))}
            placeholder="What do you want to ask your class?"
            rows={2}
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-[15px] font-medium leading-snug outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground/70 focus:border-foreground/40"
          />
          {question.length === 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {STARTERS.map((starter) => (
                <button
                  key={starter.label}
                  type="button"
                  onClick={() => applyStarter(starter)}
                  className="rounded-full bg-secondary/70 px-2.5 py-1 text-[11px] font-medium text-foreground/80 transition-colors active:bg-secondary"
                >
                  {starter.label}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Options */}
        <section>
          <SectionLabel>Options</SectionLabel>
          <div className="space-y-1.5">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <input
                  ref={(el) => (optionRefs.current[index] = el)}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    if (index === options.length - 1) addOption();
                    else optionRefs.current[index + 1]?.focus();
                  }}
                  placeholder={`Option ${index + 1}`}
                  enterKeyHint={index === options.length - 1 ? "done" : "next"}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground/40"
                />
                {options.length > POLL_LIMITS.minOptions && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors active:bg-muted"
                    aria-label={`Remove option ${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < POLL_LIMITS.maxOptions && (
            <button
              type="button"
              onClick={addOption}
              className="mt-2 flex items-center gap-1.5 rounded-full px-1 py-1 text-xs font-semibold text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              Add option
            </button>
          )}
        </section>

        {/* Duration */}
        <section>
          <SectionLabel>Open for</SectionLabel>
          <div className="grid grid-cols-5 gap-1 rounded-xl bg-secondary/50 p-1">
            {POLL_DURATIONS.map((d) => (
              <button
                key={d.hours}
                type="button"
                onClick={() => setDurationHours(d.hours)}
                className={cn(
                  "rounded-lg py-1.5 text-[11px] font-semibold transition-all",
                  durationHours === d.hours ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
                )}
                aria-pressed={durationHours === d.hours}
              >
                {d.label}
              </button>
            ))}
          </div>
        </section>

        {/* Settings */}
        <section className="divide-y divide-border/60 rounded-xl border border-border">
          <ToggleRow
            id="poll-multiple"
            title="Allow multiple answers"
            description="Classmates can pick more than one option."
            checked={allowMultiple}
            onChange={setAllowMultiple}
          />
          <ToggleRow
            id="poll-anonymous"
            title={
              <span className="inline-flex items-center gap-1.5">
                <VenetianMask className="h-3.5 w-3.5" />
                Post anonymously
              </span>
            }
            description="Hide your name. Votes are always anonymous."
            checked={anonymous}
            onChange={setAnonymous}
          />
        </section>
      </div>

      <div className="border-t border-border/60 bg-background px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3">
        <button
          type="button"
          onClick={submit}
          disabled={Boolean(problem) || limitReached || submitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-foreground text-sm font-semibold text-background transition-opacity active:scale-[0.99] disabled:opacity-40"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {limitReached ? `You've asked ${dailyLimit} polls today` : problem ?? "Post poll"}
        </button>
        {!limitReached && !problem && (
          <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
            Classmates in {subject?.name} get a notification.
          </p>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</p>;
}

function ToggleRow({
  id,
  title,
  description,
  checked,
  onChange,
}: {
  id: string;
  title: React.ReactNode;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-3 p-3">
      <span className="pointer-events-none min-w-0">
        <span className="block text-xs font-semibold">{title}</span>
        <span className="block text-[11px] text-muted-foreground">{description}</span>
      </span>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="data-[state=unchecked]:border-zinc-500 data-[state=unchecked]:bg-zinc-500"
      />
    </label>
  );
}
