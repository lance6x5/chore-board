<p align="center">
  <img src="public/logo-wordmark.svg" alt="Chore Champs logo" width="420" />
</p>

# Chore Champs

![Visits](https://abacus.jasoncameron.dev/get/lance6x5.github.io/chore-board/shield)

**Little helpers, big wins.** A family chore and allowance board for a shared tablet or phone.
Kids tap the chores they've finished to earn points; a parent PIN controls approvals and rewards.

Live app: https://lance6x5.github.io/chore-board/

## Features

- **Kid profiles** with emoji avatars and colors, big friendly chore cards, minimal text.
- **Parent mode** protected by a 4-6 digit PIN. Only a salted SHA-256 hash (Web Crypto) is stored.
  This is a light family lock, not real security.
- **Chores** with points, assigned kids, and frequency: every day, specific weekdays, once a week, or one time.
- **Approvals**: kids tap "done", parents approve or reject (with optional bonus points).
- **Rewards** with point costs (e.g. "30 min screen time = 20 pts"). Kids can ask for a reward, or redeem
  it on the spot when a parent enters the PIN.
- **Allowance** (optional): convert points to money (e.g. 10 pts = $1) with a running balance and cash-out.
- **Motivation**: daily streaks, confetti when a chore is approved, weekly summary per kid.
- **Your data**: JSON export / import, reset all data (with confirmation).
- Installable **PWA** that works offline, light and dark mode, keyboard and screen-reader friendly,
  works in portrait phones and landscape tablets.

> **Data lives on one device.** Everything is stored in this browser's IndexedDB. Your chore data is never sent to a server;
> the only outside request is an anonymous visit count (see [Privacy & analytics](#privacy--analytics)).
> Use *Parent → Settings → Export backup* to back up or move to another device.

## Privacy & analytics

Chore Champs counts one anonymous page load per browser session using the open-source
[Abacus](https://github.com/JasonLovesDoggo/abacus) counter, shown as a small visit count in the footer.

- No cookies, and no personal or app data is sent or stored (the request carries no parameters).
- Do Not Track and Global Privacy Control are respected: your visit is not counted (the total is only read).
- Like any web request, it reveals your IP address to the counter service.
- The count is approximate (it includes bots and is not unique visitors) and public.

## Tech

React 18 + Vite 5, `vite-plugin-pwa`, Vitest. No backend (only the anonymous Abacus visit counter). Hash routing (`#/kid/<id>`, `#/parent/<tab>`)
so refreshes never 404 on GitHub Pages.

```
src/
  App.jsx            header, routing, toast, confetti
  hooks.js           IndexedDB-backed store, hash router, "today" clock
  components/        Home, KidBoard, Modal, PinDialog, ConfirmDialog, Confetti, Avatar, WeekStrip, Feedback
  parent/            ParentGate, ParentArea + tabs (Approvals, Chores, Kids, Rewards, Summary, Settings)
  lib/               pure logic: dates, schedule, points, actions, data (validation), pin, db, feedback, visits
tests/               Vitest unit tests for the pure logic
```

## Local development

```bash
npm install
npm run dev      # start dev server
npm test         # run unit tests once
npm run build    # production build into dist/
npm run preview  # serve the build locally
```

## Deploy (GitHub Pages)

1. Push to `main`. The workflow in `.github/workflows/deploy.yml` installs, tests, builds and deploys.
2. One-time setup: **Repo Settings → Pages → Source: "GitHub Actions"**.
3. The app is served from `https://<user>.github.io/chore-board/` (`base: '/chore-board/'` in `vite.config.js`).

## Feedback & issues

- Use the **Feedback** menu in the app footer to *Report a bug* or *Request a feature*. It opens a
  pre-filled GitHub issue form in a new tab (a free GitHub account is required; no app data is sent).
- Or go straight to [Issues](https://github.com/lance6x5/chore-board/issues):
  [bug report](https://github.com/lance6x5/chore-board/issues/new?template=bug_report.yml) ·
  [feature request](https://github.com/lance6x5/chore-board/issues/new?template=feature_request.yml)
- See [CONTRIBUTING.md](CONTRIBUTING.md) for the triage flow.

## Versioning

Chore Champs follows [Semantic Versioning](https://semver.org/). The version in `package.json` is shown in the app footer.

- **MAJOR** - breaking data/schema change (e.g. old backups need migration).
- **MINOR** - new features, backwards compatible.
- **PATCH** - bug fixes.

Changes are recorded in [CHANGELOG.md](CHANGELOG.md) (Keep a Changelog format).
