import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Subject } from "@/types/attendance";
import { Plus } from "lucide-react";

interface AddExtraClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrolledSubjects: Subject[];
  onAdd: (subjectId: string, startTime?: string, endTime?: string) => Promise<void>;
  date: string;
}

export function AddExtraClassDialog({
  open,
  onOpenChange,
  enrolledSubjects,
  onAdd,
  date,
}: AddExtraClassDialogProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSubjectId) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd(
        selectedSubjectId,
        startTime || undefined,
        endTime || undefined
      );
      
      // Reset form
      setSelectedSubjectId("");
      setStartTime("");
      setEndTime("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding extra class:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedSubjectId("");
    setStartTime("");
    setEndTime("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Extra Class</DialogTitle>
          <DialogDescription>
            Add an extra class for any subject on {new Date(date).toLocaleDateString()}. 
            Time is optional.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select
                value={selectedSubjectId}
                onValueChange={setSelectedSubjectId}
                required
              >
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {enrolledSubjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="time">Class Time (Optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="startTime" className="text-xs text-muted-foreground">
                    Start Time
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="HH:MM"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="endTime" className="text-xs text-muted-foreground">
                    End Time
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="HH:MM"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty if timing is not important
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedSubjectId}>
              {isSubmitting ? "Adding..." : "Add Class"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
