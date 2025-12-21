import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from "react";
import { API_CONFIG } from "@/lib/api";
import { Capacitor } from "@capacitor/core";
import { initializePushNotifications, clearFcmToken } from "@/lib/notifications";

interface Student {
  id: string;
  name: string;
  rollNumber?: string;
  semester?: number;
  email: string;
  pictureUrl?: string;
  sid?: string;
  phone?: string;
}

interface AuthContextType {
  student: Student | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  handleGoogleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const hasCompletedInitialCheck = useRef<boolean>(false);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.USER_ME, {
        method: "GET",
        credentials: "include", // Important for cookies/sessions
      });

      if (response.ok) {
        const userData = await response.json();
        const studentData: Student = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          rollNumber: userData.sid,
          pictureUrl: userData.pictureUrl,
          sid: userData.sid,
          phone: userData.phone,
        };
        setStudent(studentData);
        
        // Initialize push notifications after successful auth check (if on native platform)
        if (Capacitor.isNativePlatform()) {
          initializePushNotifications().catch(console.error);
        }
      } else if (response.status === 401 || response.status === 404) {
        // Not authenticated or student not found
        setStudent(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      // Silently fail - user might not be logged in
      setStudent(null);
    } finally {
      // Only set loading to false on the initial check
      if (!hasCompletedInitialCheck.current) {
        hasCompletedInitialCheck.current = true;
        setIsLoadingAuth(false);
      }
    }
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Mobile: listen for deep-link callback and exchange one-time code for a WebView session.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let remove: { remove: () => Promise<void> } | undefined;

    (async () => {
      const [{ App }, { Browser }] = await Promise.all([
        import("@capacitor/app"),
        import("@capacitor/browser"),
      ]);

      remove = await App.addListener("appUrlOpen", async ({ url }) => {
        try {
          const parsed = new URL(url);
          const code = parsed.searchParams.get("code");
          const error = parsed.searchParams.get("error");

          if (error) {
            await Browser.close();
            window.dispatchEvent(
              new CustomEvent("auth:error", { detail: decodeURIComponent(error) })
            );
            return;
          }

          if (!code) return;

          await Browser.close();

          const exchangeRes = await fetch(API_CONFIG.ENDPOINTS.OAUTH_MOBILE_EXCHANGE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ code }),
          });

          if (!exchangeRes.ok) {
            const text = await exchangeRes.text().catch(() => "");
            window.dispatchEvent(
              new CustomEvent("auth:error", {
                detail: text || "Failed to complete login. Please try again.",
              })
            );
            return;
          }

          await checkAuth();
          // Initialize push notifications after successful login
          if (Capacitor.isNativePlatform()) {
            initializePushNotifications().catch(console.error);
          }
          window.dispatchEvent(new CustomEvent("auth:success"));
        } catch (e) {
          console.error("Failed to handle appUrlOpen:", e);
        }
      });
    })();

    return () => {
      void remove?.remove();
    };
  }, [checkAuth]);

  const handleGoogleLogin = useCallback(async () => {
    // Web: normal redirect
    if (!Capacitor.isNativePlatform()) {
    window.location.href = API_CONFIG.ENDPOINTS.OAUTH_GOOGLE;
      return;
    }

    // Native app: open system browser and return via deep link.
    const { Browser } = await import("@capacitor/browser");
    const redirectUri = "com.attendanceio.app://auth";

    const url = `${API_CONFIG.ENDPOINTS.OAUTH_GOOGLE_MOBILE_START}?redirect_uri=${encodeURIComponent(
      redirectUri
    )}`;

    await Browser.open({ url });
  }, []);

  const logout = async () => {
    try {
      // Clear FCM token before logout
      if (Capacitor.isNativePlatform()) {
        await clearFcmToken();
      }
      
      await fetch(API_CONFIG.ENDPOINTS.USER_LOGOUT, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      setStudent(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        student,
        isAuthenticated: !!student,
        isLoadingAuth,
        handleGoogleLogin,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
