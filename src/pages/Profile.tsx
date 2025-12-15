import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { LogOut, User, GraduationCap, Calendar, BookOpen, Edit } from "lucide-react";
import { currentSemester } from "@/data/semesterHistory";
import { SubjectSelector } from "@/components/subjects/SubjectSelector";
import { TimetableSelector } from "@/components/timetable/TimetableSelector";
import { Subject, TimetableSlot } from "@/types/attendance";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Profile() {
  const { student, logout } = useAuth();
  const { enrolledSubjects, timetable, setEnrolledSubjects, setTimetable } = useAttendance();
  const navigate = useNavigate();
  const [showSubjectEditor, setShowSubjectEditor] = useState(false);
  const [showTimetableEditor, setShowTimetableEditor] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSaveSubjects = (subjects: Subject[]) => {
    setEnrolledSubjects(subjects);
    setShowSubjectEditor(false);
    toast.success(`Updated to ${subjects.length} subjects`);
  };

  const handleSaveTimetable = (newTimetable: TimetableSlot[]) => {
    setTimetable(newTimetable);
    setShowTimetableEditor(false);
    toast.success("Timetable updated");
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center pt-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-primary" />
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
              <p className="font-semibold">{currentSemester.year} {currentSemester.term}</p>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="space-y-2">
          <div className="bg-card rounded-xl p-4 border border-border flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Year</p>
              <p className="font-medium">{currentSemester.year}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Term</p>
              <p className="font-medium">{currentSemester.term}</p>
            </div>
          </div>

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

          <button 
            onClick={() => setShowTimetableEditor(true)}
            className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 text-left hover:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Timetable</p>
              <p className="text-sm text-muted-foreground">Manage your schedule</p>
            </div>
            <Edit className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

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
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[85vh] overflow-hidden p-4">
            <DialogHeader>
              <DialogTitle className="sr-only">Edit Subjects</DialogTitle>
            </DialogHeader>
            <SubjectSelector
              selectedSubjects={enrolledSubjects}
              onSave={handleSaveSubjects}
              onCancel={() => setShowSubjectEditor(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Timetable Editor Dialog */}
        <Dialog open={showTimetableEditor} onOpenChange={setShowTimetableEditor}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[85vh] overflow-hidden p-4">
            <DialogHeader>
              <DialogTitle className="sr-only">Edit Timetable</DialogTitle>
            </DialogHeader>
            <TimetableSelector
              timetable={timetable}
              enrolledSubjects={enrolledSubjects}
              onSave={handleSaveTimetable}
              onCancel={() => setShowTimetableEditor(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
