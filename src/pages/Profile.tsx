import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, trackAppEvent } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { LogOut, User, BookOpen, Edit, Target, Save, Moon, MessageSquare, Bug, Lightbulb, Send, Heart, ChevronRight, Calendar, MapPin } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SubjectSelector } from "@/components/subjects/SubjectSelector";
import { BaselineAttendanceDialog } from "@/components/attendance/BaselineAttendanceDialog";
import { Subject } from "@/types/attendance";
import { toast } from "sonner";
import { API_CONFIG, authenticatedFetch } from "@/lib/api";
import { Slider } from "@/components/ui/slider";
import { ContributorsSection } from "@/components/contributors/ContributorsSection";
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
  const [showClassroomLocationModal, setShowClassroomLocationModal] = useState(false);
  const [currentSemester, setCurrentSemester] = useState<CurrentSemester | null>(null);
  const [isLoadingSemester, setIsLoadingSemester] = useState(true);
  const [editingCriteria, setEditingCriteria] = useState<Record<string, string>>({});
  const [isSavingCriteria, setIsSavingCriteria] = useState<Record<string, boolean>>({});
  const [editingClassroomLocation, setEditingClassroomLocation] = useState<Record<string, string>>({});
  const [isSavingClassroomLocation, setIsSavingClassroomLocation] = useState<Record<string, boolean>>({});
  const [sleepDuration, setSleepDuration] = useState<number | null>(null);
  const [isLoadingSleepDuration, setIsLoadingSleepDuration] = useState(true);
  const [isEditingSleepDuration, setIsEditingSleepDuration] = useState(false);
  const [editingSleepHours, setEditingSleepHours] = useState<string>("");
  const [isSavingSleepDuration, setIsSavingSleepDuration] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feedback' | 'suggestion'>('feedback');
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackDescription, setFeedbackDescription] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [showBaselineDialog, setShowBaselineDialog] = useState(false);
  const [selectedBaselineSubject, setSelectedBaselineSubject] = useState<Subject | null>(null);

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
    
    // Track profile page view
    trackAppEvent('profile_view', {
      timestamp: new Date().toISOString(),
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchSleepDuration = async () => {
      try {
        const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.GET_SLEEP_DURATION, {
          method: "GET",
        });
        
        if (response.ok) {
          const data = await response.json();
          setSleepDuration(data.sleepDurationHours);
        } else if (response.status === 404) {
          // Default to 8 if not set
          setSleepDuration(8);
        } else {
          console.error('Failed to fetch sleep duration:', response.status);
        }
      } catch (error) {
        console.error('Error fetching sleep duration:', error);
      } finally {
        setIsLoadingSleepDuration(false);
      }
    };

    fetchSleepDuration();
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
      const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.UPDATE_MINIMUM_CRITERIA, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subjectId,
          minimumCriteria: value,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update minimum criteria');
      }

      // Update local state directly without API call
      setEnrolledSubjects(enrolledSubjects.map(subject => 
        subject.id === subjectId 
          ? { ...subject, minimumCriteria: value }
          : subject
      ));

      toast.success("Minimum criteria updated successfully");
      handleCancelEdit(subjectId);
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

  const handleEditSleepDuration = () => {
    setEditingSleepHours(sleepDuration?.toString() || "8");
    setIsEditingSleepDuration(true);
  };

  const handleCancelEditSleepDuration = () => {
    setIsEditingSleepDuration(false);
    setEditingSleepHours("");
  };

  const handleSaveSleepDuration = async () => {
    const hoursNum = parseInt(editingSleepHours, 10);
    
    // Validate value
    if (isNaN(hoursNum) || hoursNum < 1 || hoursNum > 20) {
      toast.error("Sleep duration must be less than 20 hours");
      return;
    }

    setIsSavingSleepDuration(true);
    try {
      const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.UPDATE_SLEEP_DURATION, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sleepDurationHours: hoursNum,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update sleep duration');
      }

      setSleepDuration(hoursNum);
      setIsEditingSleepDuration(false);
      toast.success("Sleep duration updated successfully");
    } catch (error: any) {
      console.error('Error updating sleep duration:', error);
      toast.error(error.message || 'Failed to update sleep duration');
    } finally {
      setIsSavingSleepDuration(false);
    }
  };

  const handleEditClassroomLocation = (subjectId: string, currentValue: string | null | undefined) => {
    setEditingClassroomLocation(prev => ({
      ...prev,
      [subjectId]: currentValue ?? ""
    }));
  };

  const handleCancelEditClassroomLocation = (subjectId: string) => {
    setEditingClassroomLocation(prev => {
      const updated = { ...prev };
      delete updated[subjectId];
      return updated;
    });
  };

  const handleSaveClassroomLocation = async (subjectId: string) => {
    const value = editingClassroomLocation[subjectId]?.trim() || null;

    setIsSavingClassroomLocation(prev => ({ ...prev, [subjectId]: true }));

    try {
      const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.UPDATE_CLASSROOM_LOCATION, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subjectId,
          classroomLocation: value,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update classroom location');
      }

      // Update local state directly without API call
      setEnrolledSubjects(enrolledSubjects.map(subject => 
        subject.id === subjectId 
          ? { ...subject, classroomLocation: value }
          : subject
      ));

      toast.success("Classroom location updated successfully");
      handleCancelEditClassroomLocation(subjectId);
    } catch (error: any) {
      console.error('Error updating classroom location:', error);
      toast.error(error.message || 'Failed to update classroom location');
    } finally {
      setIsSavingClassroomLocation(prev => {
        const updated = { ...prev };
        delete updated[subjectId];
        return updated;
      });
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackTitle.trim() || !feedbackDescription.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmittingFeedback(true);
    
    try {
      const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.SUBMIT_FEEDBACK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: feedbackType,
          title: feedbackTitle.trim(),
          description: feedbackDescription.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to submit feedback' }));
        throw new Error(error.message || 'Failed to submit feedback');
      }

      const result = await response.json();
      toast.success(result.message || "Thank you for your feedback!");
      setShowFeedbackModal(false);
      setFeedbackTitle("");
      setFeedbackDescription("");
      setFeedbackType('feedback');
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast.error(error.message || 'Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const feedbackTypes = [
    { id: 'bug' as const, label: 'Bug', icon: Bug, color: 'text-red-500' },
    { id: 'feedback' as const, label: 'Feedback', icon: MessageSquare, color: 'text-blue-500' },
    { id: 'suggestion' as const, label: 'Suggestion', icon: Lightbulb, color: 'text-yellow-500' },
  ];

  return (
    <AppLayout>
      <div className="space-y-4 pb-4">
        {/* Profile Header - Enhanced Design */}
        <div className="bg-gradient-to-br from-card via-card to-primary/5 rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-primary/20 shadow-md">
              <img 
                src={student?.pictureUrl || "/user-icons/user2.png"} 
                alt={student?.name || "Profile"} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/user-icons/user2.png";
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate leading-tight">{student?.name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{student?.rollNumber}</p>
              {isLoadingSemester ? (
                <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-md bg-muted/50">
                  <p className="text-[10px] text-muted-foreground">Loading term...</p>
                </div>
              ) : currentSemester ? (
                <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20">
                  <p className="text-xs font-semibold text-primary">
                    {currentSemester.year} {currentSemester.type.charAt(0) + currentSemester.type.slice(1).toLowerCase()}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Quick Actions - Vertical List Layout */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {/* Subjects */}
            <button 
              onClick={() => setShowSubjectEditor(true)}
              className="w-full bg-card p-3.5 flex items-center gap-3 text-left active:bg-muted/50 transition-colors touch-manipulation"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight">My Subjects</p>
                <p className="text-xs text-muted-foreground mt-0.5">{enrolledSubjects.length} subjects enrolled</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>

            {/* Minimum Criteria */}
            {enrolledSubjects.length > 0 ? (
              <button
                onClick={() => setShowCriteriaModal(true)}
                className="w-full bg-card p-3.5 flex items-center gap-3 text-left active:bg-muted/50 transition-colors touch-manipulation"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight">Minimum Criteria</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Set attendance targets by subject</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            ) : (
              <div className="w-full bg-card/50 p-3.5 flex items-center gap-3 text-left opacity-60">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight text-muted-foreground">Minimum Criteria</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Add subjects first</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
              </div>
            )}

            {/* Classroom Location */}
            {enrolledSubjects.length > 0 ? (
              <button
                onClick={() => setShowClassroomLocationModal(true)}
                className="w-full bg-card p-3.5 flex items-center gap-3 text-left active:bg-muted/50 transition-colors touch-manipulation"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight">Classroom Location</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Customize location per subject</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            ) : (
              <div className="w-full bg-card/50 p-3.5 flex items-center gap-3 text-left opacity-60">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight text-muted-foreground">Classroom Location</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Add subjects first</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
              </div>
            )}

            {/* Previous Attendance */}
            {enrolledSubjects.length > 0 ? (
              <button
                onClick={() => {
                  if (enrolledSubjects.length === 1) {
                    setSelectedBaselineSubject(enrolledSubjects[0]);
                    setShowBaselineDialog(true);
                  } else {
                    // Show subject selector dialog
                    setShowBaselineDialog(true);
                  }
                }}
                className="w-full bg-card p-3.5 flex items-center gap-3 text-left active:bg-muted/50 transition-colors touch-manipulation"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight">Previous Attendance</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Set past attendance data</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            ) : (
              <div className="w-full bg-card/50 p-3.5 flex items-center gap-3 text-left opacity-60">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight text-muted-foreground">Previous Attendance</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Add subjects first</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
              </div>
            )}

            {/* Sleep Duration */}
            <button
              onClick={() => {
                setEditingSleepHours(sleepDuration?.toString() || "8");
                setIsEditingSleepDuration(true);
              }}
              className="w-full bg-card p-3.5 flex items-center gap-3 text-left active:bg-muted/50 transition-colors touch-manipulation"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Moon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight">Sleep Duration</p>
                {isLoadingSleepDuration ? (
                  <p className="text-xs text-muted-foreground mt-0.5">Loading...</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {sleepDuration !== null ? `${sleepDuration} hours` : "8 hours"} · Reminders enabled
                  </p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>

            {/* Feedback */}
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="w-full bg-card p-3.5 flex items-center gap-3 text-left active:bg-muted/50 transition-colors touch-manipulation"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight">Feedback & Bugs</p>
                <p className="text-xs text-muted-foreground mt-0.5">Help us improve the app</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* Sleep Duration Modal */}
        <Dialog open={isEditingSleepDuration} onOpenChange={setIsEditingSleepDuration}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[92vh] sm:max-h-[85vh] overflow-hidden p-0 flex flex-col">
            <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-3 border-b border-border">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <Moon className="w-4 h-4 text-primary" />
                  Sleep Duration
                </DialogTitle>
              </DialogHeader>
              <p className="text-[10px] text-muted-foreground mt-0.5">How many hours do you sleep?</p>
            </div>
            
            <div className="p-4 space-y-4 flex-1 min-h-0 overflow-y-auto">
              {/* Value Display */}
              <div className="text-center py-2">
                <span className="text-4xl font-bold text-primary tabular-nums">{editingSleepHours}</span>
                <span className="text-lg text-muted-foreground ml-1">hours</span>
              </div>
              
              {/* Slider */}
              <div className="px-2">
                <Slider
                  value={[parseInt(editingSleepHours) || 8]}
                  onValueChange={(value) => setEditingSleepHours(value[0].toString())}
                  min={1}
                  max={20}
                  step={1}
                  disabled={isSavingSleepDuration}
                  className="w-full"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>1h</span>
                  <span>10h</span>
                  <span>20h</span>
                </div>
              </div>
            </div>
            
            <div className="p-3 pt-0 flex gap-2 border-t border-border">
              <Button
                variant="outline"
                onClick={handleCancelEditSleepDuration}
                disabled={isSavingSleepDuration}
                className="flex-1 h-10 rounded-lg text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSleepDuration}
                disabled={isSavingSleepDuration}
                className="flex-1 gap-2 h-10 rounded-lg text-sm"
              >
                {isSavingSleepDuration ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Previous Attendance Dialog */}
        {showBaselineDialog && enrolledSubjects.length > 1 && !selectedBaselineSubject && (
          <Dialog open={showBaselineDialog} onOpenChange={(open) => {
            setShowBaselineDialog(open);
            if (!open) setSelectedBaselineSubject(null);
          }}>
            <DialogContent className="max-w-sm mx-auto rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Select Subject</DialogTitle>
                <p className="text-sm text-muted-foreground">Choose a subject to set previous attendance</p>
              </DialogHeader>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {enrolledSubjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => {
                      setSelectedBaselineSubject(subject);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0">
                      {subject.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{subject.name}</p>
                      <p className="text-xs text-muted-foreground">{subject.code}</p>
                    </div>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {selectedBaselineSubject && (
          <BaselineAttendanceDialog
            open={showBaselineDialog}
            onOpenChange={(open) => {
              setShowBaselineDialog(open);
              if (!open) {
                setSelectedBaselineSubject(null);
              }
            }}
            subjectId={selectedBaselineSubject.id}
            subjectName={selectedBaselineSubject.name}
            onSave={async () => {
              // Refresh attendance data after saving baseline
              await refreshEnrolledSubjects();
            }}
          />
        )}

        {/* Contributors Section - Compact */}
        <ContributorsSection />

        {/* Logout */}
        <Button
          variant="destructive"
          onClick={handleLogout}
          className="w-full h-11 rounded-xl"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>

        {/* Creator Credit */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <span className="text-xs text-muted-foreground">Made with</span>
          <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">by</span>
          <a 
            href="https://paramsavjani.in" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs font-medium text-primary hover:underline"
          >
            Param Savjani
          </a>
        </div>

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

        {/* Classroom Location Modal */}
        <Dialog open={showClassroomLocationModal} onOpenChange={setShowClassroomLocationModal}>
          <DialogContent className="max-w-[90vw] sm:max-w-md max-h-[90vh] sm:max-h-[85vh] overflow-hidden p-0 flex flex-col">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4 border-b border-border">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Classroom Location
                </DialogTitle>
              </DialogHeader>
              <p className="text-xs text-muted-foreground mt-1">Customize classroom location for each subject</p>
            </div>
            
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
              {enrolledSubjects.map((subject) => {
                const isEditing = Object.prototype.hasOwnProperty.call(editingClassroomLocation, subject.id);
                const isSaving = isSavingClassroomLocation[subject.id] || false;
                const currentValue = subject.classroomLocation ?? subject.lecturePlace ?? null;
                const displayValue = currentValue || "Not set";

                return (
                  <div
                    key={subject.id}
                    className={`rounded-xl border transition-all ${
                      isEditing 
                        ? 'border-primary/30 bg-primary/5 p-4' 
                        : 'border-border bg-muted/30 p-3'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-lg"
                        style={{ backgroundColor: subject.color, boxShadow: `0 0 8px ${subject.color}40` }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{subject.name}</p>
                        <p className="text-xs text-muted-foreground">{subject.code}</p>
                      </div>
                      {!isEditing && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                            {displayValue}
                          </span>
                          <button
                            onClick={() => handleEditClassroomLocation(subject.id, currentValue)}
                            className="h-8 px-2.5 rounded-lg bg-muted/50 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {isEditing && (
                      <div className="mt-4 space-y-4">
                        {/* Input Field */}
                        <div className="space-y-2">
                          <Input
                            value={editingClassroomLocation[subject.id] || ""}
                            onChange={(e) => setEditingClassroomLocation(prev => ({ ...prev, [subject.id]: e.target.value }))}
                            placeholder={subject.lecturePlace || "Enter classroom location"}
                            disabled={isSaving}
                            className="w-full"
                            maxLength={50}
                          />
                          {subject.lecturePlace && (
                            <p className="text-xs text-muted-foreground">
                              Default: {subject.lecturePlace}
                            </p>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelEditClassroomLocation(subject.id)}
                            disabled={isSaving}
                            className="flex-1 h-9 rounded-lg"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveClassroomLocation(subject.id)}
                            disabled={isSaving}
                            className="flex-1 h-9 rounded-lg gap-1.5"
                          >
                            {isSaving ? (
                              "Saving..."
                            ) : (
                              <>
                                <Save className="w-3.5 h-3.5" />
                                Save
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="p-4 pt-0">
              <Button 
                variant="outline" 
                onClick={() => setShowClassroomLocationModal(false)}
                className="w-full h-10 rounded-xl"
              >
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Minimum Criteria Modal - Premium Design */}
        <Dialog open={showCriteriaModal} onOpenChange={setShowCriteriaModal}>
          <DialogContent className="max-w-[90vw] sm:max-w-md max-h-[90vh] sm:max-h-[85vh] overflow-hidden p-0 flex flex-col">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4 border-b border-border">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Minimum Criteria
                </DialogTitle>
              </DialogHeader>
              <p className="text-xs text-muted-foreground mt-1">Set attendance targets for each subject</p>
            </div>
            
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
              {enrolledSubjects.map((subject) => {
                const isEditing = Object.prototype.hasOwnProperty.call(editingCriteria, subject.id);
                const isSaving = isSavingCriteria[subject.id] || false;
                const currentValue = subject.minimumCriteria;
                const displayValue = currentValue !== null && currentValue !== undefined ? currentValue : 70;

                return (
                  <div
                    key={subject.id}
                    className={`rounded-xl border transition-all ${
                      isEditing 
                        ? 'border-primary/30 bg-primary/5 p-4' 
                        : 'border-border bg-muted/30 p-3'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-lg"
                        style={{ backgroundColor: subject.color, boxShadow: `0 0 8px ${subject.color}40` }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{subject.name}</p>
                        <p className="text-xs text-muted-foreground">{subject.code}</p>
                      </div>
                      {!isEditing && (
                        <div className="flex items-center gap-2">
                          <span className={`text-base font-bold tabular-nums ${
                            displayValue >= 75 ? 'text-emerald-500' : displayValue >= 65 ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                            {displayValue}%
                          </span>
                          <button
                            onClick={() => handleEditCriteria(subject.id, currentValue)}
                            className="h-8 px-2.5 rounded-lg bg-muted/50 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {isEditing && (
                      <div className="mt-4 space-y-4">
                        {/* Value Display */}
                        <div className="text-center">
                          <span className={`text-3xl font-bold tabular-nums ${
                            parseInt(editingCriteria[subject.id]) >= 75 ? 'text-emerald-500' : 
                            parseInt(editingCriteria[subject.id]) >= 65 ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                            {editingCriteria[subject.id] || 0}
                          </span>
                          <span className="text-lg text-muted-foreground ml-1">%</span>
                        </div>
                        
                        {/* Slider */}
                        <div className="px-1">
                          <Slider
                            value={[parseInt(editingCriteria[subject.id]) || 0]}
                            onValueChange={(value) => setEditingCriteria(prev => ({ ...prev, [subject.id]: value[0].toString() }))}
                            min={0}
                            max={100}
                            step={5}
                            disabled={isSaving}
                            className="w-full"
                          />
                          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelEdit(subject.id)}
                            disabled={isSaving}
                            className="flex-1 h-9 rounded-lg"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveCriteria(subject.id)}
                            disabled={isSaving}
                            className="flex-1 h-9 rounded-lg gap-1.5"
                          >
                            {isSaving ? (
                              "Saving..."
                            ) : (
                              <>
                                <Save className="w-3.5 h-3.5" />
                                Save
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="p-4 pt-0">
              <Button 
                variant="outline" 
                onClick={() => setShowCriteriaModal(false)}
                className="w-full h-10 rounded-xl"
              >
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Feedback Modal */}
        <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
          <DialogContent className="max-w-[90vw] sm:max-w-md max-h-[90vh] sm:max-h-[85vh] overflow-hidden p-0 flex flex-col">
            <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4 border-b border-border">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Send Feedback
                </DialogTitle>
              </DialogHeader>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Feedback Type Selector */}
              <div className="flex gap-2">
                {feedbackTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setFeedbackType(type.id)}
                    className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                      feedbackType === type.id
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <type.icon className={`w-5 h-5 ${feedbackType === type.id ? type.color : 'text-muted-foreground'}`} />
                    <span className={`text-xs font-medium ${feedbackType === type.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Brief summary..."
                  value={feedbackTitle}
                  onChange={(e) => setFeedbackTitle(e.target.value)}
                  maxLength={100}
                  disabled={isSubmittingFeedback}
                />
                <p className="text-xs text-muted-foreground text-right">{feedbackTitle.length}/100</p>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe in detail..."
                  value={feedbackDescription}
                  onChange={(e) => setFeedbackDescription(e.target.value)}
                  maxLength={500}
                  rows={4}
                  disabled={isSubmittingFeedback}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">{feedbackDescription.length}/500</p>
              </div>
            </div>

            <div className="p-4 pt-0 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFeedbackModal(false)}
                disabled={isSubmittingFeedback}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitFeedback}
                disabled={isSubmittingFeedback || !feedbackTitle.trim() || !feedbackDescription.trim()}
                className="flex-1 gap-2"
              >
                {isSubmittingFeedback ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
}