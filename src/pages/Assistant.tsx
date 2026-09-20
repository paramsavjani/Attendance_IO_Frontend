import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BookOpen, Check, Copy, RotateCcw, Square } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { streamAgentChat } from "@/lib/agent";
import { useAuth } from "@/contexts/AuthContext";
import { SparkIcon } from "@/components/assistant/AssistantFab";
import { collapseTo, lastRevealOrigin } from "@/lib/revealTransition";

interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  /** Set when the turn failed; rendered as its own bubble with a retry. */
  error?: string;
  /** The user message this assistant turn answered — for "try again". */
  question?: string;
  streaming?: boolean;
  /** What the assistant is doing right now, while nothing has streamed yet. */
  status?: string;
}

const HOME_PATH = "/dashboard";

/** Human wording for tool names arriving in STATUS events. */
const STATUS_TEXT: Record<string, string> = {
  search_students: "Searching students…",
  get_student_attendance: "Fetching attendance…",
  get_my_attendance: "Checking your attendance…",
  get_my_timetable: "Reading your timetable…",
  get_subject_records: "Going through lecture records…",
  list_subjects: "Looking up subjects…",
  list_semesters: "Looking up semesters…",
  get_subject_class_stats: "Crunching class statistics…",
  get_group_average: "Averaging the batch…",
  get_overall_analytics: "Pulling institute analytics…",
  compare_students: "Comparing attendance…",
  simulate_attendance: "Running the what-if…",
  get_unmarked_lectures: "Finding unmarked lectures…",
  get_attendance_on_date: "Checking that day…",
  get_attendance_trend: "Building the weekly trend…",
  get_lab_tutorial_attendance: "Checking labs & tutorials…",
  get_subject_schedule: "Looking up the schedule…",
  get_academic_calendar: "Checking the calendar…",
};

/**
 * Things only the assistant can answer — the home page already shows your own numbers and the
 * timetable, so those are deliberately absent. Four are picked at random per visit, three of
 * them alumni questions — the directory is the thing people are least likely to know is here.
 */
const ATTENDANCE_POOL = [
  "Show Param Savjani's attendance this semester",
  "Compare my attendance with Param Savjani",
  "Who has better attendance in CT303, me or Param Savjani?",
  "Compare Param Savjani and 202301045 subject by subject",
  "Average attendance of the 2023 batch in CT303",
  "Which batch is doing best in CS374?",
  "Batch-wise average attendance in DS603",
  "Average attendance of my batch across all my subjects",
  "How does the 2024 batch compare with 2025 in Digital Communication?",
  "Top 5 students by attendance in CP1001",
  "Bottom 5 students in Signals and Systems",
  "How many students of my batch are below 60% this semester?",
  "Which of my subjects has the lowest class average?",
  "When did I last miss a CT303 lecture?",
  "How many CS374 classes happened in September?",
  "What was Param Savjani's official attendance last semester?",
  "Can I skip the next two CT303 classes and stay above 75%?",
  "What did I forget to mark this week?",
  "Am I improving? Show my last 6 weeks",
  "Who in CP1001 is below 60%?",
  "How many weeks of classes are left?",
];

const ALUMNI_POOL = [
  "Alumni working at Google with LinkedIn profiles",
  "Seniors at Microsoft I can reach on LinkedIn",
  "Which alumni are working in Gujarat?",
  "Alumni in Ahmedabad or Gandhinagar with LinkedIn",
  "2019 batch alumni working in Bangalore",
  "Which companies hire the most DAU alumni?",
  "Top 10 highest-paying companies where alumni work",
  "What is the average package at Amazon for alumni?",
  "Data scientists among our alumni",
  "Product managers from DAU and where they work",
  "M.Sc. alumni working abroad in the Bay Area",
  "Alumni at Sprinklr — names, roles and LinkedIn",
  "Who from the 2020 batch works at Google or Microsoft?",
  "Alumni working in startups in Bangalore",
  "Seniors from my programme working at Atlassian",
];

const CAMPUS_POOL = [
  "Who is the convener of the Cultural Committee and their phone number?",
  "Which clubs are there for coding and robotics?",
  "Contact of the Hostel Management Committee",
  "What events are happening on campus this week?",
  "Is there a garba night coming up?",
  "Who teaches machine learning here? Give email",
  "When do end-sem exams start this semester?",
  "Last date for add/drop this semester",
  "Is 2 October a holiday? List holidays this month",
  "Average and highest package for UG in 2024-25",
  "Which companies recruited from DAU last year?",
  "Subjects in semester 3 of B.Tech ICT",
  "Scholarships available for B.Tech students",
  "Whom do I report ragging to?",
  "Women's hostel warden's phone number",
  "Hostel laundry timings and charges",
  "Can my parents stay in the hostel guest room?",
  "Doctor timings at the medical centre",
  "How do I get a TV card in the hostel?",
  "What does the Programming Club do?",
];

