import { runContatosUsuariosSync } from "../routes/sync-contatos-usuarios";
import { gerarCobrancasMensais } from "../routes/financeiro";
import { atualizarDashboardCacheDeTodos } from "../routes/dashboard";

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

  gerarCobrancasMensais().catch(error => {
    console.error("[Scheduler] Error on startup mensalidade generation:", error);
  });

  atualizarDashboardCacheDeTodos().catch(error => {
    console.error("[Scheduler] Error on startup dashboard cache generation:", error);
  });

  // Then run every hour (3600000 ms = 1 hour)
  setInterval(() => {
    syncContatosUsuariosHourly().catch(error => {
      console.error("[Scheduler] Error in scheduled sync:", error);
    });
  }, 3600000); // 1 hour

  // Recurring mensalidade charges only need a daily check (24h = 86400000 ms)
  setInterval(() => {
    gerarCobrancasMensais().catch(error => {
      console.error("[Scheduler] Error in scheduled mensalidade generation:", error);
    });
  }, 86400000); // 24 hours

  // Dashboard is read-only cache — refreshing every few hours is plenty; the manual
  // "Reprocessar agora" button covers anyone who needs it sooner (6h = 21600000 ms)
  setInterval(() => {
    atualizarDashboardCacheDeTodos().catch(error => {
      console.error("[Scheduler] Error in scheduled dashboard cache generation:", error);
    });
  }, 21600000); // 6 hours

  console.log("[Scheduler] Hourly + daily + 6-hourly scheduler initialized");
}
