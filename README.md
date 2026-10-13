# Frontend

React + Vite + TypeScript SPA: lazy routes, skeleton loaders, error boundary, cookie auth with silent refresh, typed API client generated from the backend contract, maintenance and error pages, admin dashboard.

```bash
npm install
npm run dev            # http://localhost:5173, proxies /api -> http://localhost:4000
npm run api:sync       # copy ../backend/openapi.yaml and regenerate src/api/schema.d.ts
npm run check          # typecheck + guard + tests + build
```

Deploy (Vercel): root `frontend`, build `npm run build`, output `dist`. Point the rewrite at your API once: `npm run set-api -- https://your-api-host`. `develop` -> preview/staging, `main` -> production. Security headers live in `vercel.json`.
