import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  BookOpen,
  Target,
  Flame,
  Trophy,
  Calendar,
  Smartphone,
  Zap,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { SemesterSelector, Semester } from "@/components/filters/SemesterSelector";
import { API_CONFIG, authenticatedFetch } from "@/lib/api";
import { toast } from "sonner";
import { trackAppEvent } from "@/contexts/AuthContext";
import { StatsCard } from "@/components/analytics/StatsCard";
import { InsightCard } from "@/components/analytics/InsightCard";
import { AttendanceRing } from "@/components/analytics/AttendanceRing";
import { SemesterComparisonChart } from "@/components/analytics/SemesterComparisonChart";
import { DistributionChart } from "@/components/analytics/DistributionChart";
import { TrendChart } from "@/components/analytics/TrendChart";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function Analytics() {
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [overallData, setOverallData] = useState<AllSemestersData | null>(null);
  const [semesterData, setSemesterData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSemester, setIsLoadingSemester] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "distribution" | "trends">("overview");

  // Fetch semesters and overall analytics on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch semesters
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

        // Fetch overall analytics with timeout
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
          if (error.name === "AbortError") {
            toast.error("Request timed out. Please try again.");
          } else {
            toast.error("Error loading analytics");
          }
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
        toast.error("Error loading analytics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Track analytics page view
    trackAppEvent("analytics_view", {
      timestamp: new Date().toISOString(),
    }).catch(console.error);
  }, []);

  // Fetch specific semester analytics when selected
  useEffect(() => {
    if (!selectedSemester || !overallData) return;

    const fetchSemesterData = async () => {
      setIsLoadingSemester(true);
      try {
        const semester = overallData.semesters.find((s) => s.label === selectedSemester.label);

        if (semester) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          try {
            const response = await authenticatedFetch(
              API_CONFIG.ENDPOINTS.ANALYTICS_SEMESTER(semester.id.toString()),
              {
                method: "GET",
                signal: controller.signal,
              }
            );

            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              setSemesterData(data.analytics);
            } else {
              toast.error("Failed to load semester analytics");
            }
          } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === "AbortError") {
              toast.error("Request timed out. Please try again.");
            } else {
              toast.error("Error loading semester analytics");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching semester analytics:", error);
        toast.error("Error loading semester analytics");
      } finally {
        setIsLoadingSemester(false);
      }
    };

    fetchSemesterData();
  }, [selectedSemester, overallData]);

  // Get current stats based on selection
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

  // Get semester-wise data for display
  const semesterWiseData = useMemo(() => {
    if (!overallData) return [];
    return overallData.semesterWise;
  }, [overallData]);

  // Generate insights based on data
  const insights = useMemo(() => {
    const result: Array<{
      type: "tip" | "achievement" | "warning" | "goal";
      title: string;
      description: string;
    }> = [];

    if (!stats.totalStudents) return result;

    const aboveRate = stats.totalStudents > 0 ? (stats.above70 / stats.totalStudents) * 100 : 0;
    const belowRate = stats.totalStudents > 0 ? (stats.below60 / stats.totalStudents) * 100 : 0;

    if (stats.averageAttendance >= 75) {
      result.push({
        type: "achievement",
        title: "Excellent Attendance!",
        description: `Average attendance is ${stats.averageAttendance}% which is above the recommended 75% threshold. Keep it up!`,
      });
    } else if (stats.averageAttendance >= 60) {
      result.push({
        type: "warning",
        title: "Room for Improvement",
        description: `Average attendance is ${stats.averageAttendance}%. Consider attending more classes to reach the 75% target.`,
      });
    } else {
      result.push({
        type: "warning",
        title: "Critical Attendance Level",
        description: `Average attendance is only ${stats.averageAttendance}%. Immediate improvement needed to avoid academic issues.`,
      });
    }

    if (aboveRate > 70) {
      result.push({
        type: "achievement",
        title: "Strong Community",
        description: `${Math.round(aboveRate)}% of students maintain above 70% attendance. Great collective effort!`,
      });
    }

    if (belowRate > 20) {
      result.push({
        type: "warning",
        title: "At-Risk Students",
        description: `${Math.round(belowRate)}% of students are below 60% attendance. Consider reaching out for support.`,
      });
    }

    if (stats.totalSubjects > 5) {
      result.push({
        type: "tip",
        title: "Managing Multiple Subjects",
        description: `Tracking ${stats.totalSubjects} subjects. Consider prioritizing subjects with lower attendance first.`,
      });
    }

    return result;
  }, [stats]);

  const handleSemesterClick = (semesterLabel: string) => {
    const sem = semesters.find((s) => s.label === semesterLabel);
    if (sem) setSelectedSemester(sem);
  };

  const handleBackToOverview = () => {
    setSelectedSemester(null);
    setSemesterData(null);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 pb-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {selectedSemester && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToOverview}
                className="h-9 w-9 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Analytics
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {selectedSemester
                  ? `${selectedSemester.label} statistics`
                  : "Overall attendance insights"}
              </p>
            </div>
          </div>
          <SemesterSelector
            selectedSemester={selectedSemester}
            onSemesterChange={setSelectedSemester}
            semesters={semesters}
          />
        </div>

        {isLoadingSemester ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Hero Section - Average Attendance Ring */}
            <div className="bg-gradient-to-br from-card via-card to-muted/20 rounded-3xl border border-border p-6 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-success/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative flex flex-col md:flex-row items-center gap-6">
                {/* Ring */}
                <AttendanceRing
                  percentage={stats.averageAttendance}
                  size="lg"
                  label="Average"
                />

                {/* Quick Stats */}
                <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                  <StatsCard
                    title="Total Students"
                    value={stats.totalStudents}
                    subtitle={`Across ${stats.totalSubjects} subjects`}
                    icon={Users}
                    variant="primary"
                  />
                  <StatsCard
                    title="Above 70%"
                    value={stats.above70}
                    subtitle={`${
                      stats.totalStudents > 0
                        ? Math.round((stats.above70 / stats.totalStudents) * 100)
                        : 0
                    }% of students`}
                    icon={CheckCircle}
                    variant="success"
                  />
                  <StatsCard
                    title="Below 60%"
                    value={stats.below60}
                    subtitle={`${
                      stats.totalStudents > 0
                        ? Math.round((stats.below60 / stats.totalStudents) * 100)
                        : 0
                    }% at risk`}
                    icon={AlertTriangle}
                    variant="destructive"
                  />
                  <StatsCard
                    title="Subjects"
                    value={stats.totalSubjects}
                    subtitle="Being tracked"
                    icon={BookOpen}
                    variant="default"
                  />
                </div>
              </div>
            </div>

            {/* Insights Section */}
            {insights.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Key Insights
                  </h2>
                </div>
                <div className="grid gap-3">
                  {insights.map((insight, index) => (
                    <InsightCard
                      key={index}
                      type={insight.type}
                      title={insight.title}
                      description={insight.description}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Tabs for different views */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="w-full grid grid-cols-3 h-11 rounded-xl bg-muted/50">
                <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="distribution" className="rounded-lg data-[state=active]:bg-background">
                  Distribution
                </TabsTrigger>
                <TabsTrigger value="trends" className="rounded-lg data-[state=active]:bg-background">
                  Compare
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="space-y-4 animate-fade-in">
                {/* Milestones */}
                <div className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-4 h-4 text-warning" />
                    <h3 className="font-semibold">Attendance Milestones</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { threshold: 90, label: "Excellent", color: "success" },
                      { threshold: 75, label: "Good", color: "primary" },
                      { threshold: 60, label: "Minimum", color: "warning" },
                    ].map((milestone) => {
                      const achieved = stats.averageAttendance >= milestone.threshold;
                      return (
                        <div
                          key={milestone.threshold}
                          className={cn(
                            "rounded-xl p-3 text-center border transition-all",
                            achieved
                              ? `bg-${milestone.color}/10 border-${milestone.color}/30`
                              : "bg-muted/30 border-border opacity-50"
                          )}
                        >
                          <div
                            className={cn(
                              "text-2xl font-bold mb-1",
                              achieved ? `text-${milestone.color}` : "text-muted-foreground"
                            )}
                          >
                            {milestone.threshold}%
                          </div>
                          <div className="text-xs text-muted-foreground">{milestone.label}</div>
                          {achieved && (
                            <CheckCircle className={cn("w-4 h-4 mx-auto mt-2 text-${milestone.color}")} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Distribution Mini Preview */}
                {stats.distribution.length > 0 && (
                  <div className="bg-card rounded-2xl border border-border p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold">Distribution Preview</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab("distribution")}
                        className="text-xs"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                    <DistributionChart data={stats.distribution} />
                  </div>
                )}
              </div>
            )}

            {activeTab === "distribution" && (
              <div className="space-y-4 animate-fade-in">
                {/* Full Distribution */}
                {stats.distribution.length > 0 && (
                  <div className="bg-card rounded-2xl border border-border p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">Attendance Distribution</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">
                      How students are distributed across attendance ranges
                    </p>
                    <DistributionChart data={stats.distribution} />
                  </div>
                )}

                {/* Range Histogram */}
                {stats.ranges.length > 0 && (
                  <div className="bg-card rounded-2xl border border-border p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Flame className="w-4 h-4 text-warning" />
                      <h3 className="font-semibold">Attendance Histogram</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">
                      Number of students in each percentage range
                    </p>
                    <div className="space-y-2">
                      {stats.ranges.map((range, index) => {
                        const maxCount = Math.max(...stats.ranges.map((r) => r.count));
                        const width = maxCount > 0 ? (range.count / maxCount) * 100 : 0;
                        return (
                          <div
                            key={range.range}
                            className="flex items-center gap-3 animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">
                              {range.range}
                            </span>
                            <div className="flex-1 h-6 bg-muted/30 rounded-lg overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-lg transition-all duration-700"
                                style={{ width: `${width}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold tabular-nums w-12 text-right">
                              {range.count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "trends" && (
              <div className="space-y-4 animate-fade-in">
                {/* Semester Comparison */}
                {!selectedSemester && semesterWiseData.length > 0 && (
                  <div className="bg-card rounded-2xl border border-border p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">Semester Comparison</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">
                      Tap any semester to view detailed statistics
                    </p>
                    <SemesterComparisonChart
                      data={semesterWiseData}
                      onSemesterClick={handleSemesterClick}
                    />
                  </div>
                )}

                {/* Best/Worst Semester */}
                {!selectedSemester && semesterWiseData.length > 1 && (
                  <div className="grid grid-cols-2 gap-3">
                    {(() => {
                      const sorted = [...semesterWiseData].sort(
                        (a, b) => b.percentage - a.percentage
                      );
                      const best = sorted[0];
                      const worst = sorted[sorted.length - 1];
                      return (
                        <>
                          <div className="bg-success/5 border border-success/20 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-4 h-4 text-success" />
                              <span className="text-xs font-medium text-success uppercase">
                                Best Semester
                              </span>
                            </div>
                            <p className="text-sm font-semibold">{best.semester}</p>
                            <p className="text-2xl font-bold text-success">{best.percentage}%</p>
                          </div>
                          <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-4 h-4 text-destructive" />
                              <span className="text-xs font-medium text-destructive uppercase">
                                Needs Work
                              </span>
                            </div>
                            <p className="text-sm font-semibold">{worst.semester}</p>
                            <p className="text-2xl font-bold text-destructive">
                              {worst.percentage}%
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {selectedSemester && (
                  <div className="bg-card rounded-2xl border border-border p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">{selectedSemester.label} Details</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Viewing detailed statistics for {selectedSemester.label}. Use the distribution
                      tab to see how students are spread across attendance ranges.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
