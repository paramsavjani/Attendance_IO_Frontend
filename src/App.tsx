import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AttendanceProvider, useAttendance } from "@/contexts/AttendanceContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AndroidWebViewBlock } from "@/components/AndroidWebViewBlock";
import { UpdateDialog } from "@/components/UpdateDialog";
import { NotificationPermissionGate } from "@/components/NotificationPermissionGate";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Timetable from "./pages/Timetable";
import LabTutorial from "./pages/LabTutorial";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import Analytics from "./pages/Analytics";
import SubjectOnboarding from "./pages/SubjectOnboarding";
import Intro from "./pages/Intro";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DeleteAccount from "./pages/DeleteAccount";
import ErrorOldVersion from "./pages/ErrorOldVersion";
import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";
import { checkAppUpdate, type AppUpdateResponse } from "@/lib/api";

const queryClient = new QueryClient();

/**
 * Component to handle app update checks on launch
 */
function AppUpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState<AppUpdateResponse | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check for updates on app launch
    const checkUpdate = async () => {
      try {
        const result = await checkAppUpdate();
        if (result && result.isUpdateRequired) {
          setUpdateInfo(result);
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Failed to check app update:", error);
      }
    };

    // Small delay to ensure app is fully loaded
    const timer = setTimeout(() => {
      checkUpdate();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    if (updateInfo && !updateInfo.isCritical) {
      setIsOpen(false);
    }
  };

  if (!updateInfo) {
    return null;
  }

  return (
    <UpdateDialog
      open={isOpen}
      isCritical={updateInfo.isCritical}
      title={updateInfo.title}
      message={updateInfo.message}
      onDismiss={handleDismiss}
    />
  );
}

function AppRoutes() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const { hasCompletedOnboarding, hasSeenIntro, isLoadingEnrolledSubjects } = useAttendance();
  const location = useLocation();
  
  // Don't show popups/announcements on error page
  const isErrorPage = location.pathname === "/error-old-version";

  // Show loading while checking authentication status
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center safe-area-top" style={{ backgroundColor: '#000', color: '#fff' }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Wait for enrolled subjects to load before making routing decisions
  // Only show loading if authenticated (unauthenticated users should see login)
  if (isAuthenticated && isLoadingEnrolledSubjects) {
    return (
      <div className="min-h-screen flex items-center justify-center safe-area-top" style={{ backgroundColor: '#000', color: '#fff' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <>
      {!isErrorPage && <AndroidWebViewBlock />}
      {!isErrorPage && <AppUpdateChecker />}
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated 
              ? hasCompletedOnboarding 
                ? <Navigate to="/dashboard" replace /> 
                : hasSeenIntro
                  ? <Navigate to="/onboarding" replace />
                  : <Navigate to="/intro" replace />
              : <Navigate to="/login" replace />
          }
        />
      <Route path="/login" element={<Login />} />
      <Route path="/error-old-version" element={<ErrorOldVersion />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/delete-account" element={<DeleteAccount />} />
      <Route
        path="/intro"
        element={
          <ProtectedRoute>
            {hasCompletedOnboarding ? <Navigate to="/dashboard" replace /> : <Intro />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            {hasCompletedOnboarding 
              ? <Navigate to="/dashboard" replace /> 
              : !hasSeenIntro 
                ? <Navigate to="/intro" replace />
                : <SubjectOnboarding />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {hasCompletedOnboarding ? <Dashboard /> : <Navigate to="/onboarding" replace />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/timetable"
        element={
          <ProtectedRoute>
            <Timetable />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lab-tutorial"
        element={
          <ProtectedRoute>
            {hasCompletedOnboarding ? <LabTutorial /> : <Navigate to="/onboarding" replace />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <Search />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AttendanceProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <NotificationPermissionGate>
            {Capacitor.isNativePlatform() ? (
              <HashRouter>
                <AppRoutes />
              </HashRouter>
            ) : (
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
            )}
            {!Capacitor.isNativePlatform() && <VercelAnalytics />}
          </NotificationPermissionGate>
        </TooltipProvider>
      </AttendanceProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
