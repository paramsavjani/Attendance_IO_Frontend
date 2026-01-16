import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, Mail } from "lucide-react";

interface DemoBannerProps {
  isDemo: boolean;
}

export function DemoBanner({ isDemo }: DemoBannerProps) {
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (isDemo) {
      // Check if user has dismissed the demo dialog
      const hasDismissedDemoDialog = localStorage.getItem("hasDismissedDemoDialog");
      if (!hasDismissedDemoDialog) {
        setShowDialog(true);
      }
    } else {
      setShowDialog(false);
    }
  }, [isDemo]);

  const handleGotIt = () => {
    localStorage.setItem("hasDismissedDemoDialog", "true");
    setShowDialog(false);
  };

  if (!isDemo) {
    return null;
  }

  return (
    <>
      <Dialog 
        open={showDialog} 
        onOpenChange={(open) => {
          // Prevent closing by clicking outside or pressing ESC
          // User must click "Got it" button
          if (!open) {
            return;
          }
          setShowDialog(open);
        }}
      >
        <DialogContent 
          className="sm:max-w-md [&>button]:hidden" 
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Demo Mode
            </DialogTitle>
            <DialogDescription>
              You are currently viewing the application in demo mode.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert className="border-primary/50 bg-primary/5">
              <Mail className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">Want Full Access?</AlertTitle>
              <AlertDescription>
                To use all features and make changes, please sign in with a <strong>@dau.ac.in</strong> email address.
              </AlertDescription>
            </Alert>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Read-Only Access</AlertTitle>
              <AlertDescription>
                As a demo user, you can view attendance data but cannot make any changes.
              </AlertDescription>
            </Alert>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">What you can do:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>View attendance records</li>
                <li>Browse timetables</li>
                <li>Explore the dashboard</li>
              </ul>
              <p className="font-medium mt-4">What you cannot do:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Mark attendance</li>
                <li>Update settings</li>
                <li>Modify any data</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleGotIt} className="w-full">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
