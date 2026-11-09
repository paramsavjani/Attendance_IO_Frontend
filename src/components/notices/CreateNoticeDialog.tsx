import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BellRing, AlertCircle, Ban, HelpCircle, FileCheck2, Send, CheckCircle2 } from "lucide-react";
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

const NOTICE_TYPES: { value: NoticeType; label: string; icon: typeof Ban; description: string; defaultTitle: string }[] = [
  {
    value: "CANCELLED_LECTURE",
    label: "Lecture Cancelled",
    icon: Ban,
    description: "Professor cancelled today's lecture or lab",
    defaultTitle: "Lecture Cancelled",
  },
  {
    value: "QUIZ",
    label: "Surprise Quiz",
    icon: HelpCircle,
    description: "Announcement for an upcoming or surprise test",
    defaultTitle: "Surprise Quiz Announced",
  },
  {
    value: "MARKS",
    label: "Marks / Results Out",
    icon: FileCheck2,
    description: "Exam or lab marks have been displayed / shared",
    defaultTitle: "Marks Released",
  },
  {
    value: "OTHER",
    label: "Other Urgent Update",
    icon: AlertCircle,
    description: "Crucial announcement concerning the class",
    defaultTitle: "Important Subject Update",
  },
];

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
  const [title, setTitle] = useState("Lecture Cancelled");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [existingDuplicate, setExistingDuplicate] = useState<UrgentNotice | null>(null);

  // Sync preselectedSubject when opening
  const activeSubject = useMemo(() => {
    return (
      (preselectedSubject?.id === selectedSubjectId ? preselectedSubject : null) ||
      enrolledSubjects.find((s) => s.id === selectedSubjectId) ||
      enrolledSubjects[0]
    );
  }, [preselectedSubject, selectedSubjectId, enrolledSubjects]);

  const handleTypeChange = (type: NoticeType) => {
    setNoticeType(type);
    const preset = NOTICE_TYPES.find((t) => t.value === type);
    if (preset) {
      setTitle(preset.defaultTitle);
    }
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSubjectId && !activeSubject?.id) {
      toast.error("Please select a subject");
      return;
    }

    if (!title.trim() || !message.trim()) {
      toast.error("Please provide both a title and message");
      return;
    }

    const currentPostCount = getTodayPostCountForUser();
    if (currentPostCount >= 2) {
      toast.error("You have reached your limit of 2 urgent notices for today.");
      return;
    }

    // Check duplicate
    const targetSubjectId = activeSubject?.id || selectedSubjectId;
    const duplicate = findDuplicateNoticeToday(targetSubjectId, noticeType);
    if (duplicate) {
      setExistingDuplicate(duplicate);
      return;
    }

    // Show confirm dialog
    setShowConfirmDialog(true);
  };

  const handleConfirmSend = async () => {
    setShowConfirmDialog(false);
    const targetSubjectId = activeSubject?.id || selectedSubjectId;

    try {
      setIsSubmitting(true);
      const payload: CreateNoticePayload = {
        subjectId: targetSubjectId,
        title: title.trim(),
        message: message.trim(),
        noticeType,
      };

      const created = await createUrgentNotice(payload, currentStudent);
      toast.success("Urgent notice sent to classmates!");
      onNoticeCreated?.(created);
      onOpenChange(false);
      setMessage("");
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
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[92vh] overflow-hidden p-0 flex flex-col rounded-2xl bg-card border-border shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500/20 via-orange-500/10 to-transparent p-4 border-b border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <BellRing className="w-4 h-4 text-red-500 animate-pulse" />
                Notify Class / Urgent Notice
              </DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pings enrolled classmates with a high-priority mobile push notification.
            </p>
          </div>

          <form onSubmit={handleInitialSubmit} className="p-4 space-y-4 flex-1 min-h-0 overflow-y-auto">
            {/* Duplicate Notice Alert if found */}
            {existingDuplicate && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  Notice already sent today!
                </div>
                <p className="text-xs text-foreground">
                  A classmate (<span className="font-medium">{existingDuplicate.createdBy.name}</span>) already posted this:
                </p>
                <div className="p-2 rounded-lg bg-background/60 text-xs space-y-0.5">
                  <p className="font-semibold">{existingDuplicate.title}</p>
                  <p className="text-muted-foreground">{existingDuplicate.message}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setExistingDuplicate(null);
                    onOpenChange(false);
                  }}
                  className="w-full text-xs h-7"
                >
                  Close & Avoid Duplicate
                </Button>
              </div>
            )}

            {/* Subject Selector (if not preselected) */}
            {preselectedSubject ? (
              <div className="p-2.5 rounded-xl border border-border bg-muted/30 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">Subject</p>
                  <p className="text-xs font-semibold">{preselectedSubject.name}</p>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                  {preselectedSubject.code}
                </span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Select Enrolled Subject</Label>
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                  <SelectTrigger className="text-xs bg-background/50">
                    <SelectValue placeholder="Choose subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {enrolledSubjects.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        {s.name} ({s.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notice Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Type of Notice</Label>
              <div className="grid grid-cols-2 gap-2">
                {NOTICE_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = noticeType === t.value;
                  return (
                    <button
                      type="button"
                      key={t.value}
                      onClick={() => handleTypeChange(t.value)}
                      className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-red-500 bg-red-500/10 text-foreground"
                          : "border-border/70 hover:border-border bg-background/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isSelected ? "text-red-500" : ""}`} />
                      <div>
                        <p className="text-xs font-semibold leading-tight">{t.label}</p>
                        <p className="text-[10px] text-muted-foreground leading-snug line-clamp-1 mt-0.5">
                          {t.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="notice-title" className="text-xs font-semibold">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="notice-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lecture Cancelled / Surprise Quiz"
                className="text-xs bg-background/50 h-9"
                maxLength={80}
                required
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <Label htmlFor="notice-msg" className="text-xs font-semibold">
                Message / Details <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="notice-msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Professor sent an email saying today's 2 PM lecture is cancelled."
                rows={3}
                className="text-xs bg-background/50 resize-none"
                maxLength={200}
                required
              />
            </div>

            {/* Sender Identity Preview */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-2.5 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Posting As</span>
                <p className="font-semibold text-foreground">{currentStudent.name}</p>
              </div>
              {currentStudent.rollNumber && (
                <span className="text-[11px] text-muted-foreground font-mono">
                  {currentStudent.rollNumber}
                </span>
              )}
            </div>

            {/* Spam Warning */}
            <p className="text-[10px] text-muted-foreground text-center italic">
              ⚠️ Max 2 notices/day. Notices are never anonymous. Classmates can report false notices; repeated misuse blocks posting.
            </p>

            <div className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
                className="flex-1 text-xs h-9 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !!existingDuplicate}
                className="flex-1 text-xs h-9 rounded-xl font-medium bg-red-600 hover:bg-red-700 text-white gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Notify Class
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog before sending */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base flex items-center gap-2">
              <BellRing className="w-4 h-4 text-red-500" />
              Notify entire class?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground space-y-2 pt-1">
              <span>
                This will immediately broadcast a push notification to all enrolled classmates for{" "}
                <strong className="text-foreground">{activeSubject?.name}</strong>:
              </span>
              <div className="p-2.5 rounded-xl border border-border bg-card text-foreground font-medium">
                ❗ {title} · {activeSubject?.code || "Subject"}
                <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">
                  "{message}" · by {currentStudent.name}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-9 text-xs rounded-xl">Edit Notice</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSend}
              className="h-9 text-xs rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium"
            >
              Yes, Send Notification
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

