---
name: frontend-security
description: Use before shipping, or when touching auth, API client, headers, or anything that renders user or agent-generated text.
---
- Sessions are httpOnly cookies; the SPA only reads `csrf_token`. No tokens in web storage or URLs.
- Render agent/user text as plain text (React escapes). No `dangerouslySetInnerHTML` unless sanitised and flagged `fde-allow-unsafe` after review.
- `vercel.json` carries CSP/HSTS/frame/referrer headers: after adding any external resource, update `connect-src`/`img-src` deliberately (prefer not to add any).
- `/api` is proxied same-origin (Vite in dev, Vercel rewrite in prod: `npm run set-api -- https://api-host`). Keep it that way so cookies stay first-party.
- `npm run audit:deps` clean at high severity; review Dependabot PRs weekly.
