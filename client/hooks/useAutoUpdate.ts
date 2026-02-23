import { useEffect, useRef } from "react";

export function useAutoUpdate() {
  const versionRef = useRef<string | null>(null);

  useEffect(() => {
    // Set initial version
    versionRef.current = import.meta.env.VITE_APP_VERSION || "1.0.0";

    // Check for updates every 60 seconds
    const interval = setInterval(async () => {
      try {
        // Fetch the version file with cache busting
        const response = await fetch("/version.json?t=" + Date.now(), {
          cache: "no-store",
        });

        if (response.ok) {
          const data = await response.json();
          const newVersion = data.version;

          // If version changed, reload the page
          if (
            versionRef.current &&
            newVersion !== versionRef.current
          ) {
            console.log(
              `[AutoUpdate] New version detected: ${newVersion} (current: ${versionRef.current}). Reloading...`
            );
            // Force a hard reload to clear all caches
            window.location.reload();
          }
        }
      } catch (error) {
        console.error("[AutoUpdate] Error checking for updates:", error);
      }
    }, 60000); // Check every 60 seconds

    return () => clearInterval(interval);
  }, []);
}
