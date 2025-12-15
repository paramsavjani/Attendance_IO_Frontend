import { AppLayout } from "@/components/layout/AppLayout";
import { AttendanceCard } from "@/components/attendance/AttendanceCard";
import { subjectAttendance, officialLastDate } from "@/data/mockData";
import { AlertCircle, BookOpen } from "lucide-react";
import { format } from "date-fns";

export default function Attendance() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Attendance</h1>
          <p className="text-muted-foreground">
            View your subject-wise attendance breakdown
          </p>
        </div>

        {/* Legend & Notice */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Understanding Your Attendance</p>
              <p className="text-xs text-muted-foreground mt-1">
                Official attendance from the institute is available till{" "}
                <span className="text-foreground font-medium">
                  {format(new Date(officialLastDate), "MMMM d, yyyy")}
                </span>
                . Any attendance after this date is your self-tracked estimate and will be
                replaced once official data is released.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Official (Institute)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-muted-foreground" />
              <span className="text-xs text-muted-foreground">Estimated (Self-tracked)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-success" />
              <span className="text-xs text-muted-foreground">≥75% (Safe)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-warning" />
              <span className="text-xs text-muted-foreground">60-74% (Warning)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-destructive" />
              <span className="text-xs text-muted-foreground">&lt;60% (Critical)</span>
            </div>
          </div>
        </div>

        {/* Subject Cards */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Subject-wise Attendance</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjectAttendance.map((data, index) => (
              <div
                key={data.subject.id}
                style={{ animationDelay: `${index * 100}ms` }}
                className="animate-slide-up"
              >
                <AttendanceCard data={data} showDetails={true} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
