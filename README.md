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

Hosted on **GitHub Pages** from this repo (`activecompute/activecompute.github.io`), custom
domain `activecompute.co` (`CNAME`). Pushing to `main` runs `.github/workflows/pages.yml`,
which stamps every `?v=DEV` in `index.html` with the git short SHA and publishes.

Keep `?v=DEV` in source — never commit a SHA.

### One-time setup (not yet done)

1. Create the repo `activecompute/activecompute.github.io` as **public** and push `main`.
2. Repo → Settings → Pages → Source: **GitHub Actions**.
3. Cloudflare DNS for `activecompute.co`, **DNS only (grey cloud)** until the certificate issues:
   - `A` `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` `www` → `activecompute.github.io`
4. Settings → Pages → Custom domain `activecompute.co` → wait for the DNS check → **Enforce HTTPS**.
   (With a GitHub Actions deployment the `CNAME` file is ignored — the domain is set here. The
   file stays in the repo only as a fallback for branch publishing.)
5. Optional afterwards: flip Cloudflare to proxied with SSL mode **Full**.

## Conventions

This repo sits under `ActiveCompute/` but is a static marketing page: `dev/CLAUDE.md`'s
landing-page conventions apply (`?v=DEV` cache-busting), not the cloud/application stack in
`ActiveCompute/.claude/CLAUDE.md`. The design system's colour, shadow and chrome decisions
(`rules/design-decisions.md`) do apply — the page is drawn as one of the app's text cards.
