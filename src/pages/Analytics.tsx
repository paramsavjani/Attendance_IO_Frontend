import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";
import { Users, TrendingUp, AlertTriangle, CheckCircle, Loader2, Search, ChevronRight, Calendar } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { SemesterSelector, Semester } from "@/components/filters/SemesterSelector";
import { Input } from "@/components/ui/input";
import { API_CONFIG, authenticatedFetch } from "@/lib/api";
import { toast } from "sonner";
import { trackAppEvent } from "@/contexts/AuthContext";

interface AnalyticsData {
  totalStudents: number;
  totalSubjects: number;
  averageAttendance: number;
  above70: number;
  below60: number;
  distribution: { name: string; value: number; color: string }[];
  ranges: { range: string; count: number }[];
}

interface SemesterWiseData {
  semester: string;
  percentage: number;
  students: number;
  color: string;
}

interface AllSemestersData {
  semesters: Array<{ id: number; year: number; type: string; label: string }>;
  overall: AnalyticsData;
  semesterWise: SemesterWiseData[];
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

interface SubjectAnalysisData {
  subjects: SubjectEntry[];
}

type AnalyticsTab = "my" | "subjects";

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

function SubjectAnalysisSection() {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.subjects.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        No official attendance data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cutoff info */}
      {data.subjects[0]?.cutoffDate && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-primary">
            Official data till {data.subjects[0].cutoffDate}
          </span>
        </div>
      )}

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

function MyAnalyticsSection() {
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [overallData, setOverallData] = useState<AllSemestersData | null>(null);
  const [semesterData, setSemesterData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSemester, setIsLoadingSemester] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const semestersResponse = await authenticatedFetch(API_CONFIG.ENDPOINTS.ANALYTICS_SEMESTERS, {
          method: "GET",
        });

        if (semestersResponse.ok) {
          const semestersData = await semestersResponse.json();
          const formattedSemesters: Semester[] = semestersData.map((s: any) => ({
            year: s.year,
            term: s.type as "Winter" | "Summer" | "Fall" | "Spring",
            label: s.label,
          }));
          setSemesters(formattedSemesters);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
          const analyticsResponse = await authenticatedFetch(API_CONFIG.ENDPOINTS.ANALYTICS, {
            method: "GET",
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (analyticsResponse.ok) {
            const data = await analyticsResponse.json();
            setOverallData(data);
          } else {
            toast.error("Failed to load analytics data");
          }
        } catch (error: any) {
          clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
            toast.error("Request timed out. Please try again or select a specific semester.");
          } else {
            toast.error("Error loading analytics");
          }
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
        toast.error("Error loading analytics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedSemester || !overallData) return;

    const fetchSemesterData = async () => {
      setIsLoadingSemester(true);
      try {
        const semester = overallData.semesters.find(
          s => s.label === selectedSemester.label
        );

        if (semester) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          try {
            const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.ANALYTICS_SEMESTER(semester.id.toString()), {
              method: "GET",
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              setSemesterData(data.analytics);
            } else {
              toast.error("Failed to load semester analytics");
            }
          } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
              toast.error("Request timed out. Please try again.");
            } else {
              toast.error("Error loading semester analytics");
            }
          }
        }
      } catch (error) {
        console.error('Error fetching semester analytics:', error);
        toast.error("Error loading semester analytics");
      } finally {
        setIsLoadingSemester(false);
      }
    };

    fetchSemesterData();
  }, [selectedSemester, overallData]);

  const stats = useMemo(() => {
    if (!overallData) {
      return {
        totalStudents: 0,
        totalSubjects: 0,
        averageAttendance: 0,
        above70: 0,
        below60: 0,
        distribution: [],
        ranges: [],
      };
    }

    if (selectedSemester && semesterData) {
      return semesterData;
    }

    return overallData.overall;
  }, [selectedSemester, overallData, semesterData]);

  const semesterWiseData = useMemo(() => {
    if (!overallData) return [];
    return overallData.semesterWise;
  }, [overallData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-end">
        <SemesterSelector
          selectedSemester={selectedSemester}
          onSemesterChange={setSelectedSemester}
          semesters={semesters}
        />
      </div>

      {isLoadingSemester ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
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

          {/* Semester-wise Stats */}
          {!selectedSemester && semesterWiseData.length > 0 && (
            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="font-semibold mb-1">Attendance by Semester</h3>
              <p className="text-xs text-muted-foreground mb-4">Percentage for each term</p>

              <div className="grid grid-cols-2 gap-3">
                {semesterWiseData.map((item) => (
                  <button
                    key={item.semester}
                    onClick={() => {
                      const sem = semesters.find(s => s.label === item.semester);
                      if (sem) setSelectedSemester(sem);
                    }}
                    className="bg-background rounded-lg p-3 border border-border text-left hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground font-medium">{item.semester}</span>
                    </div>
                    <p className={cn(
                      "text-xl font-bold",
                      item.percentage >= 70 ? "text-success" :
                        item.percentage >= 60 ? "text-warning" : "text-destructive"
                    )}>
                      {item.percentage}%
                    </p>
                    <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          item.percentage >= 70 ? "bg-success" :
                            item.percentage >= 60 ? "bg-warning" : "bg-destructive"
                        )}
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.students} students</p>
                  </button>
                ))}
              </div>
            </div>
          )}

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
        </>
      )}
    </div>
  );
}

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("my");

  useEffect(() => {
    trackAppEvent('analytics_view', {
      timestamp: new Date().toISOString(),
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          {activeTab === "my" ? "Your attendance statistics" : "Official institute subject data"}
        </p>
      </div>

      {/* Tab Toggle */}
      <div className="flex rounded-xl bg-muted p-1 gap-1">
        <button
          onClick={() => setActiveTab("my")}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
            activeTab === "my"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          My Analytics
        </button>
        <button
          onClick={() => setActiveTab("subjects")}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
            activeTab === "subjects"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Subject Analysis
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "my" ? <MyAnalyticsSection /> : <SubjectAnalysisSection />}
    </div>
  );
}
