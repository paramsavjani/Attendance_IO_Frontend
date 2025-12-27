import { useEffect, useState } from "react";
import { Lightbulb, Users, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { API_CONFIG } from "@/lib/api";

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
          fetch(API_CONFIG.ENDPOINTS.CONTRIBUTORS('IDEA'), { credentials: 'include' }),
          fetch(API_CONFIG.ENDPOINTS.CONTRIBUTORS('TESTER'), { credentials: 'include' }),
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
      <div className="flex items-center justify-center py-3">
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
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Combined Header - Collapsible sections */}
      <div className="divide-y divide-border">
        {/* Ideas Section */}
        {ideaContributors.length > 0 && (
          <div>
            <button
              onClick={() => setExpandedSection(expandedSection === 'ideas' ? null : 'ideas')}
              className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span className="font-medium text-sm">Feature Ideas</span>
                <span className="text-xs text-muted-foreground">({ideaContributors.length})</span>
              </div>
              {expandedSection === 'ideas' ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {expandedSection === 'ideas' && (
              <div className="px-3 pb-3">
                <div className="flex flex-wrap gap-1.5">
                  {displayedIdeas.map((contributor) => (
                    <span
                      key={contributor.id}
                      className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-xs font-medium"
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
                    className="mt-2 h-6 text-xs px-2"
                  >
                    {showAllIdeas ? 'Show Less' : `+${ideaContributors.length - INITIAL_DISPLAY_COUNT} more`}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Testers Section */}
        {testers.length > 0 && (
          <div>
            <button
              onClick={() => setExpandedSection(expandedSection === 'testers' ? null : 'testers')}
              className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-sm">Testers</span>
                <span className="text-xs text-muted-foreground">({testers.length})</span>
              </div>
              {expandedSection === 'testers' ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {expandedSection === 'testers' && (
              <div className="px-3 pb-3">
                <div className="flex flex-wrap gap-1.5">
                  {displayedTesters.map((tester) => (
                    <span
                      key={tester.id}
                      className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-xs font-medium"
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
                    className="mt-2 h-6 text-xs px-2"
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

