import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  GraduationCap,
  Home,
  Landmark,
  PartyPopper,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
  UserSearch,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SparkIcon } from "@/components/assistant/AssistantFab";
import { useAuth } from "@/contexts/AuthContext";

type Domain = {
  icon: LucideIcon;
  title: string;
  blurb: string;
  examples: string[];
};

/**
 * Everything the assistant can answer, grouped by where the data comes from. Kept in one list so
 * the page is the single place to update when a tool is added on the backend. Each example opens
 * the chat and asks it straight away.
 */
const DOMAINS: Domain[] = [
  {
    icon: BarChart3,
    title: "Your attendance",
    blurb: "Everything you've marked in the app: per subject, labs & tutorials, trends, what you forgot to mark, and what-if checks.",
    examples: ["Can I skip the next two CT303 classes and stay above 75%?", "What did I forget to mark this week?", "Am I improving? Show my last 6 weeks"],
  },
  {
    icon: UserSearch,
    title: "Friends, batches & subjects",
    blurb: "Any student's attendance, side-by-side comparisons, batch and subject averages, who's below a cut-off, timetables and class timings.",
    examples: ["Compare my attendance with 202301045", "Average attendance of the 2023 batch in CT303", "Who in CP1001 is below 60%?"],
  },
  {
    icon: Users,
    title: "Alumni network",
    blurb: "DAU graduates by company, city, batch or role, with LinkedIn links to reach out for referrals — plus company average packages.",
    examples: ["Alumni at Google I can message on LinkedIn", "Which companies hire the most DAU alumni?", "2019 batch alumni in Bangalore"],
  },
  {
    icon: PartyPopper,
    title: "Clubs & committees",
    blurb: "All 35 SBG clubs, committees and organisations: what they do, who runs them, and every member's role, phone and email.",
    examples: ["Who is the convener of the Cultural Committee and their number?", "Which clubs are there for coding?", "Is Siddh Shah in any committee?"],
  },
  {
    icon: CalendarDays,
    title: "Campus events, calendar & holidays",
    blurb: "Upcoming SBG events with venue and time, the official academic calendar (registration, add/drop, exams, breaks) and the holiday list.",
    examples: ["What's happening on campus this week?", "When do end-sem exams start?", "Holidays in October"],
  },
  {
    icon: GraduationCap,
    title: "Faculty",
    blurb: "The faculty directory: who teaches or researches what, with office, phone, email, bio and courses taught.",
    examples: ["Who teaches machine learning? Give email", "Office of Prof. Rutu Parekh", "What does Dr. Arpit Rana research?"],
  },
  {
    icon: Briefcase,
    title: "Placements",
    blurb: "Official placement figures by season and level (highest, average, median, sector and city split), recruiters, and company sessions on campus.",
    examples: ["Average and highest package for UG in 2024-25", "Which sectors hired the most in 2023-24?", "Did Google recruit from DAU?"],
  },
  {
    icon: Landmark,
    title: "Programmes & curriculum",
    blurb: "Every degree programme with duration and admission route, and the semester-wise courses, credits and electives of each.",
    examples: ["Subjects in semester 3 of B.Tech ICT", "How many credits is Data Structures?", "How long is the M.Des programme?"],
  },
  {
    icon: Wallet,
    title: "Scholarships",
    blurb: "Merit, means-based and sponsored scholarships: who is eligible, how much, how many, and how to apply.",
    examples: ["Scholarships for B.Tech students", "Merit-cum-means scholarship eligibility", "Is there a fee waiver for M.Sc?"],
  },
  {
    icon: ShieldCheck,
    title: "Institute committees",
    blurb: "Anti-ragging committee & squad, ICC, grievance cell, academic council and more — purpose, how to reach them, and members.",
    examples: ["Whom do I report ragging to?", "ICC contact details", "Who is on the academic council?"],
  },
  {
    icon: Phone,
    title: "Office & staff contacts",
    blurb: "Wardens, hostel office, Dean of Students, medical centre, counsellor, registrar, placement office, security, library, IT support.",
    examples: ["Women's hostel warden phone number", "Hostel supervisor's mobile", "Registrar's email"],
  },
  {
    icon: Home,
    title: "Hostel & campus services",
    blurb: "Hostel rules and procedures, laundry, courier & post, TV card, activity room, parents' visits, mediclaim, doctor timings, library, sports, Wi-Fi.",
    examples: ["Hostel laundry timings and charges", "Can my parents stay in the guest room?", "Doctor timings at the medical centre"],
  },
];

const LIMITS = [
  "It only reads data — it can't mark, change or delete attendance.",
  "It won't write code, do homework, or answer general-knowledge questions.",
  "Campus information comes from official DAU, SBG and hostel-office pages; when something isn't there, it says so instead of guessing.",
];

export default function AssistantGuide() {
  const navigate = useNavigate();
  const { student: me } = useAuth();
  const ask = (q: string) => navigate(`/assistant?q=${encodeURIComponent(q)}`);

  return (
    <div className="min-h-dvh bg-background">
      <header
        className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background/95 px-3 pb-2.5 backdrop-blur"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
      >
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back" className="h-10 w-10 rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="liquid-nav flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
            <SparkIcon className="h-[18px] w-[18px]" gradientId="guide-spark" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-semibold leading-tight">What the assistant knows</h1>
            <p className="truncate text-[11px] text-muted-foreground">Tap any example to ask it</p>
          </div>
        </div>
        {!me?.isDemo && (
          <Button size="sm" onClick={() => navigate("/assistant")} className="h-9 rounded-full px-3">
            <Sparkles className="mr-1.5 h-4 w-4" />
            Ask
          </Button>
        )}
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-col gap-3 px-4 py-4 pb-10">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          The assistant answers from live app data and official DAU sources. Ask in English, Hindi or Hinglish — these are the areas it covers.
        </p>

        {DOMAINS.map((d) => (
          <section key={d.title} className="rounded-2xl border border-border bg-card p-3.5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <d.icon className="h-[18px] w-[18px]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold leading-tight">{d.title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{d.blurb}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-1.5">
              {d.examples.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => ask(q)}
                  className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-left text-[13px] text-foreground active:scale-[0.98]"
                >
                  {q}
                </button>
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-2xl border border-border bg-muted/40 p-3.5">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Good to know</h2>
          </div>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-xs leading-relaxed text-muted-foreground">
            {LIMITS.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
