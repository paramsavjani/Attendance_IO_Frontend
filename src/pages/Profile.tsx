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
    if (isNaN(hoursNum) || hoursNum < 1 || hoursNum >= 20) {
      toast.error("Sleep duration must be less than 20 hours");
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
    
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.SUBMIT_FEEDBACK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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

        {/* Sleep Duration - Premium Design */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {isEditingSleepDuration ? (
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Sleep Duration</p>
                  <p className="text-xs text-muted-foreground">How many hours do you sleep?</p>
                </div>
              </div>
              
              {/* Quick Select Chips */}
              <div className="flex gap-2 justify-center">
                {[6, 7, 8, 9].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => setEditingSleepHours(hours.toString())}
                    disabled={isSavingSleepDuration}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      editingSleepHours === hours.toString()
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border'
                    }`}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
              
              {/* Custom Input */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex items-center gap-1 bg-muted/30 rounded-lg px-3 py-1.5 border border-border">
                  <Input
                    type="number"
                    min="4"
                    max="16"
                    value={editingSleepHours}
                    onChange={(e) => setEditingSleepHours(e.target.value)}
                    placeholder="8"
                    className="w-12 h-6 text-center text-sm font-bold border-0 bg-transparent p-0 focus-visible:ring-0"
                    disabled={isSavingSleepDuration}
                  />
                  <span className="text-xs text-muted-foreground font-medium">hours</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleCancelEditSleepDuration}
                  disabled={isSavingSleepDuration}
                  className="flex-1 h-10 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveSleepDuration}
                  disabled={isSavingSleepDuration}
                  className="flex-1 h-10 rounded-xl gap-2"
                >
                  {isSavingSleepDuration ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Moon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Sleep Duration</p>
                {isLoadingSleepDuration ? (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {sleepDuration !== null ? `${sleepDuration} hours` : "8 hours"} · Reminders enabled
                  </p>
                )}
              </div>
              {!isLoadingSleepDuration && (
                <button
                  onClick={handleEditSleepDuration}
                  className="h-8 px-3 rounded-lg bg-muted/50 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
              )}
            </div>
          )}
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
                      <div className="mt-4 space-y-3">
                        {/* Quick Select Chips */}
                        <div className="flex gap-2 justify-center flex-wrap">
                          {[65, 70, 75, 80, 85].map((percent) => (
                            <button
                              key={percent}
                              onClick={() => setEditingCriteria(prev => ({ ...prev, [subject.id]: percent.toString() }))}
                              disabled={isSaving}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                editingCriteria[subject.id] === percent.toString()
                                  ? 'bg-primary text-primary-foreground shadow-md scale-105'
                                  : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border'
                              }`}
                            >
                              {percent}%
                            </button>
                          ))}
                        </div>
                        
                        {/* Custom Input */}
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs text-muted-foreground">or</span>
                          <div className="flex items-center gap-1 bg-muted/30 rounded-lg px-3 py-1.5 border border-border">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={editingCriteria[subject.id]}
                              onChange={(e) => setEditingCriteria(prev => ({ ...prev, [subject.id]: e.target.value }))}
                              placeholder="70"
                              className="w-12 h-6 text-center text-sm font-bold border-0 bg-transparent p-0 focus-visible:ring-0"
                              disabled={isSaving}
                            />
                            <span className="text-xs text-muted-foreground font-medium">%</span>
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
