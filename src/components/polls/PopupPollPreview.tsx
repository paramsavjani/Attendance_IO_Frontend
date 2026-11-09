import { Check, VenetianMask } from "lucide-react";
import { cn } from "@/lib/utils";

const SAMPLE = {
  subject: "Processes on Networks",
  question: "Is tomorrow's 8 AM lecture happening?",
  options: [
    { text: "Yes, it's on", percent: 64, mine: true },
    { text: "No, cancelled", percent: 24, mine: false },
    { text: "Not sure", percent: 12, mine: false },
  ],
  votes: 42,
};

/** A sample class poll for the launch popup, so students see what one looks like before trying it. */
export function PopupPollPreview({
  visible,
  className,
  style,
}: {
  visible: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cn("rounded-lg bg-[#151515] px-3 pb-3 pt-2.5 text-left", className)} style={style}>
      <div className="flex items-center gap-1.5 text-[10.5px] text-[#898781]">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#91d4dc]/15 px-1.5 py-0.5 font-medium text-[#f0efec]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#91d4dc]" />
          {SAMPLE.subject}
        </span>
        <span className="inline-flex items-center gap-1">
          <VenetianMask className="h-3 w-3" />
          Anonymous
        </span>
      </div>
      <div className="mt-1.5 text-[13px] font-medium leading-snug text-[#f0efec]">{SAMPLE.question}</div>
      <div className="mt-2 space-y-1">
        {SAMPLE.options.map((option, index) => (
          <div
            key={option.text}
            className="relative flex items-center gap-2 overflow-hidden rounded-md border border-white/[0.06] px-2.5 py-1.5 text-[11.5px]"
          >
            <span
              className="absolute inset-y-0 left-0 transition-[width] duration-700 ease-out"
              style={{
                width: visible ? `${option.percent}%` : "0%",
                transitionDelay: `${150 + index * 90}ms`,
                backgroundColor: option.mine ? "rgba(145, 212, 220, 0.35)" : "rgba(145, 212, 220, 0.14)",
              }}
              aria-hidden
            />
            <span className={cn("relative z-10 flex-1 text-[#e4e3de]", option.mine && "font-medium text-[#f0efec]")}>
              {option.text}
            </span>
            {option.mine && <Check className="relative z-10 h-3 w-3 text-[#f0efec]" />}
            <span className="relative z-10 w-8 text-right font-medium tabular-nums text-[#c3c2b7]">{option.percent}%</span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 text-[10px] text-[#898781]">{SAMPLE.votes} votes · nobody sees who voted for what</div>
    </div>
  );
}
