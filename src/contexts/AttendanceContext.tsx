import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from "react";
import { defaultTimetable as initialDefaultTimetable } from "@/data/mockData";
import { Subject, TimetableSlot } from "@/types/attendance";
import { API_CONFIG, authenticatedFetch } from "@/lib/api";
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
  totalUntilEndDate?: number;
  percentage?: number;
  classesNeeded?: number;
  bunkableClasses?: number;
}

interface AttendanceContextType {
  subjectStats: Record<string, SubjectStats>;
  subjectStatsToday: Record<string, SubjectStats>; // Always shows today's total attendance
  subjectMinAttendance: Record<string, number>;
  todayAttendance: Record<string, 'present' | 'absent' | 'cancelled' | null>;
  attendanceIds: Record<string, number | null>; // Map of slot keys to attendance IDs
  enrolledSubjects: Subject[];
  timetable: TimetableSlot[];
  hasCompletedOnboarding: boolean;
  hasSeenIntro: boolean;
  isLoadingEnrolledSubjects: boolean;
  isLoadingTimetable: boolean;
  isLoadingAttendance: boolean;
  savingState: { 
    subjectId: string; 
    action: 'present' | 'absent' | 'cancelled';
    timeSlot?: number | null;
    startTime?: string;
    endTime?: string;
    extraClassIndex?: number;
  } | null; // Currently saving attendance
  markAttendance: (
    subjectId: string, 
    date: string, 
    status: 'present' | 'absent' | 'cancelled',
    timeSlot?: number | null,
    startTime?: string,
    endTime?: string,
    isExtraClass?: boolean,
    extraClassIndex?: number
  ) => Promise<void>;
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
  const { student, enrolledSubjects: enrolledSubjectsFromAuth } = useAuth();

  // Enrolled subjects - use from AuthContext if available, otherwise fetch
  const [enrolledSubjects, setEnrolledSubjectsState] = useState<Subject[]>([]);
  const [isLoadingEnrolledSubjects, setIsLoadingEnrolledSubjects] = useState(true);
  const hasInitializedFromAuth = useRef(false);

