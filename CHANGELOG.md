# Changelog

All notable changes to this project will be documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) — versioning follows [SemVer](https://semver.org/).

---

## [Unreleased]

## [0.2.0] — 2026-06-18

### Added
- **Trending Repos view** — browse the most-starred GitHub repositories by timeframe (Today / This Week / This Month) with optional language filter
- `getTrendingRepos()` API helper in `src/lib/github.ts`
- `CLAUDE.md` project guidance file for Claude Code

### Removed
- Unused `examples/websocket/` template files
- Unused `download/` placeholder directory
- `.zscripts/dev.pid` runtime file (now gitignored)

## [0.1.0] — 2025-10-01

### Added
- Initial RepoScope SPA with 7 views: Landing, Search, Dashboard, Profile, Compare, Saved, Settings
- GitHub REST API client (`src/lib/github.ts`) with rate-limit detection and optional auth token support
- Repository analytics: stars over time, commit activity, language breakdown, contributor list, issue tracking
- Health score algorithm weighted across Activity (35%), Popularity (25%), Community (15%), Maintenance (15%), Documentation (10%)
- Side-by-side repository comparison (up to 3 repos)
- AI-style repository summary
- Saved repositories persisted to localStorage (no backend required)
- Zustand store with localStorage persistence for navigation, settings, and saved repos
- React Query caching for all GitHub API responses
- Prisma + SQLite database (placeholder schema)
- Vercel deployment under Rorentsu Tech team; production at `greposcope.vercel.app`
- Caddy reverse proxy configuration
