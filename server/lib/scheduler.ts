import { runContatosUsuariosSync } from "../routes/sync-contatos-usuarios";

/**
 * Sync contatos with usuarios based on matching email or phone
 * This should be called every hour
 */
export async function syncContatosUsuariosHourly() {
  try {
    console.log("[Scheduler] Starting hourly contatos-usuarios sync...");
    const { linkedCount } = await runContatosUsuariosSync();
    console.log(`[Scheduler] Sync complete. Created/updated ${linkedCount} links.`);
    return { success: true, linkedCount };
  } catch (error) {
    console.error("[Scheduler] Error during sync:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Initialize scheduler to run hourly
 */
export function initializeScheduler() {
  console.log("[Scheduler] Initializing hourly scheduler...");

  // Run immediately on startup
  syncContatosUsuariosHourly().catch(error => {
    console.error("[Scheduler] Error on startup sync:", error);
  });

  // Then run every hour (3600000 ms = 1 hour)
  setInterval(() => {
    syncContatosUsuariosHourly().catch(error => {
      console.error("[Scheduler] Error in scheduled sync:", error);
    });
  }, 3600000); // 1 hour

  console.log("[Scheduler] Hourly scheduler initialized");
}
