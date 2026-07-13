import type { CapacitorConfig } from "@capacitor/cli";

// The native shell loads the live site directly (server.url) instead of bundling a static
// snapshot of dist/spa - this app deploys many times a day, and pointing at production means
// every deploy reaches installed apps immediately with no app-store resubmission needed.
// webDir is still required by the CLI even though it isn't the primary content source.
const config: CapacitorConfig = {
  appId: "com.herestomorrow.vitrii",
  appName: "Vitrii",
  webDir: "dist/spa",
  server: {
    url: "https://www.vitrii.com.br",
    cleartext: false,
  },
};

export default config;
