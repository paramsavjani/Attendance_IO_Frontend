import { useState, useMemo, useEffect } from "react";
import { Search, Check, X, BookOpen, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Subject } from "@/types/attendance";
import { cn } from "@/lib/utils";
import { API_CONFIG } from "@/lib/api";
import { toast } from "sonner";

interface SubjectSelectorProps {
  selectedSubjects: Subject[];
  onSave: (subjects: Subject[]) => void;
  onCancel?: () => void;
  isOnboarding?: boolean;
}

// Generate a consistent color for a subject based on its code
function generateSubjectColor(code: string): string {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `${hue} 72% 50%`;
}

export function SubjectSelector({ 
  selectedSubjects, 
  onSave, 
  onCancel,
  isOnboarding = false 
}: SubjectSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Subject[]>(selectedSubjects);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(API_CONFIG.ENDPOINTS.SUBJECTS_CURRENT, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch subjects');
        }
        
        const data = await response.json();
        
        // Convert backend response to frontend Subject format
        const formattedSubjects: Subject[] = data.map((subject: any) => ({
          id: subject.id,
          code: subject.code,
          name: subject.name,
          color: generateSubjectColor(subject.code),
        }));
        
        setSubjects(formattedSubjects);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        toast.error('Failed to load subjects');
        setSubjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjects;
    const query = searchQuery.toLowerCase();
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.code.toLowerCase().includes(query)
    );
  }, [searchQuery, subjects]);

  const MAX_SUBJECTS = 7;

  const toggleSubject = (subject: Subject) => {
    setSelected((prev) => {
      const exists = prev.find((s) => s.id === subject.id);
      if (exists) {
        return prev.filter((s) => s.id !== subject.id);
      }
      // Check max subjects constraint
      if (prev.length >= MAX_SUBJECTS) {
        toast.error(`Maximum ${MAX_SUBJECTS} subjects allowed`);
        return prev;
      }
      return [...prev, subject];
    });
  };

  const isSelected = (id: string) => selected.some((s) => s.id === id);

  const handleSave = async () => {
    // Validate max subjects
    if (selected.length > MAX_SUBJECTS) {
      toast.error(`Maximum ${MAX_SUBJECTS} subjects allowed`);
      return;
    }

    try {
      // Save to backend
      const response = await fetch(API_CONFIG.ENDPOINTS.ENROLLED_SUBJECTS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subjectIds: selected.map(s => s.id),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save subjects');
      }

      toast.success(`Successfully enrolled in ${selected.length} subject${selected.length !== 1 ? 's' : ''}`);
      onSave(selected);
    } catch (error: any) {
      console.error('Error saving subjects:', error);
      toast.error(error.message || 'Failed to save subjects');
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="text-center mb-3 sm:mb-4 px-2 flex-shrink-0">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 sm:mb-3">
          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </div>
        <h2 className="text-base sm:text-lg font-bold mb-1">
          {isOnboarding ? "Select Your Subjects" : "Update Subjects"}
        </h2>
        <p className="text-[10px] sm:text-xs text-muted-foreground px-2">
          {isOnboarding 
            ? "Choose the subjects you're enrolled in"
            : "Add or remove subjects from your list"
          }
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-2 sm:mb-3 flex-shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search subjects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 sm:h-10 rounded-xl bg-muted/50 border-border text-sm"
        />
      </div>

      {/* Selected count */}
      <div className="flex items-center justify-between mb-2 px-1 flex-shrink-0">
        <span className={cn(
          "text-[10px] sm:text-xs",
          selected.length >= MAX_SUBJECTS ? "text-destructive font-medium" : "text-muted-foreground"
        )}>
          {selected.length} / {MAX_SUBJECTS} subject{selected.length !== 1 ? "s" : ""} selected
        </span>
        {selected.length > 0 && (
          <button
            onClick={() => setSelected([])}
            className="text-[10px] text-destructive hover:underline px-1"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Subject List - Flexible height for mobile */}
      <div className="flex-1 overflow-y-auto space-y-1.5 mb-2 sm:mb-3 min-h-0 pr-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {filteredSubjects.map((subject) => {
              const checked = isSelected(subject.id);
              return (
                <button
                  key={subject.id}
                  onClick={() => toggleSubject(subject)}
                  className={cn(
                    "w-full flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-lg sm:rounded-xl border transition-all text-left",
                    checked
                      ? "bg-primary/10 border-primary/30"
                      : "bg-card border-border hover:bg-muted/50 active:scale-[0.98]"
                  )}
                >
                  <div
                    className="w-1.5 sm:w-2 h-7 sm:h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: `hsl(${subject.color})` }}
                  />
                  <div className="flex-1 min-w-0 pr-1">
                    <p className="font-medium text-xs sm:text-sm truncate leading-tight">{subject.name}</p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">{subject.code}</p>
                  </div>
                  <div
                    className={cn(
                      "w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                      checked
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {checked && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                  </div>
                </button>
              );
            })}

            {!isLoading && filteredSubjects.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">
                  {searchQuery.trim() ? "No subjects found" : "No subjects available"}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-border flex-shrink-0">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-9 sm:h-10 rounded-lg sm:rounded-xl text-xs sm:text-sm"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={selected.length === 0 || selected.length > MAX_SUBJECTS}
          className="flex-1 h-9 sm:h-10 rounded-lg sm:rounded-xl text-xs sm:text-sm"
        >
          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
          {isOnboarding ? "Continue" : "Save"}
        </Button>
      </div>
    </div>
  );
}
