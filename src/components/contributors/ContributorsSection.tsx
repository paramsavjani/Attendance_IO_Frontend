import { useEffect, useState } from "react";
import { Lightbulb, Users, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { API_CONFIG } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Contributor {
  id: number;
  name: string;
  typeOfHelp: string;
}

const INITIAL_DISPLAY_COUNT = 8;

export function ContributorsSection() {
  const [ideaContributors, setIdeaContributors] = useState<Contributor[]>([]);
  const [testers, setTesters] = useState<Contributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllTesters, setShowAllTesters] = useState(false);
  const [showAllIdeas, setShowAllIdeas] = useState(false);

  useEffect(() => {
    const fetchContributors = async () => {
      try {
        setIsLoading(true);
        
        // Fetch idea contributors
        const ideaResponse = await fetch(API_CONFIG.ENDPOINTS.CONTRIBUTORS('IDEA'), {
          credentials: 'include',
        });
        
        // Fetch testers
        const testerResponse = await fetch(API_CONFIG.ENDPOINTS.CONTRIBUTORS('TESTER'), {
          credentials: 'include',
        });

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
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
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
    <div className="space-y-3">
      {/* Idea Contributors Section */}
      {ideaContributors.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
              <Lightbulb className="w-3.5 h-3.5 text-primary" />
              Feature Ideas
              <span className="text-xs font-normal text-muted-foreground ml-1">
                ({ideaContributors.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0">
            <div className="flex flex-wrap gap-1.5">
              {displayedIdeas.map((contributor) => (
                <div
                  key={contributor.id}
                  className="px-2 py-1 bg-primary/10 rounded-md text-xs font-medium"
                >
                  {contributor.name}
                </div>
              ))}
            </div>
            {hasMoreIdeas && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllIdeas(!showAllIdeas)}
                className="mt-2 h-7 text-xs px-2"
              >
                {showAllIdeas ? (
                  <>
                    <ChevronUp className="w-3 h-3 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 mr-1" />
                    Show {ideaContributors.length - INITIAL_DISPLAY_COUNT} More
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Testers Section */}
      {testers.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
              <Users className="w-3.5 h-3.5 text-primary" />
              Testers
              <span className="text-xs font-normal text-muted-foreground ml-1">
                ({testers.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0">
            <div className="flex flex-wrap gap-1.5">
              {displayedTesters.map((tester) => (
                <div
                  key={tester.id}
                  className="px-2 py-1 bg-primary/10 rounded-md text-xs font-medium"
                >
                  {tester.name}
                </div>
              ))}
            </div>
            {hasMoreTesters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllTesters(!showAllTesters)}
                className="mt-2 h-7 text-xs px-2"
              >
                {showAllTesters ? (
                  <>
                    <ChevronUp className="w-3 h-3 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 mr-1" />
                    Show {testers.length - INITIAL_DISPLAY_COUNT} More
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Show message if no contributors */}
      {!isLoading && ideaContributors.length === 0 && testers.length === 0 && (
        <div className="text-center py-4 text-xs text-muted-foreground">
          No contributors yet
        </div>
      )}
    </div>
  );
}

