import { Link } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

export default function DeleteAccount() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 safe-area-top">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <Link
            to={Capacitor.isNativePlatform() ? "#/login" : "/login"}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Login
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <img
              src="/logo.png"
              alt="Attendance IO Logo"
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
            />
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
              Delete Your Account
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Request to delete your Attendance IO account and associated data
          </p>
        </div>

        {/* Content */}
        <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-2xl border border-border/50 backdrop-blur-sm bg-background/80">
          <div className="prose prose-invert prose-sm sm:prose-base max-w-none">
            {/* Important Notice */}
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 sm:p-6 mb-8">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-destructive flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-destructive mb-2">
                    Important: This action cannot be undone
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Deleting your Attendance IO account will permanently remove all your data. 
                    This action is irreversible. Please ensure you have exported any data you wish to keep before proceeding.
                  </p>
                </div>
              </div>
            </div>

            {/* Steps Section - Prominently Featured */}
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-foreground">
                How to Request Account Deletion
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground mb-2">
                      Sign in to your Attendance IO account
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                      Ensure you are signed in with your Google account (@dau.ac.in) that is associated with your Attendance IO account.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground mb-2">
                      Contact us to request deletion
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-sm sm:text-base mb-3">
                      Send an email to our support team with the following information:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 text-sm sm:text-base">
                      <li>Subject line: "Account Deletion Request"</li>
                      <li>Your full name</li>
                      <li>Your email address (@dau.ac.in)</li>
                      <li>Confirmation that you want to delete your account</li>
                    </ul>
                    <div className="mt-4 bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Email:</strong> parmsavjani3010@gmail.com
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground mb-2">
                      Verification and processing
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                      We will verify your identity and process your deletion request. You will receive a confirmation email once your account and data have been deleted.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground mb-2">
                      Confirmation
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                      Once your account is deleted, you will no longer be able to sign in to Attendance IO. All associated data will be permanently removed from our systems.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Deletion Section */}
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
                What Data Will Be Deleted
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When you request account deletion, Attendance IO will permanently delete the following data associated with your account:
              </p>
              <div className="bg-muted/30 rounded-lg p-4 sm:p-6 mb-4">
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
                  <li><strong>Account Information:</strong> Your name, email address, profile picture, and Google account ID</li>
                  <li><strong>Attendance Records:</strong> All attendance entries, timestamps, and self-attendance data</li>
                  <li><strong>Subject Enrollments:</strong> All enrolled subjects and associated schedules</li>
                  <li><strong>Timetable Data:</strong> Your personal timetable and class schedules</li>
                  <li><strong>Analytics Data:</strong> All attendance statistics, analytics, and reports</li>
                  <li><strong>Settings and Preferences:</strong> Minimum criteria settings, sleep duration preferences, and notification settings</li>
                  <li><strong>Push Notification Tokens:</strong> Device tokens used for push notifications</li>
                  <li><strong>Session Data:</strong> All active sessions and authentication tokens</li>
                </ul>
              </div>
            </section>

            {/* Data Retention Section */}
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
                Data Retention and Exceptions
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-3 text-foreground">
                    Retention Period
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Once your account deletion request is processed, your data will be permanently deleted within <strong className="text-foreground">30 days</strong> of the request. During this period, your account will be deactivated and you will not be able to access it.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3 text-foreground">
                    Data That May Be Retained
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    In certain circumstances, we may be required to retain some data for legal or regulatory purposes:
                  </p>
                  <div className="bg-muted/30 rounded-lg p-4 sm:p-6">
                    <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
                      <li><strong>Legal Obligations:</strong> Data required to comply with legal obligations, court orders, or regulatory requirements</li>
                      <li><strong>Anonymized Analytics:</strong> Aggregated, anonymized data that cannot be used to identify you may be retained for statistical purposes</li>
                      <li><strong>Security Logs:</strong> Security and access logs may be retained for a limited period for security and fraud prevention purposes</li>
                    </ul>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mt-4 text-sm">
                    Any retained data will be kept only for the minimum period required by law and will be deleted as soon as legally permissible.
                  </p>
                </div>
              </div>
            </section>

            {/* Alternative Options */}
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
                Alternative Options
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Before deleting your account, you may want to consider:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Export Your Data:</strong> You can export your attendance data before deletion if you wish to keep a record</li>
                <li><strong>Deactivate Temporarily:</strong> If you're unsure, you can simply stop using the app without deleting your account</li>
                <li><strong>Contact Support:</strong> If you have concerns about your data or privacy, please contact our support team first</li>
              </ul>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
                Contact Us
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have questions about account deletion or need assistance, please contact Attendance IO support:
              </p>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 sm:p-6">
                <p className="text-muted-foreground mb-2">
                  <strong className="text-foreground">Email:</strong> parmsavjani3010@gmail.com
                </p>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Response Time:</strong> We aim to respond to deletion requests within 5-7 business days
                </p>
              </div>
            </section>

            {/* App Information */}
            <section className="mb-8">
              <div className="bg-muted/30 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-semibold mb-3 text-foreground">
                  About Attendance IO
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  Attendance IO is a personal attendance tracking application designed for students. 
                  We are committed to protecting your privacy and providing you with control over your personal data. 
                  This account deletion process is part of our commitment to data privacy and user rights.
                </p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <Link
              to={Capacitor.isNativePlatform() ? "#/privacy-policy" : "/privacy-policy"}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View Privacy Policy
            </Link>
            <Link
              to={Capacitor.isNativePlatform() ? "#/login" : "/login"}
              className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

