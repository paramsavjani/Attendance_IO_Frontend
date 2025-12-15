import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { LogOut, User, GraduationCap, Calendar, Settings, ChevronRight, History } from "lucide-react";
import { currentSemester, semesterHistory } from "@/data/semesterHistory";
import { SubjectCard } from "@/components/attendance/SubjectCard";
import { cn } from "@/lib/utils";

export default function Profile() {
  const { student, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const selectedSemData = selectedSemester !== null 
    ? semesterHistory.find(s => s.semester === selectedSemester)
    : null;

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
            onClick={() => navigate("/timetable")}
            className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 text-left hover:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Timetable</p>
              <p className="text-sm text-muted-foreground">Manage your schedule</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Previous Semesters */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Previous Semesters</h3>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {semesterHistory.map((sem) => (
              <button
                key={sem.semester}
                onClick={() => setSelectedSemester(selectedSemester === sem.semester ? null : sem.semester)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border",
                  selectedSemester === sem.semester
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:bg-muted"
                )}
              >
                Sem {sem.semester} • {sem.term} {sem.year}
              </button>
            ))}
          </div>

          {/* Selected Semester Details */}
          {selectedSemData && (
            <div className="mt-3 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
                <span>Semester {selectedSemData.semester} Attendance</span>
                <span>{selectedSemData.year} {selectedSemData.term}</span>
              </div>
              {selectedSemData.subjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  name={subject.name}
                  code={subject.code}
                  color={subject.color}
                  present={subject.present}
                  absent={subject.absent}
                  total={subject.total}
                  minRequired={75}
                />
              ))}
            </div>
          )}
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
      </div>
    </AppLayout>
  );
}
