import { API_CONFIG, authenticatedFetch } from "./api";
import { getToken } from "./token";

/**
 * Client for the attendance assistant (`/api/agent/*`).
 *
 * The server keeps each thread's recent history; the page only holds the conversation id it
 * gets back in the first META event. Streaming is Server-Sent Events over a POST with a Bearer
 * token, which `EventSource` cannot do, so the stream is read with `fetch` and parsed by hand.
 */

export type AgentMessageRole = "USER" | "ASSISTANT";

export interface AgentToolCall {
  name: string;
  arguments: Record<string, unknown>;
  durationMs: number;
  error?: string | null;
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
  | (AgentEventBase & {
      type: "DONE";
      toolCalls: AgentToolCall[];
      latencyMs: number;
      firstTokenMs?: number | null;
      usage?: AgentTokenUsage | null;
    })
  | (AgentEventBase & { type: "ERROR"; error: string });

export interface AgentStoredMessage {
  role: AgentMessageRole;
  content: string;
  at: string;
  turnId?: string | null;
  toolNames?: string[] | null;
  latencyMs?: number | null;
}

export interface AgentConversation {
  conversationId: string;
  messages: AgentStoredMessage[];
}

export interface StreamAgentChatOptions {
  message: string;
  /** Omit to start a new thread; the META event carries the id to send next time. */
  conversationId?: string | null;
  onEvent: (event: AgentStreamEvent) => void;
  signal?: AbortSignal;
}

const AGENT_BASE = `${API_CONFIG.BASE_URL}/api/agent`;

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
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, conversationId: conversationId ?? undefined }),
    signal,
  });

  if (response.status === 401) throw new Error("Please sign in again.");
  if (!response.ok || !response.body) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      detail = body?.message || body?.error || detail;
    } catch {
      /* non-JSON error body */
    }
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

/** The stored thread, for restoring a conversation the page only remembers the id of. */
export async function getAgentConversation(conversationId: string): Promise<AgentConversation> {
  const response = await authenticatedFetch(`${AGENT_BASE}/conversations/${encodeURIComponent(conversationId)}`, {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return (await response.json()) as AgentConversation;
}
