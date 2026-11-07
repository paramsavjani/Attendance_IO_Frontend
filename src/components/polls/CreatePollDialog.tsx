import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, CalendarIcon, BellRing, Sparkles } from "lucide-react";
import { PollType, CreatePollPayload } from "@/types/poll";
import { toast } from "sonner";

interface CreatePollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  subjectName?: string;
  onPollCreated: (payload: CreatePollPayload) => Promise<void>;
}

export function CreatePollDialog({
  open,
  onOpenChange,
  subjectId,
  subjectName,
  onPollCreated,
}: CreatePollDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pollType, setPollType] = useState<PollType>("SINGLE_CHOICE");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [endDate, setEndDate] = useState("");
  const [notifyStudents, setNotifyStudents] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPollType("SINGLE_CHOICE");
    setOptions(["", ""]);
    setEndDate("");
    setNotifyStudents(true);
  };

  const handlePollTypeChange = (type: PollType) => {
    setPollType(type);
    if (type === "YES_NO") {
      setOptions(["Yes", "No"]);
    } else if (options.length < 2) {
      setOptions(["", ""]);
    }
  };

  const handleAddOption = () => {
    if (options.length >= 8) {
      toast.warning("Maximum 8 options allowed");
      return;
    }
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.warning("Polls must have at least 2 options");
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (text: string, index: number) => {
    const updated = [...options];
    updated[index] = text;
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a question or title for the poll");
      return;
    }

    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);

    if (cleanOptions.length < 2) {
      toast.error("Please provide at least 2 distinct options");
      return;
    }

    // Check duplicates
    const uniqueOptions = new Set(cleanOptions.map((o) => o.toLowerCase()));
    if (uniqueOptions.size !== cleanOptions.length) {
      toast.error("Poll options must be unique");
      return;
    }

    // Validate future end date if provided
    if (endDate) {
      const selectedTime = new Date(endDate).getTime();
      if (selectedTime <= Date.now()) {
        toast.error("End date must be in the future");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onPollCreated({
        subjectId,
        title: title.trim(),
        description: description.trim() || undefined,
        pollType,
        options: cleanOptions,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        notifyStudents,
      });

      toast.success("Poll created successfully!");
      resetForm();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to create poll");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[92vh] overflow-hidden p-0 flex flex-col rounded-2xl bg-card border-border shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Sparkles className="w-4 h-4 text-primary" />
              Create Subject Poll
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground mt-0.5">
            {subjectName ? `For ${subjectName}` : "Ask classmates & make collaborative decisions"}
          </p>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {/* Question / Title */}
          <div className="space-y-1.5">
            <Label htmlFor="poll-title" className="text-xs font-semibold">
              Poll Question / Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="poll-title"
              placeholder="e.g. Should we request extra revision for Unit 3?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm bg-background/50"
              maxLength={150}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="poll-desc" className="text-xs font-semibold text-muted-foreground">
              Description / Notes (Optional)
            </Label>
            <Textarea
              id="poll-desc"
              placeholder="Add relevant context, timings, or details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="text-xs bg-background/50 resize-none"
              maxLength={300}
            />
          </div>

          {/* Poll Type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Poll Type</Label>
            <Select value={pollType} onValueChange={(val) => handlePollTypeChange(val as PollType)}>
              <SelectTrigger className="text-xs bg-background/50">
                <SelectValue placeholder="Select poll type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SINGLE_CHOICE">Single Choice (Pick one)</SelectItem>
                <SelectItem value="MULTIPLE_CHOICE">Multiple Choice (Pick many)</SelectItem>
                <SelectItem value="YES_NO">Yes / No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">
                Options ({options.length}/8) <span className="text-destructive">*</span>
              </Label>
              {pollType !== "YES_NO" && options.length < 8 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                >
                  <Plus className="w-3 h-3" /> Add Option
                </button>
              )}
            </div>

            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground w-4 text-center">
                    {idx + 1}.
                  </span>
                  <Input
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(e.target.value, idx)}
                    disabled={pollType === "YES_NO"}
                    className="text-xs flex-1 bg-background/50 h-9"
                    maxLength={100}
                    required
                  />
                  {pollType !== "YES_NO" && options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveOption(idx)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Expiry Date */}
          <div className="space-y-1.5">
            <Label htmlFor="poll-end" className="text-xs font-semibold flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
              Auto-Close On (Optional)
            </Label>
            <Input
              id="poll-end"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs bg-background/50 h-9"
            />
            <p className="text-[10px] text-muted-foreground">
              Leaves poll active indefinitely if not set.
            </p>
          </div>

          {/* Notify Switch */}
          <div className="rounded-xl border border-border p-3 flex items-center justify-between bg-accent/20">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <BellRing className="w-3.5 h-3.5 text-primary" />
                Notify classmates
              </div>
              <p className="text-[10px] text-muted-foreground">
                Send push notification to enrolled students who opted in
              </p>
            </div>
            <Switch
              checked={notifyStudents}
              onCheckedChange={setNotifyStudents}
            />
          </div>

          {/* Anti-spam notice */}
          <p className="text-[10px] text-muted-foreground text-center italic">
            🛡️ Anti-spam policy: Classmates can report inappropriate or repeated polls. Polls receiving multiple reports are automatically hidden.
          </p>

          {/* Action buttons */}
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
              disabled={isSubmitting}
              className="flex-1 text-xs h-9 rounded-xl font-medium"
            >
              {isSubmitting ? "Creating..." : "Launch Poll"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

