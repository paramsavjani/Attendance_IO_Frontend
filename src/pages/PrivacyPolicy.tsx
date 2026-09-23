import { Link } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

export default function PrivacyPolicy() {
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
              Privacy Policy
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Last updated: 23 September 2026
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
                <li>Official attendance figures published by the institute, where available</li>
              </ul>
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4">
                <p className="text-foreground leading-relaxed">
                  <strong>Important — other students can see your attendance.</strong> Attendance IO is a shared
                  app for your institute, not a private diary. Any signed-in student can search for you by name or
                  roll number and see your subjects, your attendance percentages and the same statistics you see
                  about yourself, including through the AI assistant. Class, batch and institute averages, and
                  "top" and "bottom" lists, are built from every student's records and are visible to all users.
                  Please do not record anything here that you are not comfortable with your classmates seeing.
                </p>
              </div>

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
                <li>A device identifier and the installed app version, used to deliver app updates</li>
              </ul>

              <h3 className="text-lg font-medium mb-3 text-foreground">
                2.4 AI Assistant Conversations
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When you use the in-app AI assistant, we collect and process:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4 ml-4">
                <li>The questions you type and the answers the assistant gives</li>
                <li>Which data the assistant looked up to answer you</li>
                <li>Timing, token usage and errors, so we can monitor quality and cost</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Recent messages in a conversation are kept for a short period so the assistant can follow up
                within the same chat, and are then discarded automatically. A record of each conversation turn is
                retained on our own servers for quality monitoring, debugging and abuse prevention. There is a
                daily limit on how many questions each account may ask.
              </p>
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
                <li>Answer your questions through the AI assistant</li>
                <li>Deliver app updates to your device</li>
                <li>Monitor reliability, cost and misuse of the service</li>
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
                <li><strong>Other students using the app:</strong> Your name, roll number, subjects, attendance
                  records and attendance statistics are visible to other signed-in students of your institute,
                  through search, comparisons, class and batch statistics, and the AI assistant. This is a core
                  feature of the app, not an accident.</li>
                <li><strong>AI provider:</strong> To answer your questions, the assistant sends your message,
                  recent messages from the same chat, and the data it looked up (which may include your own or
                  another student's attendance figures) to our AI provider for processing. We do not send your
                  email address, and the provider processes this only to generate the reply.</li>
                <li><strong>Service Providers:</strong> We may share information with third-party service providers who assist us in operating our application and providing services to you, such as authentication, push notifications and hosting</li>
                <li><strong>Legal Requirements:</strong> We may disclose your information if required by law or in response to valid legal requests</li>
                <li><strong>Protection of Rights:</strong> We may share information to protect our rights, property, or safety, or that of our users</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
                6. The AI Assistant
              </h2>
              <div className="bg-warning/10 border border-warning/40 rounded-lg p-4 mb-4">
                <p className="text-foreground leading-relaxed mb-4">
                  <strong>The assistant can be wrong. Always double-check before you rely on it.</strong> It is an
                  AI system and can misread a question, miss a class, or state a number confidently that is
                  incorrect or out of date. Never use it as your only basis for a decision that matters — for
                  example whether you can skip a class, whether you meet an attendance requirement, an exam or
                  registration date, or anything you would tell the institute. Verify against your own attendance
                  page, the official institute notice or the concerned office before acting.
                </p>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Other things worth knowing about the assistant:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4 ml-4">
                <li>It answers only from data inside this app; it is not a general-purpose chatbot and does not
                  browse the internet</li>
                <li>It can read and report other students' attendance, because that data is shared inside the app
                  as described above</li>
                <li>It can read and answer only; it can never mark, change or delete your attendance</li>
                <li>Figures it quotes may be based on what students marked themselves rather than official
                  institute records, and may be out of date</li>
                <li>Where it reports placement statistics, campus contacts, calendars or alumni information, these
                  come from information collected within the app and may contain errors or become outdated</li>
                <li>We are not liable for any loss caused by relying on an answer from the assistant</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
                7. Google Authentication
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
                8. Your Rights and Choices
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
                9. Data Retention
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We retain your personal information and attendance data for as long as your account is active or as needed to provide you with our services. If you delete your account, we will delete or anonymize your personal information, except where we are required to retain it for legal purposes.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Recent AI assistant messages used to continue a conversation are discarded automatically after a
                short period. Records kept for quality monitoring and abuse prevention are retained for a limited
                time and are not used to build a profile of you.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
                10. Children's Privacy
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our application is intended for use by students and is restricted to users with institutional email addresses. We do not knowingly collect personal information from children under the age of 13. If you believe we have collected information from a child under 13, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
                11. Changes to This Privacy Policy
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
                12. Contact Us
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <p className="text-muted-foreground">
                  <strong>Email:</strong> paramsavjani3010@gmail.com<br />
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
                13. Consent
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

