#!/bin/bash
# deploy.sh — publish activecompute.co to Cloudflare Pages (direct upload, project "activecompute").
# Same convention as the other landing pages: stage, stamp every ?v=DEV with the git short SHA,
# ship. One-time per machine: `npx wrangler login` (OAuth in the browser; nothing stored here).
set -e
cd "$(dirname "$0")"
PROJECT="activecompute"

if [ -n "$(git status --porcelain)" ]; then
  echo "✗ Uncommitted changes — commit first so the version stamp matches what ships."; exit 1
fi
SHA="$(git rev-parse --short HEAD)"

echo "→ Staging ${SHA}"
rm -rf _site && mkdir -p _site
rsync -a \
  --exclude '.git' --exclude '.github' --exclude '.claude' --exclude '_site' \
  --exclude 'README.md' --exclude 'serve.py' --exclude 'deploy.sh' --exclude '.gitignore' --exclude '.DS_Store' \
  ./ _site/
sed -i '' "s/?v=DEV/?v=${SHA}/g" _site/index.html
echo "→ Stamped ?v=${SHA} × $(grep -c "?v=${SHA}" _site/index.html)"

echo "→ Deploying to Cloudflare Pages (${PROJECT})"
npx --yes wrangler@latest pages deploy _site --project-name "$PROJECT" --branch main \
  --commit-hash "$(git rev-parse HEAD)" --commit-message "$(git log -1 --pretty=%s)"

echo "✓ Done — https://activecompute.co/   (always-current preview: https://${PROJECT}.pages.dev/)"
