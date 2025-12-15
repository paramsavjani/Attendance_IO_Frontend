import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { LogOut, User, GraduationCap, Hash, Settings } from "lucide-react";

export default function Profile() {
  const { student, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center pt-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-xl font-bold">{student?.name}</h1>
          <p className="text-muted-foreground">{student?.rollNumber}</p>
        </div>

        {/* Info Cards */}
        <div className="space-y-3">
          <div className="bg-card rounded-xl p-4 border border-border flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Hash className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Roll Number</p>
              <p className="font-medium">{student?.rollNumber}</p>
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Semester</p>
              <p className="font-medium">Semester {student?.semester}</p>
            </div>
          </div>

          <button 
            onClick={() => navigate("/timetable")}
            className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 text-left"
          >
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Timetable</p>
              <p className="font-medium">Manage your schedule</p>
            </div>
          </button>
        </div>

        {/* Logout */}
        <Button
          variant="destructive"
          onClick={handleLogout}
          className="w-full py-6 rounded-xl"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </div>
    </AppLayout>
  );
}
