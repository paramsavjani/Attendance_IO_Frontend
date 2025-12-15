import { getTodaySchedule } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

export function TodaySchedule() {
  const schedule = getTodaySchedule();
  const now = new Date();
  const currentHour = now.getHours();

  const getSlotStatus = (timeSlot: string) => {
    const startHour = parseInt(timeSlot.split(":")[0]);
    if (startHour < currentHour) return "past";
    if (startHour === currentHour) return "current";
    return "upcoming";
  };

  return (
    <div className="glass-card rounded-xl p-5 animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Today's Schedule</h3>
      </div>

      <div className="space-y-3">
        {schedule.slots.map((slot, index) => {
          const status = getSlotStatus(slot.time);
          return (
            <div
              key={index}
              className={cn(
                "flex items-center gap-4 p-3 rounded-lg transition-all duration-200",
                status === "current" && "bg-primary/10 border border-primary/30",
                status === "past" && "opacity-50",
                status === "upcoming" && "bg-muted/30"
              )}
            >
              <span className="text-sm text-muted-foreground w-24 shrink-0">
                {slot.time}
              </span>
              {slot.subject ? (
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: `hsl(${slot.subject.color})` }}
                  />
                  <span className="text-sm font-medium">{slot.subject.name}</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground italic">No class</span>
              )}
              {status === "current" && (
                <span className="ml-auto text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                  Now
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
