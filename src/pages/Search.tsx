import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";

import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, ChevronLeft, ChevronDown, X, Trash2 } from "lucide-react";
import { trackAppEvent } from "@/contexts/AuthContext";
import { SubjectCard } from "@/components/attendance/SubjectCard";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SemesterSelector, availableSemesters, Semester } from "@/components/filters/SemesterSelector";
import { API_CONFIG } from "@/lib/api";
import { toast } from "sonner";
import { hexToHslLightened, cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  email?: string;
  pictureUrl?: string;
}

interface SubjectAttendance {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  lecturePlace?: string | null;
  present: number;
  absent: number;
  leave: number;
  total: number;
  color: string;
}

interface SemesterData {
  semester: {
    id: string;
    year: number;
    type: string;
  };
  subjects: SubjectAttendance[];
}

interface StudentAttendanceData {
  studentId: string;
  studentName: string;
  rollNumber: string;
  studentPictureUrl?: string;
  semester?: {
    id: string;
    year: number;
    type: string;
  };
  subjects?: SubjectAttendance[];
  semesters?: SemesterData[];
}

interface SearchHistoryItem {
  id: string;
  viewedStudentId: string;
  viewedStudentName: string;
  viewedStudentRollNumber: string;
  viewedStudentPictureUrl: string | null;
  createdAt: string | null;
}

