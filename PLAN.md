# Greposcope — Roadmap & Task Plan

> A living roadmap derived from a full codebase analysis. Greposcope is already a
> **feature-complete, client-side GitHub analytics SPA** — this plan is about
> **hardening, paying down deliberate tech debt, and extending** a working product,
> not finishing broken features.

---

## 1. Project Snapshot

Greposcope is a GitHub repository analytics and explorer. It is a Next.js app that
behaves as a **client-side SPA**: there is almost no server-side logic, and all real
data comes from GitHub's REST API called directly from the browser.

**Current state — what's complete and working:**

- ✅ 9 fully implemented views: `landing`, `search`, `dashboard`, `profile`,
  `compare`, `saved`, `settings`, `trending`, `topics`
- ✅ Typed GitHub REST client with rate-limit handling (`src/lib/github.ts`)
- ✅ React Query caching with per-endpoint stale times
- ✅ Zustand state persisted to localStorage (saved repos, recent searches, settings)
- ✅ Weighted health scoring (`calculateHealthScore` in `src/lib/utils.ts`)
- ✅ Rule-based "AI summary" narrative (`src/components/repo/ai-summary.tsx`)
- ✅ Recharts visualizations (stars, issues, commit activity, languages, heatstrip)
- ✅ Theme support, responsive design, toast notifications

**Tech stack:** Next.js 16 · React 19 · TypeScript 5 · Bun · Tailwind CSS 4 ·
shadcn/ui (Radix) · Zustand 5 · TanStack Query 5 · Recharts · Framer Motion ·
Prisma + SQLite (currently unused).

---

## 2. Architecture Overview

- **View routing is state-based, not URL-based.** `src/app/page.tsx` renders an
  `<AppShell>` + `<CurrentView>` that switches on `currentView` in the Zustand
  store (`src/lib/store.ts`). There is no Next.js file-based routing between views.
- **GitHub API layer** (`src/lib/github.ts`): a custom `ghFetch` wrapper handles
  auth tokens, detects rate limits, and throws a typed `GitHubError`. Key functions:
  `getRepo`, `getRepoLanguages`, `getRepoContributors`, `getRepoIssues`,
  `getRepoPullRequests`, `getRepoReleases`, `getRepoCommits`,
  `getRepoCommitActivity`, `getStargazerSample`, `getUser`, `searchRepos`,
  `getTrendingRepos`. Parsing helpers: `parseRepoInput`, `classifyQuery`.
- **Data fetching:** React Query 5; queries live inside view components (no global
  key strategy). Token presence (`!!token`) is part of query keys.
- **Persistence:** localStorage via Zustand `persist` — no backend, no accounts.
- **Database:** Prisma + SQLite scaffolding exists but is **not used** by the app.

---

## 3. Roadmap

### Phase 1 — Code Quality & Stability (foundation)

The build currently hides errors and the linter enforces almost nothing. Restore
real guardrails before building further.

- [ ] Re-enable meaningful ESLint rules in `eslint.config.mjs` (currently nearly all
      rules are `"off"`); fix resulting violations incrementally.
- [ ] Flip `typescript.ignoreBuildErrors` to `false` in `next.config.ts` and resolve
      surfaced type errors.
- [ ] Set `noImplicitAny: true` in `tsconfig.json` (currently `false` despite
      `strict: true`); fix implicit-any sites.
- [ ] Re-enable `reactStrictMode: true` in `next.config.ts`.
- [ ] Add a test runner (Vitest) and write first unit tests for pure functions:
      `calculateHealthScore`, `formatNumber`, `formatRelativeTime`,
      `languagePercentages` (`src/lib/utils.ts`); `parseRepoInput`, `classifyQuery`
      (`src/lib/github.ts`).
- [ ] Add GitHub Actions CI at `.github/workflows/ci.yml`: Bun install → lint →
      typecheck → build.

### Phase 2 — Cleanup & Honesty

Remove scaffolding the app doesn't use so the repo reflects reality.

- [ ] Decide on Prisma/SQLite. **Recommended: remove** it — delete `src/lib/db.ts`,
      `prisma/schema.prisma`, the `db:*` scripts in `package.json`, the
      `@prisma/client`/`prisma` deps, and the stale `DATABASE_URL` in `.env`
      (app is client-only). Alternatively, document a concrete use.
- [ ] Remove unused dependencies (`next-auth`, `@dnd-kit/*`) unless slated for a
      planned feature.
- [ ] Fix the hardcoded path `/home/z/my-project` in `.zscripts/build.sh`.
- [ ] Implement or delete the stub API route `src/app/api/route.ts` (returns
      `"Hello, world!"`).

### Phase 3 — Feature Enhancements

- [ ] **URL-based deep linking:** sync Zustand `currentView`/`selectedRepo` to query
      params or routes so dashboards are shareable and bookmarkable (today only the
      client-side `buildShareLink` in `src/lib/utils.ts` exists).
- [ ] **Richer star history:** replace the single sampled stargazer page
      (`getStargazerSample`) with paginated fetching and a progress indicator for a
      truer stars-over-time chart.
- [ ] **Optional real LLM summaries:** augment/replace the rule-based composer in
      `src/components/repo/ai-summary.tsx`, gated behind a user-supplied API key.
- [ ] **Export improvements:** CSV export and chart-to-PNG; keyboard navigation in
      the compare view.

### Phase 4 — Polish & Performance

- [ ] Accessibility pass on custom views (landmarks, focus order, labels) — Radix
      primitives cover base components, but the view shells need attention.
- [ ] SEO/perf: evaluate Next `Image` for avatars (currently Radix `<img>`), and add
      `robots`/`sitemap` if any SSR is introduced.
- [ ] Bundle review and code-splitting for the large `dashboard-view.tsx` (~1.2k LOC,
      10+ parallel queries).

---

## 4. Known Issues / Tech Debt

| Area | Issue | Location |
|------|-------|----------|
| Build | TypeScript errors ignored | `next.config.ts` (`ignoreBuildErrors: true`) |
| Build | React Strict Mode disabled | `next.config.ts` (`reactStrictMode: false`) |
| Lint | Nearly all ESLint rules turned off | `eslint.config.mjs` |
| Types | `noImplicitAny: false` despite strict | `tsconfig.json` |
| Tests | No test suite, no CI | (project-wide) |
| Dead code | Prisma/SQLite scaffolding unused | `src/lib/db.ts`, `prisma/schema.prisma`, `.env` |
| Dead code | Stub API route | `src/app/api/route.ts` |
| Deps | `next-auth`, `@dnd-kit/*` unused | `package.json` |
| Scripts | Hardcoded path `/home/z/my-project` | `.zscripts/build.sh` |
| Data | Star history is a single sampled page | `getStargazerSample` in `src/lib/github.ts` |
| UX | No URL routing → views not deep-linkable | `src/lib/store.ts`, `src/app/page.tsx` |

---

## 5. Quick Wins

Low-effort, high-signal items to build momentum:

- [ ] Remove unused deps (`next-auth`, `@dnd-kit/*`).
- [ ] Fix the hardcoded path in `.zscripts/build.sh`.
- [ ] Add CI (`.github/workflows/ci.yml`) running lint + typecheck + build.
- [ ] Add first unit tests for `src/lib/utils.ts` pure functions.
- [ ] Remove or wire up the `src/app/api/route.ts` stub.
