import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const { handleGoogleLogin, isAuthenticated, isLoadingAuth, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Receive auth events from the Capacitor deep-link handler (mobile flow)
  useEffect(() => {
    const onAuthError = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail) toast.error(detail);
      setIsLoading(false);
    };

    const onAuthSuccess = () => {
      setIsLoading(false);
    };

    window.addEventListener("auth:error", onAuthError as EventListener);
    window.addEventListener("auth:success", onAuthSuccess);
    return () => {
      window.removeEventListener("auth:error", onAuthError as EventListener);
      window.removeEventListener("auth:success", onAuthSuccess);
    };
  }, []);

  // Note: checkAuth is already called on mount in AuthContext, so we don't need to call it here

  // Handle error from OAuth callback
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      toast.error(decodeURIComponent(error));
      // Remove error from URL
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.delete("error");
        return newParams;
      });
    }
  }, [searchParams, setSearchParams]);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Show loading while checking authentication status
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000', color: '#fff' }}>
        <div>Loading...</div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-3 sm:p-4 relative overflow-hidden safe-area-bottom">
      {/* Enhanced Background decoration - Mobile optimized */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 sm:w-96 sm:h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 sm:w-96 sm:h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section - Mobile responsive */}
        <div className="text-center mb-6 sm:mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-4 sm:mb-6">
            <img 
              src="/logo.png" 
              alt="Attendance IO Logo" 
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent mb-2 sm:mb-3">
            Attendance IO
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base px-2">
            Track your attendance with confidence
          </p>
        </div>

        {/* Login Card - Mobile optimized padding */}
        <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-10 animate-slide-up shadow-2xl border border-border/50 backdrop-blur-sm bg-background/80">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold mb-1 sm:mb-2">Welcome</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Sign in or sign up with your Google account
            </p>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            {/* Domain Restriction Notice - Simplified */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg sm:rounded-xl p-3 sm:p-3">
              <p className="text-xs sm:text-sm text-muted-foreground text-center leading-relaxed">
                All signup and login is done through Google. Only <span className="font-semibold text-primary">@dau.ac.in</span> Gmail accounts are allowed.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full h-12 sm:h-14 text-sm sm:text-base font-medium transition-all duration-200 border-2 bg-background"
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  {/* Colorful Google Logo */}
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0" viewBox="0 0 24 24">
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
                  <span className="font-medium">Continue with Google</span>
                </div>
              )}
            </Button>
          </div>

          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border/50">
            <p className="text-[10px] sm:text-xs text-muted-foreground text-center leading-relaxed px-2">
              By signing in, you agree to our{" "}
              <Link
                to={Capacitor.isNativePlatform() ? "#/privacy-policy" : "/privacy-policy"}
                className="text-primary hover:text-primary/80 underline transition-colors"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>

        {/* Footer - Mobile optimized */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-[10px] sm:text-xs text-muted-foreground/80 px-2">
            Your personal attendance tracker
          </p>
        </div>
      </div>
    </div>
  );
}