  // Fetch enrolled subjects from backend - used for refresh
  const fetchEnrolledSubjects = useCallback(async () => {
    if (!student) {
      setIsLoadingEnrolledSubjects(false);
      return;
    }

    try {
      setIsLoadingEnrolledSubjects(true);
      const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.ENROLLED_SUBJECTS, {
        method: "GET",
      });

      if (response.ok) {
        const data = await response.json();
        // Convert backend response to Subject format
        const subjects: Subject[] = data.subjects.map((s: any) => ({
          id: s.subjectId,
          code: s.subjectCode,
          name: s.subjectName,
          lecturePlace: s.lecturePlace ?? null, // Default/institute location
          classroomLocation: s.classroomLocation ?? null, // User's custom location
          color: hexToHslLightened(s.color || "#3B82F6"),
          minimumCriteria: s.minimumCriteria ?? null,
        }));
        setEnrolledSubjectsState(subjects);
        hasInitializedFromAuth.current = true;
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

  // Convert enrolled subjects from AuthContext format to Subject format
  // Use subjects from AuthContext on initial load (from combined endpoint)
  useEffect(() => {
    if (enrolledSubjectsFromAuth && enrolledSubjectsFromAuth.length > 0) {
      const subjects: Subject[] = enrolledSubjectsFromAuth.map((s) => ({
        id: s.subjectId,
        code: s.subjectCode,
        name: s.subjectName,
        lecturePlace: s.lecturePlace ?? null,
        classroomLocation: s.classroomLocation ?? null,
        color: hexToHslLightened(s.color || "#3B82F6"),
        minimumCriteria: s.minimumCriteria ?? null,
      }));
      setEnrolledSubjectsState(subjects);
      setIsLoadingEnrolledSubjects(false);
      hasInitializedFromAuth.current = true;
    } else if (!student) {
      // No student, clear subjects
      setEnrolledSubjectsState([]);
      setIsLoadingEnrolledSubjects(false);
      hasInitializedFromAuth.current = false;
    } else if (student && enrolledSubjectsFromAuth.length === 0 && !hasInitializedFromAuth.current) {
      // Student exists but no subjects from auth context on initial load - fetch them
      // This handles edge cases where USER_ME was used instead of USER_INIT
      fetchEnrolledSubjects();
    }
  }, [enrolledSubjectsFromAuth, student, fetchEnrolledSubjects]);

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
      const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.TIMETABLE, {
        method: "GET",
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
  const [savingState, setSavingState] = useState<{ 
    subjectId: string; 
    action: 'present' | 'absent' | 'cancelled';
    timeSlot?: number | null;
    startTime?: string;
    endTime?: string;
    extraClassIndex?: number;
  } | null>(null);

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

      const response = await authenticatedFetch(url, {
        method: "GET",
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
            totalUntilEndDate: stat.totalUntilEndDate,
            percentage: stat.percentage,
            classesNeeded: stat.classesNeeded,
            bunkableClasses: stat.bunkableClasses,
          };
        });
        
        // Debug: Log first subject stats to verify new fields are present
        if (data.subjectStats && data.subjectStats.length > 0) {
          const firstStat = data.subjectStats[0];
        }
        setSubjectStats(statsMap);

        // If fetching today's date, also update subjectStatsToday for real-time updates in Subject Section
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const fetchDate = date || today;
        if (fetchDate === today) {
          setSubjectStatsToday(statsMap);
        }

        // Convert attendance records to the format expected by the frontend
        // Key format: date-subjectId-slotN | date-subjectId-start-end | date-subjectId-extra-N | date-subjectId (backward compat)
        // Normalize so keys match regardless of API returning subjectId as string/number and lectureDate with or without time
        const attendanceMap: Record<string, 'present' | 'absent' | 'cancelled' | null> = {};
        const idsMap: Record<string, number | null> = {};
        const norm = (r: any) => ({
          date: (r.lectureDate != null ? String(r.lectureDate) : '').slice(0, 10),
          subjectId: String(r.subjectId ?? ''),
        });
        data.todayAttendance?.forEach((record: any) => {
          const { date: d, subjectId: sid } = norm(record);
          let slotKey: string;
          if (record.isExtraClass === true) {
            const idx = record.extraClassIndex != null ? record.extraClassIndex : 0;
            slotKey = `${d}-${sid}-extra-${idx}`;
          } else if (record.timeSlot !== null && record.timeSlot !== undefined) {
            slotKey = `${d}-${sid}-slot${record.timeSlot}`;
          } else if (record.startTime && record.endTime) {
            slotKey = `${d}-${sid}-${record.startTime}-${record.endTime}`;
          } else {
            slotKey = `${d}-${sid}`;
          }
          attendanceMap[slotKey] = record.status as 'present' | 'absent' | 'cancelled';
          idsMap[slotKey] = record.attendanceId != null ? Number(record.attendanceId) : null;
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
      const response = await authenticatedFetch(`${API_CONFIG.ENDPOINTS.GET_MY_ATTENDANCE}?date=${today}`, {
        method: "GET",
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
            totalUntilEndDate: stat.totalUntilEndDate,
            percentage: stat.percentage,
            classesNeeded: stat.classesNeeded,
            bunkableClasses: stat.bunkableClasses,
          };
        });
        
        // Debug: Log first subject stats to verify new fields are present
        if (data.subjectStats && data.subjectStats.length > 0) {
          const firstStat = data.subjectStats[0];
          console.log('📊 Attendance API Response Sample:', {
            subjectId: firstStat.subjectId,
            hasPercentage: firstStat.percentage !== undefined,
            hasClassesNeeded: firstStat.classesNeeded !== undefined,
            hasBunkableClasses: firstStat.bunkableClasses !== undefined,
            percentage: firstStat.percentage,
            classesNeeded: firstStat.classesNeeded,
            bunkableClasses: firstStat.bunkableClasses,
          });
        }
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
    authenticatedFetch(API_CONFIG.ENDPOINTS.TIMETABLE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

    // Recalculate percentage based on updated present/absent counts
    const newPercentage = newTotal > 0 ? (newPresent / newTotal) * 100 : 0;

    return {
      ...currentStats,
      present: newPresent,
      absent: newAbsent,
      total: newTotal, // Total remains constant during live updates
      percentage: newPercentage, // Recalculate percentage for real-time updates
      // Note: classesNeeded and bunkableClasses are not recalculated here
      // They will be updated when backend response is received
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

  const markAttendance = useCallback(async (
    subjectId: string, 
    date: string, 
    status: 'present' | 'absent' | 'cancelled',
    timeSlot?: number | null,
    startTime?: string,
    endTime?: string,
    isExtraClass?: boolean,
    extraClassIndex?: number
  ) => {
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

    // Generate slot key based on time information (extra classes use date-subjectId-extra-{index})
    let slotKey: string;
    if (isExtraClass) {
      slotKey = (extraClassIndex !== undefined && extraClassIndex !== null)
        ? `${date}-${subjectId}-extra-${extraClassIndex}`
        : `${date}-${subjectId}`;
    } else if (timeSlot !== null && timeSlot !== undefined) {
      slotKey = `${date}-${subjectId}-slot${timeSlot}`;
    } else if (startTime && endTime) {
      slotKey = `${date}-${subjectId}-${startTime}-${endTime}`;
    } else {
      slotKey = `${date}-${subjectId}`;
    }
    
    const operationKey = `${slotKey}-${status}`;
    
    if (ongoingOperationsRef.current.has(operationKey)) {
      return;
    }
    
    ongoingOperationsRef.current.add(operationKey);
    
    const fallbackKey = `${date}-${subjectId}`;
    const previousStatus = todayAttendance[slotKey] || todayAttendance[fallbackKey] || null;
    const attendanceId = attendanceIds[slotKey] || attendanceIds[fallbackKey] || null;

    setSavingState({ subjectId, action: status, timeSlot, startTime, endTime, extraClassIndex });

    // Toggle off if same status - delete from backend
    if (previousStatus === status) {
      // Delete from backend if we have the attendance ID
      if (attendanceId) {
        try {
          const deleteResponse = await authenticatedFetch(API_CONFIG.ENDPOINTS.DELETE_ATTENDANCE(attendanceId.toString()), {
            method: 'DELETE',
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
      const requestBody: any = {
        subjectId,
        lectureDate: date,
        status,
      };
      
      // Add time information if provided
      if (timeSlot !== null && timeSlot !== undefined) {
        requestBody.timeSlot = timeSlot;
      } else if (startTime && endTime) {
        requestBody.startTime = startTime;
        requestBody.endTime = endTime;
      }
      
      // Send extra-class flag so backend persists is_extra_class = true (send both keys for Jackson compatibility)
      if (isExtraClass) {
        requestBody.isExtraClass = true;
        requestBody.extraClass = true;
        if (extraClassIndex !== undefined && extraClassIndex !== null) {
          requestBody.extraClassIndex = extraClassIndex;
        }
      }
      
      const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.MARK_ATTENDANCE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
        attendanceIds,
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
