import { API_CONFIG, authenticatedFetch } from "@/lib/api";

/** This season's placement drives and results (backend: /api/placements). */

export interface PlacementSummary {
  companiesOnPortal: number;
  companiesWithSelections: number;
  companiesWithNoSelection?: number;
  /** One per student (best offer); allOffers counts every offer. */
  offers: number;
  allOffers?: number;
  ppos: number;
  campusSelections: number;
  studentsSelected: number;
  /** The batch being placed, its size in the student list, how many have an offer, and that as a %. */
  batchYear?: string | null;
  batchStudents?: number | null;
  batchPlaced?: number | null;
  placedPercent?: number | null;
  highestCtcLpa: number | null;
  highestCtcCompany: string | null;
  averageCtcLpa: number | null;
  resultsUpTo: string | null;
  updatedAt: string | null;
  topRecruiters: { id: string; name: string; selected: number }[];
  /** Companies that came each month ("2026-07") and the average of their packages (not per student, no PPOs). */
  companiesByMonth?: PlacementMonth[];
  averageCompanyCtcLpa?: number | null;
  coverage: string;
}

export interface PlacementMonth {
  month: string;
  companies: number;
  averageCtcLpa: number;
}

export interface PlacementCompanyCard {
  id: string;
  name: string;
  offerTypes: string[];
  programmes: string[];
  roles: string[];
  maxCtcLpa: number | null;
  /** What the company list shows and sorts by: a range counts at its minimum. */
  minCtcLpa: number | null;
  minCpi: number | null;
  selectedCount: number;
  ppoCount: number;
  /** The result is out; with selectedCount 0 it means no B.Tech student was selected. */
  resultDeclared?: boolean;
  lastActivity: string | null;
  onPortal: boolean;
}

export interface PlacementList {
  season: string | null;
  summary: PlacementSummary;
  companies: PlacementCompanyCard[];
}

export interface PlacementProfile {
  name: string | null;
  ugPackage: string | null;
  pgPackage: string | null;
  ugCtcMin: number | null;
  ugCtcMax: number | null;
  pgCtcMin: number | null;
  pgCtcMax: number | null;
  stipend: string | null;
  description: string | null;
}

export interface PlacementDrive {
  eventId: number;
  title: string;
  offerType: string | null;
  location: string | null;
  category: string | null;
  ugCpi: number | null;
  pgCpi: number | null;
  openFor: string[];
  openForLabels: string[];
  driveDate: string | null;
  registrationStart: string | null;
  registrationEnd: string | null;
  bond: string | null;
  hasJdFile: boolean;
  /** Text of the drive's job description files (PDF / Word). */
  jdFiles?: PlacementJdFile[];
  profiles: PlacementProfile[];
  source: string | null;
}

/** A JD file's text; when `pdf`, the file as sent can be opened from jdPdfUrl(). */
export interface PlacementJdFile {
  file: string;
  text: string;
  transcribed: boolean;
  original?: string | null;
  pdf?: boolean;
}

/** The JD PDF as the company sent it (DAU students only). */
export function jdPdfUrl(eventId: number, original: string): string {
  return `${API_CONFIG.BASE_URL}/api/placements/jd/${eventId}/${encodeURIComponent(original)}`;
}

export interface PlacementSelection {
  studentId: string | null;
  name: string | null;
  kind: "PPO" | "Campus" | string;
  role: string | null;
  ctc: string | null;
  ctcLpa: number | null;
  stipend: string | null;
  offerType: string | null;
  announcedOn: string | null;
  programme: string | null;
  notes: string | null;
}

export interface PlacementCompany extends Omit<PlacementCompanyCard, "roles"> {
  season: string;
  aliases: string[];
  roles: string[];
  locations: string[];
  drives: PlacementDrive[];
  selections: PlacementSelection[];
  /** Why a declared result has no selections, and when it was announced. */
  resultNote?: string | null;
  resultOn?: string | null;
  ctcNotes: { role: string | null; ctc: string | null; stipend: string | null; offerType: string | null; notes: string | null }[];
  updatedAt: string | null;
}

/** Thrown for 403: placements are only for DAU students (not the demo login). */
export class PlacementsForbiddenError extends Error {}

export async function fetchPlacements(): Promise<PlacementList> {
  const res = await authenticatedFetch(`${API_CONFIG.BASE_URL}/api/placements`);
  if (res.status === 403) throw new PlacementsForbiddenError("forbidden");
  if (!res.ok) throw new Error(`Placements failed: ${res.status}`);
  return res.json();
}

export async function fetchPlacementCompany(id: string): Promise<PlacementCompany | null> {
  const res = await authenticatedFetch(`${API_CONFIG.BASE_URL}/api/placements/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (res.status === 403) throw new PlacementsForbiddenError("forbidden");
  if (!res.ok) throw new Error(`Placement company failed: ${res.status}`);
  return res.json();
}

/** "25", "12 – 15" or "—", in LPA. */
export function formatLpa(min: number | null | undefined, max: number | null | undefined): string {
  if (min == null && max == null) return "—";
  const f = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, ""));
  if (min != null && max != null && min !== max) return `${f(min)} – ${f(max)}`;
  return f((max ?? min) as number);
}

/** "2026-09-02" or "2026-09-02T10:00:00+05:30" → "2 Sep". */
export function formatDay(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
