---
name: ui-states
description: Use when building or changing any page or component that loads data or submits a form.
---
Pattern (copy `src/pages/Home.tsx` for lists, `AgentConsole.tsx` for mutations):
- `useQuery`: `isPending` -> `ListSkeleton`/`PageSkeleton`; `isError` -> `ErrorState` + retry; empty -> `EmptyState` + action; else the data.
- `useMutation`: disable the button while pending, show `Spinner`, show `Alert` with `userMessage(error)`, invalidate related queries on success.
- Forms: inline validation on submit/blur, `aria-invalid` + `aria-describedby`, labels, no placeholder-only inputs.
- Test: loading, empty, error and one interaction (see `tests/ui.test.tsx`).
