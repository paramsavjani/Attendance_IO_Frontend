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
import AppAnalyticsPage from "./pages/AppAnalyticsPage";
import Search from "./pages/Search";
import Analytics from "./pages/Analytics";
import SubjectAnalysis from "./pages/SubjectAnalysis";
import SubjectAnalysisDetail from "./pages/SubjectAnalysisDetail";
import SubjectOnboarding from "./pages/SubjectOnboarding";
import Intro from "./pages/Intro";
import NotFound from "./pages/NotFound";
import BackendUpdating from "./pages/BackendUpdating";
import NoInternet from "./pages/NoInternet";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DeleteAccount from "./pages/DeleteAccount";
import ErrorOldVersion from "./pages/ErrorOldVersion";
import { FeatureAnnouncement } from "@/components/FeatureAnnouncement";
import { Capacitor } from "@capacitor/core";
import { useEffect, useRef, useState } from "react";
import { API_CONFIG, checkAppUpdate, type AppUpdateResponse } from "@/lib/api";
import { requestAppReview } from "@/lib/in-app-review";

const queryClient = new QueryClient();

const NON_CRITICAL_UPDATE_SHOWN_DATE_KEY = "attendance_io_non_critical_update_shown_date";
const LAST_REVIEW_PROMPT_DATE_KEY = "attendance_io_last_review_prompt_date";
const REVIEW_PROMPT_INTERVAL_DAYS = 35;

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function shouldShowNonCriticalUpdateToday(): boolean {
  try {
    const lastShown = localStorage.getItem(NON_CRITICAL_UPDATE_SHOWN_DATE_KEY);
    const today = getTodayDateString();
    return lastShown !== today;
  } catch {
    return true;
  }
}

function markNonCriticalUpdateShownToday(): void {
  try {
    localStorage.setItem(NON_CRITICAL_UPDATE_SHOWN_DATE_KEY, getTodayDateString());
  } catch {
    // ignore
  }
}

function getLastReviewPromptDate(): string | null {
  try {
    return localStorage.getItem(LAST_REVIEW_PROMPT_DATE_KEY);
  } catch {
    return null;
  }
}

function shouldShowReviewPrompt(): boolean {
  const last = getLastReviewPromptDate();
  if (!last) return true;
  const lastDate = new Date(last);
  const now = new Date();
  const daysSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= REVIEW_PROMPT_INTERVAL_DAYS;
}

function markReviewPromptShown(): void {
  try {
    localStorage.setItem(LAST_REVIEW_PROMPT_DATE_KEY, new Date().toISOString());
  } catch {
    // ignore
  }
}

/**
 * Prompts in-app review every 2 days on app open (native only). Does not redirect to Play Store.
 */
