import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, User, ChevronLeft, ChevronDown } from "lucide-react";
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


export default function Search() {
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

  // Handle browser/Capacitor back button
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      // Browser: URL params handle navigation automatically
      return;
    }

    // Capacitor: Handle hardware back button
    let listenerHandle: { remove: () => Promise<void> } | undefined;

    (async () => {
      const { App } = await import("@capacitor/app");
      
      listenerHandle = await App.addListener("backButton", ({ canGoBack }) => {
        if (studentIdParam) {
          // If viewing a profile, go back to search results
          setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev);
            newParams.delete("studentId");
            return newParams;
          });
        } else if (canGoBack) {
          // Otherwise, let the default behavior handle it
          window.history.back();
        }
      });
    })();

    return () => {
      listenerHandle?.remove();
    };
  }, [studentIdParam, setSearchParams]);

  // Sync selectedStudent with URL parameter
  useEffect(() => {
    if (studentIdParam) {
      // Find the student from the current students list
      const student = students.find(s => s.id === studentIdParam);
      if (student) {
        setSelectedStudent(student);
      } else if (students.length > 0) {
        // Student ID in URL but not in current search results - clear it
        // This can happen if user navigated via browser history
        setSearchParams((prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.delete("studentId");
          return newParams;
        });
      }
      // If students.length === 0, we might still be loading or haven't searched yet
      // Don't clear the param in that case - wait for search to complete or fetch attendance
    } else {
      setSelectedStudent(null);
    }
  }, [studentIdParam, students, setSearchParams]);

  // Fetch student info from attendance when studentIdParam exists but student not found in search results
  useEffect(() => {
    const fetchStudentFromAttendance = async () => {
      if (!studentIdParam || selectedStudent || students.length > 0) {
        return; // Don't fetch if student is already selected or if we have search results
      }

      setIsLoadingAttendance(true);
      try {
        const url = API_CONFIG.ENDPOINTS.STUDENT_ATTENDANCE(studentIdParam);
        const response = await fetch(url, { credentials: 'include' });
        
        if (response.ok) {
          const data: StudentAttendanceData = await response.json();
          
          // Create student object from attendance data
          const student: Student = {
            id: data.studentId,
            name: data.studentName,
            rollNumber: data.rollNumber,
            pictureUrl: data.studentPictureUrl,
          };
          
          setSelectedStudent(student);

          // Convert hex colors to HSL format for subjects
          if (data.subjects) {
            data.subjects = data.subjects.map(subj => ({
              ...subj,
              color: hexToHslLightened(subj.color || "#3B82F6")
            }));
          }
          
          if (data.semesters) {
            data.semesters = data.semesters.map(sem => ({
              ...sem,
              subjects: sem.subjects.map(subj => ({
                ...subj,
                color: hexToHslLightened(subj.color || "#3B82F6")
              }))
            }));
          }
          
          setAttendanceData(data);
        } else if (response.status === 404) {
          // Student not found, clear the param
          setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev);
            newParams.delete("studentId");
            return newParams;
          });
          toast.error('Student not found');
        } else {
          console.error('Failed to fetch attendance');
          toast.error('Failed to load student data');
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
        toast.error('Error loading student data');
      } finally {
        setIsLoadingAttendance(false);
      }
    };

    fetchStudentFromAttendance();
  }, [studentIdParam, selectedStudent, students.length, setSearchParams]);

  // Fetch current semester on mount
  useEffect(() => {
    const fetchCurrentSemester = async () => {
      try {
        const response = await fetch(API_CONFIG.ENDPOINTS.SEMESTER_CURRENT, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentSemester(data);
        }
      } catch (error) {
        console.error('Error fetching current semester:', error);
      }
    };
    fetchCurrentSemester();
    
    // Track search page view (only when not viewing a specific profile)
    if (!studentIdParam) {
      trackAppEvent('search_view', {
        timestamp: new Date().toISOString(),
      }).catch(console.error);
    }
  }, [studentIdParam]);

  // Search students when query changes
  useEffect(() => {
    const searchStudents = async () => {
      if (query.trim().length === 0) {
        setStudents([]);
        return;
      }

      if (query.trim().length < 2) {
        return; // Don't search for very short queries
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `${API_CONFIG.ENDPOINTS.SEARCH_STUDENTS}?query=${encodeURIComponent(query)}`,
          { credentials: 'include' }
        );
        
        if (response.ok) {
          const data = await response.json();
          setStudents(data);
          
          // Track search event
          trackAppEvent('search_performed', {
            query: query.trim(),
            resultsCount: data.length,
            timestamp: new Date().toISOString(),
          }).catch(console.error);
        } else {
          console.error('Failed to search students');
          toast.error('Failed to search students');
        }
      } catch (error) {
        console.error('Error searching students:', error);
        toast.error('Error searching students');
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchStudents, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [query]);

  // Fetch attendance when student is selected
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedStudent) {
        setAttendanceData(null);
        return;
      }

      // Track profile open event when a student is selected
      trackAppEvent('profile_open', {
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        timestamp: new Date().toISOString(),
      }).catch(console.error);

      // Skip if we already have attendance data for this student
      if (attendanceData && attendanceData.studentId === selectedStudent.id) {
        return;
      }

      setIsLoadingAttendance(true);
      try {
        const url = API_CONFIG.ENDPOINTS.STUDENT_ATTENDANCE(selectedStudent.id);
        const response = await fetch(url, { credentials: 'include' });
        
        if (response.ok) {
          const data: StudentAttendanceData = await response.json();

          // Convert hex colors to HSL format for subjects
          if (data.subjects) {
            data.subjects = data.subjects.map(subj => ({
              ...subj,
              color: hexToHslLightened(subj.color || "#3B82F6")
            }));
          }
          
          if (data.semesters) {
            data.semesters = data.semesters.map(sem => ({
              ...sem,
              subjects: sem.subjects.map(subj => ({
                ...subj,
                color: hexToHslLightened(subj.color || "#3B82F6")
              }))
            }));
          }
          
          setAttendanceData(data);
        } else {
          console.error('Failed to fetch attendance');
          toast.error('Failed to load attendance data');
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
        toast.error('Error loading attendance data');
      } finally {
        setIsLoadingAttendance(false);
      }
    };

    fetchAttendance();
  }, [selectedStudent, selectedSemester]);

  // Filter semesters based on selected semester
  const filteredSemesters = useMemo(() => {
    if (!attendanceData?.semesters || !selectedSemester) {
      return attendanceData?.semesters || [];
    }
    return attendanceData.semesters.filter(sem => 
      sem.semester.year === selectedSemester.year &&
      sem.semester.type.toLowerCase() === selectedSemester.term.toLowerCase()
    );
  }, [attendanceData, selectedSemester]);

  // Find current semester data
  const currentSemesterData = useMemo(() => {
    if (!attendanceData?.semesters || !currentSemester) return null;
    return attendanceData.semesters.find(sem => 
      sem.semester.year === currentSemester.year &&
      sem.semester.type.toLowerCase() === currentSemester.type.toLowerCase()
    );
  }, [attendanceData, currentSemester]);

  // Calculate overall attendance for current semester only
  const overallAttendance = useMemo(() => {
    if (!currentSemesterData) return null;

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalClasses = 0;

    // Sum up attendance from current semester only
    currentSemesterData.subjects.forEach(subject => {
      totalPresent += subject.present;
      totalAbsent += subject.absent;
      totalClasses += subject.total;
    });

    const percentage = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0;

    return {
      present: totalPresent,
      absent: totalAbsent,
      total: totalClasses,
      percentage: percentage,
    };
  }, [currentSemesterData]);

  if (selectedStudent) {
    return (
      <AppLayout>
        <div className="space-y-4">
          {/* Back button */}
          <button
            onClick={() => {
              // Remove studentId from URL to go back to search results
              // This works with browser history - when URL changes, browser history is updated
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
              {/* Student Profile Card with Overall Attendance */}
              {overallAttendance && (
                <div className="bg-card rounded-lg p-3 md:p-4 border border-border space-y-3">
                  {/* Student Info */}
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

                  {/* Overall Attendance */}
                  <div className="space-y-2">
                    {/* Percentage Display */}
                    <div className="text-center">
                      <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">Overall Attendance</p>
                      <p className={cn(
                        "text-3xl md:text-4xl font-bold",
                        overallAttendance.percentage >= 75 ? "text-success" :
                        overallAttendance.percentage >= 60 ? "text-warning" : "text-destructive"
                      )}>
                        {overallAttendance.percentage.toFixed(1)}%
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="relative h-2 md:h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            overallAttendance.percentage >= 75 ? "bg-success" :
                            overallAttendance.percentage >= 60 ? "bg-warning" : "bg-destructive"
                          )}
                          style={{ width: `${Math.min(overallAttendance.percentage, 100)}%` }}
                        />
                        {/* 75% threshold marker */}
                        <div
                          className="absolute top-0 w-0.5 h-full bg-foreground/30"
                          style={{ left: "75%" }}
                        />
                      </div>
                    </div>

                    {/* Stats Grid */}
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

              {/* Current Semester - Only if no filter applied */}
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
                          defaultExpanded={true}
                          hideBunkableInfo={true}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Filtered Semester Data */}
              {selectedSemester && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">
                    {selectedSemester.label} Attendance
                  </h3>
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
                            />
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Previous Semesters - Collapsed view without filter */}
              {!selectedSemester && attendanceData?.semesters && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Previous Semesters</h3>
                  <div className="space-y-2">
                    {attendanceData.semesters
                      .filter(sem => 
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
                                {sem.subjects.length} subject{sem.subjects.length !== 1 ? 's' : ''}
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
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Semester Filter at Top */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Search Students</h2>
          <SemesterSelector
            selectedSemester={selectedSemester}
            onSemesterChange={setSelectedSemester}
            semesters={availableSemesters}
          />
        </div>

        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name or roll number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 py-6 text-base rounded-xl bg-card border-border"
          />
        </div>

        {/* Results */}
        {query.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <SearchIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Search for any student</p>
            {selectedSemester && (
              <p className="text-xs mt-1">Filtering by {selectedSemester.label}</p>
            )}
          </div>
        )}

        {isSearching && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Searching...</p>
          </div>
        )}

        {!isSearching && query.length >= 2 && students.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">No students found</p>
          </div>
        )}

        {!isSearching && students.length > 0 && (
          <div className="space-y-2">
            {students.map((student) => (
              <button
                key={student.id}
                onClick={() => {
                  // Update URL with studentId to maintain browser history
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
    </AppLayout>
  );
}
