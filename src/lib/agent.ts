import { API_CONFIG } from "./api";
import { getToken } from "./token";

/**
 * Client for the attendance assistant (`/api/agent/chat/stream`).
 *
 * The server keeps each thread's recent turns so follow-up questions work; the page only holds
 * the conversation id it gets back in the first META event, for as long as the page is open.
 * Streaming is Server-Sent Events over a POST with a Bearer token, which `EventSource` cannot
 * do, so the stream is read with `fetch` and parsed by hand.
 */

export type AgentMessageRole = "USER" | "ASSISTANT";

export interface AgentToolCall {
  name: string;
  arguments: Record<string, unknown>;
  durationMs: number;
  error?: string | null;
}

/** A student the answer is about, sent on DONE so the chat can show their photo. */
export interface AgentPersonCard {
  id: string;
  name: string;
  rollNumber: string;
  pictureUrl?: string | null;
}

export interface AgentTokenUsage {
  inputTokens: number;
  outputTokens: number;
}

interface AgentEventBase {
  conversationId: string;
  turnId: string;
}

export type AgentStreamEvent =
  | (AgentEventBase & { type: "META" })
  | (AgentEventBase & { type: "TOKEN"; text: string })
  /** The model started a tool; `text` is its name. Informational only. */
  | (AgentEventBase & { type: "STATUS"; text: string })
  | (AgentEventBase & {
      type: "DONE";
      toolCalls: AgentToolCall[];
      latencyMs: number;
      firstTokenMs?: number | null;
      usage?: AgentTokenUsage | null;
      people?: AgentPersonCard[] | null;
    })
  | (AgentEventBase & { type: "ERROR"; error: string });

export interface StreamAgentChatOptions {
  message: string;
  /** Omit to start a new thread; the META event carries the id to send next time. */
  conversationId?: string | null;
  onEvent: (event: AgentStreamEvent) => void;
  signal?: AbortSignal;
}

const AGENT_BASE = `${API_CONFIG.BASE_URL}/api/agent`;

/** The paid-plan question the server attaches to the daily-limit reply. */
export interface AgentSubscriptionOffer {
  priceRupees: number;
  benefits: string[];
  question: string;
}

/**
 * The daily limit (HTTP 429). Its message is a normal reply to show in the chat, not a failure —
 * and when [offer] is set it asks whether the student would buy the AI plan.
 */
export class AgentLimitError extends Error {
  constructor(
    message: string,
    readonly offer?: AgentSubscriptionOffer,
  ) {
    super(message);
    this.name = "AgentLimitError";
  }
}

/** Records the Yes/No answer to the paid-plan question; resolves to the thank-you line to show. */
export async function answerSubscriptionOffer(interested: boolean): Promise<string> {
  const token = getToken();
  const response = await fetch(`${AGENT_BASE}/subscription-interest`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ interested }),
  });
  if (!response.ok) throw new Error("Couldn't save your answer. Please try again.");
  const body = await response.json();
  return body?.message ?? "Thanks, noted!";
}

function parseSseBlock(block: string): AgentStreamEvent | null {
  const data = block
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");
  if (!data) return null;
  try {
    return JSON.parse(data) as AgentStreamEvent;
  } catch {
    return null;
  }
}

/** Opens the stream and resolves once the server has sent DONE/ERROR or closed the connection. */
export async function streamAgentChat({ message, conversationId, onEvent, signal }: StreamAgentChatOptions): Promise<void> {
  const token = getToken();
  const response = await fetch(`${AGENT_BASE}/chat/stream`, {
    method: "POST",
    credentials: "include", // session-cookie logins (web) work alongside the JWT (mobile)
    headers: {
      "Content-Type": "application/json",
      // JSON is listed too so a pre-stream refusal (e.g. the daily limit, HTTP 429) can carry a message.
      Accept: "text/event-stream, application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, conversationId: conversationId ?? undefined }),
    signal,
  });

  if (response.status === 401) throw new Error("Please sign in again.");
  if (!response.ok || !response.body) {
    let detail =
      response.status === 429
        ? "You've used all your messages for today. Come back after 12 midnight for a fresh set."
        : `${response.status} ${response.statusText}`;
    let offer: AgentSubscriptionOffer | undefined;
    try {
      const body = await response.json();
      detail = body?.message || body?.error || detail;
      offer = body?.subscriptionOffer ?? undefined;
    } catch {
      /* non-JSON error body */
    }
    if (response.status === 429) throw new AgentLimitError(detail, offer);
    throw new Error(detail);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Events are separated by a blank line; keep any trailing partial event in the buffer.
    let separator = buffer.indexOf("\n\n");
    while (separator !== -1) {
      const block = buffer.slice(0, separator);
      buffer = buffer.slice(separator + 2);
      const event = parseSseBlock(block);
      if (event) onEvent(event);
      separator = buffer.indexOf("\n\n");
    }
  }

  const trailing = parseSseBlock(buffer);
  if (trailing) onEvent(trailing);
}
