import { useEffect, useRef, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BellRing, AlertCircle, Ban, HelpCircle, FileCheck2, Send, CheckCircle2, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Subject } from "@/types/attendance";
import { NoticeType, CreateNoticePayload, UrgentNotice } from "@/types/notice";
import {
  createUrgentNotice,
  findDuplicateNoticeToday,
  getTodayPostCountForUser,
} from "@/lib/notices";
import { toast } from "sonner";

interface CreateNoticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If pre-selected from a lecture slot, e.g. "Notify class" */
  preselectedSubject?: Subject | null;
  enrolledSubjects: Subject[];
  currentStudent: {
    id: string;
    name: string;
    rollNumber?: string;
    pictureUrl?: string;
  };
  onNoticeCreated?: (notice: UrgentNotice) => void;
}

const DAILY_LIMIT = 2;
const MESSAGE_MAX = 200;

const NOTICE_TYPES: { value: NoticeType; label: string; icon: typeof Ban; defaultTitle: string; placeholder: string; tone: string }[] = [
  {
    value: "CANCELLED_LECTURE",
    label: "Cancelled",
    icon: Ban,
    defaultTitle: "Lecture Cancelled",
    placeholder: "e.g. Prof emailed that today's 2 PM lecture is cancelled.",
    tone: "border-red-500/60 bg-red-500/10 text-red-500",
  },
  {
    value: "QUIZ",
    label: "Quiz",
    icon: HelpCircle,
    defaultTitle: "Surprise Quiz Announced",
    placeholder: "e.g. Quiz on chapters 3-4 in tomorrow's lecture.",
    tone: "border-amber-500/60 bg-amber-500/10 text-amber-500",
  },
  {
    value: "MARKS",
    label: "Marks out",
    icon: FileCheck2,
    defaultTitle: "Marks Released",
    placeholder: "e.g. Mid-sem marks are up on the notice board.",
    tone: "border-blue-500/60 bg-blue-500/10 text-blue-500",
  },
  {
    value: "OTHER",
    label: "Other",
    icon: AlertCircle,
    defaultTitle: "Important Subject Update",
    placeholder: "e.g. Lecture moved to LT-3 today.",
    tone: "border-primary/60 bg-primary/10 text-primary",
  },
];

/** What classmates will see on their lock screen, shown live while typing and again in the confirm step. */
function PushPreview({ title, code, message, sender }: { title: string; code?: string; message: string; sender: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-3">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <BellRing className="w-3 h-3 text-red-500" />
        <span className="font-medium">Attendance IO</span>
        <span>· now</span>
      </div>
      <p className="mt-1 text-[13px] font-semibold text-foreground leading-snug truncate">
        {title.trim() || "Title"}
        {code && <span className="font-normal text-muted-foreground"> · {code}</span>}
      </p>
      <p className={cn("text-xs leading-snug line-clamp-2", message.trim() ? "text-foreground/80" : "text-muted-foreground/60")}>
        {message.trim() || "Your message shows here"}
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground">— {sender}</p>
    </div>
  );
}

