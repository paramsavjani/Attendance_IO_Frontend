import { createContext, useContext, useState, ReactNode } from "react";

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  semester: number;
  email: string;
}

interface AuthContextType {
  student: Student | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(() => {
    const saved = localStorage.getItem("student");
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulated API call - in production, this would call your backend
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    if (email && password.length >= 6) {
      const mockStudent: Student = {
        id: "mock-id",
        name: "Alex Johnson",
        rollNumber: "CS2024001",
        semester: 4,
        email: email,
      };
      setStudent(mockStudent);
      localStorage.setItem("student", JSON.stringify(mockStudent));
      return true;
    }
    return false;
  };

  const logout = () => {
    setStudent(null);
    localStorage.removeItem("student");
  };

  return (
    <AuthContext.Provider
      value={{
        student,
        isAuthenticated: !!student,
        login,
        logout,
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
