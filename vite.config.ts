import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // No real .env in CI/local test runs -- dummy but well-formed values, so a test exercises
    // real code paths (env.ts's own validation) instead of every suite needing its own stub.
    env: {
      VITE_APP_ENV: "test",
      VITE_API_BASE_URL: "/api/v1",
      VITE_SUPABASE_URL: "https://test-project.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      VITE_OAUTH_REDIRECT_URL: "https://test.example/auth/callback",
    },
  },
});