function InAppReviewPrompt() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !shouldShowReviewPrompt()) return;
    const timer = setTimeout(() => {
      requestAppReview();
      markReviewPromptShown();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  return null;
}

/**
 * Component to handle app update checks on launch.
 * Critical updates: shown every time.
 * Non-critical updates: shown only on the first app open of each day.
 */
function AppUpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState<AppUpdateResponse | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check for updates on app launch
    const checkUpdate = async () => {
      try {
        const result = await checkAppUpdate();
        if (!result || !result.isUpdateRequired) return;

        // Critical update: always show
        if (result.isCritical) {
          setUpdateInfo(result);
          setIsOpen(true);
          return;
        }

        // Non-critical: show only on first open of the day
        if (shouldShowNonCriticalUpdateToday()) {
          markNonCriticalUpdateShownToday();
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
      markNonCriticalUpdateShownToday();
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

import { MainLayout } from "@/components/layout/MainLayout";

function AppRoutes() {
  const { isAuthenticated, isLoadingAuth, checkAuth } = useAuth();
  const { hasCompletedOnboarding, hasSeenIntro, isLoadingEnrolledSubjects } = useAttendance();
  const location = useLocation();
  const isNativeApp = Capacitor.isNativePlatform();
  const [isOfflineOnNative, setIsOfflineOnNative] = useState(
    isNativeApp && typeof navigator !== "undefined" ? !navigator.onLine : false
  );
  const [isBackendAvailableOnNative, setIsBackendAvailableOnNative] = useState<boolean | null>(
    isNativeApp ? null : true
  );
  // Track previous backend state so we know when it transitions to available
  const prevBackendAvailableRef = useRef<boolean | null>(isNativeApp ? null : true);

  // Don't show popups/announcements on error page
  const isErrorPage = location.pathname === "/error-old-version";

  // Track online/offline state
  useEffect(() => {
    if (!isNativeApp) return;

    const updateNetworkState = () => {
      setIsOfflineOnNative(!navigator.onLine);
    };

    updateNetworkState();
    window.addEventListener("online", updateNetworkState);
    window.addEventListener("offline", updateNetworkState);

    return () => {
      window.removeEventListener("online", updateNetworkState);
      window.removeEventListener("offline", updateNetworkState);
    };
  }, [isNativeApp]);

  // When internet is available, check backend health with retries.
  // Retries prevent false "Backend Updating" flashes right after the network
  // comes back (the OS fires "online" before the route is actually usable).
  useEffect(() => {
    if (!isNativeApp) return;

    if (isOfflineOnNative) {
      setIsBackendAvailableOnNative(null);
      return;
    }

    let isCancelled = false;
    const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));
    // Delays before retry 1, 2, 3 (ms)
    const retryDelays = [1500, 3000, 5000];

    const checkWithRetries = async () => {
      setIsBackendAvailableOnNative(null);

      for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
        if (isCancelled) return;

        // Wait before every attempt except the first
        if (attempt > 0) {
          await sleep(retryDelays[attempt - 1]);
          if (isCancelled) return;
        }

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const response = await fetch(`${API_CONFIG.BASE_URL}/actuator/health`, {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!isCancelled && response.ok) {
            setIsBackendAvailableOnNative(true);
            return;
          }
        } catch {
          // swallow and retry
        }
      }

      if (!isCancelled) {
        setIsBackendAvailableOnNative(false);
      }
    };

    checkWithRetries();

    return () => {
      isCancelled = true;
    };
  }, [isNativeApp, isOfflineOnNative]);

  // While "Backend Updating" is visible, keep polling every 15 s.
  // When the backend comes back the screen disappears automatically — no manual refresh needed.
  useEffect(() => {
    if (!isNativeApp || isBackendAvailableOnNative !== false) return;

    let isCancelled = false;

    const poll = async () => {
      if (isCancelled) return;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${API_CONFIG.BASE_URL}/actuator/health`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!isCancelled && response.ok) {
          setIsBackendAvailableOnNative(true);
        }
      } catch {
        // still down, keep waiting
      }
    };

    const intervalId = setInterval(poll, 15_000);
    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [isNativeApp, isBackendAvailableOnNative]);

  // When backend transitions from unavailable/loading → available, re-run auth
  // so a user with a valid token lands on the dashboard, not the login page.
  useEffect(() => {
    if (
      isNativeApp &&
      isBackendAvailableOnNative === true &&
      prevBackendAvailableRef.current !== true
    ) {
      checkAuth();
    }
    prevBackendAvailableRef.current = isBackendAvailableOnNative;
  }, [isNativeApp, isBackendAvailableOnNative, checkAuth]);

  if (isOfflineOnNative) {
    return <NoInternet />;
  }

  if (isNativeApp && isBackendAvailableOnNative === null) {
    return (
      <div className="min-h-screen flex items-center justify-center safe-area-top" style={{ backgroundColor: '#000', color: '#fff' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (isNativeApp && isBackendAvailableOnNative === false) {
    return <BackendUpdating />;
  }

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
      {!isErrorPage && isAuthenticated && <InAppReviewPrompt />}
      {!isErrorPage && isAuthenticated && <FeatureAnnouncement />}
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

        {/* Protected Routes with Persistent MainLayout */}
        <Route element={<MainLayout />}>
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
            path="/app-analytics"
            element={
              <ProtectedRoute>
                <AppAnalyticsPage />
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
          <Route
            path="/subject-analysis"
            element={
              <ProtectedRoute>
                <SubjectAnalysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subject-analysis/:subjectCode"
            element={
              <ProtectedRoute>
                <SubjectAnalysisDetail />
              </ProtectedRoute>
            }
          />
        </Route>

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
