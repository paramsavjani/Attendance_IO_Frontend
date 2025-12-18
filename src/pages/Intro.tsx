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
    icon: <Sparkles className="w-8 h-8" />,
    title: "Welcome to Attendance Aid",
    description: "Your personal attendance tracker while you wait for official institute records.",
    image: "/demo/self_attendance.png",
    highlight: "Track • Analyze • Stay Ahead",
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
        <div className="px-6 py-6 min-h-[420px] flex flex-col">
          <div 
            key={currentSlide}
            className={cn(
              "flex-1 flex flex-col items-center text-center",
              direction === 'right' ? "animate-slide-in-right" : "animate-slide-in-left"
            )}
          >
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
              {slide.icon}
            </div>

            {/* Title */}
            <h2 className="text-lg font-bold mb-2">{slide.title}</h2>

            {/* Highlight badge */}
            {slide.highlight && (
              <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                {slide.highlight}
              </div>
            )}

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {slide.description}
            </p>

            {/* Demo Image */}
            {slide.image && (
              <div className="w-full rounded-xl overflow-hidden border border-border/50 shadow-lg">
                <img 
                  src={slide.image} 
                  alt={slide.title}
                  className="w-full h-auto object-cover"
                />
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