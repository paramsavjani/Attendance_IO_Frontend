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
  todayAttendance: Record<string, 'present' | 'absent' | 'cancelled' | null>;
  enrolledSubjects: Subject[];
  timetable: TimetableSlot[];
  hasCompletedOnboarding: boolean;
  isLoadingEnrolledSubjects: boolean;
  isLoadingTimetable: boolean;
  isLoadingAttendance: boolean;
  savingSubjectId: string | null; // Currently saving attendance for this subject
  markAttendance: (subjectId: string, date: string, status: 'present' | 'absent' | 'cancelled') => Promise<void>;
  setSubjectMin: (subjectId: string, value: number) => void;
  getSubjectStats: (subjectId: string) => SubjectStats;
  setEnrolledSubjects: (subjects: Subject[]) => void;
  setTimetable: (timetable: TimetableSlot[]) => void;
  completeOnboarding: () => void;
  refreshEnrolledSubjects: () => Promise<void>;
  refreshTimetable: () => Promise<void>;
  fetchAttendanceForDate: (date?: string) => Promise<void>;
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

  // Initialize subject stats - fetch from backend
  const [subjectStats, setSubjectStats] = useState<Record<string, SubjectStats>>({});

  // Subject min attendance - no localStorage, use defaults
  const [subjectMinAttendance, setSubjectMinAttendance] = useState<Record<string, number>>({});

  // Today's attendance - fetch from backend
  const [todayAttendance, setTodayAttendance] = useState<Record<string, 'present' | 'absent' | 'cancelled' | null>>({});
  
  // Loading states
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);
  const [savingSubjectId, setSavingSubjectId] = useState<string | null>(null);

  // Fetch attendance data from backend for a specific date (defaults to today)
  // silent = true skips showing loading state (used for background refresh after marking)
  const fetchAttendanceData = useCallback(async (date?: string, silent: boolean = false) => {
    if (!student) {
      setSubjectStats({});
      setTodayAttendance({});
      setIsLoadingAttendance(false);
      return;
    }

    if (!silent) {
      setIsLoadingAttendance(true);
    }

    try {
      const url = date 
        ? `${API_CONFIG.ENDPOINTS.GET_MY_ATTENDANCE}?date=${date}`
        : API_CONFIG.ENDPOINTS.GET_MY_ATTENDANCE;
      
      const response = await fetch(url, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        
        // Convert subject stats to the format expected by the frontend
        const statsMap: Record<string, SubjectStats> = {};
        data.subjectStats?.forEach((stat: any) => {
          statsMap[stat.subjectId] = {
            subjectId: stat.subjectId,
            present: stat.present,
            absent: stat.absent,
            total: stat.total,
          };
        });
        setSubjectStats(statsMap);
        
        // Convert attendance records to the format expected by the frontend
        const attendanceMap: Record<string, 'present' | 'absent' | 'cancelled' | null> = {};
        data.todayAttendance?.forEach((record: any) => {
          const slotKey = `${record.lectureDate}-${record.subjectId}`;
          attendanceMap[slotKey] = record.status as 'present' | 'absent' | 'cancelled';
        });
        setTodayAttendance(attendanceMap);
      } else {
        setSubjectStats({});
        setTodayAttendance({});
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setSubjectStats({});
      setTodayAttendance({});
    } finally {
      if (!silent) {
        setIsLoadingAttendance(false);
      }
    }
  }, [student]);

  // Fetch attendance data when student is available (defaults to today)
  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

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

  const markAttendance = useCallback(async (subjectId: string, date: string, status: 'present' | 'absent' | 'cancelled') => {
    const slotKey = `${date}-${subjectId}`;
    const previousStatus = todayAttendance[slotKey];
    
    setSavingSubjectId(subjectId);
    
    // Toggle off if same status - delete from backend
    if (previousStatus === status) {
      // Mark as null (cleared) and refresh from backend
      setTodayAttendance(prev => {
        const updated = { ...prev };
        delete updated[slotKey];
        return updated;
      });
      
      // Refresh from backend to get updated stats for this date (silent - no loading UI)
      await fetchAttendanceData(date, true);
      setSavingSubjectId(null);
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
      
      // Update local state immediately for better UX
      setTodayAttendance(prev => {
        return { ...prev, [slotKey]: status };
      });
      
      toast.success(`Marked ${status} successfully`);
      
      // Refresh attendance data from backend to get updated stats (silent - no loading UI)
      await fetchAttendanceData(date, true);
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      toast.error(error.message || 'Failed to mark attendance');
      // Don't update local state on error
    } finally {
      setSavingSubjectId(null);
    }
  }, [todayAttendance, fetchAttendanceData]);

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
        isLoadingTimetable,
        isLoadingAttendance,
        savingSubjectId,
        markAttendance,
        setSubjectMin,
        getSubjectStats,
        setEnrolledSubjects,
        setTimetable,
        completeOnboarding,
        refreshEnrolledSubjects,
        refreshTimetable,
        fetchAttendanceForDate: fetchAttendanceData,
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
