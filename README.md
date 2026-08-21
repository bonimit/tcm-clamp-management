# TCM Clamp Management

![TCM Clamp Management cover](docs/cover.gif)

An AI-assisted operations dashboard for tracking temporary pipe clamps across a refinery complex — from leak report to permanent repair, with predictive risk scoring, demand forecasting, and schedule optimization built into every screen.

Portfolio project by Bo. Built with React + Vite. Live demo auto-deploys to GitHub Pages on every push to `main`.

## Features
- Dashboard with predictive charts
- Interactive SVG plant map (pan, zoom, layer toggles, fly-to)
- Leak sealing request workflow
- Monitoring schedule
- Permanent repair tracker
- Clamp inventory with stock alerts
- AI Assist powered by Claude (bring your own Anthropic API key)

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:5173/tcm-clamp-management/

## Deploy to GitHub Pages

1. Push to `main` — GitHub Actions builds and deploys automatically.
2. First time: go to **Settings → Pages → Source → GitHub Actions**.
3. Your site will be live at `https://<your-username>.github.io/tcm-clamp-management/`

## Changing the repo name

If you name the repo something other than `tcm-clamp-management`, update `vite.config.js`:

```js
base: '/your-repo-name/',
```
