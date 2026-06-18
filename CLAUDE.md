# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Package manager:** Bun (not npm/yarn — use `bun` for all installs and script runs)

```bash
bun run dev        # Start dev server (port 3000); logs to dev.log
bun run build      # Next.js standalone build + copy static assets
bun run start      # Run production build
bun run lint       # ESLint

bun run db:push      # Sync Prisma schema to SQLite (no migration file created)
bun run db:generate  # Regenerate Prisma client after schema change
bun run db:migrate   # Create and run a migration
bun run db:reset     # Wipe and re-run all migrations
```

There are no test commands — no test suite exists in this project.

The `.zscripts/` directory has shell scripts for full dev setup (`dev.sh`) and production builds (`build.sh`), but the `bun run` commands above are the typical entry points.

## Architecture

**RepoScope** is a GitHub repository analytics and explorer SPA. It is a Next.js app that behaves as a client-side SPA — there is almost no server-side logic. The single API route (`src/app/api/route.ts`) returns a placeholder response; all real data comes from GitHub's REST API called directly from the browser.

### View routing (not URL-based)

Navigation is controlled by a Zustand store (`src/lib/store.ts`), not by Next.js file-based routing. The root `src/app/page.tsx` renders an `<AppShell>` and a `<CurrentView>` component that switches between 7 views based on `currentView` state:

- `landing` → `src/components/views/landing-view.tsx`
- `search` → `src/components/views/search-view.tsx`
- `dashboard` → `src/components/views/dashboard-view.tsx`
- `profile` → `src/components/views/profile-view.tsx`
- `compare` → `src/components/views/compare-view.tsx`
- `saved` → `src/components/views/saved-view.tsx`
- `settings` → `src/components/views/settings-view.tsx`

### State management

`useAppStore` (Zustand, persisted to localStorage) is the central state: current view, selected repo/user, comparison list (max 3), saved repos, recent searches, and user settings (GitHub token, theme toggles).

### GitHub API layer

`src/lib/github.ts` is a typed client wrapping GitHub REST API v2022-11-28. It uses a custom `ghFetch` that handles auth tokens (from Zustand store), detects rate-limit errors, and returns typed results. The token is optional but raises the limit from 60 to 5,000 req/hr. Key functions: `getRepo`, `getRepoLanguages`, `getRepoContributors`, `getRepoIssues`, `getRepoCommits`, `getRepoCommitActivity`, `getStargazerSample`.

### Data fetching

React Query 5 is used for caching GitHub API responses. Queries live inside view components (not centralized). No global query key strategy — each view defines its own keys.

### UI

- shadcn/ui (Radix UI + Tailwind CSS 4) for base components in `src/components/ui/`
- Repo-specific analytics components in `src/components/repo/` (charts, health score card, AI summary, contributors)
- Recharts for data visualization
- Framer Motion for animations; Sonner for toasts

### Health scoring

`src/lib/utils.ts` contains `calculateHealthScore()` — a weighted algorithm scoring repos 0–100 across: Activity (35%), Popularity (25%), Community (15%), Maintenance (15%), Documentation (10%). This is purely client-side computation.

### Database

Prisma + SQLite (`db/custom.db`). The schema has placeholder `User` and `Post` models and is not meaningfully used by the app yet. The `DATABASE_URL` is in `.env`.

### Build output

`next.config.ts` sets `output: "standalone"`. TypeScript errors and ESLint errors are ignored during build (`ignoreBuildErrors: true`, `ignoreDuringBuilds: true`). Strict mode is disabled.

### Reverse proxy

`Caddyfile` configures Caddy to expose the app on port 81, proxying to localhost:3000.

## Deployment

- **GitHub:** public repo at `github.com/mlger/greposcope`
- **Vercel:** deployed under team **Rorentsu Tech** (`rorentsu-tech`)
  - Production URL: `greposcope.vercel.app`
  - Auto-deploys from the `main` branch via GitHub integration
  - Runtime: Node.js 24.x, Turbopack bundler
  - Project ID: `prj_wY4VRR0HYSQDXKCKCm0E4JCHJWBj`

## Path aliases

`@/*` maps to `src/*` (configured in `tsconfig.json` and `components.json`).
