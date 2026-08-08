// @ts-check
import { defineConfig, envField } from "astro/config";
import netlify from "@astrojs/netlify";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // SSR: the index page reads circles server-side, then hands them to the island.
  output: "server",
  adapter: netlify(),

  vite: {
    plugins: [tailwindcss()],
  },

  env: {
    schema: {
      // Browser side: realtime subscription + inserts + storage uploads.
      // Public by design — security relies entirely on the RLS policies.
      PUBLIC_SUPABASE_URL: envField.string({ context: "client", access: "public" }),
      PUBLIC_SUPABASE_ANON_KEY: envField.string({ context: "client", access: "public" }),
      // Optional: used only for the SSR read. The circles table is world-readable
      // via RLS, so the public key works too — this just keeps server reads
      // independent of the client policies if we ever tighten them.
      SUPABASE_SERVICE_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
    },
  },
});
