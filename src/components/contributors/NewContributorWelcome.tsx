import { useEffect, useState } from "react";
import { Github } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useGitHubContributors } from "@/components/contributors/GitHubContributors";

/** GitHub logins that never get a welcome: Claude's own accounts, not people. */
const NO_WELCOME = new Set(["claude", "claude[bot]", "claude-code", "claude-code[bot]", "claude-ai", "anthropic-claude"]);

/** Logins this phone has already seen, so each new contributor is welcomed once. */
const SEEN_KEY = "welcomed_contributors_v1";

function readSeen(): Set<string> | null {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

function saveSeen(logins: string[]) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(logins));
  } catch {
    // storage blocked: worst case the same welcome shows again
  }
}

/**
 * When a new person shows up in the GitHub contributors list, welcome them once with a popup.
 * The first time this runs on a phone it only remembers who is already there, so nobody sees
 * "welcome" for the people who built the app from the start.
 */
export function NewContributorWelcome() {
  const people = useGitHubContributors();
  const [newcomers, setNewcomers] = useState<NonNullable<typeof people>>([]);

  useEffect(() => {
    if (!people || people.length === 0) return;
    const seen = readSeen();
    if (!seen) {
      saveSeen(people.map((p) => p.login));
      return;
    }
    const fresh = people.filter((p) => !seen.has(p.login) && !NO_WELCOME.has(p.login.toLowerCase()));
    if (fresh.length === 0) return;

    // Wait for the app to settle, and never on top of another popup (updates, announcements).
    const timer = setInterval(() => {
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      clearInterval(timer);
      setNewcomers(fresh);
    }, 1500);
    return () => clearInterval(timer);
  }, [people]);

  const close = () => {
    if (people) saveSeen(people.map((p) => p.login));
    setNewcomers([]);
  };

  if (newcomers.length === 0) return null;
  const single = newcomers.length === 1 ? newcomers[0] : null;

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent
        className="max-w-[88vw] gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-[360px] [&>button]:hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="relative flex flex-col items-center px-6 pb-5 pt-8 text-center">
          <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 -translate-y-1/3 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="relative flex -space-x-3">
            {newcomers.slice(0, 3).map((p) => (
              <img
                key={p.login}
                src={`${p.avatarUrl}${p.avatarUrl.includes("?") ? "&" : "?"}s=160`}
                alt=""
                className="h-20 w-20 rounded-full border-4 border-background bg-muted object-cover"
              />
            ))}
            <span className="absolute -bottom-1 -right-2 text-2xl" aria-hidden="true">
              🎉
            </span>
          </div>
          <DialogTitle className="mt-4 text-lg font-bold tracking-tight">
            {single ? "New contributor" : `${newcomers.length} new contributors`}
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {single ? (
              <>
                Welcome <span className="font-semibold text-foreground">@{single.login}</span>, who just made their first
                contribution to Attendance IO. Thanks for helping build it!
              </>
            ) : (
              <>
                Welcome{" "}
                <span className="font-semibold text-foreground">{newcomers.map((p) => `@${p.login}`).join(", ")}</span>,
                who just made their first contributions to Attendance IO. Thanks for helping build it!
              </>
            )}
          </DialogDescription>
        </div>
        <div className="flex flex-col gap-2 px-5 pb-5">
          {single && (
            <a
              href={single.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-semibold text-background active:opacity-80"
            >
              <Github className="h-4 w-4" /> See their GitHub
            </a>
          )}
          <button
            type="button"
            onClick={close}
            className="h-10 rounded-xl text-sm font-medium text-muted-foreground active:bg-white/[0.06]"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
