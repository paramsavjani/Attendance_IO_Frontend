import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import { Subject } from "@/types/attendance";

interface TodayClassCardProps {
  index: number;
  time: string;
  subject: Subject;
  isCurrent: boolean;
  status: 'present' | 'absent' | null;
  onMark: (status: 'present' | 'absent') => void;
}

export function TodayClassCard({
  time,
  subject,
  isCurrent,
  status,
  onMark,
}: TodayClassCardProps) {
  return (
    <div
      className={cn(
        "relative flex items-stretch rounded-2xl bg-card border transition-all overflow-hidden",
        isCurrent && "border-primary/50 ring-2 ring-primary/20",
        !isCurrent && "border-border"
      )}
    >
      {/* Color stripe */}
      <div
        className="w-1.5 flex-shrink-0"
        style={{ backgroundColor: `hsl(${subject.color})` }}
      />
      
      {/* Content */}
      <div className="flex-1 p-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{subject.name}</p>
            {isCurrent && (
              <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium shrink-0">
                NOW
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{time}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-stretch border-l border-border">
        <button
          onClick={() => onMark('present')}
          className={cn(
            "w-14 flex items-center justify-center transition-all",
            status === 'present'
              ? "bg-success text-success-foreground"
              : "hover:bg-success/10 text-success"
          )}
        >
          <Check className="w-5 h-5" strokeWidth={status === 'present' ? 3 : 2} />
        </button>
        <button
          onClick={() => onMark('absent')}
          className={cn(
            "w-14 flex items-center justify-center transition-all border-l border-border",
            status === 'absent'
              ? "bg-destructive text-destructive-foreground"
              : "hover:bg-destructive/10 text-destructive"
          )}
        >
          <X className="w-5 h-5" strokeWidth={status === 'absent' ? 3 : 2} />
        </button>
      </div>
    </div>
  );
}
