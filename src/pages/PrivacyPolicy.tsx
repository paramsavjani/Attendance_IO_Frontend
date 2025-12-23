import { Link } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
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
              Privacy Policy
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Content */}
        <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-2xl border border-border/50 backdrop-blur-sm bg-background/80">
          <div className="prose prose-invert prose-sm sm:prose-base max-w-none">
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
                1. Introduction
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Welcome to Attendance IO ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our attendance tracking application.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
                2. Information We Collect
              </h2>
              <h3 className="text-lg font-medium mb-3 text-foreground">
                2.1 Account Information
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When you sign in with Google, we collect:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4 ml-4">
                <li>Your name and email address (from your Google account)</li>
                <li>Your profile picture (if available)</li>
                <li>Your Google account ID</li>
              </ul>

              <h3 className="text-lg font-medium mb-3 text-foreground">
                2.2 Attendance Data
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We collect and store:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4 ml-4">
                <li>Your attendance records for enrolled subjects</li>
                <li>Subject information and timetables</li>
                <li>Self-attendance entries and timestamps</li>
                <li>Analytics and statistics related to your attendance</li>
              </ul>

              <h3 className="text-lg font-medium mb-3 text-foreground">
                2.3 Device Information
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When you use our mobile application, we may collect:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4 ml-4">
                <li>Device type and operating system</li>
                <li>App version and usage statistics</li>
                <li>Push notification tokens (for notifications)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
                3. How We Use Your Information
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4 ml-4">
                <li>Provide and maintain our attendance tracking services</li>
                <li>Authenticate your identity and manage your account</li>
                <li>Store and process your attendance data</li>
                <li>Generate analytics and reports about your attendance</li>
                <li>Send you notifications related to your attendance (if enabled)</li>
                <li>Improve our application and user experience</li>
                <li>Respond to your inquiries and provide customer support</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
                4. Data Storage and Security
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We take the security of your data seriously:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4 ml-4">
                <li>Your data is stored securely on our servers</li>
                <li>We use industry-standard encryption to protect your information</li>
                <li>Access to your data is restricted to authorized personnel only</li>
                <li>We implement appropriate technical and organizational measures to prevent unauthorized access, disclosure, or destruction of your data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
                5. Data Sharing and Disclosure
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4 ml-4">
                <li><strong>Service Providers:</strong> We may share information with third-party service providers who assist us in operating our application and providing services to you</li>
                <li><strong>Legal Requirements:</strong> We may disclose your information if required by law or in response to valid legal requests</li>
                <li><strong>Protection of Rights:</strong> We may share information to protect our rights, property, or safety, or that of our users</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
                6. Google Authentication
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our application uses Google OAuth for authentication. By signing in with Google, you authorize us to access certain information from your Google account. We only access the minimum information necessary to provide our services. Your use of Google's services is also governed by Google's Privacy Policy.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                <strong>Domain Restriction:</strong> Currently, only users with <span className="font-semibold text-primary">@dau.ac.in</span> email addresses are permitted to use this application.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
                7. Your Rights and Choices
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4 ml-4">
                <li>Access and review your personal information</li>
                <li>Request correction of inaccurate or incomplete data</li>
                <li>Request deletion of your account and associated data</li>
                <li>Opt-out of certain data collection or processing activities</li>
                <li>Export your attendance data</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To request account deletion, please visit our{" "}
                <Link
                  to={Capacitor.isNativePlatform() ? "#/delete-account" : "/delete-account"}
                  className="text-primary hover:text-primary/80 underline transition-colors"
                >
                  Account Deletion page
                </Link>
                .
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
                8. Data Retention
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We retain your personal information and attendance data for as long as your account is active or as needed to provide you with our services. If you delete your account, we will delete or anonymize your personal information, except where we are required to retain it for legal purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
                9. Children's Privacy
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our application is intended for use by students and is restricted to users with institutional email addresses. We do not knowingly collect personal information from children under the age of 13. If you believe we have collected information from a child under 13, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
                10. Changes to This Privacy Policy
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
                11. Contact Us
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <p className="text-muted-foreground">
                  <strong>Email:</strong> [Your contact email]<br />
                  <strong>Address:</strong> [Your contact address, if applicable]
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
                12. Consent
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                By using Attendance IO, you consent to the collection and use of your information as described in this Privacy Policy. If you do not agree with this policy, please do not use our application.
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-border/50">
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

