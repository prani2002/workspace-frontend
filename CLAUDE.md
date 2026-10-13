# Frontend (React 18 + Vite + TypeScript, TanStack Query, React Router)
Rules here add to the workspace CLAUDE.md (scope law, token rules, no guessing). API types come from the backend contract.

Run: `npm run dev` (proxies /api to :4000) · `npm run check` (types+guard+tests+build) · `npm run api:sync` after any backend contract change
Layout: `src/routes.tsx` (route table) · `src/pages/` · `src/components/` · `src/api/{client,endpoints,errors,schema.d.ts}` · `src/auth/`

## Rules
1. Routes only in `src/routes.tsx` with `scope` (MUST id), `auth`, `title`; pages are lazy-loaded. New slice: `node scripts/new-feature.mjs Mx slug` (from the workspace root).
2. API calls only via `src/api/endpoints.ts` -> `client.ts` (never `fetch` elsewhere; guard fails). Types from `src/api/schema.d.ts` (grep it, never read it whole; never edit it: run `npm run api:sync`).
3. Every async view has all four states: loading (skeleton/shimmer), error (`ErrorState` with retry), empty (`EmptyState` with next action), success. Buttons show a busy state and block double submits.
4. Errors reach users only through `userMessage()` (`src/api/errors.ts`). Never show raw error text, stack traces or status codes alone.
5. Create/mutate calls send an `Idempotency-Key` (see `AgentConsole.tsx`: one key per user intent, reused on retry).
6. Auth is cookie-based. Never store tokens or passwords in web storage. Role checks in UI are only convenience; the backend enforces.
7. No `dangerouslySetInnerHTML`, `eval`, hard-coded API hosts, or third-party scripts (CSP in `vercel.json` blocks them).
8. Accessible by default: labels on inputs, visible focus, semantic headings, `aria-live` for async results, `prefers-reduced-motion` respected, works at 360 px wide.
9. Tests (vitest + Testing Library) per page: loading/empty/error + one interaction. Mock `api` from `src/api/endpoints`.
10. No new dependency without user approval (`node scripts/dep.mjs approve frontend <pkg>`).
