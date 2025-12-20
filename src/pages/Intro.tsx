import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAttendance } from "@/contexts/AttendanceContext";
import { Button } from "@/components/ui/button";
import { 
  CalendarCheck, 
  Clock, 
  BarChart3, 
  AlertTriangle, 
  Search,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Moon,
  BookOpen,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SlideContent {
  icon: React.ReactNode;
  title: string;
  description: string;
  image?: string;
  highlight?: string;
  features?: { icon: React.ReactNode; text: string }[];
}

const slides: SlideContent[] = [
  {
    icon: (
      <img
        src="/logo.png"
        alt="Attendance IO"
        className="w-8 h-8 object-contain"
      />
    ),
    title: "Welcome to Attendance IO",
    description: "Your personal attendance tracker with auto sync with official institute records",
    image: "/demo/self_attendance.png",
    highlight: "",
  },
  {
    icon: <Clock className="w-8 h-8" />,
    title: "Smart Timetable",
    description: "Select your subjects and get an auto-generated timetable based on default schedules.",
    image: "/demo/timetable.png",
  },
  {
    icon: <CalendarCheck className="w-8 h-8" />,
    title: "Daily Attendance",
    description: "Mark your attendance with a single tap. Track present, absent, or cancelled classes.",
    image: "/demo/daily_attendance.png",
  },
  {
    icon: <AlertTriangle className="w-8 h-8" />,
    title: "Smart Warnings",
    description: "Set minimum attendance criteria. Get alerts when you're at risk of falling below.",
    image: "/demo/minimum_criteria.png",
  },
  {
    icon: <Moon className="w-8 h-8" />,
    title: "Sleep Reminders",
    description: "Get smart sleep notifications based on your first lecture. Critical lectures get priority alerts to ensure you never miss important classes.",
    image: "/demo/sleep_notification_screenshot.jpg",
  },
  {
    icon: <Search className="w-8 h-8" />,
    title: "Search Anyone",
    description: "Search students by name or roll number and view attendance across semesters.",
    image: "/demo/search_anyone.png",
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: "Analytics & Search",
    description: "Search your history, analyze trends, and plan your attendance strategy.",
    image: "/demo/analytics.png",
  },
  {
    icon: <BookOpen className="w-8 h-8" />,
    title: "Get Started",
    description: "Next, you'll choose your subjects and an auto-generated timetable will be created based on default schedules. Please note that there may be some errors in the auto-generated timetable, so make sure to review and adjust it as needed.",
    image: undefined,
  },
];

export default function Intro() {
  const navigate = useNavigate();
  const { markIntroAsSeen } = useAttendance();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [assetsReady, setAssetsReady] = useState(false);
  const [assetsLoadedCount, setAssetsLoadedCount] = useState(0);
  const [assetsTotal, setAssetsTotal] = useState(0);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const urls = Array.from(
      new Set(
        [
          ...slides.map((s) => s.image).filter(Boolean),
          "/logo.png",
        ] as string[]
      )
    );

    setAssetsTotal(urls.length);

    if (urls.length === 0) {
      setAssetsReady(true);
      return;
    }

    let loaded = 0;
    let cancelled = false;

    const markLoaded = () => {
      loaded += 1;
      if (cancelled) return;
      setAssetsLoadedCount(loaded);
      if (loaded >= urls.length) setAssetsReady(true);
    };

    for (const url of urls) {
      const img = new Image();
      img.onload = markLoaded;
      img.onerror = markLoaded; // don't block forever if an asset fails
      img.src = url;
    }

    return () => {
      cancelled = true;
    };
  }, []);

  // Disable button for 4 seconds when on last slide with countdown
  useEffect(() => {
    const isLastSlide = currentSlide === slides.length - 1;
    if (isLastSlide) {
      setIsButtonDisabled(true);
      setCountdown(4);
      
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setIsButtonDisabled(false);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setIsButtonDisabled(false);
      setCountdown(0);
    }
  }, [currentSlide]);

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
    <div className="min-h-screen bg-background flex items-center justify-center p-2">
      {/* Background blur effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Modal */}
      <div className="relative w-full max-w-md h-[90vh] max-h-[90vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        

        {!assetsReady ? (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-border/60 flex items-center justify-center">
              <img src="/logo.png" alt="Attendance IO" className="w-9 h-9 object-contain" />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading intro images… {assetsLoadedCount}/{assetsTotal}
            </div>

            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: `${assetsTotal ? Math.round((assetsLoadedCount / assetsTotal) * 100) : 100}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 pt-4 pb-1">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentSlide ? 'right' : 'left');
                    setCurrentSlide(index);
                  }}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    index === currentSlide 
                      ? "w-5 bg-primary" 
                      : "w-1 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>

            {/* Slide content */}
            <div className="px-4 py-3 flex-1 min-h-0 flex flex-col">
              {isLastSlide ? (
                <div 
                  key={currentSlide}
                  className={cn(
                    "flex flex-col flex-1 min-h-0 justify-center",
                    direction === 'right' ? "animate-slide-in-right" : "animate-slide-in-left"
                  )}
                >
                  {/* Large Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 mx-auto text-primary">
                    <BookOpen className="w-8 h-8" />
                  </div>

                  {/* Large Title */}
                  <h2 className="text-2xl font-bold mb-6 text-center text-foreground">
                    {slide.title}
                  </h2>

                  {/* Content Cards */}
                  <div className="space-y-4 mb-6">
                    {/* Step 1 Card */}
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-foreground mb-1">
                            Choose Your Subjects
                          </h3>
                          <p className="text-base text-muted-foreground leading-relaxed">
                            Select the subjects you're enrolled in for this semester
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Step 2 Card */}
                    <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Clock className="w-5 h-5 text-accent-foreground" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-foreground mb-1">
                            Auto-Generated Timetable
                          </h3>
                          <p className="text-base text-muted-foreground leading-relaxed">
                            A timetable will be automatically created based on default schedules
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Warning Card */}
                    <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <AlertCircle className="w-5 h-5 text-destructive" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-foreground mb-1">
                            Important Notice
                          </h3>
                          <p className="text-base text-muted-foreground leading-relaxed font-semibold">
                            There may be errors in the auto-generated timetable. Please review and adjust it as needed to ensure accuracy.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  key={currentSlide}
                  className={cn(
                    "flex flex-col items-center text-center flex-1 min-h-0",
                    direction === 'right' ? "animate-slide-in-right" : "animate-slide-in-left"
                  )}
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                    {slide.icon}
                  </div>

                  {/* Title */}
                  <h2 className="text-base font-bold mb-1">{slide.title}</h2>

                  {/* Highlight badge */}
                  {slide.highlight && (
                    <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium mb-2">
                      {slide.highlight}
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed px-2">
                    {slide.description}
                  </p>

                  {/* Demo Image - Compact */}
                  {slide.image && (
                    <div className="w-full flex-1 min-h-0 rounded-lg overflow-hidden border border-border/50 shadow-md bg-muted/20">
                      <img 
                        src={slide.image} 
                        alt={slide.title}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="px-4 pb-4 pt-2 flex items-center gap-2">
              {!isFirstSlide && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrev}
                  className="rounded-lg h-10 w-10 border-border/50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}
              
              {isLastSlide ? (
                <Button
                  onClick={handleGetStarted}
                  disabled={isButtonDisabled}
                  className="flex-1 h-10 rounded-lg text-sm font-semibold"
                >
                  {isButtonDisabled ? `Get Started (${countdown}s)` : "Get Started"}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="flex-1 h-10 rounded-lg text-sm font-semibold"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}