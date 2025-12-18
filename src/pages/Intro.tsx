import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  CalendarCheck, 
  Clock, 
  BarChart3, 
  Search, 
  AlertTriangle, 
  ChevronRight,
  BookOpen,
  Zap,
  Shield,
  Sparkles
} from "lucide-react";

export default function Intro() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/onboarding");
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-16">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 text-center max-w-lg mx-auto">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-8 shadow-lg animate-scale-in">
            <BookOpen className="w-10 h-10 text-primary-foreground" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
            <span className="text-gradient">Attendance Aid</span>
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Your personal attendance tracker while you wait for official institute records
          </p>

          <div className="flex flex-col gap-3 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="w-full py-6 text-lg font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105"
            >
              Get Started
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground">
              Scroll down to learn more
            </p>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-muted-foreground/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* What is this app */}
      <section className="px-6 py-16 bg-card/30">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">What is Attendance Aid?</h2>
          </div>
          
          <div className="space-y-4 text-muted-foreground">
            <p className="leading-relaxed">
              Attendance Aid helps you <span className="text-foreground font-medium">track your daily attendance</span> while 
              waiting for your institute's official records.
            </p>
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  <span className="text-warning font-medium">Remember:</span> Institute attendance is always final and correct. 
                  This app helps you estimate and plan until official records are available.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Auto Timetable Generation */}
      <section className="px-6 py-16">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-accent" />
            </div>
            <h2 className="text-2xl font-bold">Smart Timetable</h2>
          </div>

          <div className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              When you select your subjects during setup, a <span className="text-foreground font-medium">timetable is automatically generated</span> based on default schedules.
            </p>

            {/* Demo placeholder */}
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="p-4 bg-secondary/30 border-b border-border">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Your Weekly Schedule</span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {["9:00 AM - Mathematics", "10:00 AM - Physics", "11:00 AM - Chemistry", "2:00 PM - Computer Science"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                    <div className={`w-2 h-8 rounded-full ${i % 2 === 0 ? 'bg-primary' : 'bg-accent'}`} />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Conflict Detection</p>
                  <p className="text-sm text-muted-foreground">
                    If multiple subjects are scheduled at the same time, the app detects and shows you these conflicts so you can resolve them manually.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Attendance Tracking */}
      <section className="px-6 py-16 bg-card/30">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <CalendarCheck className="w-6 h-6 text-success" />
            </div>
            <h2 className="text-2xl font-bold">Daily Attendance</h2>
          </div>

          <div className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              Mark your attendance with a single tap. Track whether you attended, missed, or if a class was cancelled.
            </p>

            {/* Demo card */}
            <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
              {[
                { subject: "Mathematics", status: "present", color: "bg-success" },
                { subject: "Physics", status: "absent", color: "bg-destructive" },
                { subject: "Chemistry", status: "cancelled", color: "bg-warning" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-8 rounded-full ${item.color}`} />
                    <span className="text-sm font-medium">{item.subject}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    item.status === 'present' ? 'bg-success/20 text-success' :
                    item.status === 'absent' ? 'bg-destructive/20 text-destructive' :
                    'bg-warning/20 text-warning'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Official institute attendance will overwrite your calculated attendance when available
            </p>
          </div>
        </div>
      </section>

      {/* Search and Analysis */}
      <section className="px-6 py-16">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Search & Analytics</h2>
          </div>

          <div className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              Search through your attendance history and analyze your performance across subjects.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Classes", value: "48", icon: BookOpen },
                { label: "Present", value: "42", icon: CalendarCheck },
                { label: "Attendance", value: "87.5%", icon: BarChart3 },
                { label: "This Week", value: "12", icon: Clock },
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-xl bg-card border border-border text-center">
                  <stat.icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Attendance Criteria & Warnings */}
      <section className="px-6 py-16 bg-card/30">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
            <h2 className="text-2xl font-bold">Smart Warnings</h2>
          </div>

          <div className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              Set your minimum attendance criteria for each subject. Get <span className="text-foreground font-medium">visual warnings</span> when you're at risk.
            </p>

            {/* Warning demo */}
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <div>
                      <p className="text-sm font-medium">Physics</p>
                      <p className="text-xs text-muted-foreground">Below 75% threshold</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-destructive">68%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <CalendarCheck className="w-4 h-4 text-success" />
                    <div>
                      <p className="text-sm font-medium">Mathematics</p>
                      <p className="text-xs text-muted-foreground">Above threshold</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-success">92%</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Low-attendance subjects are highlighted in your timetable so you know which classes are <span className="text-foreground font-medium">important to attend</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          
          <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-muted-foreground mb-8">
            Select your subjects and let the app handle the rest
          </p>
          
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="w-full max-w-xs py-6 text-lg font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105"
          >
            Continue to Setup
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer spacer */}
      <div className="h-8" />
    </div>
  );
}