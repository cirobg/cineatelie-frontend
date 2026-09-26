# cineatelie-frontend

React 19 + TypeScript SPA for Cine Ateliê (ADR-005), built with Vite. Architecture, ADRs and
specs live in the sibling [`cineatelie`](https://github.com/cirobg/cineatelie) repository —
start there, specifically `03-spec/spec-20260920-frontend.md`.

## Running locally

```bash
npm install
npm run dev
```

There is no backend wiring yet (M0): `npm run dev` shows a placeholder page. Login, routing
and the app shell land in M1 alongside `cineatelie-backend`'s `modules/identity`.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) then production build |
| `npm run lint` | `oxlint` |
| `npm test` | `vitest run` |

## Repository layout

```
src/
  app/          router, providers, error boundary, app shell — M1
  features/     one folder per screen area — from M1 onward
  shared/
    ui/         the in-house component library (§3 of the frontend spec) — M1
    lib/        format.ts (the only sanctioned formatter — §6), pure utilities
    auth/       AuthClient seam over supabase-js — M1
    i18n/       pt-BR copy catalogue — M1
  styles/       tokens.css — the design tokens, Appendix C of the architecture doc, final
contract/       openapi.json, VERSION, generated/client.ts — from M1, once there is a
                backend contract to pin against
```

## What's deliberately not here yet

React Router, TanStack Query, Zustand, React Hook Form + Zod, `@dnd-kit`, TanStack Table
(ADR-005's full stack) are not installed. Nothing in M0 uses them — installing them now would
be speculative. They arrive with the screens that need them, starting M1.

## Status

M0 — Foundations. See `cineatelie/04-implementation/` for what has been built, what is
pending, and which of the implementation plan's highest-risk items are addressed.
