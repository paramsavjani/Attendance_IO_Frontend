import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { ArrowLeft, Loader2, RotateCcw, Send, Square } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { streamAgentChat } from "@/lib/agent";
import { SparkIcon } from "@/components/assistant/AssistantFab";
import { collapseTo, lastRevealOrigin } from "@/lib/revealTransition";

interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  /** Set when the turn failed; rendered as its own bubble. */
  error?: string;
  streaming?: boolean;
}

const HOME_PATH = "/dashboard";

/**
 * Things only the assistant can answer — the home page already shows your own numbers and the
 * timetable, so those are deliberately absent. Four are picked at random per visit.
 */
const SUGGESTION_POOL = [
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
  "Average attendance of the whole institute this semester",
  "Who in the 2025 batch has the best attendance in CP1002?",
];

function pickSuggestions(count: number): string[] {
  const pool = [...SUGGESTION_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>(() => pickSuggestions(4));
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const viewportHeight = useVisualViewportHeight();

  // Shrink back into the launcher we came from; if the page was opened directly (no origin
  // recorded) collapse toward where the launcher lives, bottom-right.
  const goHome = useCallback(() => {
    const fallback = { x: window.innerWidth - 44, y: window.innerHeight - 112 };
    collapseTo(lastRevealOrigin() ?? fallback, () => navigate(HOME_PATH, { replace: true }));
  }, [navigate]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // When the keyboard opens the viewport shrinks; keep the latest message in view.
  useEffect(() => {
    scrollToBottom("auto");
  }, [viewportHeight, scrollToBottom]);

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
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: "USER", content: message },
        { id: assistantId, role: "ASSISTANT", content: "", streaming: true },
      ]);
      setInput("");
      setBusy(true);

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
              case "TOKEN":
                updateMessage(assistantId, (m) => ({ content: m.content + event.text }));
                break;
              case "DONE":
                updateMessage(assistantId, { streaming: false });
                break;
              case "ERROR":
                updateMessage(assistantId, { streaming: false, error: event.error });
                break;
              default:
                break;
            }
          },
        });
        // Server closed without DONE/ERROR (e.g. proxy cut the stream): finish the bubble as-is.
        updateMessage(assistantId, (m) => (m.streaming ? { streaming: false } : {}));
      } catch (err) {
        const aborted = controller.signal.aborted;
        updateMessage(assistantId, (m) => ({
          streaming: false,
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
            <p className="truncate text-[11px] text-muted-foreground">Attendance, subjects &amp; classes</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={reset} disabled={messages.length === 0 && !busy} className="h-9 rounded-full px-3">
          <RotateCcw className="mr-1.5 h-4 w-4" />
          New chat
        </Button>
      </header>

      {/* Messages */}
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
          {messages.length === 0 ? (
            <EmptyState suggestions={suggestions} onPick={(s) => void send(s)} />
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}
        </div>
      </div>

      {/* Composer — bottom of the visual viewport, i.e. directly above the keyboard */}
      <div
        className="shrink-0 border-t border-border bg-background px-3 pt-2.5"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        <div className="mx-auto flex w-full max-w-lg items-end gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setTimeout(() => scrollToBottom("auto"), 250)}
            placeholder={busy ? "Type your next question…" : "Ask about your attendance…"}
            rows={1}
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl bg-card text-[15px]"
          />
          {busy ? (
            <Button variant="outline" size="icon" onClick={stop} aria-label="Stop" className="h-11 w-11 shrink-0 rounded-full">
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="icon" onClick={() => void send(input)} disabled={!input.trim()} aria-label="Send" className="h-11 w-11 shrink-0 rounded-full">
              <Send className="h-4 w-4" />
            </Button>
          )}
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

function EmptyState({ suggestions, onPick }: { suggestions: string[]; onPick: (s: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-5 pt-10 pb-4 text-center">
      <div className="liquid-nav flex h-14 w-14 items-center justify-center rounded-full">
        <SparkIcon className="h-7 w-7" gradientId="empty-spark" />
      </div>
      <div>
        <h2 className="text-base font-semibold">What do you want to know?</h2>
        <p className="mt-1 text-xs text-muted-foreground">Ask about friends, batches and subjects — or type your own.</p>
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
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "USER";

  // A failed turn is shown as a proper bubble, not a stray label under an empty one.
  if (!isUser && message.error && !message.content) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[88%] rounded-2xl rounded-tl-sm border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-sm leading-relaxed text-foreground">
          {message.error}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[88%] flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
            isUser
              ? "whitespace-pre-wrap rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm border border-border bg-card text-foreground",
          )}
        >
          {isUser ? message.content : message.content ? <AssistantMarkdown content={message.content} /> : message.streaming ? <Thinking /> : null}
        </div>
        {!isUser && message.error && message.content && (
          <div className="max-w-full rounded-2xl rounded-tl-sm border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-sm leading-relaxed text-foreground">
            {message.error}
          </div>
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
            <div className="my-1.5 overflow-x-auto rounded-lg border border-border">
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

function Thinking() {
  return (
    <span className="inline-flex items-center gap-2 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Looking that up…
    </span>
  );
}
