import { useState, useMemo } from "react";
import { Search, Check, X, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Subject } from "@/types/attendance";
import { allSubjects } from "@/data/allSubjects";
import { cn } from "@/lib/utils";

interface SubjectSelectorProps {
  selectedSubjects: Subject[];
  onSave: (subjects: Subject[]) => void;
  onCancel?: () => void;
  isOnboarding?: boolean;
}

export function SubjectSelector({ 
  selectedSubjects, 
  onSave, 
  onCancel,
  isOnboarding = false 
}: SubjectSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Subject[]>(selectedSubjects);

  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return allSubjects;
    const query = searchQuery.toLowerCase();
    return allSubjects.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const toggleSubject = (subject: Subject) => {
    setSelected((prev) => {
      const exists = prev.find((s) => s.id === subject.id);
      if (exists) {
        return prev.filter((s) => s.id !== subject.id);
      }
      return [...prev, subject];
    });
  };

  const isSelected = (id: string) => selected.some((s) => s.id === id);

  const handleSave = () => {
    onSave(selected);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="text-center mb-4 px-2">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <BookOpen className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-lg font-bold mb-1">
          {isOnboarding ? "Select Your Subjects" : "Update Subjects"}
        </h2>
        <p className="text-xs text-muted-foreground">
          {isOnboarding 
            ? "Choose the subjects you're enrolled in"
            : "Add or remove subjects from your list"
          }
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search subjects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 rounded-xl bg-muted/50 border-border text-sm"
        />
      </div>

      {/* Selected count */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs text-muted-foreground">
          {selected.length} subject{selected.length !== 1 ? "s" : ""} selected
        </span>
        {selected.length > 0 && (
          <button
            onClick={() => setSelected([])}
            className="text-[10px] text-destructive hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Subject List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 mb-3 max-h-[45vh] pr-1">
        {filteredSubjects.map((subject) => {
          const checked = isSelected(subject.id);
          return (
            <button
              key={subject.id}
              onClick={() => toggleSubject(subject)}
              className={cn(
                "w-full flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left",
                checked
                  ? "bg-primary/10 border-primary/30"
                  : "bg-card border-border hover:bg-muted/50 active:scale-[0.98]"
              )}
            >
              <div
                className="w-2 h-8 rounded-full flex-shrink-0"
                style={{ backgroundColor: `hsl(${subject.color})` }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{subject.name}</p>
                <p className="text-[10px] text-muted-foreground">{subject.code}</p>
              </div>
              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                  checked
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {checked && <Check className="w-3 h-3" />}
              </div>
            </button>
          );
        })}

        {filteredSubjects.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No subjects found</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-border">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl text-sm"
          >
            <X className="w-4 h-4 mr-1.5" />
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={selected.length === 0}
          className="flex-1 h-10 rounded-xl text-sm"
        >
          <Check className="w-4 h-4 mr-1.5" />
          {isOnboarding ? "Continue" : "Save"}
        </Button>
      </div>
    </div>
  );
}
