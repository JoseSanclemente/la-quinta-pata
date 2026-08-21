// @ts-check
import { defineConfig, envField } from "astro/config";
import netlify from "@astrojs/netlify";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "server",
  adapter: netlify(),
  integrations: [react()],
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },

  vite: {
    plugins: [tailwindcss()],
  },

  env: {
    schema: {
      PUBLIC_SUPABASE_URL: envField.string({ context: "client", access: "public" }),
      PUBLIC_SUPABASE_ANON_KEY: envField.string({ context: "client", access: "public" }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({ context: "server", access: "secret" }),
      RESEND_API_KEY: envField.string({ context: "server", access: "secret" }),
      RESEND_FROM_EMAIL: envField.string({ context: "server", access: "secret" }),
      REPORT_NOTIFY_EMAIL: envField.string({ context: "server", access: "secret" }),
    },
  },
});
