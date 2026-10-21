import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";
import { Users, TrendingUp, AlertTriangle, CheckCircle, Loader2, Search, ChevronRight, LayoutGrid, Layers, GraduationCap } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Input } from "@/components/ui/input";
import { API_CONFIG, authenticatedFetch } from "@/lib/api";
import { toast } from "sonner";
import { trackAppEvent } from "@/contexts/AuthContext";
import { LevelAnalysis } from "@/components/subject-analysis/SubjectGroupAnalysis";
import { BatchAnalysis } from "@/components/subject-analysis/BatchAnalysis";
import {
  GlassSegmentedControl,
  type GlassSegment,
} from "@/components/subject-analysis/GlassSegmentedControl";

interface AnalyticsData {
  totalStudents: number;
  totalSubjects: number;
  averageAttendance: number;
  above70: number;
  below60: number;
  distribution: { name: string; value: number; color: string }[];
  ranges: { range: string; count: number }[];
}

interface CurrentSemesterAnalytics {
  semester: { id: number; year: number; type: string; label: string };
  analytics: AnalyticsData;
}

interface SubjectEntry {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  color: string;
  totalStudents: number;
  averageAttendancePercentage: number;
  cutoffDate: string | null;
}

type AnalyticsTab = "my" | "subjects";
type GeneralView = "overview" | "batch" | "level";

const GENERAL_VIEWS: GlassSegment<GeneralView>[] = [
  { value: "batch", label: "By Batch", icon: GraduationCap },
  { value: "overview", label: "Overview", icon: LayoutGrid },
  { value: "level", label: "By Level", icon: Layers },
];

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

