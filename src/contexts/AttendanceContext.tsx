import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { subjectAttendance as initialSubjectAttendance, subjects, defaultTimetable as initialDefaultTimetable } from "@/data/mockData";
import { Subject, TimetableSlot } from "@/types/attendance";
import { API_CONFIG } from "@/lib/api";
import { useAuth } from "./AuthContext";

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
  markAttendance: (subjectId: string, slotKey: string, status: 'present' | 'absent') => void;
  setSubjectMin: (subjectId: string, value: number) => void;
  getSubjectStats: (subjectId: string) => SubjectStats;
  setEnrolledSubjects: (subjects: Subject[]) => void;
  setTimetable: (timetable: TimetableSlot[]) => void;
  completeOnboarding: () => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const { student } = useAuth();
  
  // Enrolled subjects
  const [enrolledSubjects, setEnrolledSubjectsState] = useState<Subject[]>([]);
  const [isLoadingEnrolledSubjects, setIsLoadingEnrolledSubjects] = useState(true);

  // Fetch enrolled subjects from backend
  useEffect(() => {
    const fetchEnrolledSubjects = async () => {
      if (!student) {
        setIsLoadingEnrolledSubjects(false);
        return;
      }

      try {
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
            color: generateSubjectColor(s.subjectCode),
          }));
          setEnrolledSubjectsState(subjects);
          // Also save to localStorage as backup
          localStorage.setItem('enrolledSubjects', JSON.stringify(subjects));
        } else {
          // Fallback to localStorage if backend fails
          const saved = localStorage.getItem('enrolledSubjects');
          if (saved) {
            setEnrolledSubjectsState(JSON.parse(saved));
          }
        }
      } catch (error) {
        console.error('Error fetching enrolled subjects:', error);
        // Fallback to localStorage
        const saved = localStorage.getItem('enrolledSubjects');
        if (saved) {
          setEnrolledSubjectsState(JSON.parse(saved));
        }
      } finally {
        setIsLoadingEnrolledSubjects(false);
      }
    };

    fetchEnrolledSubjects();
  }, [student]);

  // Generate a consistent color for a subject based on its code
  function generateSubjectColor(code: string): string {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      hash = code.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `${hue} 72% 50%`;
  }

  // Timetable
  const [timetable, setTimetableState] = useState<TimetableSlot[]>(() => {
    const saved = localStorage.getItem('userTimetable');
    return saved ? JSON.parse(saved) : initialDefaultTimetable;
  });

  // Onboarding completion flag
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(() => {
    return localStorage.getItem('onboardingCompleted') === 'true';
  });

  const hasCompletedOnboarding = onboardingCompleted && enrolledSubjects.length > 0;

  const completeOnboarding = useCallback(() => {
    setOnboardingCompleted(true);
    localStorage.setItem('onboardingCompleted', 'true');
  }, []);

  const setEnrolledSubjects = useCallback((subjects: Subject[]) => {
    setEnrolledSubjectsState(subjects);
    localStorage.setItem('enrolledSubjects', JSON.stringify(subjects));
    
    // Initialize stats for new subjects
    setSubjectStats(prev => {
      const updated = { ...prev };
      subjects.forEach(s => {
        if (!updated[s.id]) {
          updated[s.id] = { subjectId: s.id, present: 0, absent: 0, total: 0 };
        }
      });
      localStorage.setItem('subjectStats', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setTimetable = useCallback((newTimetable: TimetableSlot[]) => {
    setTimetableState(newTimetable);
    localStorage.setItem('userTimetable', JSON.stringify(newTimetable));
  }, []);

  // Initialize subject stats from mock data
  const [subjectStats, setSubjectStats] = useState<Record<string, SubjectStats>>(() => {
    const saved = localStorage.getItem('subjectStats');
    if (saved) return JSON.parse(saved);
    
    const stats: Record<string, SubjectStats> = {};
    initialSubjectAttendance.forEach(sa => {
      stats[sa.subject.id] = {
        subjectId: sa.subject.id,
        present: sa.officialPresent + sa.estimatedPresent,
        absent: (sa.officialTotal + sa.estimatedTotal) - (sa.officialPresent + sa.estimatedPresent),
        total: sa.officialTotal + sa.estimatedTotal,
      };
    });
    return stats;
  });

  const [subjectMinAttendance, setSubjectMinAttendance] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('subjectMinAttendance');
    if (saved) return JSON.parse(saved);
    const defaults: Record<string, number> = {};
    subjects.forEach(s => { defaults[s.id] = DEFAULT_MIN; });
    return defaults;
  });

  const [todayAttendance, setTodayAttendance] = useState<Record<string, 'present' | 'absent' | null>>(() => {
    const saved = localStorage.getItem('todayAttendance');
    if (saved) return JSON.parse(saved);
    return {};
  });

  const markAttendance = useCallback((subjectId: string, slotKey: string, status: 'present' | 'absent') => {
    const previousStatus = todayAttendance[slotKey];
    
    // Toggle off if same status
    if (previousStatus === status) {
      setTodayAttendance(prev => {
        const updated = { ...prev, [slotKey]: null };
        localStorage.setItem('todayAttendance', JSON.stringify(updated));
        return updated;
      });
      
      // Revert stats
      setSubjectStats(prev => {
        const current = prev[subjectId];
        if (!current) return prev;
        
        const updated = {
          ...prev,
          [subjectId]: {
            ...current,
            present: current.present - (status === 'present' ? 1 : 0),
            absent: current.absent - (status === 'absent' ? 1 : 0),
            total: current.total - 1,
          }
        };
        localStorage.setItem('subjectStats', JSON.stringify(updated));
        return updated;
      });
      
      return;
    }

    // Update today's attendance
    setTodayAttendance(prev => {
      const updated = { ...prev, [slotKey]: status };
      localStorage.setItem('todayAttendance', JSON.stringify(updated));
      return updated;
    });

    // Update subject stats
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

      const updated = {
        ...prev,
        [subjectId]: {
          ...current,
          present: newPresent,
          absent: newAbsent,
          total: newTotal,
        }
      };
      localStorage.setItem('subjectStats', JSON.stringify(updated));
      return updated;
    });
  }, [todayAttendance]);

  const setSubjectMin = useCallback((subjectId: string, value: number) => {
    setSubjectMinAttendance(prev => {
      const updated = { ...prev, [subjectId]: value };
      localStorage.setItem('subjectMinAttendance', JSON.stringify(updated));
      return updated;
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
        markAttendance,
        setSubjectMin,
        getSubjectStats,
        setEnrolledSubjects,
        setTimetable,
        completeOnboarding,
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
