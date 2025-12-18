import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAttendance } from "@/contexts/AttendanceContext";
import { Button } from "@/components/ui/button";
import { 
  CalendarCheck, 
  Clock, 
  BarChart3, 
  AlertTriangle, 
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Zap,
  Shield,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SlideContent {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: string;
  features?: { icon: React.ReactNode; text: string }[];
}

const slides: SlideContent[] = [
  {
    icon: <Sparkles className="w-8 h-8" />,
    title: "Welcome to Attendance Aid",
    description: "Your personal attendance tracker while you wait for official institute records.",
    highlight: "Track • Analyze • Stay Ahead",
    features: [
      { icon: <CheckCircle2 className="w-4 h-4" />, text: "Easy daily tracking" },
      { icon: <CheckCircle2 className="w-4 h-4" />, text: "Smart warnings" },
      { icon: <CheckCircle2 className="w-4 h-4" />, text: "Auto timetable" },
    ],
  },
  {
    icon: <Clock className="w-8 h-8" />,
    title: "Smart Timetable",
    description: "Select your subjects and get an auto-generated timetable based on default schedules.",
    features: [
      { icon: <CalendarCheck className="w-4 h-4" />, text: "Auto-generated from subject data" },
      { icon: <AlertTriangle className="w-4 h-4" />, text: "Conflict detection & resolution" },
      { icon: <Zap className="w-4 h-4" />, text: "Easy manual adjustments" },
    ],
  },
  {
    icon: <CalendarCheck className="w-8 h-8" />,
    title: "Daily Attendance",
    description: "Mark your attendance with a single tap. Track present, absent, or cancelled classes.",
    features: [
      { icon: <CheckCircle2 className="w-4 h-4" />, text: "One-tap marking" },
      { icon: <Shield className="w-4 h-4" />, text: "Institute data is always final" },
      { icon: <BarChart3 className="w-4 h-4" />, text: "Real-time statistics" },
    ],
  },
  {
    icon: <AlertTriangle className="w-8 h-8" />,
    title: "Smart Warnings",
    description: "Set minimum attendance criteria. Get alerts when you're at risk of falling below.",
    features: [
      { icon: <Zap className="w-4 h-4" />, text: "Per-subject thresholds" },
      { icon: <AlertTriangle className="w-4 h-4" />, text: "Visual warnings on timetable" },
      { icon: <CalendarCheck className="w-4 h-4" />, text: "Know which classes matter" },
    ],
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: "Analytics & Search",
    description: "Search your history, analyze trends, and plan your attendance strategy.",
    features: [
      { icon: <BarChart3 className="w-4 h-4" />, text: "Subject-wise breakdown" },
      { icon: <CalendarCheck className="w-4 h-4" />, text: "Historical data" },
      { icon: <CheckCircle2 className="w-4 h-4" />, text: "Export & share" },
    ],
  },
];

export default function Intro() {
  const navigate = useNavigate();
  const { markIntroAsSeen } = useAttendance();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setDirection('right');
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setDirection('left');
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleGetStarted = () => {
    markIntroAsSeen();
    navigate("/onboarding");
  };

  const handleSkip = () => {
    markIntroAsSeen();
    navigate("/onboarding");
  };

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;
  const isFirstSlide = currentSlide === 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background blur effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Skip button */}
        <button 
          onClick={handleSkip}
          className="absolute top-4 right-4 text-xs text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          Skip
        </button>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pt-6 pb-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentSlide ? 'right' : 'left');
                setCurrentSlide(index);
              }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                index === currentSlide 
                  ? "w-6 bg-primary" 
                  : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>

        {/* Slide content */}
        <div className="px-6 py-8 min-h-[380px] flex flex-col">
          <div 
            key={currentSlide}
            className={cn(
              "flex-1 flex flex-col items-center text-center",
              direction === 'right' ? "animate-slide-in-right" : "animate-slide-in-left"
            )}
          >
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
              {slide.icon}
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold mb-3">{slide.title}</h2>

            {/* Highlight badge */}
            {slide.highlight && (
              <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                {slide.highlight}
              </div>
            )}

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {slide.description}
            </p>

            {/* Features */}
            {slide.features && (
              <div className="w-full space-y-2.5">
                {slide.features.map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 text-left"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="text-primary flex-shrink-0">
                      {feature.icon}
                    </div>
                    <span className="text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="px-6 pb-6 flex items-center gap-3">
          {!isFirstSlide && (
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              className="rounded-xl h-12 w-12 border-border/50"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          
          {isLastSlide ? (
            <Button
              onClick={handleGetStarted}
              className="flex-1 h-12 rounded-xl text-base font-semibold"
            >
              Get Started
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex-1 h-12 rounded-xl text-base font-semibold"
            >
              Next
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}