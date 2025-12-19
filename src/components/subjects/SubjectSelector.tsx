import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Check, X, BookOpen, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Subject, SaveEnrolledSubjectsResponse, TimetableConflict, SubjectInfo, SubjectSchedule, SelectedSubjectConflict } from "@/types/attendance";
import { cn, hexToHsl } from "@/lib/utils";
import { API_CONFIG } from "@/lib/api";
import { toast } from "sonner";
import { ConflictResolutionModal } from "./ConflictResolutionModal";
import { SubjectConflictResolutionModal } from "./SubjectConflictResolutionModal";

interface SubjectSelectorProps {
  selectedSubjects: Subject[];
  onSave: (subjects: Subject[], hasConflicts?: boolean) => void;
  onCancel?: () => void;
  isOnboarding?: boolean;
}

export function SubjectSelector({ 
  selectedSubjects, 
  onSave, 
  onCancel,
  isOnboarding = false 
}: SubjectSelectorProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Subject[]>(selectedSubjects);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Conflict state (from backend after save)
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflicts, setConflicts] = useState<TimetableConflict[]>([]);
  const [subjectsWithConflicts, setSubjectsWithConflicts] = useState<SubjectInfo[]>([]);
  const [timetableSlotsAdded, setTimetableSlotsAdded] = useState(0);
  
  // Pre-save conflict detection (between selected subjects)
  const [showPreSaveConflictModal, setShowPreSaveConflictModal] = useState(false);
  const [preSaveConflicts, setPreSaveConflicts] = useState<SelectedSubjectConflict[]>([]);
  const [pendingSelectedSubjects, setPendingSelectedSubjects] = useState<Subject[]>([]);

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
          lecturePlace: subject.lecturePlace ?? null,
          color: hexToHsl(subject.color || "#3B82F6"),
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
    let filtered = subjects;
    
    // Filter by search query if present
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = subjects.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.code.toLowerCase().includes(query)
      );
    }
    
    // Sort: selected subjects first, then unselected
    const selectedIds = new Set(selected.map(s => s.id));
    return filtered.sort((a, b) => {
      const aSelected = selectedIds.has(a.id);
      const bSelected = selectedIds.has(b.id);
      
      if (aSelected && !bSelected) return -1; // a comes first
      if (!aSelected && bSelected) return 1;  // b comes first
      return 0; // keep original order for same selection status
    });
  }, [searchQuery, subjects, selected]);

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

  // Detect conflicts using backend endpoint
  const detectConflicts = async (subjectIds: string[]): Promise<SelectedSubjectConflict[]> => {
    if (subjectIds.length === 0) return [];

    try {
      // Call backend to detect conflicts
      const response = await fetch(API_CONFIG.ENDPOINTS.CHECK_SUBJECT_CONFLICTS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subjectIds: subjectIds,
        }),
      });

      if (!response.ok) {
        return []; // If we can't check conflicts, proceed without conflict detection
      }

      const data = await response.json();
      const backendConflicts: TimetableConflict[] = data.conflicts || [];
      
      if (backendConflicts.length === 0) {
        return [];
      }

      // Convert backend conflicts to frontend format
      // Group conflicts by slot (dayId-slotId)
      const conflictMap = new Map<string, SelectedSubjectConflict>();
      
      backendConflicts.forEach(conflict => {
        const key = `${conflict.dayId}-${conflict.slotId}`;
        
        if (!conflictMap.has(key)) {
          conflictMap.set(key, {
            dayId: conflict.dayId,
            dayName: conflict.dayName,
            slotId: conflict.slotId,
            slotStartTime: conflict.slotStartTime,
            slotEndTime: conflict.slotEndTime,
            conflictingSubjects: [],
            selectedSubjectId: null,
          });
        }
        
        const conflictEntry = conflictMap.get(key)!;
        
        // Add both subjects to the conflicting subjects list
        const existingSubject = {
          subjectId: conflict.existingSubjectId.toString(),
          subjectCode: conflict.existingSubjectCode,
          subjectName: conflict.existingSubjectName,
        };
        const newSubject = {
          subjectId: conflict.newSubjectId.toString(),
          subjectCode: conflict.newSubjectCode,
          subjectName: conflict.newSubjectName,
        };
        
        // Add subjects if not already in the list
        if (!conflictEntry.conflictingSubjects.find(s => s.subjectId === existingSubject.subjectId)) {
          conflictEntry.conflictingSubjects.push(existingSubject);
        }
        if (!conflictEntry.conflictingSubjects.find(s => s.subjectId === newSubject.subjectId)) {
          conflictEntry.conflictingSubjects.push(newSubject);
        }
      });

      return Array.from(conflictMap.values());
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      return []; // On error, proceed without conflict detection
    }
  };

  const handleSave = async () => {
    // Validate max subjects
    if (selected.length > MAX_SUBJECTS) {
      toast.error(`Maximum ${MAX_SUBJECTS} subjects allowed`);
      return;
    }

    if (isSaving) return; // Prevent multiple saves

    try {
      setIsSaving(true);
      
      // Step 1: Check for conflicts using backend
      const detectedConflicts = await detectConflicts(selected.map(s => s.id));
      
      if (detectedConflicts.length > 0) {
        // Show conflict resolution modal
        setPreSaveConflicts(detectedConflicts);
        setPendingSelectedSubjects(selected);
        setShowPreSaveConflictModal(true);
        setIsSaving(false);
        return; // Don't save yet, wait for user to resolve conflicts
      }
      
      // Step 2: No conflicts detected, proceed with save (no resolutions needed)
      await performSave(selected, null);
    } catch (error: any) {
      console.error('Error saving subjects:', error);
      toast.error(error.message || 'Failed to save subjects');
    } finally {
      setIsSaving(false);
    }
  };

  const performSave = async (subjectsToSave: Subject[], conflictResolutions: Map<string, string> | null) => {
    try {
      setIsSaving(true);
      
      // Convert Map to object for JSON
      const resolutionsObject: Record<string, string> = {};
      if (conflictResolutions) {
        conflictResolutions.forEach((value, key) => {
          resolutionsObject[key] = value;
        });
      }
      
      // Save to backend with conflict resolutions
      const response = await fetch(API_CONFIG.ENDPOINTS.ENROLLED_SUBJECTS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subjectIds: subjectsToSave.map(s => s.id),
          conflictResolutions: conflictResolutions ? resolutionsObject : null,
        }),
      });

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        // Try to parse error response
        let errorMessage = 'Failed to save subjects';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        // Handle different error statuses
        if (response.status === 400) {
          throw new Error(errorMessage);
        } else if (response.status === 500) {
          throw new Error('Server error occurred. Please try again later.');
        } else {
          throw new Error(errorMessage);
        }
      }

      // Parse successful response
      const data: SaveEnrolledSubjectsResponse = await response.json();

      // Check for conflicts (209 = partial success with conflicts, but response.ok is true)
      // Also check if status is 209 or if hasConflicts flag is set
      if (response.status === 209 || (data.hasConflicts && data.conflicts.length > 0)) {
        // Store conflict data
        setConflicts(data.conflicts);
        setSubjectsWithConflicts(data.subjectsWithConflicts);
        setTimetableSlotsAdded(data.timetableSlotsAdded);
        
        // Show conflict modal - DON'T call onSave yet, let user see the modal first
        // onSave will be called when user dismisses the modal
        setShowConflictModal(true);
        return;
      }

      // Full success (200 OK) - ensure any open modals are closed first
      setShowConflictModal(false);
      setShowPreSaveConflictModal(false);
      
      const slotsMessage = data.timetableSlotsAdded > 0 
        ? ` and ${data.timetableSlotsAdded} timetable slot${data.timetableSlotsAdded !== 1 ? 's' : ''} added`
        : '';
      toast.success(`Successfully enrolled in ${subjectsToSave.length} subject${subjectsToSave.length !== 1 ? 's' : ''}${slotsMessage}`);
      
      // Small delay to ensure modals are closed before showing sleep dialog
      setTimeout(() => {
        onSave(subjectsToSave, false);
      }, 200);
    } catch (error: any) {
      console.error('Error saving subjects:', error);
      toast.error(error.message || 'Failed to save subjects');
      throw error; // Re-throw to be caught by caller
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreSaveConflictResolve = async (resolutions: Map<string, string>) => {
    // User has resolved all conflicts
    // Close modal and proceed with save, passing resolutions to backend
    setShowPreSaveConflictModal(false);
    
    // Save with all subjects and conflict resolutions
    // Backend will use resolutions to determine which subjects get which slots
    await performSave(pendingSelectedSubjects, resolutions);
  };

  const handlePreSaveConflictCancel = () => {
    setShowPreSaveConflictModal(false);
    setPreSaveConflicts([]);
    setPendingSelectedSubjects([]);
  };

  const handleGoToTimetable = () => {
    setShowConflictModal(false);
    // Complete the save flow first, then navigate
    // Use savedSubjects if available, otherwise fall back to selected
    const subjectsToUse = savedSubjects.length > 0 ? savedSubjects : selected;
    toast.warning(`Enrolled in ${subjectsToUse.length} subjects, but some timetable conflicts need resolution`);
    onSave(subjectsToUse, true);
    // Only navigate if NOT in onboarding mode (onboarding will handle navigation after sleep dialog)
    if (!isOnboarding) {
      // Navigate after a small delay to let the dialog close
      setTimeout(() => {
        navigate('/timetable');
      }, 100);
    }
  };

  const handleDismissConflicts = () => {
    setShowConflictModal(false);
    // Complete the save flow when user dismisses
    // Use savedSubjects if available, otherwise fall back to selected
    const subjectsToUse = savedSubjects.length > 0 ? savedSubjects : selected;
    toast.warning(`Enrolled in ${subjectsToUse.length} subjects, but some timetable conflicts need resolution`);
    onSave(subjectsToUse, true);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="text-center mb-3 sm:mb-4 px-2 flex-shrink-0">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 sm:mb-3">
          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold mb-1">
          {isOnboarding ? "Select Your Subjects" : "Update Subjects"}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground px-2">
          {isOnboarding 
            ? "Choose the subjects you're enrolled in"
            : "Add or remove subjects from your list"
          }
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-2 sm:mb-3 flex-shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
        <Input
          placeholder="Search subjects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 sm:h-10 rounded-xl bg-muted/50 border-2 border-border focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 text-sm"
        />
      </div>

      {/* Selected count */}
      <div className="flex items-center justify-between mb-2 px-1 flex-shrink-0">
        <span className={cn(
          "text-xs sm:text-sm",
          selected.length >= MAX_SUBJECTS ? "text-destructive font-medium" : "text-muted-foreground"
        )}>
          {selected.length} / {MAX_SUBJECTS} subject{selected.length !== 1 ? "s" : ""} selected
        </span>
        {selected.length > 0 && (
          <button
            onClick={() => setSelected([])}
            className="text-xs text-destructive hover:underline px-1"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Subject List - Fixed scrollable area */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 mb-3 pr-1" style={{ maxHeight: 'calc(100vh - 400px)', minHeight: '150px' }}>
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
                    <p className="font-medium text-sm sm:text-base truncate leading-tight">{subject.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{subject.code}</p>
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

      {/* Actions - Always visible at bottom */}
      <div className="flex gap-2 pt-3 mt-auto border-t border-border flex-shrink-0 bg-card">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-10 sm:h-11 rounded-lg sm:rounded-xl text-xs sm:text-sm"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={selected.length === 0 || selected.length > MAX_SUBJECTS || isSaving}
          className="flex-1 h-10 sm:h-11 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-1.5" />
              {isOnboarding ? "Continue" : "Save"}
            </>
          )}
        </Button>
      </div>

      {/* Pre-save Conflict Resolution Modal (conflicts between selected subjects) */}
      <SubjectConflictResolutionModal
        open={showPreSaveConflictModal}
        onOpenChange={setShowPreSaveConflictModal}
        conflicts={preSaveConflicts}
        subjects={subjects}
        onResolve={handlePreSaveConflictResolve}
        onCancel={handlePreSaveConflictCancel}
      />

      {/* Post-save Conflict Resolution Modal (conflicts with existing timetable) */}
      <ConflictResolutionModal
        open={showConflictModal}
        onOpenChange={setShowConflictModal}
        conflicts={conflicts}
        subjectsWithConflicts={subjectsWithConflicts}
        timetableSlotsAdded={timetableSlotsAdded}
        onGoToTimetable={handleGoToTimetable}
        onDismiss={handleDismissConflicts}
      />
    </div>
  );
}
