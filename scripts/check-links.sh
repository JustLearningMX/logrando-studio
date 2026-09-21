#!/usr/bin/env bash
# Every absolute internal link must resolve to a file that exists.
#
# This catches the failure that actually matters here: a legal page or the
# OAuth callback going 404 after a rename. A reviewer hitting a dead
# /privacy/ is a rejected app, and nothing else in the pipeline would notice.
#
# Only absolute internal hrefs ("/...") are checked. External URLs, mailto:,
# #anchors and data: URIs are out of scope.
#
# The site is served from a subdirectory, so built links carry the base prefix
# (/logrando-studio/privacy/) while the file on disk does not
# (dist/privacy/index.html). The prefix is stripped before resolving, and a
# link that is missing it is reported -- that is exactly the bug this catches.
#
# Run `npm run build` first.

set -euo pipefail
# Runs against the BUILD OUTPUT, not the source: since the site moved to Astro,
# what ships is dist/, and a link can only be verified against what ships.
cd "$(dirname "$0")/../dist"

BASE="/logrando-studio"

fail=0
checked=0

while IFS= read -r href; do
  path="${href%%#*}"     # drop fragment
  path="${path%%\?*}"    # drop query
  [ -z "$path" ] && continue

  case "$path" in
    "$BASE"/*) path="${path#"$BASE"}" ;;
    "$BASE")   path="/" ;;
    *)
      echo "MISSING BASE: ${href} -- internal links must go through src/lib/url.ts"
      fail=1
      continue
      ;;
  esac
  [ -z "$path" ] && path="/"

  case "$path" in
    */) target=".${path}index.html" ;;
    *)  target=".${path}" ;;
  esac

  checked=$((checked + 1))
  if [ ! -e "$target" ]; then
    echo "BROKEN: ${href}  (expected ${target})"
    fail=1
  fi
done < <(grep -rhoE 'href="/[^"]*"' --include='*.html' . \
         | sed -E 's/^href="//; s/"$//' \
         | sort -u)

if [ "$fail" -eq 0 ]; then
  echo "OK: ${checked} internal links resolve."
else
  echo "Internal links are broken (see above)."
fi
exit $fail
