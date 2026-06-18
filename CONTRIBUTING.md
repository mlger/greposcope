# Contributing to RepoScope

## Prerequisites

- [Bun](https://bun.sh) — package manager and runtime
- Node.js 18+ (used by some tooling)
- Git

## Setup

```bash
git clone https://github.com/mlger/greposcope
cd greposcope
bun install
bun run db:push   # sync Prisma schema to SQLite
bun run dev       # starts on http://localhost:3000
```

## Making changes

1. Create a branch: `git checkout -b your-feature`
2. Make your edits
3. Run `bun run lint` and fix any issues before committing
4. Open a pull request against `main`

## Code conventions

**Package manager:** Use `bun` — not `npm` or `yarn`.

**Where things live:**
- New views → `src/components/views/`
- GitHub API functions → `src/lib/github.ts`
- Global state (reads + writes) → `useAppStore` in `src/lib/store.ts`
- Shared types → `src/lib/types.ts`
- Utility functions → `src/lib/utils.ts`

**Styling:** Tailwind utility classes only. To add a new shadcn/ui component: `bunx shadcn add <name>`.

**Routing:** The app uses Zustand-based view routing, not Next.js file routes. To add a new view, register it in `ViewId` (`src/lib/types.ts`), `NAV_ITEMS` (`src/components/app-shell.tsx`), and `CurrentView` (`src/app/page.tsx`).

## PR guidelines

- Keep PRs focused on a single concern
- Link any related issues in the PR description
- The build ignores TypeScript and ESLint errors (`ignoreBuildErrors: true`), but please keep new code clean
