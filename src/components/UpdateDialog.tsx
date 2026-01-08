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
import { Download } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

interface UpdateDialogProps {
  open: boolean;
  isCritical: boolean;
  title: string;
  message: string;
  updateUrl: string;
  onDismiss?: () => void;
}

export function UpdateDialog({
  open,
  isCritical,
  title,
  message,
  updateUrl,
  onDismiss,
}: UpdateDialogProps) {
  const handleUpdate = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Open in system browser for native apps
        await Browser.open({ url: updateUrl });
      } else {
        // Open in new tab for web
        window.open(updateUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error("Failed to open update URL:", error);
      // Fallback: try to open in current window
      if (Capacitor.isNativePlatform()) {
        window.open(updateUrl, "_blank");
      } else {
        window.location.href = updateUrl;
      }
    }
  };

  return (
    <AlertDialog 
      open={open} 
      onOpenChange={(openState) => {
        // Prevent closing if critical update
        if (isCritical && !openState) {
          return;
        }
        if (!openState && onDismiss) {
          onDismiss();
        }
      }}
    >
      <AlertDialogContent 
        className="sm:max-w-[425px] max-w-[95vw]"
        onEscapeKeyDown={(e) => {
          // Prevent escape key from closing critical updates
          if (isCritical) {
            e.preventDefault();
          }
        }}
        onPointerDownOutside={(e) => {
          // Prevent outside click from closing critical updates
          if (isCritical) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          // Prevent any outside interaction from closing critical updates
          if (isCritical) {
            e.preventDefault();
          }
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-muted-foreground pt-2">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          {!isCritical && (
            <AlertDialogCancel
              onClick={onDismiss}
              className="w-full sm:w-auto sm:mr-auto order-2 sm:order-1"
            >
              Later
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            onClick={handleUpdate}
            className="w-full sm:w-auto order-1 sm:order-2 flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            Update Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
