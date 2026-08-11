import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GitHubIcon } from "@/components/icons/GitHubIcon";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type RepoRow = {
  label: string;
  onClick: () => void;
};

type StarRepoServerPopupProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  showDismiss: boolean;
  dismissLabel: string | null;
  onLater: () => void;
};

function RepoLinkCard({ label, onClick }: RepoRow) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center gap-2.5 py-4 px-3 rounded-2xl text-center",
        "bg-card border border-border/60",
        "active:scale-[0.97]",
        "transition-transform duration-150",
      )}
    >
      <div className="relative">
        <GitHubIcon className="h-7 w-7 text-foreground" />
        <div className="absolute -bottom-1 -right-1.5 p-[3px] rounded-full bg-amber-400 ring-2 ring-card">
          <Star className="h-2 w-2 text-amber-950 fill-amber-950" />
        </div>
      </div>
      <span className="text-xs font-semibold leading-tight">{label}</span>
    </button>
  );
}

/**
 * Server-driven "star the repo(s)" prompt. Purpose-built (not the generic feature-card
 * ServerPopup): the real GitHub mark up top, then each repo as an equal-weight card
 * side by side, so it reads as "pick a repo to star" rather than a stack of buttons.
 */
export function StarRepoServerPopup({
  open,
  title,
  subtitle,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  showDismiss,
  dismissLabel,
  onLater,
}: StarRepoServerPopupProps) {
  const hasSecondary = Boolean(secondaryLabel && onSecondary);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && showDismiss && dismissLabel) {
          onLater();
        }
      }}
    >
      <AlertDialogContent
        className="sm:max-w-[380px] max-w-[92vw] p-0 overflow-hidden gap-0"
        onOpenAutoFocus={(e) => {
          // Radix AlertDialog focuses the Cancel ("Maybe later") button by default;
          // don't let that be the first thing highlighted when this opens.
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (!showDismiss) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (!showDismiss) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (!showDismiss) e.preventDefault();
        }}
      >
        <div className="relative px-6 pt-8 pb-5 flex flex-col items-center text-center overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative p-3.5 rounded-2xl bg-foreground text-background shadow-lg">
            <GitHubIcon className="h-6 w-6" />
          </div>

          <AlertDialogHeader className="relative items-center space-y-1.5 mt-4">
            <AlertDialogTitle className="text-lg font-bold tracking-tight">
              {title}
            </AlertDialogTitle>
            {subtitle && (
              <AlertDialogDescription asChild>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[30ch]">
                  {subtitle}
                </p>
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
        </div>

        <div className={cn("px-5 pb-3 grid gap-2.5", hasSecondary ? "grid-cols-2" : "grid-cols-1")}>
          <RepoLinkCard label={primaryLabel} onClick={onPrimary} />
          {hasSecondary && (
            <RepoLinkCard label={secondaryLabel as string} onClick={onSecondary as () => void} />
          )}
        </div>

        {showDismiss && dismissLabel && (
          <AlertDialogFooter className="flex-col sm:flex-col px-5 pb-5 pt-1 sm:space-x-0">
            <AlertDialogCancel
              onClick={onLater}
              className="w-full h-9 rounded-xl text-xs text-muted-foreground border-0 shadow-none bg-transparent hover:bg-transparent hover:text-muted-foreground mt-0"
            >
              {dismissLabel}
            </AlertDialogCancel>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
