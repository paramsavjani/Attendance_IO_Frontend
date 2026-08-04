import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Github, Star } from "lucide-react";

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

/**
 * Server-driven "star the repo(s)" prompt. Purpose-built (not the generic feature-card
 * ServerPopup) to match the clean, branded look of UpdateDialog/RateAppServerPopup:
 * icon badge + short copy + one or two full-width branded buttons.
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
        className="sm:max-w-[400px] max-w-[92vw]"
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
        <AlertDialogHeader className="items-center text-center space-y-3">
          <div className="p-3 rounded-2xl bg-foreground/5 border border-border/60">
            <Github className="h-7 w-7" />
          </div>
          <AlertDialogTitle className="text-lg font-bold tracking-tight">
            {title}
          </AlertDialogTitle>
          {subtitle && (
            <AlertDialogDescription asChild>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[32ch]">
                {subtitle}
              </p>
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col sm:flex-col gap-2 sm:justify-start sm:space-x-0">
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onPrimary();
            }}
            className="w-full h-11 rounded-xl gap-2 font-semibold text-sm bg-foreground hover:bg-foreground/90 text-background shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Star className="h-4 w-4 fill-current" strokeWidth={2} />
            {primaryLabel}
          </AlertDialogAction>

          {secondaryLabel && onSecondary && (
            <Button
              variant="outline"
              className="w-full h-11 rounded-xl gap-2 font-semibold text-sm"
              onClick={onSecondary}
            >
              <Star className="h-4 w-4" strokeWidth={2} />
              {secondaryLabel}
            </Button>
          )}

          {showDismiss && dismissLabel && (
            <AlertDialogCancel
              onClick={onLater}
              className="w-full h-9 rounded-xl text-xs text-muted-foreground border-0 shadow-none hover:bg-transparent hover:text-foreground mt-0"
            >
              {dismissLabel}
            </AlertDialogCancel>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