export function CreateNoticeDialog({
  open,
  onOpenChange,
  preselectedSubject,
  enrolledSubjects,
  currentStudent,
  onNoticeCreated,
}: CreateNoticeDialogProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    preselectedSubject?.id || enrolledSubjects[0]?.id || ""
  );
  const [noticeType, setNoticeType] = useState<NoticeType>("CANCELLED_LECTURE");
  const [title, setTitle] = useState(NOTICE_TYPES[0].defaultTitle);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [existingDuplicate, setExistingDuplicate] = useState<UrgentNotice | null>(null);
  const [postsLeft, setPostsLeft] = useState(DAILY_LIMIT);
  const duplicateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (existingDuplicate) duplicateRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [existingDuplicate]);

  // Start every opening fresh, on the lecture it was opened from. Without this the subject
  // picked the first time stuck around, so a later "Notify" on another lecture sent to the old one.
  useEffect(() => {
    if (!open) return;
    setSelectedSubjectId(preselectedSubject?.id || enrolledSubjects[0]?.id || "");
    setNoticeType("CANCELLED_LECTURE");
    setTitle(NOTICE_TYPES[0].defaultTitle);
    setMessage("");
    setExistingDuplicate(null);
    setPostsLeft(Math.max(0, DAILY_LIMIT - getTodayPostCountForUser()));
    // Only on opening: re-running when the subjects list re-renders would wipe what's being typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preselectedSubject?.id]);

  const activeSubject = useMemo(
    () => enrolledSubjects.find((s) => s.id === selectedSubjectId) || preselectedSubject || enrolledSubjects[0],
    [selectedSubjectId, enrolledSubjects, preselectedSubject]
  );
  const activeType = NOTICE_TYPES.find((t) => t.value === noticeType) ?? NOTICE_TYPES[0];
  const canSend = !!activeSubject && !!title.trim() && !!message.trim() && postsLeft > 0 && !existingDuplicate;

  const handleSubjectChange = (id: string) => {
    setSelectedSubjectId(id);
    setExistingDuplicate(null);
  };

  const handleTypeChange = (type: NoticeType) => {
    // Only replace the title if the student hasn't written their own
    const isDefaultTitle = NOTICE_TYPES.some((t) => t.defaultTitle === title);
    setNoticeType(type);
    setExistingDuplicate(null);
    const preset = NOTICE_TYPES.find((t) => t.value === type);
    if (preset && (isDefaultTitle || !title.trim())) setTitle(preset.defaultTitle);
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeSubject?.id) {
      toast.error("Please select a subject");
      return;
    }

    if (!title.trim() || !message.trim()) {
      toast.error("Please provide both a title and message");
      return;
    }

    if (getTodayPostCountForUser() >= DAILY_LIMIT) {
      toast.error(`You have reached your limit of ${DAILY_LIMIT} urgent notices for today.`);
      return;
    }

    const duplicate = findDuplicateNoticeToday(activeSubject.id, noticeType);
    if (duplicate) {
      setExistingDuplicate(duplicate);
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmSend = async () => {
    setShowConfirmDialog(false);
    if (!activeSubject?.id) return;

    try {
      setIsSubmitting(true);
      const payload: CreateNoticePayload = {
        subjectId: activeSubject.id,
        title: title.trim(),
        message: message.trim(),
        noticeType,
      };

      const created = await createUrgentNotice(payload, currentStudent);
      toast.success("Urgent notice sent to classmates!");
      onNoticeCreated?.(created);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to post urgent notice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-hidden p-0 gap-0 flex flex-col rounded-2xl bg-card border-border shadow-2xl">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 pr-10">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <span className="w-7 h-7 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <BellRing className="w-3.5 h-3.5 text-red-500" />
              </span>
              Notify your class
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Sends a push notification to everyone enrolled in this subject.
            </DialogDescription>
          </div>

          <form id="create-notice-form" onSubmit={handleInitialSubmit} className="px-4 pb-3 space-y-3.5 flex-1 min-h-0 overflow-y-auto">
            {/* Duplicate Notice Alert if found: first thing in view, so a greyed-out button never goes unexplained */}
            {existingDuplicate && (
              <div ref={duplicateRef} className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  Already sent today
                </div>
                <p className="text-xs text-foreground">
                  <span className="font-medium">{existingDuplicate.createdBy.name}</span> already notified the class:
                </p>
                <div className="p-2 rounded-lg bg-background/60 text-xs space-y-0.5">
                  <p className="font-semibold">{existingDuplicate.title}</p>
                  <p className="text-muted-foreground">{existingDuplicate.message}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="w-full text-xs h-8 rounded-lg"
                >
                  Got it, don't send
                </Button>
              </div>
            )}
            {/* Subject */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground">Subject</Label>
              {preselectedSubject ? (
                <div className="h-10 px-3 rounded-xl border border-border bg-muted/30 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{preselectedSubject.name}</p>
                  <span className="text-[11px] font-mono text-muted-foreground flex-shrink-0">{preselectedSubject.code}</span>
                </div>
              ) : (
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-4 px-4 [scrollbar-width:none]">
                  {enrolledSubjects.map((s) => {
                    const isSelected = s.id === activeSubject?.id;
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => handleSubjectChange(s.id)}
                        title={s.name}
                        className={cn(
                          "h-9 px-3 rounded-full border text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors",
                          isSelected
                            ? "border-foreground/80 bg-foreground text-background"
                            : "border-border bg-background/50 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {s.code}
                      </button>
                    );
                  })}
                </div>
              )}
              {!preselectedSubject && activeSubject && (
                <p className="text-[11px] text-muted-foreground truncate">{activeSubject.name}</p>
              )}
            </div>

            {/* Notice Type */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground">What happened?</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {NOTICE_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = noticeType === t.value;
                  return (
                    <button
                      type="button"
                      key={t.value}
                      onClick={() => handleTypeChange(t.value)}
                      aria-pressed={isSelected}
                      className={cn(
                        "h-14 rounded-xl border flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-all active:scale-[0.97]",
                        isSelected ? t.tone : "border-border/70 bg-background/50 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="notice-title" className="text-[11px] font-medium text-muted-foreground">Title</Label>
              <Input
                id="notice-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lecture Cancelled"
                className="text-sm bg-background/50 h-10 rounded-xl"
                maxLength={80}
                required
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="notice-msg" className="text-[11px] font-medium text-muted-foreground">Details</Label>
                <span className={cn("text-[10px] tabular-nums", message.length > MESSAGE_MAX - 20 ? "text-amber-500" : "text-muted-foreground/70")}>
                  {message.length}/{MESSAGE_MAX}
                </span>
              </div>
              <Textarea
                id="notice-msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={activeType.placeholder}
                rows={2}
                className="text-sm bg-background/50 resize-none rounded-xl min-h-[64px]"
                maxLength={MESSAGE_MAX}
                required
              />
            </div>

            {/* Live preview */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground">Preview</Label>
              <PushPreview
                title={title}
                code={activeSubject?.code}
                message={message}
                sender={`${currentStudent.name}${currentStudent.rollNumber ? ` (${currentStudent.rollNumber})` : ""}`}
              />
            </div>

          </form>

          {/* Footer stays visible however long the form gets */}
          <div className="px-4 pt-3 pb-4 border-t border-border/60 space-y-2.5">
            <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-snug">
              <Info className="w-3.5 h-3.5 mt-px flex-shrink-0" />
              {postsLeft > 0
                ? `Your name is shown with the notice. ${postsLeft} of ${DAILY_LIMIT} left today; false notices can be reported.`
                : `You've used both notices for today. Try again tomorrow.`}
            </p>
            <Button
              type="submit"
              form="create-notice-form"
              disabled={isSubmitting || !canSend}
              className="w-full h-11 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white gap-2 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {activeSubject ? `Notify ${activeSubject.code} class` : "Notify class"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog before sending */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Send to the whole class?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Everyone in <strong className="text-foreground">{activeSubject?.name}</strong> gets this right away. It can't be unsent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <PushPreview
            title={title}
            code={activeSubject?.code}
            message={message}
            sender={`${currentStudent.name}${currentStudent.rollNumber ? ` (${currentStudent.rollNumber})` : ""}`}
          />
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-10 text-sm rounded-xl">Edit</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSend}
              className="h-10 text-sm rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Send now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
