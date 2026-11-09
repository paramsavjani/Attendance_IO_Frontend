import { useEffect, useState } from "react";
import { Github, Loader2 } from "lucide-react";

const REPOS = ["paramsavjani/Attendance_IO_Frontend", "paramsavjani/Attendance_IO_Backend"];
// v2: lists cached before Claude was filtered out must not be shown again
const CACHE_KEY = "github_contributors_v2";
/** GitHub allows 60 unauthenticated calls an hour per IP, so the list is reused for a day. */
const CACHE_MS = 24 * 60 * 60 * 1000;

/** Claude's GitHub accounts: AI tooling, not people, so never listed as contributors. */
const HIDDEN_LOGINS = new Set(["claude", "claude[bot]", "claude-code", "claude-code[bot]", "claude-ai", "anthropic-claude"]);

export function isHiddenContributor(login: string): boolean {
  const name = login.toLowerCase();
  return HIDDEN_LOGINS.has(name) || name.startsWith("claude-") || name.includes("anthropic");
}

interface CodeContributor {
  login: string;
  avatarUrl: string;
  profileUrl: string;
  contributions: number;
}

interface GitHubContributor {
  login: string;
  avatar_url: string;
  html_url: string;
  type: string;
  contributions: number;
}

function readCache(): CodeContributor[] | null {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    return cached && Date.now() - cached.at < CACHE_MS
      ? (cached.people as CodeContributor[]).filter((p) => !isHiddenContributor(p.login))
      : null;
  } catch {
    return null;
  }
}

/** Everyone with commits in the frontend or backend repo, merged by GitHub login, most commits first. */
async function fetchContributors(signal: AbortSignal): Promise<CodeContributor[]> {
  const lists = await Promise.all(
    REPOS.map(async (repo) => {
      const res = await fetch(`https://api.github.com/repos/${repo}/contributors?per_page=100`, { signal });
      return res.ok ? ((await res.json()) as GitHubContributor[]) : [];
    })
  );
  const byLogin = new Map<string, CodeContributor>();
  for (const c of lists.flat()) {
    if (c.type !== "User") continue; // dependabot and other bots
    if (isHiddenContributor(c.login)) continue;
    const seen = byLogin.get(c.login);
    if (seen) seen.contributions += c.contributions;
    else byLogin.set(c.login, { login: c.login, avatarUrl: c.avatar_url, profileUrl: c.html_url, contributions: c.contributions });
  }
  return [...byLogin.values()].sort((a, b) => b.contributions - a.contributions);
}

export const REPO_URL = `https://github.com/${REPOS[0]}`;

/** The contributor list: null while loading, empty when GitHub could not be reached. */
export function useGitHubContributors(): CodeContributor[] | null {
  const [people, setPeople] = useState<CodeContributor[] | null>(readCache);

  useEffect(() => {
    if (people) return;
    const controller = new AbortController();
    fetchContributors(controller.signal)
      .then((list) => {
        setPeople(list);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), people: list }));
        } catch {
          // storage full or blocked: the list just loads again next time
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setPeople([]);
      });
    return () => controller.abort();
  }, [people]);

  return people;
}

/** Overlapping round photos of the first few contributors. */
export function ContributorFaces({ people, size = 28 }: { people: CodeContributor[]; size?: number }) {
  return (
    <span className="flex -space-x-2">
      {people.slice(0, 4).map((p) => (
        <img
          key={p.login}
          src={`${p.avatarUrl}${p.avatarUrl.includes("?") ? "&" : "?"}s=64`}
          alt=""
          style={{ width: size, height: size }}
          className="rounded-full border-2 border-background bg-muted object-cover"
        />
      ))}
    </span>
  );
}

/** Code contributors from GitHub; each one opens their GitHub profile. */
export function GitHubContributors() {
  const people = useGitHubContributors();

  if (people === null) {
    return (
      <div className="flex items-center justify-center py-2.5">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (people.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3.5">
      <div className="mb-3.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-tight text-foreground">Code contributors</p>
          <p className="text-[11px] text-muted-foreground">
            {people.length} {people.length === 1 ? "person" : "people"} · tap to open GitHub
          </p>
        </div>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1 rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-muted-foreground active:bg-white/[0.08]"
        >
          <Github className="h-3 w-3" /> Repo
        </a>
      </div>
      <div className="space-y-1">
        {people.map((p) => (
          <a
            key={p.login}
            href={p.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-1.5 py-1.5 transition-colors active:bg-white/[0.06] hover:bg-white/[0.04] touch-manipulation"
          >
            <img
              src={`${p.avatarUrl}${p.avatarUrl.includes("?") ? "&" : "?"}s=96`}
              alt=""
              className="h-9 w-9 shrink-0 rounded-full bg-muted object-cover"
            />
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">@{p.login}</span>
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
              {p.contributions} {p.contributions === 1 ? "commit" : "commits"}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
