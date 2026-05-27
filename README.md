# WashLy Web

React + Vite PWA for WashLy (owner/manager dashboard + staff PIN flows).

**API (required):** [washly-api](https://github.com/DevD3nz/washly-api) — run on `http://localhost:8000` before starting the web app.

## Quick start

```powershell
cd web
copy .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

- **First-time setup:** http://localhost:5173/setup (needs API running; one account per install)
- **Owner login:** http://localhost:5173/login
- **Staff PIN:** http://localhost:5173/staff/login

## Environment

| Variable | Default | Notes |
|----------|---------|--------|
| `VITE_API_URL` | *(empty)* | Leave empty for dev: Vite proxies `/api` → `http://localhost:8000` |

For production or a remote API, set e.g. `VITE_API_URL=https://api.example.com/api/v1`.

## API / CORS

In dev, requests go through the Vite proxy (`vite.config.ts`), so you usually do not need CORS changes.

If you point `VITE_API_URL` at the API directly, ensure the API allows your origin:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

(in `washly-api` `.env`)

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (port 5173) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |

## Stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router · React Hook Form + Zod · PWA (`vite-plugin-pwa`)
