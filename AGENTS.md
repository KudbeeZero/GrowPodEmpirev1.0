# AGENTS.md — Memory & Operating Rules

This file is the persistent memory layer for AI agents (Kilo, Claude, Copilot)
working on GrowPod Empire. Update it as decisions and context change.

## Project Snapshot
- **Name**: GrowPod Empire v2.0 — blockchain idle/farming game on Algorand TestNet.
- **Stack**: React 18 + Vite + TS (frontend), Express + Drizzle + PostgreSQL
  (backend), TEALScript/PyTeal (Algorand contracts).
- **Deploy**: Cloudflare Workers (`deploy-cloudflare.yml`) + Vercel analytics.
- **Wallet**: Pera Wallet Connect (multi-wallet planned — see ROADMAP.md).
- **Repo conventions**: `@/` → `client/src/`, `@shared/` → `shared/`; TanStack
  Query for API calls; shadcn/ui; Tailwind dark cyberpunk theme.

## Operating Rules (USER PREFERENCES)
- **NEVER auto-merge.** No merge to `main` without explicit user approval.
- **NEVER open a PR** without explicit user approval.
- **Human in the loop**: propose intent → user approves → implement → report.
- Keep work on a clearly named branch (`kilo/<task>`, or `feature/*`/`fix/*`).
- Run `npm run check` + `npm run build` before declaring done (14 known errors
  are tolerated by CI — see below — but do not introduce new ones).
- No hardcoded secrets; use `import.meta.env.VITE_*` and server env vars.

## Known TypeScript Errors (baseline = 14, tolerated by CI)
CI (`pr-validation.yml`) hard-codes `ALLOWED_ERRORS=14` and only fails if the
count *increases*. Root cause: seed-object type inference. These are NOT to be
treated as blocked, but should shrink over time.

| # | File | Area |
|---|------|------|
| 1-? | `client/src/pages/CombinerLab.tsx` | `userSeed.seed.*` access — `SeedBankItem` relation not inferred |
| 1-? | `client/src/pages/Dashboard.tsx` | `(UserSeed & { seed: SeedBankItem })` typing in state/query/handlers |
| 1-? | `client/src/pages/SeedVault.tsx` | `userSeed.seed.rarity` / `.name` access type inference |

> Exact per-file counts were not reproducible in this session (`tsc` not
> installed in the sandbox). Re-run `npm run check` after `npm install` to get
> precise line numbers and update this table. Total confirmed baseline: 14.

## Decisions & Context
- `main` is the single source of truth; all AI work merges back via reviewed PR.
- Smart contracts converted PyTeal → TEALScript (`contracts/GrowPodEmpire.algo.ts`).
- Repo consistency enforced by `scripts/validate-consistency.js` +
  `validation-config.json` (see `VALIDATION_*.md`).
- No AI memory layer, no HERMES/agent orchestration exists in this repo.

## Recent User Requests
- Audited repo for memory layer / HERMES / workflow / roadmap (no such systems found).
- Requested workflow improvements; created `ROADMAP.md` + this `AGENTS.md`.
