import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Tell the OTA updater this bundle booted. Must be the first thing that runs: if a downloaded
// bundle never gets here within appReadyTimeout, the plugin rolls back to the previous one.
if (Capacitor.isNativePlatform()) {
  void CapacitorUpdater.notifyAppReady();
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
