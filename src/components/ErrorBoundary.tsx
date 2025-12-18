import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  message?: string;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown) {
    // Keep a console trail for Android Studio / logcat debugging.
    // eslint-disable-next-line no-console
    console.error("App crashed:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a0a0a",
            color: "#fff",
            padding: 16,
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 520 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ opacity: 0.85, marginBottom: 12 }}>
              The app hit an unexpected error. Please restart the app.
            </p>
            {this.state.message && (
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  background: "rgba(255,255,255,0.06)",
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 12,
                  textAlign: "left",
                }}
              >
                {this.state.message}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}



