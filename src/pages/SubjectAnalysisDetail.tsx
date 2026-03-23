import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  Search,
  ChevronLeft,
  Users,
  TrendingUp,
  ArrowUpDown,
  Calendar,
} from "lucide-react";
import { API_CONFIG } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SubjectStudent {
  studentId: string;
  rollNumber: string;
  studentName: string;
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  attendancePercentage: number;
}

interface SubjectDetail {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  color: string;
  totalStudents: number;
  averageAttendancePercentage: number;
  cutoffDate: string | null;
  students: SubjectStudent[];
}

type SortField = "percentage" | "name" | "rollNumber";

function getPercentageColor(pct: number): string {
  if (pct >= 75) return "text-green-400";
  if (pct >= 50) return "text-yellow-400";
  return "text-red-400";
}

function getPercentageBg(pct: number): string {
  if (pct >= 75) return "bg-green-500/20";
  if (pct >= 50) return "bg-yellow-500/20";
  return "bg-red-500/20";
}

function getBarColor(pct: number): string {
  if (pct >= 75) return "bg-green-500";
  if (pct >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

export default function SubjectAnalysisDetail() {
  const navigate = useNavigate();
  const { subjectCode } = useParams<{ subjectCode: string }>();
  const [data, setData] = useState<SubjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("rollNumber");

  useEffect(() => {
    if (!subjectCode) return;
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${API_CONFIG.ENDPOINTS.SUBJECT_ANALYSIS}/${subjectCode}`
        );
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Failed to fetch subject detail:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [subjectCode]);

  const filteredStudents = useMemo(() => {
    if (!data) return [];
    const sorted = [...data.students].sort((a, b) => {
      switch (sortField) {
        case "percentage":
          return a.attendancePercentage - b.attendancePercentage;
        case "name":
          return a.studentName.localeCompare(b.studentName);
        case "rollNumber":
        default:
          return a.rollNumber.localeCompare(b.rollNumber);
      }
    });
    if (!query.trim()) return sorted;
    const q = query.toLowerCase().trim();
    return sorted.filter(
      (s) =>
        s.rollNumber.toLowerCase().includes(q) ||
        s.studentName.toLowerCase().includes(q)
    );
  }, [data, query, sortField]);

  const cycleSortField = () => {
    setSortField((prev) => {
      if (prev === "rollNumber") return "percentage";
      if (prev === "percentage") return "name";
      return "rollNumber";
    });
  };

  const stats = useMemo(() => {
    if (!data || data.students.length === 0) return null;
    const percentages = data.students.map((s) => s.attendancePercentage);
    const below70 = data.students.filter((s) => s.attendancePercentage < 70).length;
    return {
      highest: Math.max(...percentages),
      lowest: Math.min(...percentages),
      below70,
      above70: data.students.length - below70,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/subject-analysis")}
            className="p-2 rounded-xl bg-card border border-border hover:bg-accent transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">{subjectCode}</h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/subject-analysis")}
            className="p-2 rounded-xl bg-card border border-border hover:bg-accent transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">{subjectCode}</h1>
        </div>
        <div className="text-center py-20 text-muted-foreground">
          No official data found for this subject
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/subject-analysis")}
          className="p-2 rounded-xl bg-card border border-border hover:bg-accent transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div
              className="w-1 h-6 rounded-full flex-shrink-0"
              style={{ backgroundColor: data.color }}
            />
            <h1 className="text-lg font-bold truncate">{data.subjectName}</h1>
          </div>
          <p className="text-xs text-muted-foreground ml-3">{data.subjectCode}</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Users className="w-3.5 h-3.5" />
            </div>
            <p className="text-lg font-bold">{data.totalStudents}</p>
            <p className="text-[10px] text-muted-foreground">Students</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <p
              className={cn(
                "text-lg font-bold",
                getPercentageColor(data.averageAttendancePercentage)
              )}
            >
              {data.averageAttendancePercentage.toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Attendance</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <p className="text-lg font-bold">
              {data.students[0]?.totalClasses ?? "–"}
            </p>
            <p className="text-[10px] text-muted-foreground">Total Classes</p>
          </div>
        </div>

        {/* Mini bar showing above/below 75% split */}
        {stats && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-green-400">{stats.above70} above 70%</span>
              <span className="text-red-400">{stats.below70} below 70%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden flex">
              <div
                className="h-full bg-green-500 transition-all"
                style={{
                  width: `${(stats.above70 / data.totalStudents) * 100}%`,
                }}
              />
              <div
                className="h-full bg-red-500 transition-all"
                style={{
                  width: `${(stats.below70 / data.totalStudents) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {data.cutoffDate && (
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Data as of {data.cutoffDate}
          </p>
        )}
      </div>

      {/* Search + Sort */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <button
          onClick={cycleSortField}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          {sortField === "rollNumber"
            ? "Roll"
            : sortField === "percentage"
            ? "Att%"
            : "Name"}
        </button>
      </div>

      {/* Student List */}
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              {query ? "No students match your search" : "No students found"}
            </div>
          ) : (
            filteredStudents.map((student, idx) => (
              <div
                key={student.studentId}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  idx < filteredStudents.length - 1 &&
                    "border-b border-border/50"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {student.studentName}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {student.rollNumber}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {student.presentClasses}/{student.totalClasses}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        getBarColor(student.attendancePercentage)
                      )}
                      style={{
                        width: `${Math.min(100, student.attendancePercentage)}%`,
                      }}
                    />
                  </div>
                </div>
                <div
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0",
                    getPercentageBg(student.attendancePercentage),
                    getPercentageColor(student.attendancePercentage)
                  )}
                >
                  {student.attendancePercentage.toFixed(1)}%
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
