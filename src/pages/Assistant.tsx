import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, RotateCcw, Send, Square, Wrench } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { streamAgentChat, type AgentToolCall } from "@/lib/agent";

interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  toolCalls?: AgentToolCall[];
  latencyMs?: number;
  error?: string;
  streaming?: boolean;
}

const SUGGESTIONS = [
  "How is my attendance this semester?",
  "How many classes can I bunk in each subject?",
  "When did I last attend DSA?",
  "Average attendance of the 2024 batch",
  "Who has the best attendance in CT303?",
  "What classes do I have tomorrow?",
];

let nextId = 0;
const newId = () => `${Date.now()}-${nextId++}`;

function formatToolLabel(call: AgentToolCall): string {
  const args = Object.entries(call.arguments ?? {})
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${String(v)}`)
    .join(", ");
  return args ? `${call.name}(${args})` : `${call.name}()`;
}

export default function Assistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  // A fresh thread on every page open; "New" resets it mid-way. Past sessions are never shown.
  const [conversationId, setConversationId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

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

      const userMessage: ChatMessage = { id: newId(), role: "USER", content: message };
      const assistantId = newId();
      setMessages((prev) => [...prev, userMessage, { id: assistantId, role: "ASSISTANT", content: "", streaming: true }]);
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
                updateMessage(assistantId, { streaming: false, toolCalls: event.toolCalls ?? [], latencyMs: event.latencyMs });
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
          error: aborted ? undefined : err instanceof Error ? err.message : "Request failed",
          content: aborted && !m.content ? "(stopped)" : m.content,
        }));
      } finally {
        abortRef.current = null;
        setBusy(false);
        inputRef.current?.focus();
      }
    },
    [busy, conversationId, updateMessage],
  );

  const stop = () => abortRef.current?.abort();

  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setConversationId(null);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col -m-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">Assistant</h1>
            <p className="text-[11px] text-muted-foreground">Ask about attendance, subjects and classes</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={reset} disabled={messages.length === 0 && !busy}>
          <RotateCcw className="mr-1.5 h-4 w-4" />
          New chat
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pb-3">
        <div className="flex flex-col gap-3">
          {messages.length === 0 ? (
            <EmptyState onPick={(s) => void send(s)} />
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-background px-3 py-2">
        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask something… e.g. Can I bunk CT303 tomorrow?"
            rows={1}
            className="max-h-32 min-h-[42px] flex-1 resize-none bg-card"
            disabled={busy}
          />
          {busy ? (
            <Button variant="outline" size="icon" onClick={stop} title="Stop" className="h-[42px] w-[42px] shrink-0">
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="icon" onClick={() => void send(input)} disabled={!input.trim()} title="Send" className="h-[42px] w-[42px] shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-5 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Bot className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-base font-semibold">What do you want to know?</h2>
        <p className="mt-1 text-xs text-muted-foreground">Try one of these, or type your own question.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground active:scale-[0.98]"
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
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[88%] flex-col gap-1", isUser ? "items-end" : "items-start")}>
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

        {message.error && (
          <p className="rounded-md bg-destructive/10 px-2.5 py-1 text-[11px] text-destructive">{message.error}</p>
        )}

        {!isUser && !message.streaming && (message.toolCalls?.length || message.latencyMs != null) ? (
          <div className="flex flex-wrap items-center gap-1">
            {message.toolCalls?.map((call, i) => (
              <span
                key={`${call.name}-${i}`}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground",
                  call.error && "border-destructive text-destructive",
                )}
                title={call.error ?? (call.durationMs ? `${call.durationMs} ms` : undefined)}
              >
                <Wrench className="h-2.5 w-2.5" />
                {formatToolLabel(call)}
              </span>
            ))}
            {message.latencyMs != null && (
              <span className="text-[10px] text-muted-foreground">{(message.latencyMs / 1000).toFixed(1)}s</span>
            )}
          </div>
        ) : null}
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
