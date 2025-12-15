import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { SubjectSelector } from "@/components/subjects/SubjectSelector";
import { Subject } from "@/types/attendance";
import { toast } from "sonner";

export default function SubjectOnboarding() {
  const navigate = useNavigate();
  const { student } = useAuth();
  const { enrolledSubjects, setEnrolledSubjects } = useAttendance();

  const handleSave = (subjects: Subject[]) => {
    setEnrolledSubjects(subjects);
    toast.success(`Enrolled in ${subjects.length} subjects`);
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 safe-area-bottom">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Welcome message */}
        {student && (
          <div className="text-center mb-4 animate-fade-in">
            <p className="text-sm text-muted-foreground">
              Welcome, <span className="font-medium text-foreground">{student.name}</span>
            </p>
          </div>
        )}

        {/* Selector Card */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border shadow-xl animate-slide-up">
          <SubjectSelector
            selectedSubjects={enrolledSubjects}
            onSave={handleSave}
            isOnboarding={true}
          />
        </div>
      </div>
    </div>
  );
}