export default function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const studentIdParam = searchParams.get("studentId");

  const [query, setQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [attendanceData, setAttendanceData] = useState<StudentAttendanceData | null>(null);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [currentSemester, setCurrentSemester] = useState<{ year: number; type: string } | null>(null);

  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Search history API helpers ──────────────────────────────────────────────

  const fetchHistory = async () => {
    try {
      const res = await fetch(API_CONFIG.ENDPOINTS.SEARCH_HISTORY, { credentials: "include" });
      if (res.ok) setSearchHistory(await res.json());
    } catch {
      // silent
    }
  };

  const saveToHistory = async (student: Student) => {
    // Optimistic update: bump to top, deduplicate by student id
    setSearchHistory((prev) => {
      const filtered = prev.filter((h) => h.viewedStudentId !== student.id);
      return [
        {
          id: `tmp-${Date.now()}`,
          viewedStudentId: student.id,
          viewedStudentName: student.name,
          viewedStudentRollNumber: student.rollNumber,
          viewedStudentPictureUrl: student.pictureUrl ?? null,
          createdAt: new Date().toISOString(),
        },
        ...filtered,
      ].slice(0, 10);
    });
    try {
      await fetch(API_CONFIG.ENDPOINTS.SEARCH_HISTORY, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewedStudentId: student.id }),
      });
    } catch {
      // silent
    }
  };

  const deleteHistoryItem = async (id: string) => {
    setSearchHistory((prev) => prev.filter((h) => h.id !== id));
    try {
      await fetch(API_CONFIG.ENDPOINTS.SEARCH_HISTORY_DELETE(id), {
        method: "DELETE",
        credentials: "include",
      });
    } catch {
      toast.error("Failed to delete");
      fetchHistory();
    }
  };

  const clearAllHistory = async () => {
    setSearchHistory([]);
    try {
      await fetch(API_CONFIG.ENDPOINTS.SEARCH_HISTORY, {
        method: "DELETE",
        credentials: "include",
      });
    } catch {
      toast.error("Failed to clear history");
      fetchHistory();
    }
  };

  // ── Back-button handling (Capacitor) ────────────────────────────────────────

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle: { remove: () => Promise<void> } | undefined;

    (async () => {
      const { App } = await import("@capacitor/app");

      listenerHandle = await App.addListener("backButton", ({ canGoBack }) => {
        if (studentIdParam) {
          setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev);
            newParams.delete("studentId");
            return newParams;
          });
        } else if (canGoBack) {
          window.history.back();
        }
      });
    })();

    return () => {
      listenerHandle?.remove();
    };
  }, [studentIdParam, setSearchParams]);

  // ── Sync selectedStudent with URL param ─────────────────────────────────────

  useEffect(() => {
    if (studentIdParam) {
      const student = students.find((s) => s.id === studentIdParam);
      if (student) {
        setSelectedStudent(student);
      } else if (students.length > 0) {
        setSearchParams((prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.delete("studentId");
          return newParams;
        });
      }
    } else {
      setSelectedStudent(null);
    }
  }, [studentIdParam, students, setSearchParams]);

  // ── Fetch student from attendance data when navigating directly by URL ───────

  useEffect(() => {
    const fetchStudentFromAttendance = async () => {
      if (!studentIdParam || selectedStudent || students.length > 0) return;

      setIsLoadingAttendance(true);
      try {
        const url = API_CONFIG.ENDPOINTS.STUDENT_ATTENDANCE(studentIdParam);
        const response = await fetch(url, { credentials: "include" });

        if (response.ok) {
          const data: StudentAttendanceData = await response.json();

          const student: Student = {
            id: data.studentId,
            name: data.studentName,
            rollNumber: data.rollNumber,
            pictureUrl: data.studentPictureUrl,
          };

          setSelectedStudent(student);

          if (data.subjects) {
            data.subjects = data.subjects.map((subj) => ({
              ...subj,
              color: hexToHslLightened(subj.color || "#3B82F6"),
            }));
          }

          if (data.semesters) {
            data.semesters = data.semesters.map((sem) => ({
              ...sem,
              subjects: sem.subjects.map((subj) => ({
                ...subj,
                color: hexToHslLightened(subj.color || "#3B82F6"),
              })),
            }));
          }

          setAttendanceData(data);
        } else if (response.status === 404) {
          setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev);
            newParams.delete("studentId");
            return newParams;
          });
          toast.error("Student not found");
        } else {
          toast.error("Failed to load student data");
        }
      } catch {
        toast.error("Error loading student data");
      } finally {
        setIsLoadingAttendance(false);
      }
    };

    fetchStudentFromAttendance();
  }, [studentIdParam, selectedStudent, students.length, setSearchParams]);

  // ── On mount: fetch semester + search history ────────────────────────────────

  useEffect(() => {
    const fetchCurrentSemester = async () => {
      try {
        const response = await fetch(API_CONFIG.ENDPOINTS.SEMESTER_CURRENT, {
          credentials: "include",
        });
        if (response.ok) setCurrentSemester(await response.json());
      } catch {
        // ignore
      }
    };
    fetchCurrentSemester();
    fetchHistory();

    if (!studentIdParam) {
      trackAppEvent("search_view", { timestamp: new Date().toISOString() }).catch(console.error);
    }
  }, [studentIdParam]);

  // ── Live search with debounce ────────────────────────────────────────────────

  useEffect(() => {
    const searchStudents = async () => {
      if (query.trim().length === 0) {
        setStudents([]);
        return;
      }
      if (query.trim().length < 2) return;

      setIsSearching(true);
      try {
        const response = await fetch(
          `${API_CONFIG.ENDPOINTS.SEARCH_STUDENTS}?query=${encodeURIComponent(query)}`,
          { credentials: "include" }
        );

        if (response.ok) {
          const data = await response.json();
          setStudents(data);
          trackAppEvent("search_performed", {
            query: query.trim(),
            resultsCount: data.length,
            timestamp: new Date().toISOString(),
          }).catch(console.error);
        } else {
          toast.error("Failed to search students");
        }
      } catch {
        toast.error("Error searching students");
      } finally {
        setIsSearching(false);
      }
    };

    const id = setTimeout(searchStudents, 300);
    return () => clearTimeout(id);
  }, [query]);

  // ── Fetch attendance when a student is selected ──────────────────────────────

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedStudent) {
        setAttendanceData(null);
        return;
      }

      trackAppEvent("profile_open", {
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        timestamp: new Date().toISOString(),
      }).catch(console.error);

      if (attendanceData && attendanceData.studentId === selectedStudent.id) return;

      setIsLoadingAttendance(true);
      try {
        const url = API_CONFIG.ENDPOINTS.STUDENT_ATTENDANCE(selectedStudent.id);
        const response = await fetch(url, { credentials: "include" });

        if (response.ok) {
          const data: StudentAttendanceData = await response.json();

          if (data.subjects) {
            data.subjects = data.subjects.map((subj) => ({
              ...subj,
              color: hexToHslLightened(subj.color || "#3B82F6"),
            }));
          }

          if (data.semesters) {
            data.semesters = data.semesters.map((sem) => ({
              ...sem,
              subjects: sem.subjects.map((subj) => ({
                ...subj,
                color: hexToHslLightened(subj.color || "#3B82F6"),
              })),
            }));
          }

          setAttendanceData(data);
        } else {
          toast.error("Failed to load attendance data");
        }
      } catch {
        toast.error("Error loading attendance data");
      } finally {
        setIsLoadingAttendance(false);
      }
    };

    fetchAttendance();
  }, [selectedStudent, selectedSemester]);

  // ── Derived data ─────────────────────────────────────────────────────────────

  const filteredSemesters = useMemo(() => {
    if (!attendanceData?.semesters || !selectedSemester) return attendanceData?.semesters || [];
    return attendanceData.semesters.filter(
      (sem) =>
        sem.semester.year === selectedSemester.year &&
        sem.semester.type.toLowerCase() === selectedSemester.term.toLowerCase()
    );
  }, [attendanceData, selectedSemester]);

  const currentSemesterData = useMemo(() => {
    if (!attendanceData?.semesters || !currentSemester) return null;
    return attendanceData.semesters.find(
      (sem) =>
        sem.semester.year === currentSemester.year &&
        sem.semester.type.toLowerCase() === currentSemester.type.toLowerCase()
    );
  }, [attendanceData, currentSemester]);

  const overallAttendance = useMemo(() => {
    if (!currentSemesterData) return null;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalClasses = 0;
    currentSemesterData.subjects.forEach((subject) => {
      totalPresent += subject.present;
      totalAbsent += subject.absent;
      totalClasses += subject.total;
    });
    return {
      present: totalPresent,
      absent: totalAbsent,
      total: totalClasses,
      percentage: totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0,
    };
  }, [currentSemesterData]);

  // ── Student profile view ─────────────────────────────────────────────────────

  if (selectedStudent) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => {
            setSearchParams((prev) => {
              const newParams = new URLSearchParams(prev);
              newParams.delete("studentId");
              return newParams;
            });
            setSelectedSemester(null);
          }}
          className="flex items-center gap-2 text-muted-foreground text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {isLoadingAttendance ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Loading attendance data...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-xs font-medium text-blue-400">Official Institute Attendance</span>
            </div>

            {overallAttendance && (
              <div className="bg-card rounded-lg p-3 md:p-4 border border-border space-y-3">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={selectedStudent.pictureUrl || "/user-icons/user2.png"}
                      alt={selectedStudent.name}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/user-icons/user2.png";
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-base md:text-lg font-bold truncate">{selectedStudent.name}</h1>
                    <p className="text-xs text-muted-foreground">{selectedStudent.rollNumber}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-center">
                    <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">Overall Attendance</p>
                    <p
                      className={cn(
                        "text-3xl md:text-4xl font-bold",
                        overallAttendance.percentage >= 75
                          ? "text-success"
                          : overallAttendance.percentage >= 60
                          ? "text-warning"
                          : "text-destructive"
                      )}
                    >
                      {overallAttendance.percentage.toFixed(1)}%
                    </p>
                  </div>

                  <div>
                    <div className="relative h-2 md:h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          overallAttendance.percentage >= 75
                            ? "bg-success"
                            : overallAttendance.percentage >= 60
                            ? "bg-warning"
                            : "bg-destructive"
                        )}
                        style={{ width: `${Math.min(overallAttendance.percentage, 100)}%` }}
                      />
                      <div
                        className="absolute top-0 w-0.5 h-full bg-foreground/30"
                        style={{ left: "75%" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 md:gap-3 pt-1">
                    <div className="text-center">
                      <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">Present</p>
                      <p className="text-lg md:text-xl font-bold text-success">{overallAttendance.present}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">Absent</p>
                      <p className="text-lg md:text-xl font-bold text-destructive">{overallAttendance.absent}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">Total</p>
                      <p className="text-lg md:text-xl font-bold text-foreground">{overallAttendance.total}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!selectedSemester && currentSemesterData && (
              <div>
                <h3 className="font-semibold text-sm mb-2">
                  Current Semester ({currentSemesterData.semester.type} {currentSemesterData.semester.year})
                </h3>
                <div className="space-y-2">
                  {currentSemesterData.subjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No attendance data for current semester
                    </p>
                  ) : (
                    currentSemesterData.subjects.map((subject) => (
                      <SubjectCard
                        key={subject.subjectId}
                        name={subject.subjectName}
                        code={subject.subjectCode}
                        color={subject.color}
                        present={subject.present}
                        absent={subject.absent}
                        total={subject.total}
                        minRequired={70}
                        hideBunkableInfo={true}
                        suppressLowAttendanceStyling={true}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {selectedSemester && (
              <div>
                <h3 className="font-semibold text-sm mb-2">{selectedSemester.label} Attendance</h3>
                <div className="space-y-2">
                  {filteredSemesters.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No data for {selectedSemester.label}
                    </p>
                  ) : (
                    filteredSemesters.map((sem) => (
                      <div key={`${sem.semester.year}-${sem.semester.type}`} className="space-y-2">
                        {sem.subjects.map((subject) => (
                          <SubjectCard
                            key={subject.subjectId}
                            name={subject.subjectName}
                            code={subject.subjectCode}
                            color={subject.color}
                            present={subject.present}
                            absent={subject.absent}
                            total={subject.total}
                            minRequired={75}
                            hideBunkableInfo={true}
                            suppressLowAttendanceStyling={true}
                          />
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {!selectedSemester && attendanceData?.semesters && (
              <div>
                <h3 className="font-semibold text-sm mb-2">Previous Semesters</h3>
                <div className="space-y-2">
                  {attendanceData.semesters
                    .filter(
                      (sem) =>
                        !currentSemester ||
                        sem.semester.year !== currentSemester.year ||
                        sem.semester.type.toLowerCase() !== currentSemester.type.toLowerCase()
                    )
                    .map((sem) => (
                      <Collapsible key={`${sem.semester.year}-${sem.semester.type}`}>
                        <CollapsibleTrigger className="w-full bg-card rounded-xl p-3 border border-border flex items-center justify-between text-left">
                          <div>
                            <p className="font-medium text-sm">
                              {sem.semester.type} {sem.semester.year}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {sem.subjects.length} subject{sem.subjects.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2 space-y-2">
                          {sem.subjects.map((subject) => (
                            <SubjectCard
                              key={subject.subjectId}
                              name={subject.subjectName}
                              lecturePlace={subject.lecturePlace}
                              color={subject.color}
                              present={subject.present}
                              absent={subject.absent}
                              total={subject.total}
                              minRequired={75}
                              hideBunkableInfo={true}
                              suppressLowAttendanceStyling={true}
                            />
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                </div>
              </div>
            )}

            {!attendanceData?.semesters && !attendanceData?.subjects && overallAttendance && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No detailed attendance data available</p>
              </div>
            )}

            {!overallAttendance && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No attendance data available</p>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ── Search / history view ────────────────────────────────────────────────────

  const historyVisible = showHistory && query.trim() === "" && searchHistory.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">Search Students</h2>
        <SemesterSelector
          selectedSemester={selectedSemester}
          onSemesterChange={setSelectedSemester}
          semesters={availableSemesters}
        />
      </div>

      {/* Search input + history dropdown */}
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
        <Input
          ref={inputRef}
          placeholder="Search by name or roll number..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowHistory(true)}
          onBlur={() => setShowHistory(false)}
          className="pl-12 py-6 text-base rounded-xl bg-card border-border"
        />

        {/* History dropdown */}
        {historyVisible && (
          <div className="absolute top-full left-0 right-0 z-50 mt-3 bg-card border border-border rounded-xl overflow-hidden shadow-xl">
            {/* Header row */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
              <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
                Recent
              </span>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={clearAllHistory}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear all
              </button>
            </div>

            {/* History items — profile cards */}
            {searchHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 border-b border-border/40 last:border-0 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 shrink-0 overflow-hidden">
                  <img
                    src={item.viewedStudentPictureUrl || "/user-icons/user2.png"}
                    alt={item.viewedStudentName}
                    className="w-9 h-9 rounded-full object-cover"
                    onError={(e) => { e.currentTarget.src = "/user-icons/user2.png"; }}
                  />
                </div>

                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setShowHistory(false);
                    setSearchParams((prev) => {
                      const newParams = new URLSearchParams(prev);
                      newParams.set("studentId", item.viewedStudentId);
                      return newParams;
                    });
                  }}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-sm font-medium truncate">{item.viewedStudentName}</p>
                  <p className="text-xs text-muted-foreground">{item.viewedStudentRollNumber}</p>
                </button>

                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteHistoryItem(item.id);
                  }}
                  className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors shrink-0"
                  aria-label="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {query.length === 0 && !historyVisible && (
        <div className="text-center py-16 text-muted-foreground">
          <SearchIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Search for any student</p>
          {selectedSemester && (
            <p className="text-xs mt-1">Filtering by {selectedSemester.label}</p>
          )}
        </div>
      )}

      {/* Searching indicator */}
      {isSearching && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Searching...</p>
        </div>
      )}

      {/* No results */}
      {!isSearching && query.length >= 2 && students.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No students found</p>
        </div>
      )}

      {/* Results */}
      {!isSearching && students.length > 0 && (
        <div className="space-y-2">
          {students.map((student) => (
            <button
              key={student.id}
              onClick={() => {
                saveToHistory(student);
                setSearchParams((prev) => {
                  const newParams = new URLSearchParams(prev);
                  newParams.set("studentId", student.id);
                  return newParams;
                });
              }}
              className="bg-card rounded-xl p-4 border border-border flex items-center gap-3 text-left w-full active:scale-98 transition-transform"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src={student.pictureUrl || "/user-icons/user2.png"}
                  alt={student.name}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/user-icons/user2.png";
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{student.name}</p>
                <p className="text-xs text-muted-foreground">{student.rollNumber}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
