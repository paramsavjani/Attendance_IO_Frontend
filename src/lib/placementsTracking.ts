import { trackAppEvent } from "@/contexts/AuthContext";

/**
 * Everything students do on the placements page goes to the events table as one `placements` event
 * type, with `metadata.action` saying what happened (open_list, search, filter, sort, view_company,
 * tab, role_open, jd_open, portal_link, ask_ai). The admin site's Placements page reads these.
 */
export type PlacementsAction =
  | "open_list"
  | "search"
  | "filter"
  | "sort"
  | "view_company"
  | "tab"
  | "role_open"
  | "jd_open"
  | "portal_link"
  | "ask_ai";

export function trackPlacements(action: PlacementsAction, meta: Record<string, unknown> = {}) {
  void trackAppEvent("placements", { action, ...meta });
}

/** Where a company page was opened from, passed as router state. */
export type PlacementsFrom = "list" | "top_recruiters" | "home" | "search" | "notification" | "direct";
