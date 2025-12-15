import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const { handleGoogleLogin, isAuthenticated, checkAuth } = useAuth();
  const navigate = useNavigate();

  // Check if user is already authenticated (e.g., returning from OAuth)
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await handleGoogleLogin();
      // User will be redirected to Google, so we don't need to handle response here
    } catch (error) {
      toast.error("Failed to initiate Google sign in. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section - Enhanced */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="Attendance IO Logo" 
              className="w-20 h-20 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent mb-3">
            Attendance IO
          </h1>
          <p className="text-muted-foreground text-base">
            Track your attendance with confidence
          </p>
        </div>

        {/* Login Card - Enhanced */}
        <div className="glass-card rounded-3xl p-10 animate-slide-up shadow-2xl border border-border/50 backdrop-blur-sm bg-background/80">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-2">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Sign in to continue to your dashboard
            </p>
          </div>
          
          <div className="space-y-4">
            {/* Domain Restriction Notice */}
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-2">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Domain Restriction
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Only <span className="font-semibold text-primary">@dau.ac.in</span> Gmail accounts are allowed to sign in.
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full h-14 text-base font-medium hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/50 bg-background hover:bg-accent/50"
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-3 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  {/* Colorful Google Logo */}
                  <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="font-medium">Sign in with Google</span>
                </div>
              )}
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>

        {/* Footer - Enhanced */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground/80">
            Your personal attendance tracker
          </p>
        </div>
      </div>
    </div>
  );
}
