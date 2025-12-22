import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from "react";
import { defaultTimetable as initialDefaultTimetable } from "@/data/mockData";
import { Subject, TimetableSlot } from "@/types/attendance";
import { API_CONFIG } from "@/lib/api";
import { useAuth } from "./AuthContext";
import { hexToHslLightened } from "@/lib/utils";
import { toast } from "sonner";
import { isAfter, parseISO, startOfDay } from "date-fns";

const DEFAULT_MIN = 75;

interface SubjectStats {
  subjectId: string;
  present: number;
  absent: number;
  total: number;
}

interface AttendanceContextType {
  subjectStats: Record<string, SubjectStats>;
  subjectStatsToday: Record<string, SubjectStats>; // Always shows today's total attendance
  subjectMinAttendance: Record<string, number>;
  todayAttendance: Record<string, 'present' | 'absent' | 'cancelled' | null>;
  enrolledSubjects: Subject[];
  timetable: TimetableSlot[];
  hasCompletedOnboarding: boolean;
  hasSeenIntro: boolean;
  isLoadingEnrolledSubjects: boolean;
  isLoadingTimetable: boolean;
  isLoadingAttendance: boolean;
  savingState: { subjectId: string; action: 'present' | 'absent' | 'cancelled' } | null; // Currently saving attendance
  markAttendance: (subjectId: string, date: string, status: 'present' | 'absent' | 'cancelled') => Promise<void>;
  setSubjectMin: (subjectId: string, value: number) => void;
  getSubjectStats: (subjectId: string) => SubjectStats;
  setEnrolledSubjects: (subjects: Subject[]) => void;
  setTimetable: (timetable: TimetableSlot[]) => void;
  completeOnboarding: () => void;
  markIntroAsSeen: () => void;
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
          lecturePlace: s.lecturePlace ?? null,
          color: hexToHslLightened(s.color || "#3B82F6"),
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

  // Initialize subject stats - fetch from backend (for selected date)
  const [subjectStats, setSubjectStats] = useState<Record<string, SubjectStats>>({});

  // Today's subject stats - always shows today's total attendance (for Subjects tab)
  const [subjectStatsToday, setSubjectStatsToday] = useState<Record<string, SubjectStats>>({});

  // Subject min attendance - no localStorage, use defaults
  const [subjectMinAttendance, setSubjectMinAttendance] = useState<Record<string, number>>({});

  // Today's attendance - fetch from backend
  const [todayAttendance, setTodayAttendance] = useState<Record<string, 'present' | 'absent' | 'cancelled' | null>>({});
  // Store attendance IDs for deletion
  const [attendanceIds, setAttendanceIds] = useState<Record<string, number | null>>({});

