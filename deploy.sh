#!/bin/bash
# deploy.sh — publish activecompute.co to Cloudflare Workers (static assets, Worker
# "activecompute-site"). Stage, stamp every ?v=DEV with the git short SHA, ship.
# One-time per machine: `npx wrangler login` (OAuth in the browser; nothing stored here).
#
# Moved off Cloudflare Pages on 2026-10-01. Static sites are Workers with static assets now;
# Pages is not the path for new work. The Worker, the zone and the certificate all live in the
# Active Compute Cloudflare account, which also owns the Orkestra update feed.
set -e
cd "$(dirname "$0")"

if [ -n "$(git status --porcelain)" ]; then
  echo "✗ Uncommitted changes — commit first so the version stamp matches what ships."; exit 1
fi
SHA="$(git rev-parse --short HEAD)"

echo "→ Staging ${SHA}"
rm -rf _site && mkdir -p _site
rsync -a \
  --exclude '.git' --exclude '.github' --exclude '.claude' --exclude '_site' \
  --exclude 'README.md' --exclude 'serve.py' --exclude 'deploy.sh' --exclude '.gitignore' --exclude '.DS_Store' \
  --exclude 'wrangler.jsonc' --exclude '.wrangler' \
  ./ _site/

# Stamped by writing the staged copy from source rather than editing it in place. `sed -i`
# is not portable — BSD sed (macOS) requires an argument to -i and GNU sed (Linux) refuses
# one, so the previous `sed -i ''` form worked on a Mac and failed everywhere else. Reading
# source and redirecting sidesteps the flag entirely and behaves the same on both.
sed "s/?v=DEV/?v=${SHA}/g" index.html > _site/index.html
echo "→ Stamped ?v=${SHA} × $(grep -c "?v=${SHA}" _site/index.html)"

echo "→ Deploying Worker activecompute-site"
npx --yes wrangler@latest deploy

echo "✓ Done — https://activecompute.co/"
