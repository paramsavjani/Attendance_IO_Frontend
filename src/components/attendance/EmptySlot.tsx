import { cn } from "@/lib/utils";

interface EmptySlotProps {
  time: string;
  slotNumber: number;
}

export function EmptySlot({ time, slotNumber }: EmptySlotProps) {
  return (
    <div
      className={cn(
        "relative flex items-center rounded-xl overflow-hidden",
        "bg-neutral-900/50 border border-dashed border-white/10"
      )}
    >
      {/* Left indicator */}
      <div className="flex items-center pl-3">
        <div className="w-1 rounded-full h-10 bg-neutral-700/50" />
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-between px-3 py-2.5 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-neutral-500">Free Period</p>
          <p className="text-[11px] text-neutral-600">{time}</p>
        </div>
        
        <span className="text-[10px] text-neutral-600 font-medium px-2 py-1 rounded-lg bg-neutral-800/50">
          Slot {slotNumber}
        </span>
      </div>
    </div>
  );
}
