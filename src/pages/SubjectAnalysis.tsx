import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, Users, TrendingUp } from "lucide-react";
import { API_CONFIG } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SubjectEntry {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  color: string;
  totalStudents: number;
  averageAttendancePercentage: number;
  cutoffDate: string | null;
}

interface SubjectAnalysisData {
  subjects: SubjectEntry[];
}

function getPercentageColor(pct: number): string {
  if (pct >= 75) return "text-green-400";
  if (pct >= 50) return "text-yellow-400";
  return "text-red-400";
}

function getBarColor(pct: number): string {
  if (pct >= 75) return "bg-green-500";
  if (pct >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

export default function SubjectAnalysis() {
  const navigate = useNavigate();
  const [data, setData] = useState<SubjectAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_CONFIG.ENDPOINTS.SUBJECT_ANALYSIS);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (err) {
        console.error("Failed to fetch subject analysis:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredSubjects = useMemo(() => {
    if (!data) return [];
    if (!query.trim()) return data.subjects;
    const q = query.toLowerCase().trim();
    return data.subjects.filter(
      (s) =>
        s.subjectCode.toLowerCase().includes(q) ||
        s.subjectName.toLowerCase().includes(q)
    );
  }, [data, query]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-card border border-border hover:bg-accent transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Subject Analysis</h1>
          {data && data.subjects.length > 0 && data.subjects[0].cutoffDate && (
            <p className="text-xs text-muted-foreground">
              Official data till {data.subjects[0].cutoffDate}
            </p>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search subjects..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 bg-card border-border"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          {query ? "No subjects match your search" : "No official attendance data available"}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 overflow-y-auto flex-1 pb-4">
          {filteredSubjects.map((subject) => (
            <button
              key={subject.subjectId}
              onClick={() => navigate(`/subject-analysis/${subject.subjectCode}`)}
              className="w-full text-left rounded-2xl bg-card border border-border p-4 hover:bg-accent/50 transition-colors active:scale-[0.98]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-1 h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: subject.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">
                        {subject.subjectName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {subject.subjectCode}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-2.5 ml-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      <span>{subject.totalStudents}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                      <span
                        className={cn(
                          "font-semibold",
                          getPercentageColor(subject.averageAttendancePercentage)
                        )}
                      >
                        {subject.averageAttendancePercentage.toFixed(1)}% avg
                      </span>
                    </div>
                    <div className="flex-1 ml-1">
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", getBarColor(subject.averageAttendancePercentage))}
                          style={{ width: `${Math.min(100, subject.averageAttendancePercentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
