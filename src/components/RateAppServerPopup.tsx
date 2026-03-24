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
import { GooglePlayIcon } from "@/components/icons/GooglePlayIcon";
import { Star } from "lucide-react";

export interface RateAppPopupFeature {
  title: string;
  description: string;
}

type RateAppServerPopupProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  features: RateAppPopupFeature[];
  primaryLabel: string;
  /** Store listing (Play button) vs in-app review sheet */
  reviewAction: "rate_app" | "in_app_review";
  showDismiss: boolean;
  dismissLabel: string | null;
  onLater: () => void;
  onPrimary: () => void;
};

/**
 * Server-driven “rate the app” prompt. Matches the update-available AlertDialog
 * pattern (title + body + Play-style primary + optional Later) — not the feature announcement carousel.
 */
export function RateAppServerPopup({
  open,
  title,
  subtitle,
  features,
  primaryLabel,
  reviewAction,
  showDismiss,
  dismissLabel,
  onLater,
  onPrimary,
}: RateAppServerPopupProps) {
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
        className="sm:max-w-[425px] max-w-[95vw]"
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
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold tracking-tight">{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-base text-muted-foreground pt-2 space-y-3">
              {subtitle ? <p className="leading-relaxed">{subtitle}</p> : null}
              {features.length > 0 ? (
                <div className="space-y-2.5 text-sm leading-relaxed">
                  {features.map((f, i) => (
                    <p key={i}>
                      <span className="font-medium text-foreground">{f.title}</span>
                      <span className="text-muted-foreground"> — {f.description}</span>
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          {showDismiss && dismissLabel ? (
            <AlertDialogCancel
              onClick={onLater}
              className="w-full sm:w-auto sm:mr-auto order-2 sm:order-1"
            >
              {dismissLabel}
            </AlertDialogCancel>
          ) : null}
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onPrimary();
            }}
            className="w-full sm:w-auto order-1 sm:order-2 flex items-center justify-center gap-2 bg-foreground hover:bg-foreground/90 text-background font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {reviewAction === "rate_app" ? (
              <>
                <GooglePlayIcon className="w-5 h-5" />
                <span>{primaryLabel}</span>
              </>
            ) : (
              <>
                <Star className="h-5 w-5 text-amber-400" strokeWidth={2} />
                <span>{primaryLabel}</span>
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
