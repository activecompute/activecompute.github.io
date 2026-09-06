# activecompute.co

The Active Compute Co. company page — a founding letter, rendered as one text card on the
company's canvas. Static HTML, no build step, no backend.

## Run locally

```bash
python3 serve.py
```

Then open http://localhost:4185/. `serve.py` is python's `http.server` with `Cache-Control: no-store`,
because `?v=DEV` never changes locally and Chrome would otherwise cache an edited `styles.css` or
`script.js`. (Root-absolute asset paths need a server, not `file://`.)

## Where to change things

| What | Where |
|---|---|
| The letter | `index.html` between `LETTER START` / `LETTER END` — semantic HTML, `<h1>` title, `<h2>` sections, `<strong>` emphasis |
| GitHub link | `index.html`, the footer link marked `CONFIG:GITHUB` |
| Email | `index.html`, the footer link marked `CONFIG:EMAIL` — put the address after `mailto:`; the link is hidden while empty |
| Sticky-note line, download filename | `CONFIG` at the top of `script.js` |
| Share image | `assets/og-image.jpg` (1200×630) — regenerate from the approved PNGs if the identity changes |
| Favicons / manifest icons | `assets/favicon-*.png`, `assets/icon-*.png`, `favicon.ico` — all from `Logo Square.png` |

The Download → Markdown and Copy actions derive their text from the letter's HTML at click
time, so there is exactly one copy of the letter to maintain.

## Deploy

Hosted on **Cloudflare Pages** — project `activecompute`, direct upload, domain `activecompute.co`
(DNS is on the same Cloudflare account, so the custom domain and its certificate are automatic).

```bash
bash deploy.sh
```

`deploy.sh` refuses to run with uncommitted changes (the version stamp comes from `git rev-parse`),
stages the site into `_site/`, rewrites every `?v=DEV` in `index.html` to the git short SHA, and
uploads with `wrangler pages deploy`. Keep `?v=DEV` in source — never commit a SHA.

One-time per machine: `npx wrangler login` (browser OAuth). The always-current preview is
https://activecompute.pages.dev/.

### GitHub Pages — parked

`.github/workflows/pages.yml` is the GitHub Pages deploy and is complete, but the `activecompute`
org has **Pages creation disabled for members**, so it is `workflow_dispatch`-only for now. To move
hosting there later: an org owner allows Pages (Org Settings → Member privileges → Pages creation →
Public), enable Pages on this repo with Source = **GitHub Actions**, restore the `push` trigger,
set the custom domain in Settings → Pages, and repoint DNS to GitHub's A/AAAA records (grey cloud
until the certificate issues).

## Conventions

This repo sits under `ActiveCompute/` but is a static marketing page: `dev/CLAUDE.md`'s
landing-page conventions apply (`?v=DEV` cache-busting), not the cloud/application stack in
`ActiveCompute/.claude/CLAUDE.md`. The design system's colour, shadow and chrome decisions
(`rules/design-decisions.md`) do apply — the page is drawn as one of the app's text cards.
