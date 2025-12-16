import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, User, ChevronLeft, ChevronDown } from "lucide-react";
import { SubjectCard } from "@/components/attendance/SubjectCard";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SemesterSelector, availableSemesters, Semester } from "@/components/filters/SemesterSelector";
import { API_CONFIG } from "@/lib/api";
import { toast } from "sonner";
import { hexToHsl } from "@/lib/utils";

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
  semester?: {
    id: string;
    year: number;
    type: string;
  };
  subjects?: SubjectAttendance[];
  semesters?: SemesterData[];
}


export default function Search() {
  const [query, setQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [attendanceData, setAttendanceData] = useState<StudentAttendanceData | null>(null);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [currentSemester, setCurrentSemester] = useState<{ year: number; type: string } | null>(null);

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
  }, []);

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
              color: hexToHsl(subj.color || "#3B82F6")
            }));
          }
          
          if (data.semesters) {
            data.semesters = data.semesters.map(sem => ({
              ...sem,
              subjects: sem.subjects.map(subj => ({
                ...subj,
                color: hexToHsl(subj.color || "#3B82F6")
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

  if (selectedStudent) {
    return (
      <AppLayout>
        <div className="space-y-4">
          {/* Back button */}
          <button
            onClick={() => {
              setSelectedStudent(null);
              setSelectedSemester(null);
            }}
            className="flex items-center gap-2 text-muted-foreground text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {/* Student Header */}
          <div className="pb-2 border-b border-border">
            <h1 className="text-lg font-bold">{selectedStudent.name}</h1>
            <p className="text-sm text-muted-foreground">{selectedStudent.rollNumber}</p>
            {selectedSemester && (
              <p className="text-xs text-primary mt-1">
                Showing data for {selectedSemester.label}
              </p>
            )}
          </div>

          {isLoadingAttendance ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Loading attendance data...</p>
            </div>
          ) : (
            <>
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
                        />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>
              )}

              {!attendanceData?.semesters && !attendanceData?.subjects && (
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
                onClick={() => setSelectedStudent(student)}
                className="bg-card rounded-xl p-4 border border-border flex items-center gap-3 text-left w-full active:scale-98 transition-transform"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  {student.pictureUrl ? (
                    <img 
                      src={student.pictureUrl} 
                      alt={student.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                  <User className="w-5 h-5 text-primary" />
                  )}
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
