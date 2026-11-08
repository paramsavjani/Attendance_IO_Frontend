import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCloseOnBack } from "@/lib/backOverlay";
import type { PollFeedController } from "@/hooks/usePollFeed";
import type { Poll } from "@/types/poll";
import type { Subject } from "@/types/attendance";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { PollCard } from "./PollCard";
import { CreatePollForm } from "./CreatePollForm";
import { PollsIcon } from "./PollsIcon";

export type PollsSheetView = "list" | "create";

interface PollsSheetProps {
  open: boolean;
  view: PollsSheetView;
  onOpenChange: (open: boolean) => void;
  onViewChange: (view: PollsSheetView) => void;
  polls: PollFeedController;
  subjects: Subject[];
  suggestedSubjectId?: string | null;
  isDemo: boolean;
  onReport: (poll: Poll) => void;
  onDelete: (poll: Poll) => void;
}

/** Every class poll in one sheet: browse, vote, and ask a new one. */
export function PollsSheet({
  open,
  view,
  onOpenChange,
  onViewChange,
  polls,
  subjects,
  suggestedSubjectId,
  isDemo,
  onReport,
  onDelete,
}: PollsSheetProps) {
  const { feed, openPolls, endedPolls, isLoading, votingPollId } = polls;
  const [subjectFilter, setSubjectFilter] = useState<number | null>(null);

  // The phone's back button steps out of the form first, then closes the sheet.
  useCloseOnBack(open, () => (view === "create" ? onViewChange("list") : onOpenChange(false)));

  useEffect(() => {
    if (open) polls.refresh();
    // Refresh only when the sheet opens, not on every feed change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const subjectsWithPolls = useMemo(() => {
    const seen = new Map<number, Poll["subject"]>();
    feed.polls.forEach((p) => seen.set(p.subject.id, p.subject));
    return [...seen.values()];
  }, [feed.polls]);

  const matches = (p: Poll) => subjectFilter === null || p.subject.id === subjectFilter;
  const visibleOpen = openPolls.filter(matches);
  const visibleEnded = endedPolls.filter(matches);

  const cardHandlers = {
    onVote: polls.vote,
    onClearVote: polls.clearVote,
    onClose: polls.close,
    onDelete,
    onReport,
  };

  const canAsk = !isDemo && feed.canCreate;

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
        <DrawerContent className="mx-auto flex h-[92dvh] w-full max-w-lg flex-col rounded-t-[24px] border-border/60">
          {view === "create" ? (
            <>
              <div className="flex items-center gap-1 px-2 pb-2 pt-3">
                <button
                  type="button"
                  onClick={() => onViewChange("list")}
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-colors active:bg-muted"
                  aria-label="Back to polls"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div>
                  <DrawerTitle className="text-base font-semibold">Ask your class</DrawerTitle>
                  <DrawerDescription className="text-[11px]">
                    {feed.dailyLimit - feed.createdToday > 0
                      ? `${feed.dailyLimit - feed.createdToday} of ${feed.dailyLimit} polls left today`
                      : "Daily limit reached"}
                  </DrawerDescription>
                </div>
              </div>
              <CreatePollForm
                subjects={subjects}
                suggestedSubjectId={suggestedSubjectId}
                createdToday={feed.createdToday}
                dailyLimit={feed.dailyLimit}
                onCreate={polls.create}
                onCreated={() => {
                  setSubjectFilter(null);
                  onViewChange("list");
                }}
              />
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-3">
                <div>
                  <DrawerTitle className="text-lg font-semibold">Class polls</DrawerTitle>
                  <DrawerDescription className="text-xs">Ask your classmates. Votes are anonymous.</DrawerDescription>
                </div>
                {!isDemo && (
                  <button
                    type="button"
                    onClick={() => onViewChange("create")}
                    disabled={!canAsk}
                    className="flex h-9 flex-shrink-0 items-center gap-1.5 rounded-full bg-foreground pl-2.5 pr-3.5 text-xs font-semibold text-background shadow-md transition-all active:scale-[0.97] disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                    Ask
                  </button>
                )}
              </div>

              {subjectsWithPolls.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <FilterChip active={subjectFilter === null} onClick={() => setSubjectFilter(null)}>
                    All
                  </FilterChip>
                  {subjectsWithPolls.map((s) => (
                    <FilterChip key={s.id} active={subjectFilter === s.id} onClick={() => setSubjectFilter(s.id)}>
                      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="max-w-[10rem] truncate">{s.name}</span>
                    </FilterChip>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
                {isLoading && feed.polls.length === 0 ? (
                  <div className="space-y-3">
                    {[0, 1].map((i) => (
                      <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted/50" />
                    ))}
                  </div>
                ) : feed.polls.length === 0 ? (
                  <EmptyState canAsk={canAsk} onAsk={() => onViewChange("create")} />
                ) : (
                  <div className="space-y-5">
                    {visibleOpen.length > 0 && (
                      <section className="space-y-2.5">
                        <GroupLabel>Open · {visibleOpen.length}</GroupLabel>
                        {visibleOpen.map((poll) => (
                          <PollCard key={poll.id} poll={poll} isVoting={votingPollId === poll.id} {...cardHandlers} />
                        ))}
                      </section>
                    )}
                    {visibleEnded.length > 0 && (
                      <section className="space-y-2.5">
                        <GroupLabel>Ended</GroupLabel>
                        {visibleEnded.map((poll) => (
                          <PollCard key={poll.id} poll={poll} isVoting={false} {...cardHandlers} />
                        ))}
                      </section>
                    )}
                    {!feed.canCreate && !isDemo && feed.createdToday >= feed.dailyLimit && (
                      <p className="pb-2 text-center text-[11px] text-muted-foreground">
                        You've asked {feed.dailyLimit} polls today. You can ask more tomorrow.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>

    </>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
        active ? "bg-foreground text-background" : "bg-secondary/60 text-foreground/70",
      )}
    >
      {children}
    </button>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</h4>;
}

function EmptyState({ canAsk, onAsk }: { canAsk: boolean; onAsk: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 pt-12 text-center">
      <PollsIcon className="mb-4 h-14 w-14 drop-shadow-md" />
      <p className="text-sm font-semibold">No polls in your classes yet</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Is the lecture on? When should the extra class be? Ask once instead of 60 messages in the group.
      </p>
      {canAsk && (
        <button
          type="button"
          onClick={onAsk}
          className="mt-5 flex h-10 items-center gap-1.5 rounded-full bg-foreground px-5 text-sm font-semibold text-background active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Ask the first poll
        </button>
      )}
    </div>
  );
}
