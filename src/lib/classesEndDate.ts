import { useEffect, useState } from "react";
import { isAfter, parseISO, startOfDay } from "date-fns";
import { API_CONFIG, authenticatedFetch } from "@/lib/api";

const KEY = "classesEndDate";

function cached(): Date | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? parseISO(raw) : null;
  } catch {
    return null;
  }
}

/**
 * The signed-in student's last day of classes this semester (the server knows each batch's date:
 * first years end later). Cached so the app knows it offline and on the first frame.
 */
export function useClassesEndDate(): Date | null {
  const [endDate, setEndDate] = useState<Date | null>(cached);
  useEffect(() => {
    const controller = new AbortController();
    authenticatedFetch(API_CONFIG.ENDPOINTS.CLASSES_END_DATE, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { endDate?: string } | null) => {
        if (!data?.endDate) return;
        try {
          localStorage.setItem(KEY, data.endDate);
        } catch {
          /* storage off: keep it in memory */
        }
        setEndDate(parseISO(data.endDate));
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);
  return endDate;
}

/** True for a day after the semester's last class day: no timetable classes then. */
export const isAfterClassesEnd = (date: Date, endDate: Date | null): boolean =>
  endDate !== null && isAfter(startOfDay(date), startOfDay(endDate));
