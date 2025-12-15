import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { defaultTimetable as initialDefaultTimetable } from "@/data/mockData";
import { Subject, TimetableSlot } from "@/types/attendance";
import { API_CONFIG } from "@/lib/api";
import { useAuth } from "./AuthContext";
import { hexToHsl } from "@/lib/utils";

const DEFAULT_MIN = 75;

interface SubjectStats {
  subjectId: string;
  present: number;
  absent: number;
  total: number;
}

interface AttendanceContextType {
  subjectStats: Record<string, SubjectStats>;
  subjectMinAttendance: Record<string, number>;
  todayAttendance: Record<string, 'present' | 'absent' | null>;
  enrolledSubjects: Subject[];
  timetable: TimetableSlot[];
  hasCompletedOnboarding: boolean;
  isLoadingEnrolledSubjects: boolean;
  markAttendance: (subjectId: string, slotKey: string, status: 'present' | 'absent') => void;
  setSubjectMin: (subjectId: string, value: number) => void;
  getSubjectStats: (subjectId: string) => SubjectStats;
  setEnrolledSubjects: (subjects: Subject[]) => void;
  setTimetable: (timetable: TimetableSlot[]) => void;
  completeOnboarding: () => void;
  refreshEnrolledSubjects: () => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const { student } = useAuth();
  
  // Enrolled subjects
  const [enrolledSubjects, setEnrolledSubjectsState] = useState<Subject[]>([]);
  const [isLoadingEnrolledSubjects, setIsLoadingEnrolledSubjects] = useState(true);

  // Fetch enrolled subjects from backend - no localStorage fallback
  const fetchEnrolledSubjects = useCallback(async () => {
    if (!student) {
      setIsLoadingEnrolledSubjects(false);
      return;
    }

    try {
      setIsLoadingEnrolledSubjects(true);
      const response = await fetch(API_CONFIG.ENDPOINTS.ENROLLED_SUBJECTS, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Convert backend response to Subject format
        const subjects: Subject[] = data.subjects.map((s: any) => ({
          id: s.subjectId,
          code: s.subjectCode,
          name: s.subjectName,
          color: hexToHsl(s.color || "#3B82F6"),
          minimumCriteria: s.minimumCriteria ?? null,
        }));
        setEnrolledSubjectsState(subjects);
      } else {
        // No fallback - just set empty array if backend fails
        setEnrolledSubjectsState([]);
      }
    } catch (error) {
      console.error('Error fetching enrolled subjects:', error);
      // No fallback - just set empty array on error
      setEnrolledSubjectsState([]);
    } finally {
      setIsLoadingEnrolledSubjects(false);
    }
  }, [student]);

  useEffect(() => {
    fetchEnrolledSubjects();
  }, [fetchEnrolledSubjects]);

  // Expose refresh function for manual refresh
  const refreshEnrolledSubjects = useCallback(async () => {
    await fetchEnrolledSubjects();
  }, [fetchEnrolledSubjects]);

  // Timetable - no localStorage, use default initially
  const [timetable, setTimetableState] = useState<TimetableSlot[]>(initialDefaultTimetable);

  // Initialize subject stats - no localStorage, start with empty
  // Stats should come from backend attendance API in the future
  const [subjectStats, setSubjectStats] = useState<Record<string, SubjectStats>>({});

  // Subject min attendance - no localStorage, use defaults
  const [subjectMinAttendance, setSubjectMinAttendance] = useState<Record<string, number>>({});

  // Today's attendance - no localStorage, in-memory only
  const [todayAttendance, setTodayAttendance] = useState<Record<string, 'present' | 'absent' | null>>({});

  // Onboarding completion is based solely on backend data
  // If enrolledSubjects.length === 0, show onboarding
  // If enrolledSubjects.length > 0, onboarding is complete
  const hasCompletedOnboarding = enrolledSubjects.length > 0;

  const completeOnboarding = useCallback(() => {
    // Onboarding is considered complete when user has enrolled subjects
    // No localStorage needed - the enrolledSubjects state is the source of truth
  }, []);

  const setEnrolledSubjects = useCallback((subjects: Subject[]) => {
    // This is only used for temporary state during onboarding
    // The actual enrolled subjects come from backend via fetchEnrolledSubjects
    setEnrolledSubjectsState(subjects);
    
    // Initialize stats for new subjects (no localStorage)
    setSubjectStats(prev => {
      const updated = { ...prev };
      subjects.forEach(s => {
        if (!updated[s.id]) {
          updated[s.id] = { subjectId: s.id, present: 0, absent: 0, total: 0 };
        }
      });
      return updated;
    });
  }, []);

  const setTimetable = useCallback((newTimetable: TimetableSlot[]) => {
    // No localStorage - timetable is managed in memory only
    setTimetableState(newTimetable);
  }, []);

  const markAttendance = useCallback((subjectId: string, slotKey: string, status: 'present' | 'absent') => {
    const previousStatus = todayAttendance[slotKey];
    
    // Toggle off if same status
    if (previousStatus === status) {
      setTodayAttendance(prev => {
        return { ...prev, [slotKey]: null };
      });
      
      // Revert stats (no localStorage)
      setSubjectStats(prev => {
        const current = prev[subjectId];
        if (!current) return prev;
        
        return {
          ...prev,
          [subjectId]: {
            ...current,
            present: current.present - (status === 'present' ? 1 : 0),
            absent: current.absent - (status === 'absent' ? 1 : 0),
            total: current.total - 1,
          }
        };
      });
      
      return;
    }

    // Update today's attendance (no localStorage)
    setTodayAttendance(prev => {
      return { ...prev, [slotKey]: status };
    });

    // Update subject stats (no localStorage)
    setSubjectStats(prev => {
      const current = prev[subjectId];
      if (!current) return prev;

      let newPresent = current.present;
      let newAbsent = current.absent;
      let newTotal = current.total;

      // If changing from one status to another
      if (previousStatus === 'present') newPresent--;
      if (previousStatus === 'absent') newAbsent--;
      if (previousStatus) newTotal--;

      // Add new status
      if (status === 'present') newPresent++;
      if (status === 'absent') newAbsent++;
      newTotal++;

      return {
        ...prev,
        [subjectId]: {
          ...current,
          present: newPresent,
          absent: newAbsent,
          total: newTotal,
        }
      };
    });
  }, [todayAttendance]);

  const setSubjectMin = useCallback((subjectId: string, value: number) => {
    setSubjectMinAttendance(prev => {
      return { ...prev, [subjectId]: value };
    });
  }, []);

  const getSubjectStats = useCallback((subjectId: string): SubjectStats => {
    return subjectStats[subjectId] || { subjectId, present: 0, absent: 0, total: 0 };
  }, [subjectStats]);

  return (
    <AttendanceContext.Provider
      value={{
        subjectStats,
        subjectMinAttendance,
        todayAttendance,
        enrolledSubjects,
        timetable,
        hasCompletedOnboarding,
        isLoadingEnrolledSubjects,
        markAttendance,
        setSubjectMin,
        getSubjectStats,
        setEnrolledSubjects,
        setTimetable,
        completeOnboarding,
        refreshEnrolledSubjects,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error("useAttendance must be used within an AttendanceProvider");
  }
  return context;
}
