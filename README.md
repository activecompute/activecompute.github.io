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

Hosted on **Cloudflare Workers** — Worker `activecompute-site`, static assets, domains
`activecompute.co` and `www.activecompute.co` as Custom Domains, so Cloudflare owns both DNS records
and both certificates.

```bash
bash deploy.sh
```

`deploy.sh` refuses to run with uncommitted changes (the version stamp comes from `git rev-parse`),
stages the site into `_site/`, writes `index.html` through `sed` so every `?v=DEV` becomes the git
short SHA, and ships with `wrangler deploy`. Keep `?v=DEV` in source — never commit a SHA.

One-time per machine: `npx wrangler login` (browser OAuth).

The Worker has **no `main`** — `wrangler.jsonc` declares `assets` and no script, which Cloudflare
serves straight from the edge. Add a script only when the site needs real request handling.

The target account is **pinned** in `wrangler.jsonc` as `account_id`. Do not remove it. Wrangler
otherwise falls back to a machine-local cache in `.wrangler/`, and that cache used to be committed
here pointing at the old account — a deploy would have silently gone to the wrong account and left
the apex broken. `.wrangler/` is git-ignored now.

### The first deploy will ask about DNS

Both `activecompute.co` and `www.activecompute.co` already have A records in the zone, left over
from Cloudflare Pages. Attaching a Custom Domain to a hostname that already resolves makes wrangler
stop and ask before it overwrites the record. That prompt is expected — answer yes for both. It will
not appear again.

### Known gap: there is no `404.html`

`not_found_handling` is `"404-page"`, which serves the nearest `404.html` in the asset directory.
The repo has none, so a mistyped URL currently returns a bare 404 with an empty body. The setting is
the right destination, not a mistake: drop a `404.html` in the repo root and it starts working with
no config change. Designing that page is
[issue #3](https://github.com/activecompute/activecompute.github.io/issues/3).

### Hosting history

**Cloudflare Pages until 2026-10-01**, as project `activecompute`. Pages is no longer the path for
new work: a static site is a Worker with static assets. Moving also fixed a live outage — the zone
had moved to the Active Compute Cloudflare account while the Pages project stayed behind in the old
one, so `activecompute.co` was answering **403** with nothing serving it.

A **GitHub Pages** workflow also existed, parked and never used: the `activecompute` org has Pages
creation disabled for members, so it could never deploy. It and the `CNAME` file it needed were
removed in the same change rather than left as a third hosting path nobody takes. Both are in git
history if that decision is ever revisited.

## Conventions

This repo sits under `ActiveCompute/` but is a static marketing page: `dev/CLAUDE.md`'s
landing-page conventions apply (`?v=DEV` cache-busting), not the cloud/application stack in
`ActiveCompute/.claude/CLAUDE.md`. The design system's colour, shadow and chrome decisions
(`rules/design-decisions.md`) do apply — the page is drawn as one of the app's text cards.
