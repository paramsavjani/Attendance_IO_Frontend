import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { subjectAttendance as initialSubjectAttendance, subjects } from "@/data/mockData";
import { Subject } from "@/types/attendance";

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
  hasCompletedOnboarding: boolean;
  markAttendance: (subjectId: string, slotKey: string, status: 'present' | 'absent') => void;
  setSubjectMin: (subjectId: string, value: number) => void;
  getSubjectStats: (subjectId: string) => SubjectStats;
  setEnrolledSubjects: (subjects: Subject[]) => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  // Enrolled subjects
  const [enrolledSubjects, setEnrolledSubjectsState] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('enrolledSubjects');
    return saved ? JSON.parse(saved) : [];
  });

  const hasCompletedOnboarding = enrolledSubjects.length > 0;

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
        hasCompletedOnboarding,
        markAttendance,
        setSubjectMin,
        getSubjectStats,
        setEnrolledSubjects,
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
