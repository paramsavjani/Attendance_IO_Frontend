import { AppLayout } from "@/components/layout/AppLayout";
import { subjectAttendance, officialLastDate } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function Attendance() {
  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold">Attendance Stats</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Official till {format(new Date(officialLastDate), "MMM d")}
          </p>
        </div>

        {/* Subject Cards */}
        <div className="space-y-3">
          {subjectAttendance.map((data) => {
            const totalPresent = data.officialPresent + data.estimatedPresent;
            const totalClasses = data.officialTotal + data.estimatedTotal;
            const percentage = Math.round((totalPresent / totalClasses) * 100);

            return (
              <div
                key={data.subject.id}
                className="bg-card rounded-xl p-4 border border-border"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-8 rounded-full"
                      style={{ backgroundColor: `hsl(${data.subject.color})` }}
                    />
                    <div>
                      <p className="font-medium text-sm">{data.subject.name}</p>
                      <p className="text-xs text-muted-foreground">{data.subject.code}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-xl font-bold",
                    percentage >= 75 ? "text-success" : 
                    percentage >= 60 ? "text-warning" : "text-destructive"
                  )}>
                    {percentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      percentage >= 75 ? "bg-success" : 
                      percentage >= 60 ? "bg-warning" : "bg-destructive"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  {totalPresent} / {totalClasses} classes
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
