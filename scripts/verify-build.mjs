/**
 * Asserts things about `dist/` that the build itself will not tell you.
 *
 * The site went from hand-written HTML to a build step, and that trade has one
 * real risk: a compliance page can now break without anyone editing it. These
 * URLs are registered inside the TikTok and Google developer portals — a
 * reviewer opens /privacy/ cold, with no session and sometimes with scripts
 * blocked. If it 404s or renders empty, the app submission is rejected and
 * nothing else in this pipeline would have noticed.
 *
 * So: every critical page must exist at its exact registered path, and must
 * carry its text in the HTML itself rather than waiting on JavaScript.
 *
 *   node scripts/verify-build.mjs
 */

import { readFile, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");

/** Pages whose URL is registered somewhere outside this repo. */
const CRITICAL = [
  {
    path: "privacy/index.html",
    url: "/privacy/",
    why: "TikTok + Google portals",
    // Substrings that must be in the served HTML, not injected later.
    contains: [
      "Política de privacidad",
      "Google API Services User Data Policy",
      "video.upload",
      "youtube.upload",
      "virtual.liga@gmail.com",
    ],
  },
  {
    path: "terms/index.html",
    url: "/terms/",
    why: "TikTok + Google portals",
    contains: ["Términos de servicio", "virtual.liga@gmail.com"],
  },
  {
    path: "index.html",
    url: "/",
    why: "TikTok 'official website', Google app home page",
    contains: ["Logrando Studio"],
  },
  {
    path: "tiktok/callback/index.html",
    url: "/tiktok/callback/",
    why: "TikTok Login Kit redirect URI",
    // This one legitimately needs JS to read the code out of the URL, so we
    // only assert the page and its script are present and inline.
    contains: ["Autorización de TikTok", "URLSearchParams"],
  },
  {
    // TikTok fetches this to prove we own the URL prefix. If it ever stops
    // shipping, the app's URL properties silently fall out of verification and
    // the next review submission is rejected for a reason nobody will connect
    // back to a deleted file.
    path: "tiktok-developers-site-verification.txt",
    url: "/tiktok-developers-site-verification.txt",
    why: "TikTok URL prefix ownership proof",
    contains: ["tiktok-developers-site-verification="],
    // Not a page: it is one line of text and has no prose to measure.
    skipNoJsCheck: true,
  },
];

/** Pages that should exist but carry no external commitment. */
const EXPECTED = ["404.html", "channels/deviatips/index.html", "app/index.html"];

const problems = [];
const notes = [];

async function readIfPresent(rel) {
  try {
    await stat(join(DIST, rel));
  } catch {
    return null;
  }
  return readFile(join(DIST, rel), "utf8");
}

for (const page of CRITICAL) {
  const html = await readIfPresent(page.path);
  if (html === null) {
    problems.push(`MISSING ${page.url} (${page.path}) — required by ${page.why}`);
    continue;
  }

  for (const needle of page.contains) {
    if (!html.includes(needle)) {
      problems.push(`${page.url} is missing expected text: ${JSON.stringify(needle)}`);
    }
  }

  // A compliance page that only renders after hydration is a compliance page
  // that can fail in front of a reviewer. Strip scripts and check there is
  // still substantial prose left.
  const withoutScripts = html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  const text = withoutScripts
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (page.skipNoJsCheck) {
    notes.push(`${page.url} — present (${html.trim().length} bytes)`);
    continue;
  }

  const floor = page.path === "tiktok/callback/index.html" ? 200 : 1500;
  if (text.length < floor) {
    problems.push(
      `${page.url} renders only ${text.length} chars of text without JavaScript ` +
        `(expected at least ${floor}) — it must not depend on hydration`
    );
  } else {
    notes.push(`${page.url} — ${text.length} chars readable without JS`);
  }
}

for (const rel of EXPECTED) {
  if ((await readIfPresent(rel)) === null) {
    problems.push(`MISSING ${rel}`);
  }
}

if (problems.length > 0) {
  console.error("Build verification FAILED:\n");
  for (const p of problems) console.error("  ✗ " + p);
  console.error("");
  process.exit(1);
}

console.log("Build verification passed:");
for (const n of notes) console.log("  ✓ " + n);
console.log(`  ✓ ${EXPECTED.length} other expected pages present`);
