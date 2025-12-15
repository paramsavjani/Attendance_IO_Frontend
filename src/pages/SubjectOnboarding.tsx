import { useState } from "react";
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
  const { enrolledSubjects, timetable, setEnrolledSubjects, setTimetable, completeOnboarding } = useAttendance();
  const [step, setStep] = useState<OnboardingStep>("subjects");
  const [tempSubjects, setTempSubjects] = useState<Subject[]>(enrolledSubjects);

  const handleSubjectsSave = (subjects: Subject[]) => {
    setTempSubjects(subjects);
    setEnrolledSubjects(subjects);
    setStep("timetable");
  };

  const handleTimetableSave = (newTimetable: TimetableSlot[]) => {
    setTimetable(newTimetable);
    completeOnboarding();
    toast.success("Setup complete! Welcome to your dashboard");
    navigate("/dashboard", { replace: true });
  };

  const handleBack = () => {
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
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 border border-border shadow-xl animate-slide-up max-h-[80vh] overflow-hidden">
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
  );
}
