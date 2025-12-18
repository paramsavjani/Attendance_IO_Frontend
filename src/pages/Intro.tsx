import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAttendance } from "@/contexts/AttendanceContext";
import { Button } from "@/components/ui/button";
import { 
  CalendarCheck, 
  Clock, 
  BarChart3, 
  AlertTriangle, 
  Search,
  ChevronRight,
  ChevronLeft,
  Sparkles
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
    <div className="min-h-screen bg-background flex items-center justify-center p-2">
      {/* Background blur effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Modal */}
      <div className="relative w-full max-w-md h-[90vh] max-h-[90vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        

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
              className="flex-1 h-10 rounded-lg text-sm font-semibold"
            >
              Get Started
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
      </div>
    </div>
  );
}