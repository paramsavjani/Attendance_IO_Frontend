import { useQuery } from "@tanstack/react-query";
import { API_CONFIG, authenticatedFetch } from "@/lib/api";

/**
 * Shared react-query hooks for read-only endpoints whose data barely changes
 * during a session (semester, config, contributors, lecture slots).
 *
 * These were previously refetched by every page on every mount. Going through
 * the query cache means the first page to ask pays the network cost and the
 * rest read from memory — see the QueryClient defaults in App.tsx.
 */

export interface CurrentSemester {
  year: number;
  type: string;
}

/** Current active semester. 404 is a valid "no active semester" state, not an error. */
export function useCurrentSemester() {
  return useQuery<CurrentSemester | null>({
    queryKey: ["semester", "current"],
    queryFn: async () => {
      const response = await fetch(API_CONFIG.ENDPOINTS.SEMESTER_CURRENT, {
        credentials: "include",
      });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`Failed to load semester (${response.status})`);
      return response.json();
    },
  });
}

/** Student's configured sleep duration; falls back to 8h when unset. */
export function useSleepDuration() {
  return useQuery<number>({
    queryKey: ["student", "sleep-duration"],
    queryFn: async () => {
      const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.GET_SLEEP_DURATION, {
        method: "GET",
      });
      if (response.status === 404) return 8;
      if (!response.ok) throw new Error(`Failed to load sleep duration (${response.status})`);
      const data = await response.json();
      return data.sleepDurationHours ?? 8;
    },
  });
}

export interface LectureSlot {
  index: number;
  startTime: string;
  endTime: string;
}

/** Institute lecture time slots — effectively static for the semester. */
export function useLectureSlots() {
  return useQuery<LectureSlot[]>({
    queryKey: ["time-slots"],
    queryFn: async () => {
      const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.TIME_SLOTS, { method: "GET" });
      if (!response.ok) throw new Error(`Failed to load time slots (${response.status})`);
      return response.json();
    },
    staleTime: Infinity,
  });
}

/** First day of classes for the active semester — static config. */
export function useClassesStartDate() {
  return useQuery<string | null>({
    queryKey: ["config", "classes-start-date"],
    queryFn: async () => {
      const response = await fetch(API_CONFIG.ENDPOINTS.CLASSES_START_DATE, {
        credentials: "include",
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.startDate ?? null;
    },
    staleTime: Infinity,
  });
}