function shuffle<T>(list: T[]): T[] {
  const pool = [...list];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

/** [count] prompts: half campus questions (newest, least discovered), then alumni, then attendance, in random order. */
function pickSuggestions(count: number): string[] {
  const campus = shuffle(CAMPUS_POOL).slice(0, Math.ceil(count / 2)); // 2 of 4
  const alumni = shuffle(ALUMNI_POOL).slice(0, Math.max(1, Math.floor((count - campus.length) / 2))); // 1 of 4
  const attendance = shuffle(ATTENDANCE_POOL).slice(0, Math.max(0, count - campus.length - alumni.length));
  return shuffle([...campus, ...alumni, ...attendance]);
}

let nextId = 0;
const newId = () => `${Date.now()}-${nextId++}`;

/**
 * Full-screen chat: its own fixed header (no bottom nav on this page), a scrolling message list
 * and a composer that stays above the on-screen keyboard. A fresh thread on every visit; past
 * sessions are stored server-side but never shown here.
 */
export default function Assistant() {
  const navigate = useNavigate();
  const { student: me } = useAuth();
  const isDemo = Boolean(me?.isDemo);
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>(() => pickSuggestions(4));
  const [showJump, setShowJump] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const pinnedToBottom = useRef(true);
  const viewportHeight = useVisualViewportHeight();

  const goHome = useCallback(() => {
    const fallback = { x: window.innerWidth - 44, y: window.innerHeight - 112 };
    collapseTo(lastRevealOrigin() ?? fallback, () => navigate(HOME_PATH, { replace: true }));
  }, [navigate]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  // Demo logins have no assistant: anyone who lands here by URL goes back to the dashboard.
  useEffect(() => {
    if (isDemo) navigate("/dashboard", { replace: true });
  }, [isDemo, navigate]);

  // Follow the stream only while the user is at the bottom; if they scrolled up, offer a jump.
  useEffect(() => {
    if (pinnedToBottom.current) scrollToBottom("auto");
    else setShowJump(true);
  }, [messages, scrollToBottom]);

  useEffect(() => {
    scrollToBottom("auto");
  }, [viewportHeight, scrollToBottom]);

  const onListScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    pinnedToBottom.current = atBottom;
    if (atBottom) setShowJump(false);
  };

  // Android hardware back: always return to home from here, never to a previous chat state.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let listenerHandle: { remove: () => Promise<void> } | undefined;
    (async () => {
      const { App } = await import("@capacitor/app");
      listenerHandle = await App.addListener("backButton", () => goHome());
    })();
    return () => {
      listenerHandle?.remove();
    };
  }, [goHome]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Grow the input with its content (up to a few lines), shrink back when cleared.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [input]);

  const updateMessage = useCallback(
    (id: string, patch: Partial<ChatMessage> | ((m: ChatMessage) => Partial<ChatMessage>)) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...(typeof patch === "function" ? patch(m) : patch) } : m)),
      );
    },
    [],
  );

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || busy) return;

      const assistantId = newId();
      pinnedToBottom.current = true;
      setShowJump(false);
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: "USER", content: message },
        { id: assistantId, role: "ASSISTANT", content: "", streaming: true, question: message },
      ]);
      setInput("");
      setBusy(true);
      // Keep the keyboard up: the field stays focused across the send.
      inputRef.current?.focus({ preventScroll: true });

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamAgentChat({
          message,
          conversationId,
          signal: controller.signal,
          onEvent: (event) => {
            switch (event.type) {
              case "META":
                setConversationId(event.conversationId);
                break;
              case "STATUS":
                updateMessage(assistantId, (m) => (m.content ? {} : { status: STATUS_TEXT[event.text] ?? "Working on it…" }));
                break;
              case "TOKEN":
                updateMessage(assistantId, (m) => ({ content: m.content + event.text, status: undefined }));
                break;
              case "DONE":
                updateMessage(assistantId, { streaming: false, status: undefined });
                break;
              case "ERROR":
                updateMessage(assistantId, { streaming: false, status: undefined, error: event.error });
                break;
              default:
                break;
            }
          },
        });
        updateMessage(assistantId, (m) => (m.streaming ? { streaming: false, status: undefined } : {}));
      } catch (err) {
        const aborted = controller.signal.aborted;
        updateMessage(assistantId, (m) => ({
          streaming: false,
          status: undefined,
          error: aborted ? undefined : err instanceof Error ? err.message : "Something went wrong. Please try again.",
          content: aborted && !m.content ? "Stopped." : m.content,
        }));
      } finally {
        abortRef.current = null;
        setBusy(false);
      }
    },
    [busy, conversationId, updateMessage],
  );

  const retry = useCallback(
    (message: ChatMessage) => {
      if (!message.question || busy) return;
      setMessages((prev) => prev.filter((m) => m.id !== message.id && !(m.role === "USER" && m.content === message.question && prev.indexOf(m) === prev.indexOf(message) - 1)));
      void send(message.question);
    },
    [busy, send],
  );

  const stop = () => abortRef.current?.abort();

  // Opened from elsewhere with a ready-made question (e.g. the Search page): ask it once, then
  // drop it from the URL so a refresh or back-navigation does not ask it again.
  const initialQuestion = searchParams.get("q");
  useEffect(() => {
    if (!initialQuestion) return;
    setSearchParams({}, { replace: true });
    void send(initialQuestion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setConversationId(null);
    setSuggestions(pickSuggestions(4));
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const composerState = busy ? "is-thinking" : focused ? "is-focused" : "is-idle";

  return (
    <div
      className="fixed inset-x-0 top-0 flex flex-col bg-background"
      // Follows the visual viewport, so the composer sits right above the keyboard when it opens.
      style={{ height: viewportHeight ? `${viewportHeight}px` : "100dvh" }}
    >
      {/* Fixed header */}
      <header
        className="flex shrink-0 items-center gap-2 border-b border-border bg-background/95 px-3 pb-2.5 backdrop-blur"
        // Inset + real spacing: the app's .safe-area-top class *replaces* padding with the inset,
        // which is 0 on Android, so a header using it ends up flush against the status bar.
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
      >
        <Button variant="ghost" size="icon" onClick={goHome} aria-label="Back to home" className="h-10 w-10 rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="liquid-nav flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
            <SparkIcon className="h-[18px] w-[18px]" gradientId="header-spark" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-semibold leading-tight">Assistant</h1>
            <p className="truncate text-[11px] text-muted-foreground">Attendance, alumni &amp; campus</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigate("/assistant/guide")} aria-label="What the assistant knows" className="h-9 w-9 rounded-full">
          <BookOpen className="h-[18px] w-[18px]" />
        </Button>
        <Button variant="outline" size="sm" onClick={reset} disabled={messages.length === 0 && !busy} className="h-9 rounded-full px-3">
          <RotateCcw className="mr-1.5 h-4 w-4" />
          New chat
        </Button>
      </header>

      {/* Messages */}
      <div className="relative min-h-0 flex-1">
        <div ref={listRef} onScroll={onListScroll} className="h-full overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4">
          <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
            {messages.length === 0 ? (
              <EmptyState suggestions={suggestions} onPick={(s) => void send(s)} onGuide={() => navigate("/assistant/guide")} />
            ) : (
              messages.map((m) => <MessageBubble key={m.id} message={m} onRetry={retry} />)
            )}
          </div>
        </div>
        {showJump && (
          <button
            type="button"
            onClick={() => {
              pinnedToBottom.current = true;
              setShowJump(false);
              scrollToBottom();
            }}
            className="liquid-nav absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-foreground"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            Latest
          </button>
        )}
      </div>

      {/* Composer — bottom of the visual viewport, i.e. directly above the keyboard */}
      <div className="shrink-0 px-3 pt-2" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}>
        <div className={cn("gemini-border mx-auto w-full max-w-lg", composerState)}>
          <div className="gemini-inner flex flex-col px-3.5 pt-3 pb-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => {
                setFocused(true);
                setTimeout(() => scrollToBottom("auto"), 250);
              }}
              onBlur={() => setFocused(false)}
              placeholder={busy ? "Type your next question…" : "Ask about attendance, friends, batches…"}
              rows={1}
              enterKeyHint="send"
              className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
            />
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="hidden text-[11px] text-muted-foreground sm:inline">
              </span>
              <span className="sm:hidden" />
              {busy ? (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={stop}
                  aria-label="Stop"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background active:scale-90"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  // preventDefault on mousedown keeps focus in the textarea, so the keyboard stays up.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void send(input)}
                  disabled={!input.trim()}
                  aria-label="Send"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity active:scale-90 disabled:opacity-40"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Height of the visible area, which shrinks when the on-screen keyboard opens (web and Android
 * WebView with adjustResize). Null until the API reports, in which case the CSS fallback applies.
 */
function useVisualViewportHeight(): number | null {
  const [height, setHeight] = useState<number | null>(() =>
    typeof window !== "undefined" && window.visualViewport ? Math.round(window.visualViewport.height) : null,
  );
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setHeight(Math.round(vv.height));
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  return height;
}

function EmptyState({ suggestions, onPick, onGuide }: { suggestions: string[]; onPick: (s: string) => void; onGuide: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 pt-10 pb-4 text-center">
      <div className="liquid-nav flex h-14 w-14 items-center justify-center rounded-full">
        <SparkIcon className="h-7 w-7" gradientId="empty-spark" />
      </div>
      <div>
        <h2 className="text-base font-semibold">What do you want to know?</h2>
        <p className="mt-1 text-xs text-muted-foreground">Attendance, alumni, clubs &amp; committees, faculty, calendar, placements, hostel — or type your own.</p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="w-full rounded-2xl border border-border bg-card px-3.5 py-2.5 text-left text-[13px] text-foreground active:scale-[0.98]"
          >
            {s}
          </button>
        ))}
      </div>
      {/* Guide card: the assistant's five-colour ring (same as the composer while thinking, but slow) so it
          reads as "about the assistant", not another question. */}
      <button type="button" onClick={onGuide} className="gemini-border is-focused mt-1 w-full max-w-sm text-left active:scale-[0.98]">
        <div className="gemini-inner flex items-center gap-3 px-3.5 py-3">
          <div className="liquid-nav flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
            <BookOpen className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="bg-gradient-to-r from-[#8ab4f8] via-[#c58af9] to-[#f28b82] bg-clip-text text-[13px] font-semibold leading-tight text-transparent">
              See everything it can answer
            </p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">12 topics · attendance, alumni, clubs, faculty, placements, hostel…</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
      </button>
    </div>
  );
}

