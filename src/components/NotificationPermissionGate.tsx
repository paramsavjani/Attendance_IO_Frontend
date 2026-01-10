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
  // Start with blocked=true on native platforms to be safe (will be updated after check)
  const [isBlocked, setIsBlocked] = useState(Capacitor.isNativePlatform());
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
      console.log('[NotificationGate] Permission status:', status);
      setPermissionStatus(status);
      
      // Only allow through if permission is explicitly granted
      // Block for 'denied', 'prompt', or null (unknown)
      if (status === 'granted') {
        console.log('[NotificationGate] Permission granted, allowing access');
        setIsBlocked(false);
      } else {
        // Block for denied, prompt, or any other state (including null)
        console.log('[NotificationGate] Permission not granted, blocking access. Status:', status);
        setIsBlocked(true);
      }
    } catch (error) {
      console.error('[NotificationGate] Error checking permission:', error);
      // On error, block to be safe (we can't verify permission is granted)
      console.log('[NotificationGate] Error checking permission, blocking to be safe');
      setIsBlocked(true);
      setPermissionStatus(null);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Check permission on mount
    checkPermissionStatus();

    // Also check when app comes back to foreground (in case user changed settings)
    let listener: any = null;
    
    if (Capacitor.isNativePlatform()) {
      const setupAppStateListener = async () => {
        try {
          const { App } = await import('@capacitor/app');
          listener = await App.addListener('appStateChange', (state) => {
            if (state.isActive) {
              // App came to foreground, re-check permission
              console.log('[NotificationGate] App came to foreground, re-checking permission');
              checkPermissionStatus();
            }
          });
        } catch (error) {
          console.error('[NotificationGate] Error setting up app state listener:', error);
        }
      };

      setupAppStateListener();
    }

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    setError(null);

    try {
      const token = await requestNotificationPermission();
      
      // Re-check permission status after requesting
      const newStatus = await checkNotificationPermission();
      console.log('[NotificationGate] After request, permission status:', newStatus);
      setPermissionStatus(newStatus);
      
      if (token || newStatus === 'granted') {
        // Permission granted successfully
        console.log('[NotificationGate] Permission granted after request, allowing access');
        setIsBlocked(false);
      } else {
        // Permission was denied or still not granted - keep blocking
        console.log('[NotificationGate] Permission not granted after request, keeping blocked. Status:', newStatus);
        setIsBlocked(true);
        setError("Notification permission was denied. Please enable it in your device settings to continue.");
      }
    } catch (error) {
      console.error('[NotificationGate] Error requesting permission:', error);
      // On error, keep blocking
      setIsBlocked(true);
      setError("Notification permission was denied. Please enable it in your device settings to continue.");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleOpenSettings = async () => {
    // Show instructions - opening settings programmatically is not reliable
    setError("Notification permission was denied. Please enable it in your device settings to continue.");
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
