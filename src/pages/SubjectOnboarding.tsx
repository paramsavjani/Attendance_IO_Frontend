import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { SubjectSelector } from "@/components/subjects/SubjectSelector";
import { SleepDurationDialog } from "@/components/sleep/SleepDurationDialog";
import { Subject } from "@/types/attendance";
import { toast } from "sonner";

export default function SubjectOnboarding() {
  const navigate = useNavigate();
  const { student } = useAuth();
  const { refreshEnrolledSubjects, refreshTimetable, completeOnboarding } = useAttendance();
  const [showSleepDialog, setShowSleepDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{ subjects: Subject[]; hasConflicts?: boolean } | null>(null);

  const handleSubjectsSave = async (subjects: Subject[], hasConflicts?: boolean) => {
    // Store navigation info and show dialog FIRST (before refresh causes navigation)
    setPendingNavigation({ subjects, hasConflicts });
    setShowSleepDialog(true);
  };

  const handleSleepDialogClose = async () => {
    setShowSleepDialog(false);
    // Now refresh and navigate AFTER dialog closes
    await refreshEnrolledSubjects();
    await refreshTimetable();
    completeOnboarding();
    
    if (pendingNavigation) {
      if (pendingNavigation.hasConflicts) {
        toast.warning("Subjects saved! Please resolve timetable conflicts.");
      } else {
        toast.success("Setup complete! Check your timetable.");
      }
      navigate("/timetable", { replace: true });
      setPendingNavigation(null);
    }
  };

  const handleSleepDialogSave = async () => {
    setShowSleepDialog(false);
    // Now refresh and navigate AFTER dialog closes
    await refreshEnrolledSubjects();
    await refreshTimetable();
    completeOnboarding();
    
    if (pendingNavigation) {
      if (pendingNavigation.hasConflicts) {
        toast.warning("Subjects saved! Please resolve timetable conflicts.");
      } else {
        toast.success("Setup complete! Check your timetable.");
      }
      navigate("/timetable", { replace: true });
      setPendingNavigation(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-3 sm:p-4 safe-area-bottom">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-md relative z-10 flex flex-col" style={{ maxHeight: 'calc(100vh - 48px)' }}>
        {/* Welcome message */}
        {student && (
          <div className="text-center mb-3 animate-fade-in flex-shrink-0">
            <p className="text-xs text-muted-foreground">
              Welcome, <span className="font-medium text-foreground">{student.name}</span>
            </p>
          </div>
        )}

        {/* Progress indicator - single step now */}
        <div className="flex items-center justify-center gap-2 mb-4 flex-shrink-0">
          <div className="w-6 h-2 rounded-full bg-primary" />
          <div className="w-2 h-2 rounded-full bg-muted" />
        </div>

        {/* Selector Card - Fixed height issues */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-border shadow-xl animate-slide-up flex-1 min-h-0 overflow-hidden">
          <SubjectSelector
            selectedSubjects={[]}
            onSave={handleSubjectsSave}
            isOnboarding={true}
          />
        </div>
      </div>

      {/* Sleep Duration Dialog */}
      <SleepDurationDialog
        open={showSleepDialog}
        onClose={handleSleepDialogClose}
        onSave={handleSleepDialogSave}
        defaultHours={8}
      />
    </div>
  );
}
