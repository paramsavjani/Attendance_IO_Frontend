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
  /** Students placed on campus each month ("2026-07", no PPOs) and the average of their packages. */
  placedByMonth?: PlacementPlacedMonth[];
  averagePlacedByMonthCtcLpa?: number | null;
  coverage: string;
}

export interface PlacementPlacedMonth {
  month: string;
  students: number;
  /** Over the students whose package is known; null when none is. */
  averageCtcLpa: number | null;
}

export interface PlacementCompanyCard {
  id: string;
  name: string;
  offerTypes: string[];
  programmes: string[];
  roles: string[];
  /** The B.Tech package range the company list shows: lowest role minimum to highest role maximum. */
  maxCtcLpa: number | null;
  minCtcLpa: number | null;
  minCpi: number | null;
  selectedCount: number;
  ppoCount: number;
  /** The result is out; with selectedCount 0 it means no B.Tech student was selected. */
  resultDeclared?: boolean;
  lastActivity: string | null;
  onPortal: boolean;
  /** Who the company selected (the list can be searched by them). */
  students?: PlacementCardStudent[];
  /** Seniors' interview experiences for this company. */
  experienceCount?: number;
}

export interface PlacementCardStudent {
  id: string | null;
  name: string | null;
}

/**
 * The card's students a search is about: a roll number (from its start, or its last digits) or words that each
 * start a word of the name ("param", "savjani param"). Under three letters it would match nearly everyone.
 */
export function matchingStudents(students: PlacementCardStudent[] | undefined, query: string): PlacementCardStudent[] {
  const q = query.trim().toLowerCase();
  if (!students || q.length < 3) return [];
  if (/^\d+$/.test(q)) return students.filter((s) => s.id && (s.id.startsWith(q) || s.id.endsWith(q)));
  const words = q.split(/\s+/);
  return students.filter((s) => {
    const name = (s.name ?? "").toLowerCase().split(/\s+/);
    return words.every((w) => name.some((n) => n.startsWith(w)));
  });
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

// ── Interview experiences ────────────────────────────────────────────────────

export type ExperienceVerdict = "Selected" | "Not selected" | "Not shared";

/** One senior's interview experience at a company, without its text. Anonymous: no names or roll numbers. */
export interface ExperienceSummary {
  id: string;
  companyId: string;
  company: string;
  /** The company has a page in this season's list. */
  inPlacements: boolean;
  season: string | null;
  offerType: string;
  role: string | null;
  batch: string | null;
  verdict: ExperienceVerdict | string;
  rounds: string[];
  topics: string[];
  summary: string;
  readMinutes: number;
}

export interface Experience extends ExperienceSummary {
  /** The experience, as Markdown. */
  body: string;
  words: number;
  drive: { role?: string | null; stipend?: string | null; ctc?: string | null; selects?: string | null; location?: string | null; process?: string[] } | null;
}

export interface ExperienceList {
  total: number;
  companies: { id: string; name: string; inPlacements: boolean; count: number; selected: number }[];
  experiences: ExperienceSummary[];
}

/** The list is small and only changes on a re-import, so it's kept for the app session. */
let experienceListCache: Promise<ExperienceList> | null = null;

export function fetchExperiences(): Promise<ExperienceList> {
  if (!experienceListCache) {
    experienceListCache = (async () => {
      const res = await authenticatedFetch(`${API_CONFIG.BASE_URL}/api/placements/experiences`);
      if (res.status === 403) throw new PlacementsForbiddenError("forbidden");
      if (!res.ok) throw new Error(`Experiences failed: ${res.status}`);
      return res.json();
    })();
    experienceListCache.catch(() => (experienceListCache = null));
  }
  return experienceListCache;
}

export async function fetchExperience(id: string): Promise<Experience | null> {
  const res = await authenticatedFetch(`${API_CONFIG.BASE_URL}/api/placements/experiences/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (res.status === 403) throw new PlacementsForbiddenError("forbidden");
  if (!res.ok) throw new Error(`Experience failed: ${res.status}`);
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
