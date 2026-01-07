import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { Users, TrendingUp, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { SemesterSelector, Semester } from "@/components/filters/SemesterSelector";
import { API_CONFIG, authenticatedFetch } from "@/lib/api";
import { toast } from "sonner";

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

        // Fetch overall analytics with timeout (increased since we use DB view + cache)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
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

  // Fetch specific semester analytics when selected
  useEffect(() => {
    if (!selectedSemester || !overallData) return;

    const fetchSemesterData = async () => {
      setIsLoadingSemester(true);
      try {
        // Find semester ID from overall data
        const semester = overallData.semesters.find(
          s => s.label === selectedSemester.label
        );

        if (semester) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
          
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

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header with Semester Selector */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Analytics</h1>
            <p className="text-sm text-muted-foreground">
              {selectedSemester ? `${selectedSemester.label} statistics` : "Overall attendance statistics"}
            </p>
          </div>
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

            {/* Semester-wise Stats - Only show when viewing all semesters */}
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
    </AppLayout>
  );
}
