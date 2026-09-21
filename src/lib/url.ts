/**
 * Prefixes an internal path with the site's base.
 *
 * The site lives at /logrando-studio/, not at the domain root, and Astro does
 * not rewrite hrefs written in markup. Hardcoding the prefix would break local
 * dev and would have to be found by hand in every file the day the base
 * changes — and two of those files are URLs registered inside the TikTok and
 * Google developer portals, where a 404 means a rejected app review.
 *
 *   url("/privacy/")   -> "/logrando-studio/privacy/"
 *   url("/#canales")   -> "/logrando-studio/#canales"
 */
export function url(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  if (!path.startsWith("/")) {
    throw new Error(`url() takes an absolute path, got: ${path}`);
  }
  return base + path;
}
