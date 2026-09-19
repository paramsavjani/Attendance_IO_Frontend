import React, { useEffect, useState } from "react";
import { Lightbulb, Users, Loader2 } from "lucide-react";
import { API_CONFIG, authenticatedFetch } from "@/lib/api";

import { cn } from "@/lib/utils";

interface Contributor {
  id: number;
  name: string;
  typeOfHelp: string;
}

const INITIAL_DISPLAY_COUNT = 6;

type ContributorsSectionProps = {
  className?: string;
};

export function ContributorsSection({ className }: ContributorsSectionProps) {
  const [ideaContributors, setIdeaContributors] = useState<Contributor[]>([]);
  const [testers, setTesters] = useState<Contributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllTesters, setShowAllTesters] = useState(false);
  const [showAllIdeas, setShowAllIdeas] = useState(false);

  useEffect(() => {
    const fetchContributors = async () => {
      try {
        setIsLoading(true);

        const [ideaResponse, testerResponse] = await Promise.all([
          authenticatedFetch(API_CONFIG.ENDPOINTS.CONTRIBUTORS('IDEA'), { method: "GET" }),
          authenticatedFetch(API_CONFIG.ENDPOINTS.CONTRIBUTORS('TESTER'), { method: "GET" }),
        ]);

        if (ideaResponse.ok) {
          const ideaData = await ideaResponse.json();
          setIdeaContributors(ideaData);
        }

        if (testerResponse.ok) {
          const testerData = await testerResponse.json();
          setTesters(testerData);
        }
      } catch (error) {
        console.error('Error fetching contributors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContributors();
  }, []);

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-2.5", className)}>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (ideaContributors.length === 0 && testers.length === 0) {
    return null;
  }

  /** One group: coloured header with a count, then name chips, then "+N more" when long. */
  const Group = ({
    icon,
    title,
    people,
    tone,
    expanded,
    onToggle,
  }: {
    icon: React.ReactNode;
    title: string;
    people: Contributor[];
    tone: { tile: string; chip: string; more: string };
    expanded: boolean;
    onToggle: () => void;
  }) => {
    const shown = expanded ? people : people.slice(0, INITIAL_DISPLAY_COUNT);
    const hidden = people.length - shown.length;
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
        <div className="mb-2.5 flex items-center gap-2.5">
          <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg [&>svg]:h-4 [&>svg]:w-4", tone.tile)}>{icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-tight text-foreground">{title}</p>
            <p className="text-[11px] text-muted-foreground">
              {people.length} {people.length === 1 ? "person" : "people"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {shown.map((c) => (
            <span key={c.id} className={cn("rounded-full border px-2.5 py-1 text-[12px] font-medium leading-none", tone.chip)}>
              {c.name}
            </span>
          ))}
          {(hidden > 0 || expanded) && (
            <button
              type="button"
              onClick={onToggle}
              className={cn("rounded-full border border-dashed px-2.5 py-1 text-[12px] font-medium leading-none", tone.more)}
            >
              {expanded ? "Show less" : `+${hidden} more`}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      <p className="px-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Thanks to</p>
      {ideaContributors.length > 0 && (
        <Group
          icon={<Lightbulb />}
          title="Feature ideas"
          people={ideaContributors}
          tone={{
            tile: "bg-emerald-500/15 text-emerald-400",
            chip: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
            more: "border-emerald-500/40 text-emerald-300",
          }}
          expanded={showAllIdeas}
          onToggle={() => setShowAllIdeas((v) => !v)}
        />
      )}
      {testers.length > 0 && (
        <Group
          icon={<Users />}
          title="Beta testers"
          people={testers}
          tone={{
            tile: "bg-blue-500/15 text-blue-400",
            chip: "border-blue-500/25 bg-blue-500/10 text-blue-200",
            more: "border-blue-500/40 text-blue-300",
          }}
          expanded={showAllTesters}
          onToggle={() => setShowAllTesters((v) => !v)}
        />
      )}
    </div>
  );
}