  // Loading states
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);
  const [savingState, setSavingState] = useState<{ subjectId: string; action: 'present' | 'absent' | 'cancelled' } | null>(null);

  // Track if we've successfully loaded data to prevent clearing on race conditions
  const hasLoadedDataRef = useRef(false);
  const lastStudentIdRef = useRef<string | null>(null);
  // Track ongoing attendance operations to prevent duplicate calls
  const ongoingOperationsRef = useRef<Set<string>>(new Set());

  // Fetch attendance data from backend for a specific date (defaults to today)
  // silent = true skips showing loading state (used for background refresh after marking)
  const fetchAttendanceData = useCallback(async (date?: string, silent: boolean = false) => {
    if (!student) {
      // Only clear data if we had a different student before (actual logout)
      // Don't clear if student is just temporarily null during auth check
      if (lastStudentIdRef.current !== null) {
        // User was logged in before, now logged out - clear data
        setSubjectStats({});
        setSubjectStatsToday({});
        setTodayAttendance({});
        setAttendanceIds({});
        hasLoadedDataRef.current = false;
        lastStudentIdRef.current = null;
      }
      if (!silent) {
        setIsLoadingAttendance(false);
      }
      return;
    }

    // Track student ID to detect actual logout vs temporary null
    const currentStudentId = student.id;
    const isDifferentStudent = lastStudentIdRef.current !== null && lastStudentIdRef.current !== currentStudentId;

    if (isDifferentStudent) {
      // Different student logged in - clear previous data
      setSubjectStats({});
      setSubjectStatsToday({});
      setTodayAttendance({});
      setAttendanceIds({});
      hasLoadedDataRef.current = false;
    }

    lastStudentIdRef.current = currentStudentId;

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
        const idsMap: Record<string, number | null> = {};
        data.todayAttendance?.forEach((record: any) => {
          const slotKey = `${record.lectureDate}-${record.subjectId}`;
          attendanceMap[slotKey] = record.status as 'present' | 'absent' | 'cancelled';
          idsMap[slotKey] = record.attendanceId || null;
        });
        setTodayAttendance(attendanceMap);
        setAttendanceIds(idsMap);
        hasLoadedDataRef.current = true;
      } else {
        // Only clear on error if we haven't loaded data yet, or if it's a 401 (unauthorized)
        if (!hasLoadedDataRef.current || response.status === 401) {
          setSubjectStats({});
          setSubjectStatsToday({});
          setTodayAttendance({});
          setAttendanceIds({});
          hasLoadedDataRef.current = false;
        }
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      // Only clear on error if we haven't successfully loaded data before
      // This prevents clearing data during network hiccups
      if (!hasLoadedDataRef.current) {
        setSubjectStats({});
        setSubjectStatsToday({});
        setTodayAttendance({});
        setAttendanceIds({});
      }
    } finally {
      if (!silent) {
        setIsLoadingAttendance(false);
      }
    }
  }, [student]);

  // Fetch today's subject stats separately (for Subjects tab)
  const fetchTodayStats = useCallback(async () => {
    if (!student) return;

    try {
      const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
      const response = await fetch(`${API_CONFIG.ENDPOINTS.GET_MY_ATTENDANCE}?date=${today}`, {
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
        setSubjectStatsToday(statsMap);
      }
    } catch (error) {
      console.error('Error fetching today\'s stats:', error);
    }
  }, [student]);

  // Fetch attendance data when student is available (defaults to today)
  // Only fetch when student ID actually changes, not when object reference changes
  useEffect(() => {
    const currentStudentId = student?.id;
    // Only fetch if we have a student and it's different from last time
    if (currentStudentId && lastStudentIdRef.current !== currentStudentId) {
      fetchAttendanceData();
      fetchTodayStats(); // Also fetch today's stats
    }
  }, [student?.id, fetchAttendanceData, fetchTodayStats]);

  // Fetch today's stats on mount and when attendance is marked
  useEffect(() => {
    if (student) {
      fetchTodayStats();
    }
  }, [student, fetchTodayStats]);

  // Onboarding completion is based solely on backend data
  // If enrolledSubjects.length === 0, show onboarding
  // If enrolledSubjects.length > 0, onboarding is complete
  const hasCompletedOnboarding = enrolledSubjects.length > 0;

  // Track if user has seen intro (localStorage)
  const [hasSeenIntro, setHasSeenIntro] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hasSeenIntro') === 'true';
    }
    return false;
  });

  const markIntroAsSeen = useCallback(() => {
    setHasSeenIntro(true);
    localStorage.setItem('hasSeenIntro', 'true');
  }, []);

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

  // Helper to calculate new stats logic (reused for both Today and All-Time stats)
  // NOTE: Total class count is NOT modified during live updates - only present/absent counts change
  // The total comes from the backend and should remain constant during optimistic updates
  const calculateNewStats = (
    currentStats: SubjectStats,
    previousStatus: 'present' | 'absent' | 'cancelled' | null,
    newStatus: 'present' | 'absent' | 'cancelled' | null
  ) => {
    let newPresent = currentStats.present;
    let newAbsent = currentStats.absent;
    // Keep total unchanged - it comes from backend and should not be modified locally
    const newTotal = currentStats.total;

    // Handle deletion (unmarking)
    if (newStatus === null) {
      if (previousStatus === 'present') {
        newPresent = Math.max(0, newPresent - 1);
      } else if (previousStatus === 'absent') {
        newAbsent = Math.max(0, newAbsent - 1);
      }
      // Total remains unchanged - backend will handle total updates
    } else {
      // Handle marking new attendance or changing status
      if (previousStatus === null) {
        // New attendance mark
        if (newStatus === 'present') {
          newPresent += 1;
        } else if (newStatus === 'absent') {
          newAbsent += 1;
        }
        // Total remains unchanged - backend will handle total updates
      } else if (previousStatus === newStatus) {
        // Clicking the same status again - should not change stats
        // This is a no-op, stats remain the same
        // (The toggle logic in markAttendance handles deletion separately)
      } else if (previousStatus !== newStatus) {
        // Changing from one status to another
        if (previousStatus === 'present') {
          newPresent = Math.max(0, newPresent - 1);
        } else if (previousStatus === 'absent') {
          newAbsent = Math.max(0, newAbsent - 1);
        }
        // Total remains unchanged regardless of status changes

        if (newStatus === 'present') {
          newPresent += 1;
        } else if (newStatus === 'absent') {
          newAbsent += 1;
        }
        // Total remains unchanged - cancelled or not, total stays the same
      }
    }

    return {
      ...currentStats,
      present: newPresent,
      absent: newAbsent,
      total: newTotal // Total remains constant during live updates
    };
  };

  const updateStatsLocally = useCallback((
    subjectId: string,
    previousStatus: 'present' | 'absent' | 'cancelled' | null,
    newStatus: 'present' | 'absent' | 'cancelled' | null
  ) => {
    // Update Today's Stats
    setSubjectStatsToday(prev => {
      const currentStats = prev[subjectId] || { subjectId, present: 0, absent: 0, total: 0 };
      return {
        ...prev,
        [subjectId]: calculateNewStats(currentStats, previousStatus, newStatus)
      };
    });

    // Update All-Time Stats (SubjectStats)
    setSubjectStats(prev => {
      const currentStats = prev[subjectId] || { subjectId, present: 0, absent: 0, total: 0 };
      return {
        ...prev,
        [subjectId]: calculateNewStats(currentStats, previousStatus, newStatus)
      };
    });
  }, []);

  const markAttendance = useCallback(async (subjectId: string, date: string, status: 'present' | 'absent' | 'cancelled') => {
    // Frontend guard: only allow "cancelled" for future dates, block "present" and "absent"
    try {
      const lectureDay = startOfDay(parseISO(date));
      const today = startOfDay(new Date());
      if (isAfter(lectureDay, today)) {
        // Allow cancelled for future dates
        if (status !== 'cancelled') {
          toast.error("You can only mark lectures as 'cancelled' for future dates");
          return;
        }
        // If status is cancelled, continue to mark it
      }
    } catch {
      // If parsing fails, allow request; backend should validate
    }

    const slotKey = `${date}-${subjectId}`;
    const operationKey = `${slotKey}-${status}`;
    
    // Prevent duplicate simultaneous operations for the same slot and status
    if (ongoingOperationsRef.current.has(operationKey)) {
      return;
    }
    
    ongoingOperationsRef.current.add(operationKey);
    
    // Read current state from closure (should be up to date due to dependency array)
    const previousStatus = todayAttendance[slotKey] || null;
    const attendanceId = attendanceIds[slotKey] || null;

    setSavingState({ subjectId, action: status });

    // Toggle off if same status - delete from backend
    if (previousStatus === status) {
      // Delete from backend if we have the attendance ID
      if (attendanceId) {
        try {
          const deleteResponse = await fetch(API_CONFIG.ENDPOINTS.DELETE_ATTENDANCE(attendanceId.toString()), {
            method: 'DELETE',
            credentials: 'include',
          });

          if (!deleteResponse.ok) {
            throw new Error('Failed to delete attendance');
          }

        } catch (error: any) {
          console.error('Error deleting attendance:', error);
          toast.error('Failed to unmark attendance');
          setSavingState(null);
          return;
        }
      } else {
        // If no attendance ID, just clear local state (shouldn't happen, but handle gracefully)
        toast.info('Attendance cleared');
      }

      // Update local stats immediately (Optimistic)
      updateStatsLocally(subjectId, previousStatus, null);

      // Mark as null (cleared) and refresh from backend
      setTodayAttendance(prev => {
        const updated = { ...prev };
        delete updated[slotKey];
        return updated;
      });

      setAttendanceIds(prev => {
        const updated = { ...prev };
        delete updated[slotKey];
        return updated;
      });

      // Refresh from backend to get updated stats for this date (silent - no loading UI)
      await fetchAttendanceData(date, true);
      setSavingState(null);
      ongoingOperationsRef.current.delete(operationKey);
      return;
    }

    try {
      // Update local state optimistically BEFORE API call to prevent race conditions
      // This ensures subsequent clicks see the updated status immediately
      setTodayAttendance(prev => {
        return { ...prev, [slotKey]: status };
      });
      
      // Update local stats immediately (Optimistic Update BEFORE API call for responsiveness)
      updateStatsLocally(subjectId, previousStatus, status);

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
        // Revert optimistic updates on failure
        setTodayAttendance(prev => {
          const updated = { ...prev };
          if (previousStatus === null) {
            delete updated[slotKey];
          } else {
            updated[slotKey] = previousStatus;
          }
          return updated;
        });
        updateStatsLocally(subjectId, status, previousStatus);
        const error = await response.json().catch(() => ({ error: 'Failed to mark attendance' }));
        throw new Error(error.error || 'Failed to mark attendance');
      }

      const result = await response.json();

      // Store attendance ID for future deletion
      if (result.attendanceId) {
        setAttendanceIds(prev => {
          return { ...prev, [slotKey]: result.attendanceId };
        });
      }

      // Refresh attendance data from backend to get updated stats for this date (silent - no loading UI)
      await fetchAttendanceData(date, true);
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      toast.error(error.message || 'Failed to mark attendance');
      // Don't update local state on error (already reverted above)
    } finally {
      setSavingState(null);
      ongoingOperationsRef.current.delete(operationKey);
    }
  }, [todayAttendance, attendanceIds, fetchAttendanceData, updateStatsLocally]);

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
        subjectStatsToday,
        subjectMinAttendance,
        todayAttendance,
        enrolledSubjects,
        timetable,
        hasCompletedOnboarding,
        hasSeenIntro,
        isLoadingEnrolledSubjects,
        isLoadingTimetable,
        isLoadingAttendance,
        savingState,
        markAttendance,
        setSubjectMin,
        getSubjectStats,
        setEnrolledSubjects,
        setTimetable,
        completeOnboarding,
        markIntroAsSeen,
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
