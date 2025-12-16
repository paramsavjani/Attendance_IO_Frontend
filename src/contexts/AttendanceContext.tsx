import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { defaultTimetable as initialDefaultTimetable } from "@/data/mockData";
import { Subject, TimetableSlot } from "@/types/attendance";
import { API_CONFIG } from "@/lib/api";
import { useAuth } from "./AuthContext";
import { hexToHsl } from "@/lib/utils";
import { toast } from "sonner";

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
  isLoadingTimetable: boolean;
  markAttendance: (subjectId: string, date: string, status: 'present' | 'absent') => Promise<void>;
  setSubjectMin: (subjectId: string, value: number) => void;
  getSubjectStats: (subjectId: string) => SubjectStats;
  setEnrolledSubjects: (subjects: Subject[]) => void;
  setTimetable: (timetable: TimetableSlot[]) => void;
  completeOnboarding: () => void;
  refreshEnrolledSubjects: () => Promise<void>;
  refreshTimetable: () => Promise<void>;
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

  // Timetable - fetch from backend
  const [timetable, setTimetableState] = useState<TimetableSlot[]>([]);
  const [isLoadingTimetable, setIsLoadingTimetable] = useState(true);

  // Fetch timetable from backend
  const fetchTimetable = useCallback(async () => {
    if (!student) {
      setIsLoadingTimetable(false);
      return;
    }

    try {
      setIsLoadingTimetable(true);
      const response = await fetch(API_CONFIG.ENDPOINTS.TIMETABLE, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTimetableState(data.slots || []);
      } else {
        setTimetableState([]);
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
      setTimetableState([]);
    } finally {
      setIsLoadingTimetable(false);
    }
  }, [student]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

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
    // Update local state immediately
    setTimetableState(newTimetable);
    
    // Save to backend
    fetch(API_CONFIG.ENDPOINTS.TIMETABLE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        slots: newTimetable,
      }),
    }).catch(error => {
      console.error('Error saving timetable:', error);
    });
  }, []);

  const refreshTimetable = useCallback(async () => {
    await fetchTimetable();
  }, [fetchTimetable]);

  const markAttendance = useCallback(async (subjectId: string, date: string, status: 'present' | 'absent') => {
    const slotKey = `${date}-${subjectId}`;
    const previousStatus = todayAttendance[slotKey];
    
    // Toggle off if same status - delete from backend
    if (previousStatus === status) {
      // TODO: Need to track attendance IDs to delete - for now just update local state
      setTodayAttendance(prev => {
        const updated = { ...prev };
        delete updated[slotKey];
        return updated;
      });
      
      // Revert stats
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
      
      // TODO: Call delete endpoint when we have attendance ID tracking
      return;
    }

    try {
      // Call backend API to mark attendance
      const response = await fetch(API_CONFIG.ENDPOINTS.MARK_ATTENDANCE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subjectId,
          lectureDate: date,
          status,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to mark attendance' }));
        throw new Error(error.error || 'Failed to mark attendance');
      }

      const result = await response.json();
      
      // Update local state on success
      setTodayAttendance(prev => {
        return { ...prev, [slotKey]: status };
      });

      // Update subject stats
      setSubjectStats(prev => {
        const current = prev[subjectId] || { subjectId, present: 0, absent: 0, total: 0 };

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
      
      toast.success(`Marked ${status} successfully`);
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      toast.error(error.message || 'Failed to mark attendance');
      // Don't update local state on error
    }
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
      refreshTimetable,
      isLoadingTimetable,
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
