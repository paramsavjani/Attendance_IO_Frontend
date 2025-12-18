import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AttendanceProvider, useAttendance } from "@/contexts/AttendanceContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Timetable from "./pages/Timetable";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import Analytics from "./pages/Analytics";
import SubjectOnboarding from "./pages/SubjectOnboarding";
import NotFound from "./pages/NotFound";
import { Capacitor } from "@capacitor/core";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  const { hasCompletedOnboarding, isLoadingEnrolledSubjects } = useAttendance();

  // Wait for enrolled subjects to load before making routing decisions
  // Only show loading if authenticated (unauthenticated users should see login)
  if (isAuthenticated && isLoadingEnrolledSubjects) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000', color: '#fff' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated 
            ? hasCompletedOnboarding 
              ? <Navigate to="/dashboard" replace /> 
              : <Navigate to="/onboarding" replace />
            : <Navigate to="/login" replace />
        }
      />
      <Route path="/login" element={<Login />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <SubjectOnboarding />
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
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AttendanceProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
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
        </TooltipProvider>
      </AttendanceProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
