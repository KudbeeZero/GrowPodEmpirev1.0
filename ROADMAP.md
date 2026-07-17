# ROADMAP.md

GrowPod Empire — prioritized work list.

> Source: Carried over from the interrupted PR described in
> `.github/instructions/*.instructions.md` (6 pending items), plus ongoing
> tech-debt tracked in `AGENTS.md`. Human-in-the-loop only: nothing here is
> started without explicit approval (see `AGENTS.md` → Operating Rules).

## Status
- Project: v2.0 idle/farming game on Algorand TestNet (head: `56109e9`).
- Workflow: AI-assisted PRs to `main` (Copilot/Claude branches). CI tolerates
  14 known TypeScript errors (see `AGENTS.md`).
- Branch hygiene: ~55 stale remote branches — cleanup is recommended before
  new work (see `scripts/cleanup-branches.sh`).

## Priority 1 — Pending items (from interrupted PR)
Ordered by user-facing impact. These are the 6 items the agent was mid-flight on.

1. **Multi-wallet support** — ✅ Already implemented.
   - Pera + Defly (WalletConnect) both wired in `AlgorandContext.tsx`,
     `WalletSelector.tsx` offers both, Navigation shows active wallet.
   - **Done (2026-07-17)**: added `localStorage` persistence of the
     last-used wallet type so a fresh reload restores the correct session
     globally (prefers stored wallet, falls back to the other). Non-breaking.
     Files: `client/src/context/AlgorandContext.tsx`.

2. **Remove "Fast Mode" button**
   - Clean up homepage by removing the unnecessary water-throttling control while
     keeping the underlying functionality intact.
   - Files: `client/src/pages/Dashboard.tsx`, Navigation/components.

3. **Fix song upload**
   - Repair metadata extraction and ensure audio files upload properly to the
     Jukebox (Replit Object Storage / signed URLs).
   - Files: `client/src/pages/Jukebox.tsx`, `server/routes.ts`, `server/replit_integrations/object_storage/`.

4. **Button hover effects**
   - Add subtle glowing hover effects to buttons throughout the app for better
     visual feedback.
   - Files: `client/src/components/ui/button.tsx`, shared Tailwind utilities.

5. **Enhanced landing page**
   - Make the welcome screen more informative/visually appealing with feature
     showcases.
   - Files: landing/home page component.

6. **TypeScript improvements**
   - Fix type definitions throughout the codebase (shrink the 14-error baseline
     in `AGENTS.md`). Can be done incrementally alongside other items.

## Priority 2 — Tech debt (tracked in AGENTS.md)
- Reduce the 14 known TS errors to 0 (CombinerLab, Dashboard, SeedVault).
- Consolidate/delete ~55 stale `copilot/*` and `claude/*` branches.
- Add a real memory/context layer (no cross-session memory currently exists).

## Priority 3 — Possible future (not yet committed)
- Mainnet considerations (currently TestNet only).
- Additional pod slots / breeding mechanics polish.
- Expanded community/achievements features.
