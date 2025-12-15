import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { OverviewCard } from "@/components/attendance/OverviewCard";
import { TodaySchedule } from "@/components/attendance/TodaySchedule";
import { AttendanceCard } from "@/components/attendance/AttendanceCard";
import { getOverallAttendance, subjectAttendance, officialLastDate } from "@/data/mockData";
import { TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { student } = useAuth();
  const overall = getOverallAttendance();

  const getAttendanceVariant = (percentage: number) => {
    if (percentage >= 75) return "success";
    if (percentage >= 60) return "warning";
    return "destructive";
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">
            Welcome back, {student?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            Semester {student?.semester} • {student?.rollNumber}
          </p>
        </div>

        {/* Official Attendance Notice */}
        <div className="glass-card rounded-xl p-4 border-primary/30 bg-primary/5 flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm">
              <span className="font-medium">Official attendance updated till:</span>{" "}
              {format(new Date(officialLastDate), "MMMM d, yyyy")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Attendance after this date is your self-tracked estimate
            </p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <OverviewCard
            title="Official Attendance"
            value={`${overall.official}%`}
            subtitle="From institute records"
            icon={<Calendar className="w-5 h-5 text-primary" />}
            variant={getAttendanceVariant(overall.official)}
            tooltip="This is your official attendance from the institute, calculated up to the last updated date."
          />
          <OverviewCard
            title="Estimated Attendance"
            value={`${overall.estimated}%`}
            subtitle="Including self-tracked"
            icon={<TrendingUp className="w-5 h-5 text-primary" />}
            variant={getAttendanceVariant(overall.estimated)}
            tooltip="This includes your official attendance plus your self-tracked entries after the official date."
          />
          <OverviewCard
            title="Current Semester"
            value={`Sem ${student?.semester}`}
            subtitle={`${subjectAttendance.length} subjects`}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <div className="lg:col-span-1">
            <TodaySchedule />
          </div>

          {/* Quick Attendance Overview */}
          <div className="lg:col-span-2">
            <h3 className="font-semibold mb-4">Subject Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjectAttendance.slice(0, 4).map((data) => (
                <AttendanceCard key={data.subject.id} data={data} showDetails={false} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
