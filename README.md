# TCM Clamp Management

AI-driven temporary clamp management system — portfolio project by Bo.

Built with React + Vite. Live demo auto-deploys to GitHub Pages on every push to `main`.

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
