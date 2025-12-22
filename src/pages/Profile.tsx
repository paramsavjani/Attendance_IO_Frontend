import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, User, Calendar, BookOpen, Edit, Target, Save, X, ChevronRight, Moon, MessageSquare, Bug, Lightbulb, Send, Heart } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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

  useEffect(() => {
    const fetchSleepDuration = async () => {
      try {
        const response = await fetch(API_CONFIG.ENDPOINTS.GET_SLEEP_DURATION, {
          credentials: 'include',
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
    if (isNaN(hoursNum) || hoursNum < 4 || hoursNum > 16) {
      toast.error("Sleep duration must be between 4 and 16 hours");
      return;
    }

    setIsSavingSleepDuration(true);
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.UPDATE_SLEEP_DURATION, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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

  const handleSubmitFeedback = async () => {
    if (!feedbackTitle.trim() || !feedbackDescription.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmittingFeedback(true);
    
    // Simulate submission - in real app, this would send to an API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    toast.success("Thank you for your feedback!");
    setShowFeedbackModal(false);
    setFeedbackTitle("");
    setFeedbackDescription("");
    setFeedbackType('feedback');
    setIsSubmittingFeedback(false);
  };

  const feedbackTypes = [
    { id: 'bug' as const, label: 'Bug', icon: Bug, color: 'text-red-500' },
    { id: 'feedback' as const, label: 'Feedback', icon: MessageSquare, color: 'text-blue-500' },
    { id: 'suggestion' as const, label: 'Suggestion', icon: Lightbulb, color: 'text-yellow-500' },
  ];

  return (
    <AppLayout>
      <div className="space-y-3">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2 overflow-hidden">
            {student?.pictureUrl ? (
              <img 
                src={student.pictureUrl} 
                alt={student.name || "Profile"} 
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-primary" />
            )}
          </div>
          <h1 className="text-lg font-bold">{student?.name}</h1>
          <p className="text-sm text-muted-foreground">{student?.rollNumber}</p>
        </div>

        {/* Current Semester Info */}
        <div className="bg-card rounded-xl p-3 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Current Term</p>
              {isLoadingSemester ? (
                <p className="font-semibold text-sm">Loading...</p>
              ) : currentSemester ? (
                <p className="font-semibold text-sm">
                  {currentSemester.year} {currentSemester.type.charAt(0) + currentSemester.type.slice(1).toLowerCase()}
                </p>
              ) : (
                <p className="font-semibold text-sm text-muted-foreground">No active semester</p>
              )}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <button 
          onClick={() => setShowSubjectEditor(true)}
          className="w-full bg-card rounded-xl p-3 border border-border flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">My Subjects</p>
            <p className="text-xs text-muted-foreground">{enrolledSubjects.length} subjects enrolled</p>
          </div>
          <Edit className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Sleep Duration - Compact Mobile Optimized */}
        <div className="bg-card rounded-xl p-3 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Moon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Sleep Duration</p>
              {isLoadingSleepDuration ? (
                <p className="text-xs text-muted-foreground">Loading...</p>
              ) : isEditingSleepDuration ? (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2 py-0.5">
                    <Input
                      type="number"
                      min="4"
                      max="16"
                      value={editingSleepHours}
                      onChange={(e) => setEditingSleepHours(e.target.value)}
                      placeholder="8"
                      className="w-10 h-6 text-center text-sm font-semibold border-0 bg-transparent p-0 focus-visible:ring-0"
                      disabled={isSavingSleepDuration}
                    />
                    <span className="text-xs text-muted-foreground">hrs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSaveSleepDuration}
                      disabled={isSavingSleepDuration}
                      className="h-6 w-6 p-0 text-primary hover:bg-primary/10"
                    >
                      <Save className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEditSleepDuration}
                      disabled={isSavingSleepDuration}
                      className="h-6 w-6 p-0 text-muted-foreground hover:bg-muted"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {sleepDuration !== null ? `${sleepDuration} hours` : "8 hours"} · Reminders enabled
                </p>
              )}
            </div>
            {!isLoadingSleepDuration && !isEditingSleepDuration && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleEditSleepDuration}
                className="h-7 w-7 p-0 flex-shrink-0"
              >
                <Edit className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>

        {/* Minimum Criteria (Modal) */}
        {enrolledSubjects.length > 0 && (
          <button
            onClick={() => setShowCriteriaModal(true)}
            className="w-full bg-card rounded-xl p-3 border border-border flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Minimum Criteria</p>
              <p className="text-xs text-muted-foreground">Set attendance targets by subject</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Feedback & Bugs */}
        <button
          onClick={() => setShowFeedbackModal(true)}
          className="w-full bg-card rounded-xl p-3 border border-border flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">Feedback & Bugs</p>
            <p className="text-xs text-muted-foreground">Help us improve the app</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Logout */}
        <Button
          variant="destructive"
          onClick={handleLogout}
          className="w-full py-5 rounded-xl"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>

        {/* Creator Credit */}
        <div className="flex items-center justify-center gap-1.5 pt-2 pb-1">
          <span className="text-xs text-muted-foreground">Made with</span>
          <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">by</span>
          <span className="text-xs font-medium text-foreground">Param Savjani</span>
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
