import { FC } from 'react';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LoadingScreen: FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden", className)}>
      {/* Ambient Background Effects - Clean white glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] animate-pulse" 
             style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] animate-pulse" 
             style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>

      {/* Main Content Card - Glass Effect */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Logo Container */}
        {/* Animated Logo Container */}
        <div className="relative mb-8">
          {/* Logo - Original Color, No Background */}
          <img 
            src="/logo.png" 
            alt="Attendance IO" 
            className="relative z-10 w-20 h-20 object-contain" 
          />
        </div>

        {/* Text Content */}
        <div className="space-y-3 text-center">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-neutral-200 to-neutral-400 tracking-tight animate-pulse">
            Attendance IO
          </h1>
          
          {/* Loading Indicator */}
          <div className="flex flex-col items-center gap-3">
            <div className="h-1 w-32 bg-white/10 rounded-full overflow-hidden">
               <div className="h-full w-1/2 bg-gradient-to-r from-white/40 via-white to-white/40 rounded-full" 
                    style={{ 
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s infinite linear' 
                    }} 
               />
            </div>
            <p className="text-xs font-medium text-white/40 tracking-widest uppercase">
              Loading Workspace...
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="absolute bottom-8 text-[10px] text-white/60 font-medium tracking-widest">
        DESIGNED FOR STUDENTS
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};
