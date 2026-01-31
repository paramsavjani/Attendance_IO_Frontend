import { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { API_CONFIG, authenticatedFetch } from "@/lib/api";
import { trackAppEvent } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Users,
  ClipboardCheck,
  Activity,
  LogIn,
  BarChart3,
  Loader2,
  Smartphone,
  Globe,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";

export interface DailyCount {
  date: string;
  count: number;
}

export interface AppAnalyticsData {
  totalUsers: number;
  totalAttendance: number;
  totalEvents: number;
  recentLogins: number;
  eventsByType: Record<string, number>;
  notificationsEnabled: number;
  notificationsDisabled: number;
  totalEnrollments: number;
  studentsWithSubjects: number;
  uniqueSubjects: number;
  attendanceLast15Days?: DailyCount[];
  appOpensLast15Days?: DailyCount[];
}

interface AppAnalyticsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatEventName(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function formatChartDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export function AppAnalyticsModal({ open, onOpenChange }: AppAnalyticsModalProps) {
  const [data, setData] = useState<AppAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const openedAtRef = useRef<number | null>(null);

  // Track when user opens App Analytics
  useEffect(() => {
    if (open) {
      openedAtRef.current = Date.now();
      trackAppEvent("app_analytics_view", {
        action: "opened",
        openedAt: new Date().toISOString(),
      }).catch(() => {});
    }
  }, [open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && openedAtRef.current != null) {
      const durationSeconds = Math.round((Date.now() - openedAtRef.current) / 1000);
      trackAppEvent("app_analytics_view", {
        action: "closed",
        durationSeconds,
        closedAt: new Date().toISOString(),
      }).catch(() => {});
      openedAtRef.current = null;
    }
    onOpenChange(nextOpen);
  };

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setData(null);
    authenticatedFetch(API_CONFIG.ENDPOINTS.ANALYTICS_APP, { method: "GET" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load analytics");
        return res.json();
      })
      .then(setData)
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load app analytics");
      })
      .finally(() => setLoading(false));
  }, [open]);

  const attendanceChartData = useMemo(() => {
    const list = data?.attendanceLast15Days ?? [];
    if (!list.length) return [];
    return list.map((d) => ({
      date: d.date,
      label: formatChartDate(d.date),
      count: d.count,
    }));
  }, [data?.attendanceLast15Days]);

  const appOpensChartData = useMemo(() => {
    const list = data?.appOpensLast15Days ?? [];
    if (!list.length) return [];
    return list.map((d) => ({
      date: d.date,
      label: formatChartDate(d.date),
      count: d.count,
    }));
  }, [data?.appOpensLast15Days]);

  // Responsive: use container width for mobile detection instead of window
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(max-width: 640px)");
    setIsNarrow(mq.matches);
    const handler = () => setIsNarrow(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [open]);

  const avgAttendancePerDay = useMemo(() => {
    if (!attendanceChartData.length) return 0;
    const sum = attendanceChartData.reduce((s, d) => s + d.count, 0);
    return Math.round((sum / attendanceChartData.length) * 10) / 10;
  }, [attendanceChartData]);

  // App opens avg: weekdays only (exclude Saturday & Sunday)
  const avgAppOpensPerDay = useMemo(() => {
    if (!appOpensChartData.length) return 0;
    const weekdays = appOpensChartData.filter((d) => {
      const day = new Date(d.date).getDay();
      return day >= 1 && day <= 5;
    });
    if (!weekdays.length) return 0;
    const sum = weekdays.reduce((s, d) => s + d.count, 0);
    return Math.round((sum / weekdays.length) * 10) / 10;
  }, [appOpensChartData]);

  const eventsByTypeList = data?.eventsByType
    ? Object.entries(data.eventsByType)
        .filter(([eventType]) => eventType !== "app_analytics_view")
        .sort(([, a], [, b]) => b - a)
    : [];

  const chartHeight = 200;
  const isMobile = isNarrow;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[100vw] sm:max-w-2xl md:max-w-3xl max-h-[95dvh] sm:max-h-[90vh] overflow-hidden flex flex-col bg-card border-border text-foreground p-3 sm:p-4 md:p-6 rounded-xl">
        <DialogHeader className="border-b border-border pb-3 sm:pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            App Analytics
          </DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Overview of app usage and engagement
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 app-analytics-scrollbar space-y-4 sm:space-y-6 py-3 sm:py-4 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 sm:py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : data ? (
            <>
              {/* Overview cards - compact on mobile */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2 sm:mb-3 uppercase tracking-wide">
                  Overview
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                  <div className="bg-background rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        Logged-in Users
                      </span>
                    </div>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold tabular-nums">
                      {data.totalUsers.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-background rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                      <ClipboardCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        Total Attendance
                      </span>
                    </div>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-success tabular-nums">
                      {data.totalAttendance.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-background rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                      <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        Total Events
                      </span>
                    </div>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold tabular-nums">
                      {data.totalEvents.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-background rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                      <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-warning flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        Recent (7d)
                      </span>
                    </div>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-warning tabular-nums">
                      {data.recentLogins.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Last 15 days: Attendance + Avg per day */}
              <div className="bg-background rounded-xl border border-border p-3 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Last 15 Days — Attendance
                  </h3>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="text-muted-foreground">Avg/day:</span>
                    <span className="font-bold text-success tabular-nums">
                      {avgAttendancePerDay.toFixed(1)}
                    </span>
                  </div>
                </div>
                {attendanceChartData.length > 0 ? (
                  <div className="w-full" style={{ height: chartHeight }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={attendanceChartData}
                        margin={{
                          top: 6,
                          right: 4,
                          left: isMobile ? -8 : 0,
                          bottom: 0,
                        }}
                      >
                        <defs>
                          <linearGradient
                            id="colorAttendance"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="hsl(var(--success))"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="hsl(var(--success))"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: isMobile ? 9 : 10, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fontSize: isMobile ? 9 : 10, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                          width={isMobile ? 24 : 28}
                          tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(value: number) => [value, "Attendance"]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="hsl(var(--success))"
                          strokeWidth={2}
                          fill="url(#colorAttendance)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[160px] text-sm text-muted-foreground">
                    No attendance data in last 15 days
                  </div>
                )}
              </div>

              {/* Last 15 days: App Opens */}
              <div className="bg-background rounded-xl border border-border p-3 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Last 15 Days — App Opens
                  </h3>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="text-muted-foreground">Avg/day (weekdays):</span>
                    <span className="font-bold text-primary tabular-nums">
                      {avgAppOpensPerDay.toFixed(1)}
                    </span>
                  </div>
                </div>
                {appOpensChartData.length > 0 ? (
                  <div className="w-full" style={{ height: chartHeight }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={appOpensChartData}
                        margin={{
                          top: 6,
                          right: 4,
                          left: isMobile ? -8 : 0,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: isMobile ? 9 : 10, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fontSize: isMobile ? 9 : 10, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                          width={isMobile ? 24 : 28}
                          tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(value: number) => [value, "App Opens"]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Bar
                          dataKey="count"
                          fill="hsl(var(--primary))"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[160px] text-sm text-muted-foreground">
                    No app opens in last 15 days
                  </div>
                )}
              </div>

              {/* Average attendance per day - summary card */}
              <div className="bg-background rounded-xl border border-border p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Average attendance per day (last 15 days)
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-success tabular-nums mt-0.5">
                    {avgAttendancePerDay.toFixed(1)}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      entries/day
                    </span>
                  </p>
                </div>
              </div>

              {/* Events by type - scrollable, compact */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2 sm:mb-3 uppercase tracking-wide">
                  Events by Type
                </h3>
                <div className="bg-background rounded-xl border border-border overflow-hidden">
                  <div className="max-h-[240px] sm:max-h-[280px] overflow-y-auto app-analytics-scrollbar">
                    <div className="divide-y divide-border">
                      {eventsByTypeList.length > 0 ? (
                        eventsByTypeList.map(([eventType, count]) => {
                          const isAppOpen = eventType === "app_open";
                          const isWeb = eventType.includes("web");
                          return (
                            <div
                              key={eventType}
                              className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <div
                                  className={cn(
                                    "w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                                    isAppOpen ? "bg-primary/10 text-primary" : isWeb ? "bg-muted text-muted-foreground" : "bg-muted/50 text-muted-foreground"
                                  )}
                                >
                                  {isAppOpen || eventType === "login" ? (
                                    <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  ) : isWeb ? (
                                    <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  ) : (
                                    <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  )}
                                </div>
                                <span className="text-xs sm:text-sm font-medium truncate">
                                  {formatEventName(eventType)}
                                </span>
                              </div>
                              <span className="text-xs sm:text-sm font-bold tabular-nums flex-shrink-0 ml-2">
                                {count.toLocaleString()}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-4 py-8 text-center text-xs sm:text-sm text-muted-foreground">
                          No events recorded yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            !loading && (
              <div className="py-12 text-center text-muted-foreground text-sm">
                Unable to load analytics. Please try again.
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
