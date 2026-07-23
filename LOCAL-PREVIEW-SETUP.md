# Local Live-Preview Setup (for Ryan's build sessions)

**Goal:** Let Ryan preview the hand-coded BFC site locally, with live auto-refresh on every file change - so he can check each tweak instantly, with images/fonts rendering correctly, **without deploying to Netlify** (which costs ~15 credits per deploy).

This replaces the download-unzip-open loop AND avoids burning Netlify credits during the iterative build phase. Netlify is then only used for real milestone reviews / launch.

---

## What Ryan needs

A local folder containing the site (the `bfc-site-repo` contents: the `.html` pages, `shared/`, `assets/`, config files), and a local dev server that:
1. Serves the folder over `http://localhost` (so relative asset paths and clean URLs work), and
2. Auto-reloads the browser whenever a file changes.

---

## Option A - Simplest (no Node): VS Code Live Server

If Ryan uses (or can install) **VS Code**:
1. Install VS Code, open the site folder.
2. Install the **"Live Server"** extension (by Ritwick Dey).
3. Right-click `home.html` -> **"Open with Live Server."**
4. Browser opens at `http://127.0.0.1:5500/home.html` and **auto-refreshes on every save.**

Ryan just keeps that tab open. When Claude sends updated files, Ryan drops them into the folder (overwriting), and the tab refreshes itself. Zero terminal use.

> Note: Live Server won't apply the `_redirects` clean-URL rules (those are Netlify-only), so during local preview use the `.html` filenames directly (e.g. `home.html`, `our-story.html`). That's fine for previewing - clean URLs still work once deployed.

---

## Option B - Node one-liner (if Dixit prefers terminal)

From inside the site folder:

```bash
npx serve .
# or, with live-reload:
npx browser-sync start --server --files "**/*.html, **/*.css, assets/**"
```

`browser-sync` gives auto-refresh on change and prints a `localhost` URL to open.

---

## The new working rhythm for Ryan

1. Claude sends updated file(s).
2. Ryan drops them into the local folder (overwrite).
3. Browser tab auto-refreshes - Ryan sees the change instantly, images and all.
4. Ryan screenshots anything off, sends to Claude.
5. Repeat - **all free, no Netlify credits used.**

Deploy to Netlify only for milestone reviews or launch (batch several changes into one deploy to conserve credits).

---

## Keeping the local folder in sync (optional, nice-to-have)

If the drag-and-drop-file overwrite gets tedious, connect the folder to the GitHub repo so Ryan can `git pull` the latest, or Dixit can wire a simple sync. Not essential - overwriting files works fine.

---

## Netlify credit note (important)

- Each production deploy = ~15 credits; Free tier = 300 credits/month (~20 deploys).
- **Keep auto-recharge OFF** (Team Owner setting) so there's never a surprise bill - sites just pause at the limit instead.
- Set usage alerts at 50% / 75%.
- During the build phase, prefer local preview (above) and deploy only for milestones.
