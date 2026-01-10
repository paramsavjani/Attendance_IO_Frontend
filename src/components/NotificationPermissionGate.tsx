import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, AlertCircle } from "lucide-react";
import { checkNotificationPermission, requestNotificationPermission } from "@/lib/notifications";

export function NotificationPermissionGate({ children }: { children: React.ReactNode }) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkPermissionStatus = async () => {
    // Only check on native platforms
    if (!Capacitor.isNativePlatform()) {
      setIsBlocked(false);
      setIsChecking(false);
      return;
    }

    try {
      const status = await checkNotificationPermission();
      setPermissionStatus(status);
      
      if (status === 'granted') {
        setIsBlocked(false);
      } else if (status === 'denied' || status === 'prompt') {
        setIsBlocked(true);
      } else {
        // If check failed, allow through (don't block on error)
        console.warn('[NotificationGate] Failed to check permission, allowing through');
        setIsBlocked(false);
      }
    } catch (error) {
      console.error('[NotificationGate] Error checking permission:', error);
      // Don't block on error
      setIsBlocked(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    setError(null);

    try {
      const token = await requestNotificationPermission();
      
      // Re-check permission status after requesting
      const newStatus = await checkNotificationPermission();
      setPermissionStatus(newStatus);
      
      if (token || newStatus === 'granted') {
        // Permission granted successfully
        setIsBlocked(false);
      } else if (newStatus === 'denied') {
        // Permission was denied - user needs to go to settings
        setError("Notification permission was denied. Please enable it in your device settings to continue.");
      } else {
        // Still in prompt state or failed
        setError("Please allow notification permission to continue using the app.");
      }
    } catch (error) {
      console.error('[NotificationGate] Error requesting permission:', error);
      setError("Failed to request notification permission. Please try again.");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleOpenSettings = async () => {
    // Show instructions - opening settings programmatically is not reliable
    const platform = Capacitor.getPlatform();
    if (platform === 'android') {
      setError("Please go to: Settings → Apps → Attendance IO → Notifications → Enable notifications");
    } else if (platform === 'ios') {
      setError("Please go to: Settings → Attendance IO → Notifications → Allow Notifications");
    } else {
      setError("Please manually open your device settings and enable notifications for this app.");
    }
  };

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000', color: '#fff' }}>
        <div>Loading...</div>
      </div>
    );
  }

  // If not blocked, render children normally
  if (!isBlocked) {
    return <>{children}</>;
  }

  // Show blocking dialog
  return (
    <>
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[500px] max-w-[95vw] rounded-lg p-6 [&>button]:hidden">
          <DialogHeader className="space-y-3">
            <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-primary/10 mb-2">
              <Bell className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">
              Notification Permission Required
            </DialogTitle>
            <DialogDescription className="text-base text-center text-muted-foreground">
              To provide you with important attendance reminders and sleep notifications, we need notification permission.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Why we need this:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                <li>Wake-up reminders before your first lecture</li>
                <li>Critical attendance alerts for important classes</li>
                <li>Sleep schedule notifications</li>
                <li>Real-time attendance updates</li>
              </ul>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2">
            {permissionStatus === 'denied' ? (
              <>
                <Button
                  onClick={handleOpenSettings}
                  className="w-full"
                  size="lg"
                >
                  Open Settings
                </Button>
                <Button
                  onClick={checkPermissionStatus}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  I've Enabled It
                </Button>
              </>
            ) : (
              <Button
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="w-full"
                size="lg"
              >
                {isRequesting ? "Requesting Permission..." : "Allow Notifications"}
              </Button>
            )}
            {error && (
              <p className="text-xs text-muted-foreground text-center">
                {permissionStatus === 'denied' 
                  ? "Please enable notifications in your device settings, then tap 'I've Enabled It' above."
                  : "Please allow notification permission to continue."}
              </p>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Render children but they'll be blocked by the dialog overlay */}
      <div className="pointer-events-none opacity-50">
        {children}
      </div>
    </>
  );
}