function Spinner({ minHeight = "min-h-[300px]" }: { minHeight?: string }) {
  return (
    <div className={cn("flex items-center justify-center", minHeight)}>
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function NoOfficialData() {
  return (
    <div className="text-center py-20 text-muted-foreground">
      No official attendance data available
    </div>
  );
}

/** Subject Analysis tab: every subject of the current semester, searchable. */
function SubjectListSection({ subjects }: { subjects: SubjectEntry[] }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filteredSubjects = useMemo(() => {
    if (!query.trim()) return subjects;
    const q = query.toLowerCase().trim();
    return subjects.filter(
      (s) =>
        s.subjectCode.toLowerCase().includes(q) ||
        s.subjectName.toLowerCase().includes(q)
    );
  }, [subjects, query]);

  return (
    <div className="space-y-2.5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search subjects..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 bg-card border-border"
        />
      </div>

      {/* Subject List */}
      {filteredSubjects.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No subjects match your search
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredSubjects.map((subject) => (
            <button
              key={subject.subjectId}
              onClick={() => navigate(`/subject-analysis/${subject.subjectCode}`)}
              className="w-full text-left rounded-2xl bg-card border border-border px-4 py-3 active:scale-[0.98]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
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

                  <div className="flex items-center gap-4 mt-2 ml-3">
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

/** General → Overview: institute-wide official numbers for the current semester. */
function GeneralOverview() {
  const [data, setData] = useState<CurrentSemesterAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.ANALYTICS_CURRENT, {
          method: "GET",
          signal: controller.signal,
        });
        if (response.ok) {
          setData(await response.json());
        } else {
          toast.error("Failed to load analytics data");
        }
      } catch (error) {
        const aborted = error instanceof DOMException && error.name === "AbortError";
        toast.error(aborted ? "Request timed out. Please try again." : "Error loading analytics");
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <Spinner minHeight="min-h-[400px]" />;
  if (!data) return <NoOfficialData />;

  const stats = data.analytics;

  return (
    <div className="space-y-2.5">
      <p className="text-xs text-muted-foreground px-1">
        {data.semester.label} · each student's overall official attendance
      </p>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Total Students</span>
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold">{stats.totalStudents.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Across {stats.totalSubjects} subjects</p>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Average</span>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className={cn(
            "text-2xl font-bold",
            stats.averageAttendance >= 70 ? "text-success" :
              stats.averageAttendance >= 60 ? "text-warning" : "text-destructive"
          )}>
            {stats.averageAttendance}%
          </p>
          <div className="h-1 bg-muted rounded-full mt-2 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                stats.averageAttendance >= 70 ? "bg-success" :
                  stats.averageAttendance >= 60 ? "bg-warning" : "bg-destructive"
              )}
              style={{ width: `${Math.min(stats.averageAttendance, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Above 70%</span>
            <CheckCircle className="w-4 h-4 text-success" />
          </div>
          <p className="text-2xl font-bold text-success">{stats.above70.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">
            {stats.totalStudents > 0 ? Math.round((stats.above70 / stats.totalStudents) * 100) : 0}% of students
          </p>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Below 60%</span>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <p className="text-2xl font-bold text-destructive">{stats.below60.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">
            {stats.totalStudents > 0 ? Math.round((stats.below60 / stats.totalStudents) * 100) : 0}% of students
          </p>
        </div>
      </div>

      {/* Distribution Pie Chart */}
      {stats.distribution.length > 0 && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-semibold mb-1">Attendance Distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Students by attendance ranges</p>

          <div className="flex items-center justify-center">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={stats.distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {stats.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {stats.distribution.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs">{item.name}: {item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Range Bar Chart */}
      {stats.ranges.length > 0 && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-semibold mb-1">Attendance Range Distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Histogram of student percentages</p>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.ranges}>
              <XAxis
                dataKey="range"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/** General tab: batch-wise (default), overview and course-level analysis of the current semester. */
function GeneralSection({ subjects }: { subjects: SubjectEntry[] | null }) {
  const [view, setView] = useState<GeneralView>("batch");

  return (
    <div className="space-y-2.5">
      <GlassSegmentedControl<GeneralView> segments={GENERAL_VIEWS} value={view} onChange={setView} />

      {view === "overview" && <GeneralOverview />}
      {view === "batch" && <BatchAnalysis />}
      {view === "level" &&
        (subjects === null ? (
          <Spinner />
        ) : subjects.length === 0 ? (
          <NoOfficialData />
        ) : (
          <LevelAnalysis subjects={subjects} />
        ))}
    </div>
  );
}

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("my");
  // Official subject list for the current semester; shared by the subject list, the course-level
  // view and the "Till <date>" badge. null while loading.
  const [subjects, setSubjects] = useState<SubjectEntry[] | null>(null);

  useEffect(() => {
    trackAppEvent('analytics_view', {
      timestamp: new Date().toISOString(),
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch(API_CONFIG.ENDPOINTS.SUBJECT_ANALYSIS);
        setSubjects(response.ok ? (await response.json()).subjects ?? [] : []);
      } catch (err) {
        console.error("Failed to fetch subject analysis:", err);
        setSubjects([]);
      }
    };
    fetchSubjects();
  }, []);

  const cutoffDate = subjects?.[0]?.cutoffDate ?? null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Official institute data · current semester
          </p>
        </div>
        {cutoffDate && (
          <span className="text-sm text-primary bg-primary/10 border border-primary/20 rounded-xl px-3.5 py-1.5 whitespace-nowrap mt-0.5 font-semibold">
            Till {new Date(cutoffDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        )}
      </div>

      {/* Tab Toggle */}
      <div className="relative flex rounded-2xl p-1 gap-1 border border-white/20 dark:border-white/10 bg-white/20 dark:bg-black/20 backdrop-blur-3xl shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] dark:shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]">
        <div
          className="absolute top-1 bottom-1 rounded-xl bg-white/80 dark:bg-white/10 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.3)] backdrop-blur-xl border border-white/20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{
            width: 'calc((100% - 12px) / 2)',
            left: activeTab === "my" ? '4px' : 'calc(50% + 2px)',
          }}
        />
        <button
          onClick={() => setActiveTab("my")}
          className={cn(
            "flex-1 py-1.5 px-3 rounded-xl text-sm font-medium transition-colors duration-200 relative z-10",
            activeTab === "my"
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab("subjects")}
          className={cn(
            "flex-1 py-1.5 px-3 rounded-xl text-sm font-medium transition-colors duration-200 relative z-10",
            activeTab === "subjects"
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          Subject Analysis
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "my" ? (
        <GeneralSection subjects={subjects} />
      ) : subjects === null ? (
        <Spinner />
      ) : subjects.length === 0 ? (
        <NoOfficialData />
      ) : (
        <SubjectListSection subjects={subjects} />
      )}
    </div>
  );
}
