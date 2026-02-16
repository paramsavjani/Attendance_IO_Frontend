import { useEffect, useState } from "react";
import { Lightbulb, Users, Loader2, ChevronDown, ChevronUp, Crown } from "lucide-react";
import { API_CONFIG, authenticatedFetch } from "@/lib/api";

import { Button } from "@/components/ui/button";

interface Contributor {
  id: number;
  name: string;
  typeOfHelp: string;
}

const INITIAL_DISPLAY_COUNT = 6;

export function ContributorsSection() {
  const [ideaContributors, setIdeaContributors] = useState<Contributor[]>([]);
  const [testers, setTesters] = useState<Contributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllTesters, setShowAllTesters] = useState(false);
  const [showAllIdeas, setShowAllIdeas] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'ideas' | 'testers' | null>(null);

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
      <div className="flex items-center justify-center py-2.5">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (ideaContributors.length === 0 && testers.length === 0) {
    return null;
  }

  const displayedIdeas = showAllIdeas
    ? ideaContributors
    : ideaContributors.slice(0, INITIAL_DISPLAY_COUNT);
  const displayedTesters = showAllTesters
    ? testers
    : testers.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMoreIdeas = ideaContributors.length > INITIAL_DISPLAY_COUNT;
  const hasMoreTesters = testers.length > INITIAL_DISPLAY_COUNT;

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-center gap-2 mb-2 opacity-60">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/30" />
        <span className="text-[10px] font-medium uppercase tracking-widest text-white/50">Hall of Fame</span>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/30" />
      </div>

      <div className="grid grid-cols-1 gap-2">
        {ideaContributors.length > 0 && (
          <div className="relative overflow-hidden rounded-xl border border-yellow-500/20 bg-yellow-500/5 backdrop-blur-sm transition-all hover:bg-yellow-500/10">
            <button
              onClick={() => setExpandedSection(expandedSection === 'ideas' ? null : 'ideas')}
              className="w-full flex items-center justify-between p-3 active:scale-[0.99] transition-transform touch-manipulation"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-yellow-500/20 p-2 text-yellow-400">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white">Feature Ideas</p>
                  <p className="text-[10px] text-white/50">{ideaContributors.length} contributors</p>
                </div>
              </div>
              {expandedSection === 'ideas' ? (
                <ChevronUp className="w-4 h-4 text-white/40" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/40" />
              )}
            </button>

            {expandedSection === 'ideas' && (
              <div className="px-3 pb-3 pt-0">
                <div className="h-px w-full bg-white/5 mb-3" />
                <div className="flex flex-wrap gap-1.5">
                  {displayedIdeas.map((contributor) => (
                    <span
                      key={contributor.id}
                      className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 rounded text-[10px] font-medium shadow-sm"
                    >
                      {contributor.name}
                    </span>
                  ))}
                </div>
                {hasMoreIdeas && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAllIdeas(!showAllIdeas);
                    }}
                    className="mt-2 h-6 text-[10px] px-2 text-yellow-500/80 hover:text-yellow-400 hover:bg-transparent"
                  >
                    {showAllIdeas ? 'Show Less' : `+${ideaContributors.length - INITIAL_DISPLAY_COUNT} more`}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {testers.length > 0 && (
          <div className="relative overflow-hidden rounded-xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-sm transition-all hover:bg-blue-500/10">
            <button
              onClick={() => setExpandedSection(expandedSection === 'testers' ? null : 'testers')}
              className="w-full flex items-center justify-between p-3 active:scale-[0.99] transition-transform touch-manipulation"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/20 p-2 text-blue-400">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white">Beta Testers</p>
                  <p className="text-[10px] text-white/50">{testers.length} heroes</p>
                </div>
              </div>
              {expandedSection === 'testers' ? (
                <ChevronUp className="w-4 h-4 text-white/40" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/40" />
              )}
            </button>

            {expandedSection === 'testers' && (
              <div className="px-3 pb-3 pt-0">
                <div className="h-px w-full bg-white/5 mb-3" />
                <div className="flex flex-wrap gap-1.5">
                  {displayedTesters.map((tester) => (
                    <span
                      key={tester.id}
                      className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded text-[10px] font-medium shadow-sm"
                    >
                      {tester.name}
                    </span>
                  ))}
                </div>
                {hasMoreTesters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAllTesters(!showAllTesters);
                    }}
                    className="mt-2 h-6 text-[10px] px-2 text-blue-500/80 hover:text-blue-400 hover:bg-transparent"
                  >
                    {showAllTesters ? 'Show Less' : `+${testers.length - INITIAL_DISPLAY_COUNT} more`}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
