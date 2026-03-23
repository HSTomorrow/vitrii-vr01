import { createRoot } from "react-dom/client";
import App from "./App";

// Initialize APP_URL for image URL normalization
async function initializeAppUrl() {
  try {
    // Try to get APP_URL from meta tag first
    const metaTag = document.querySelector('meta[name="app-url"]');
    if (metaTag?.getAttribute("content")) {
      const appUrl = metaTag.getAttribute("content");
      if (appUrl) {
        (window as any).APP_URL = appUrl;
        console.log("[Init] APP_URL from meta tag:", appUrl);
        return;
      }
    }

    // Fall back to fetching from API
    const response = await fetch("/api/check-app-url");
    if (response.ok) {
      const data = await response.json();
      (window as any).APP_URL = data.appUrl;
      console.log("[Init] APP_URL from API:", data.appUrl);
    }
  } catch (error) {
    console.warn("[Init] Could not initialize APP_URL:", error);
    // Default to relative URLs if APP_URL can't be determined
  }
}

// Initialize APP_URL before rendering the app
initializeAppUrl().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
