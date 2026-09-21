// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";

// Project repo, so the site is served from a subdirectory:
//   https://justlearningmx.github.io/logrando-studio/
// The root (justlearningmx.github.io) is the owner's personal site and is not
// ours to touch.
//
// `base` does NOT rewrite hrefs in markup — Astro only exposes it as
// import.meta.env.BASE_URL. Every internal link goes through src/lib/url.ts
// so a base change can never silently produce 404s.
//
// `format: "directory"` is what keeps the compliance URLs shaped the way the
// TikTok and Google portals have them registered: /privacy/ -> privacy/index.html.
export default defineConfig({
  site: "https://justlearningmx.github.io",
  base: "/logrando-studio",
  integrations: [react()],
  build: { format: "directory" },
  trailingSlash: "ignore",
  devToolbar: { enabled: false },
});
