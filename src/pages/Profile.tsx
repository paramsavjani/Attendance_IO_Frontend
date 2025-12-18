import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, User, Calendar, BookOpen, Edit, Target, Save, X, ChevronRight } from "lucide-react";
import { SubjectSelector } from "@/components/subjects/SubjectSelector";
import { Subject } from "@/types/attendance";
import { toast } from "sonner";
import { API_CONFIG } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CurrentSemester {
  year: number;
  type: string;
}

export default function Profile() {
  const { student, logout } = useAuth();
  const { enrolledSubjects, setEnrolledSubjects, refreshEnrolledSubjects, refreshTimetable } = useAttendance();
  const navigate = useNavigate();
  const [showSubjectEditor, setShowSubjectEditor] = useState(false);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [currentSemester, setCurrentSemester] = useState<CurrentSemester | null>(null);
  const [isLoadingSemester, setIsLoadingSemester] = useState(true);
  const [editingCriteria, setEditingCriteria] = useState<Record<string, string>>({});
  const [isSavingCriteria, setIsSavingCriteria] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchCurrentSemester = async () => {
      try {
        const response = await fetch(API_CONFIG.ENDPOINTS.SEMESTER_CURRENT, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setCurrentSemester(data);
        } else if (response.status === 404) {
          // No active semester is a valid state, not an error
          setCurrentSemester(null);
        } else {
          console.error('Failed to fetch current semester:', response.status);
          toast.error('Failed to load current semester');
        }
      } catch (error) {
        console.error('Error fetching current semester:', error);
        toast.error('Error loading current semester');
      } finally {
        setIsLoadingSemester(false);
      }
    };

    fetchCurrentSemester();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSaveSubjects = async (subjects: Subject[], hasConflicts?: boolean) => {
    setEnrolledSubjects(subjects);
    setShowSubjectEditor(false);
    
    // Refresh timetable to get the updated slots from backend
    await refreshTimetable();
    
    if (!hasConflicts) {
      toast.success(`Updated to ${subjects.length} subjects`);
    }
    // If hasConflicts is true, the SubjectSelector already showed the conflict modal
  };

  const handleEditCriteria = (subjectId: string, currentValue: number | null | undefined) => {
    // Use 70 as default if value is null/undefined
    const defaultValue = currentValue ?? 70;
    setEditingCriteria(prev => ({
      ...prev,
      [subjectId]: defaultValue.toString()
    }));
  };

  const handleCancelEdit = (subjectId: string) => {
    setEditingCriteria(prev => {
      const updated = { ...prev };
      delete updated[subjectId];
      return updated;
    });
  };

  const handleSaveCriteria = async (subjectId: string) => {
    const valueStr = editingCriteria[subjectId]?.trim();
    const value = valueStr === "" ? null : parseInt(valueStr, 10);

    // Validate value
    if (valueStr !== "" && (isNaN(value!) || value! < 0 || value! > 100)) {
      toast.error("Minimum criteria must be between 0 and 100");
      return;
    }

    setIsSavingCriteria(prev => ({ ...prev, [subjectId]: true }));

    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.UPDATE_MINIMUM_CRITERIA, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subjectId,
          minimumCriteria: value,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update minimum criteria');
      }

      toast.success("Minimum criteria updated successfully");
      handleCancelEdit(subjectId);
      
      // Refresh enrolled subjects to get updated data
      await refreshEnrolledSubjects();
    } catch (error: any) {
      console.error('Error updating minimum criteria:', error);
      toast.error(error.message || 'Failed to update minimum criteria');
    } finally {
      setIsSavingCriteria(prev => {
        const updated = { ...prev };
        delete updated[subjectId];
        return updated;
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center pt-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 overflow-hidden">
            {student?.pictureUrl ? (
              <img 
                src={student.pictureUrl} 
                alt={student.name || "Profile"} 
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-primary" />
            )}
          </div>
          <h1 className="text-xl font-bold">{student?.name}</h1>
          <p className="text-muted-foreground">{student?.rollNumber}</p>
        </div>

        {/* Current Semester Info */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Current Term</p>
              {isLoadingSemester ? (
                <p className="font-semibold">Loading...</p>
              ) : currentSemester ? (
                <p className="font-semibold">
                  {currentSemester.year} {currentSemester.type.charAt(0) + currentSemester.type.slice(1).toLowerCase()}
                </p>
              ) : (
                <p className="font-semibold text-muted-foreground">No active semester</p>
              )}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="space-y-2">
          <button 
            onClick={() => setShowSubjectEditor(true)}
            className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 text-left hover:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">My Subjects</p>
              <p className="text-sm text-muted-foreground">{enrolledSubjects.length} subjects enrolled</p>
            </div>
            <Edit className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Minimum Criteria (Modal) */}
        {enrolledSubjects.length > 0 && (
          <button
            onClick={() => setShowCriteriaModal(true)}
            className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 text-left hover:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Minimum Criteria</p>
              <p className="text-sm text-muted-foreground">Set attendance targets by subject</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Logout */}
        <Button
          variant="destructive"
          onClick={handleLogout}
          className="w-full py-6 rounded-xl"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>

        {/* Subject Editor Dialog */}
        <Dialog open={showSubjectEditor} onOpenChange={setShowSubjectEditor}>
          <DialogContent className="max-w-[90vw] sm:max-w-md max-h-[90vh] sm:max-h-[85vh] h-[90vh] sm:h-auto overflow-hidden p-3 sm:p-4 flex flex-col top-[50%] translate-y-[-50%]">
            <DialogHeader className="sr-only">
              <DialogTitle>Edit Subjects</DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <SubjectSelector
                selectedSubjects={enrolledSubjects}
                onSave={handleSaveSubjects}
                onCancel={() => setShowSubjectEditor(false)}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Minimum Criteria Modal */}
        <Dialog open={showCriteriaModal} onOpenChange={setShowCriteriaModal}>
          <DialogContent className="max-w-[90vw] sm:max-w-md max-h-[90vh] sm:max-h-[85vh] overflow-hidden p-3 sm:p-4 flex flex-col">
            <DialogHeader>
              <DialogTitle>Minimum Criteria</DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
              {enrolledSubjects.map((subject) => {
                const isEditing = Object.prototype.hasOwnProperty.call(editingCriteria, subject.id);
                const isSaving = isSavingCriteria[subject.id] || false;
                const currentValue = subject.minimumCriteria;

                return (
                  <div
                    key={subject.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: subject.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{subject.name}</p>
                      <p className="text-xs text-muted-foreground">{subject.code}</p>
                    </div>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={editingCriteria[subject.id]}
                          onChange={(e) =>
                            setEditingCriteria((prev) => ({
                              ...prev,
                              [subject.id]: e.target.value,
                            }))
                          }
                          placeholder="70"
                          className="w-20 h-8 text-sm"
                          disabled={isSaving}
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSaveCriteria(subject.id)}
                          disabled={isSaving}
                          className="h-8 w-8 p-0"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancelEdit(subject.id)}
                          disabled={isSaving}
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {currentValue !== null && currentValue !== undefined ? `${currentValue}%` : "70%"}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditCriteria(subject.id, currentValue)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="pt-3 border-t border-border flex justify-end">
              <Button variant="outline" onClick={() => setShowCriteriaModal(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
}
