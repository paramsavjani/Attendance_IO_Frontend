import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { API_CONFIG, authenticatedFetch } from "@/lib/api";
import { trackAppEvent } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Users,
  ClipboardCheck,
  Activity,
  LogIn,
  Loader2,
  Smartphone,
  Globe,
  TrendingUp,
  Calendar,
  ArrowLeft,
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

interface DailyCount {
  date: string;
  count: number;
}

interface AppAnalyticsData {
  totalUsers: number;
  totalAttendance: number;
  totalEvents: number;
  recentLogins: number;
  eventsByType: Record<string, number>;
  attendanceLast15Days?: DailyCount[];
  appOpensLast15Days?: DailyCount[];
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

export default function AppAnalyticsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<AppAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const openedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    trackAppEvent("app_analytics_view", {
      action: "opened",
      openedAt: new Date().toISOString(),
    }).catch(() => {});
    return () => {
      const durationSeconds = Math.round((Date.now() - openedAtRef.current) / 1000);
      trackAppEvent("app_analytics_view", {
        action: "closed",
        durationSeconds,
        closedAt: new Date().toISOString(),
      }).catch(() => {});
    };
  }, []);

  useEffect(() => {
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
  }, []);

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

  const avgAttendancePerDay = useMemo(() => {
    if (!attendanceChartData.length) return 0;
    const sum = attendanceChartData.reduce((s, d) => s + d.count, 0);
    return Math.round((sum / attendanceChartData.length) * 10) / 10;
  }, [attendanceChartData]);

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

  const [chartHeight, setChartHeight] = useState(200);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setChartHeight(mq.matches ? 180 : 220);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <AppLayout>
      <div className="min-h-screen pb-6">
        {/* Fixed header - always stuck to top */}
        <header className="fixed top-0 left-0 right-0 z-30 bg-background border-b border-border safe-area-top">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6 max-w-lg mx-auto min-h-[52px] sm:min-h-[56px]">
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="flex items-center justify-center w-11 h-11 sm:w-10 sm:h-10 rounded-xl bg-muted/90 hover:bg-muted active:scale-[0.98] text-foreground transition-colors touch-manipulation flex-shrink-0"
              aria-label="Back to Profile"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0 py-0.5">
              <h1 className="text-sm sm:text-base font-bold truncate leading-tight">App Analytics</h1>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">Usage & engagement</p>
            </div>
          </div>
        </header>

        {/* Spacer so content starts below fixed header */}
        <div className="h-[52px] sm:h-[56px]" aria-hidden />

        <div className="space-y-3 sm:space-y-5 app-analytics-scrollbar -mx-1 px-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 gap-3">
              <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading analytics…</p>
            </div>
          ) : data ? (
            <>
              {/* KPI cards - 2x2 mobile (compact), 4 cols desktop */}
              <section>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                  <div className="rounded-lg sm:rounded-xl border border-border bg-card p-2.5 sm:p-4 shadow-sm min-h-[64px] sm:min-h-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">
                        Users
                      </span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold tabular-nums leading-tight">
                      {data.totalUsers.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg sm:rounded-xl border border-border bg-card p-2.5 sm:p-4 shadow-sm min-h-[64px] sm:min-h-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                        <ClipboardCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-success" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">
                        Attendance
                      </span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-success tabular-nums leading-tight">
                      {data.totalAttendance.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg sm:rounded-xl border border-border bg-card p-2.5 sm:p-4 shadow-sm min-h-[64px] sm:min-h-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">
                        Events
                      </span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold tabular-nums leading-tight">
                      {data.totalEvents.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg sm:rounded-xl border border-border bg-card p-2.5 sm:p-4 shadow-sm min-h-[64px] sm:min-h-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                        <LogIn className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-warning" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">
                        Recent 7d
                      </span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-warning tabular-nums leading-tight">
                      {data.recentLogins.toLocaleString()}
                    </p>
                  </div>
                </div>
              </section>

              {/* Charts - side by side on large screens */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                {/* Attendance chart */}
                <div className="rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-3">
                    <h2 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success" />
                      Attendance (last 15 days)
                    </h2>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      Avg <span className="font-semibold text-success tabular-nums">{avgAttendancePerDay.toFixed(1)}</span>/day
                    </span>
                  </div>
                  {attendanceChartData.length > 0 ? (
                    <div className="w-full" style={{ height: chartHeight }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={attendanceChartData}
                          margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="appAnalyticsAttendance" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                            width={24}
                            tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "11px",
                            }}
                            formatter={(value: number) => [value, "Attendance"]}
                          />
                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke="hsl(var(--success))"
                            strokeWidth={2}
                            fill="url(#appAnalyticsAttendance)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[180px] text-xs text-muted-foreground rounded-lg bg-muted/30">
                      No attendance data
                    </div>
                  )}
                </div>

                {/* App opens chart */}
                <div className="rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-3">
                    <h2 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                      App opens (last 15 days)
                    </h2>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      Avg <span className="font-semibold text-primary tabular-nums">{avgAppOpensPerDay.toFixed(1)}</span>/day (weekdays)
                    </span>
                  </div>
                  {appOpensChartData.length > 0 ? (
                    <div className="w-full" style={{ height: chartHeight }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={appOpensChartData}
                          margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                            width={24}
                            tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "11px",
                            }}
                            formatter={(value: number) => [value, "App Opens"]}
                          />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[180px] text-xs text-muted-foreground rounded-lg bg-muted/30">
                      No app opens data
                    </div>
                  )}
                </div>
              </section>

              {/* Summary strip - stacks on narrow mobile */}
              <section>
                <div className="rounded-xl sm:rounded-2xl border border-border bg-gradient-to-r from-card to-muted/20 p-2.5 sm:p-4 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-4">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 sm:w-5 sm:h-5 text-success" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Attendance avg (15d)</p>
                      <p className="text-base sm:text-lg font-bold text-success tabular-nums">{avgAttendancePerDay.toFixed(1)} <span className="text-[10px] sm:text-xs font-normal text-muted-foreground">/ day</span></p>
                    </div>
                  </div>
                  <div className="h-6 w-px bg-border hidden sm:block self-center" />
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">App opens avg (weekdays)</p>
                      <p className="text-base sm:text-lg font-bold text-primary tabular-nums">{avgAppOpensPerDay.toFixed(1)} <span className="text-[10px] sm:text-xs font-normal text-muted-foreground">/ day</span></p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Events by type - compact, small fonts */}
              <section>
                <h2 className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                  Events by type
                </h2>
                <div className="rounded-xl sm:rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                  {eventsByTypeList.length > 0 ? (
                    <ul className="divide-y divide-border">
                      {eventsByTypeList.map(([eventType, count]) => {
                        const isAppOpen = eventType === "app_open";
                        const isWeb = eventType.includes("web");
                        return (
                          <li
                            key={eventType}
                            className="flex items-center justify-between px-3 py-2.5 min-h-[44px] sm:min-h-[40px] hover:bg-muted/30 active:bg-muted/40 transition-colors touch-manipulation"
                          >
                            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                  isAppOpen ? "bg-primary/10 text-primary" : isWeb ? "bg-muted text-muted-foreground" : "bg-muted/50 text-muted-foreground"
                                )}
                              >
                                {isAppOpen || eventType === "login" ? (
                                  <Smartphone className="w-4 h-4" />
                                ) : isWeb ? (
                                  <Globe className="w-4 h-4" />
                                ) : (
                                  <Activity className="w-4 h-4" />
                                )}
                              </div>
                              <span className="text-xs font-medium truncate text-foreground">{formatEventName(eventType)}</span>
                            </div>
                            <span className="text-xs font-bold tabular-nums text-muted-foreground ml-2 flex-shrink-0">
                              {count.toLocaleString()}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="px-3 py-8 text-center text-[11px] text-muted-foreground">
                      No events recorded yet
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : (
            !loading && (
              <div className="rounded-xl border border-border bg-card p-8 sm:p-10 text-center">
                <p className="text-xs text-muted-foreground mb-3">Unable to load analytics.</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Try again
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </AppLayout>
  );
}
