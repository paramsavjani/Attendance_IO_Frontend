import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Hash, BookOpen, LogOut, Shield } from "lucide-react";

export default function Profile() {
  const { student, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const profileFields = [
    {
      icon: User,
      label: "Full Name",
      value: student?.name,
    },
    {
      icon: Mail,
      label: "Email Address",
      value: student?.email,
    },
    {
      icon: Hash,
      label: "Roll Number",
      value: student?.rollNumber,
    },
    {
      icon: BookOpen,
      label: "Current Semester",
      value: `Semester ${student?.semester}`,
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Profile</h1>
          <p className="text-muted-foreground">
            Your account information
          </p>
        </div>

        {/* Profile Card */}
        <div className="glass-card rounded-xl p-6 animate-slide-up">
          {/* Avatar Section */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {student?.name?.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold">{student?.name}</h2>
              <p className="text-sm text-muted-foreground">{student?.rollNumber}</p>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Profile Fields */}
          <div className="space-y-4">
            {profileFields.map((field, index) => (
              <div
                key={field.label}
                className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <field.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{field.label}</p>
                  <p className="font-medium">{field.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="glass-card rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Your data is private</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your attendance data is only visible to you. No other students can access
              your records.
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </Button>
      </div>
    </AppLayout>
  );
}
