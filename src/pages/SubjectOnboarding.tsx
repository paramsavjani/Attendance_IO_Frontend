import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { SubjectSelector } from "@/components/subjects/SubjectSelector";
import { TimetableSelector } from "@/components/timetable/TimetableSelector";
import { Subject, TimetableSlot } from "@/types/attendance";
import { toast } from "sonner";

type OnboardingStep = "subjects" | "timetable";

export default function SubjectOnboarding() {
  const navigate = useNavigate();
  const { student } = useAuth();
  const { enrolledSubjects, timetable, setTimetable, completeOnboarding, refreshEnrolledSubjects, refreshTimetable } = useAttendance();
  const [step, setStep] = useState<OnboardingStep>("subjects");
  const [tempSubjects, setTempSubjects] = useState<Subject[]>(enrolledSubjects);
  const hasMovedToTimetable = useRef(false);
  const stepRef = useRef<OnboardingStep>("subjects");

  // Keep stepRef in sync with step state
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  // Update tempSubjects only on initial load, not when enrolledSubjects changes during onboarding
  useEffect(() => {
    // Only update if we're still on subjects step, haven't moved to timetable, and have enrolled subjects
    if (stepRef.current === "subjects" && !hasMovedToTimetable.current && enrolledSubjects.length > 0) {
      setTempSubjects(enrolledSubjects);
    }
  }, [enrolledSubjects.length]); // Only depend on length, not step

  const handleSubjectsSave = async (subjects: Subject[], hasConflicts?: boolean) => {
    setTempSubjects(subjects);
    // Mark that we've moved to timetable to prevent useEffect from interfering
    hasMovedToTimetable.current = true;
    // Move to timetable step immediately - use functional update to ensure it happens
    setStep(prevStep => {
      if (prevStep === "subjects") {
        return "timetable";
      }
      return prevStep; // Don't change if already on timetable
    });
    // Refresh timetable to get the auto-generated slots from backend
    // This is important because the backend now auto-generates timetable based on subject_schedule
    await refreshTimetable();
  };

  const handleTimetableSave = async (newTimetable: TimetableSlot[]) => {
    setTimetable(newTimetable);
    completeOnboarding();
    // Refresh enrolled subjects to ensure latest data before navigating
    await refreshEnrolledSubjects();
    toast.success("Setup complete! Welcome to your dashboard");
    navigate("/dashboard", { replace: true });
  };

  const handleBack = () => {
    hasMovedToTimetable.current = false;
    setStep("subjects");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-3 safe-area-bottom">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Welcome message */}
        {student && (
          <div className="text-center mb-3 animate-fade-in">
            <p className="text-xs text-muted-foreground">
              Welcome, <span className="font-medium text-foreground">{student.name}</span>
            </p>
          </div>
        )}

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className={`w-2 h-2 rounded-full transition-all ${step === "subjects" ? "bg-primary w-6" : "bg-primary"}`} />
          <div className={`w-2 h-2 rounded-full transition-all ${step === "timetable" ? "bg-primary w-6" : "bg-muted"}`} />
        </div>

        {/* Selector Card */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-border shadow-xl animate-slide-up max-h-[85vh] sm:max-h-[80vh] h-[85vh] sm:h-auto overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 overflow-hidden">
            {step === "subjects" ? (
              <SubjectSelector
                selectedSubjects={tempSubjects}
                onSave={handleSubjectsSave}
                isOnboarding={true}
              />
            ) : (
              <TimetableSelector
                timetable={timetable}
                enrolledSubjects={tempSubjects}
                onSave={handleTimetableSave}
                onBack={handleBack}
                isOnboarding={true}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
