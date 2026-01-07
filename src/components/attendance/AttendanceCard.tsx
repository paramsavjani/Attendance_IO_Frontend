import { SubjectAttendance } from "@/types/attendance";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface AttendanceCardProps {
  data: SubjectAttendance;
  showDetails?: boolean;
}

export function AttendanceCard({ data, showDetails = true }: AttendanceCardProps) {
  const officialPercentage = Math.round(
    (data.officialPresent / data.officialTotal) * 100
  );
  const totalPresent = data.officialPresent + data.estimatedPresent;
  const totalClasses = data.officialTotal + data.estimatedTotal;
  const estimatedPercentage = Math.round((totalPresent / totalClasses) * 100);

  const getStatusColor = (percentage: number) => {
    if (percentage >= 75) return "text-success";
    if (percentage >= 60) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all duration-300 animate-scale-in">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: `hsl(${data.subject.color})` }}
          />
          <div>
            <h3 className="font-semibold text-foreground">{data.subject.name}</h3>
            <p className="text-xs text-muted-foreground">{data.subject.code}</p>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger>
            <Info className="w-4 h-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs">
              Official attendance is updated till {data.officialLastDate}. 
              Estimated includes your tracked entries after that date.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      {showDetails && (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                Official (Institute)
              </span>
              <span className={cn("text-sm font-semibold", getStatusColor(officialPercentage))}>
                {officialPercentage}%
              </span>
            </div>
            <Progress value={officialPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {data.officialPresent} / {data.officialTotal} classes
            </p>
          </div>

          {/* Estimated Attendance */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground" />
                Estimated (Self-tracked)
              </span>
              <span className={cn("text-sm font-semibold", getStatusColor(estimatedPercentage))}>
                {estimatedPercentage}%
              </span>
            </div>
            <Progress value={estimatedPercentage} className="h-2 bg-muted" />
            <p className="text-xs text-muted-foreground mt-1">
              {totalPresent} / {totalClasses} classes (includes tracked)
            </p>
          </div>
        </>
      )}

      {!showDetails && (
        <div className="flex items-baseline gap-2">
          <span className={cn("text-2xl font-bold", getStatusColor(estimatedPercentage))}>
            {estimatedPercentage}%
          </span>
          <span className="text-xs text-muted-foreground">estimated</span>
        </div>
      )}
    </div>
  );
}