function MessageBubble({ message, onRetry }: { message: ChatMessage; onRetry: (m: ChatMessage) => void }) {
  const isUser = message.role === "USER";
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  // A failed turn is shown as a proper bubble with a retry, not a stray label under an empty one.
  if (!isUser && message.error && !message.content) {
    return (
      <div className="flex justify-start">
        <div className="flex max-w-[88%] flex-col gap-2 rounded-2xl rounded-tl-sm border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
          <span>{message.error}</span>
          {message.question && (
            <button type="button" onClick={() => onRetry(message)} className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs">
              <RotateCcw className="h-3 w-3" />
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      {/* min-w-0 lets a wide table scroll inside the bubble instead of stretching it past the screen */}
      <div className={cn("group flex min-w-0 flex-col gap-1", isUser ? "max-w-[88%] items-end" : "max-w-full items-start")}>
        <div
          className={cn(
            "min-w-0 max-w-full rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
            isUser
              ? "whitespace-pre-wrap rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm border border-border bg-card text-foreground",
          )}
        >
          {isUser ? (
            message.content
          ) : message.content ? (
            <AssistantMarkdown content={message.content} />
          ) : message.streaming ? (
            <Thinking status={message.status} />
          ) : null}
        </div>
        {!isUser && message.error && message.content && (
          <div className="flex max-w-full flex-col gap-2 rounded-2xl rounded-tl-sm border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-sm leading-relaxed text-foreground">
            <span>{message.error}</span>
            {message.question && (
              <button type="button" onClick={() => onRetry(message)} className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs">
                <RotateCcw className="h-3 w-3" />
                Try again
              </button>
            )}
          </div>
        )}
        {!isUser && !message.streaming && message.content && (
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] text-muted-foreground opacity-70 active:opacity-100"
            aria-label="Copy answer"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
    </div>
  );
}

/** Assistant replies are Markdown (lists, tables, bold). Tables scroll inside the bubble on narrow screens. */
function AssistantMarkdown({ content }: { content: string }) {
  return (
    <div className="space-y-1.5 break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="my-1 list-disc space-y-0.5 pl-4">{children}</ul>,
          ol: ({ children }) => <ol className="my-1 list-decimal space-y-0.5 pl-4">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => <p className="mt-1.5 mb-1 font-semibold">{children}</p>,
          h2: ({ children }) => <p className="mt-1.5 mb-1 font-semibold">{children}</p>,
          h3: ({ children }) => <p className="mt-1.5 mb-1 font-semibold">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 font-mono text-[12px]">{children}</code>,
          a: ({ children, href }) => (
            <a href={href} className="font-medium text-primary underline underline-offset-2">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-1.5 max-w-full overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-[12px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
          th: ({ children }) => <th className="whitespace-nowrap px-2 py-1.5 text-left font-semibold">{children}</th>,
          td: ({ children }) => <td className="px-2 py-1 align-top">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function Thinking({ status }: { status?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-muted-foreground">
      <span className="inline-flex items-end gap-0.5">
        <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-current" />
        <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-current" />
        <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      {status ?? "Thinking…"}
    </span>
  );
}
