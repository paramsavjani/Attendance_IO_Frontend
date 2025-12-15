import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { API_CONFIG } from "@/lib/api";

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
  handleGoogleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(() => {
    const saved = localStorage.getItem("student");
    return saved ? JSON.parse(saved) : null;
  });

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.USER_CHECK, {
        method: "GET",
        credentials: "include", // Important for cookies/sessions
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          // Fetch user details
          await fetchUserDetails();
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      // Silently fail - user might not be logged in
    }
  };

  const fetchUserDetails = async () => {
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.USER_ME, {
        method: "GET",
        credentials: "include",
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
        localStorage.setItem("student", JSON.stringify(studentData));
      } else if (response.status === 404) {
        // Student not found in database
        setStudent(null);
        localStorage.removeItem("student");
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error);
    }
  };

  const handleGoogleLogin = async () => {
    // Redirect to backend OAuth endpoint
    window.location.href = API_CONFIG.ENDPOINTS.OAUTH_GOOGLE;
  };

  const logout = async () => {
    try {
      await fetch(API_CONFIG.ENDPOINTS.USER_LOGOUT, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      setStudent(null);
      localStorage.removeItem("student");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        student,
        isAuthenticated: !!student,
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
