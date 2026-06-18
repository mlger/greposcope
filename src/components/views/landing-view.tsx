'use client'

import * as React from 'react'
import {
  Search,
  Star,
  GitFork,
  Users,
  Code2,
  Activity,
  ArrowRight,
  Sparkles,
  GitCompareArrows,
  Bookmark,
  ShieldCheck,
  Zap,
  LineChart,
  Trash2,
  Clock,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { parseRepoInput, classifyQuery } from '@/lib/github'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'

const FEATURE_HIGHLIGHTS = [
  {
    icon: Activity,
    title: 'Repository analytics',
    body: 'Stars over time, commit activity, issue status, PR breakdown, and contributor insights in one dashboard.',
  },
  {
    icon: Code2,
    title: 'Language breakdown',
    body: 'Color-coded distribution with byte-level accuracy sourced directly from the GitHub languages API.',
  },
  {
    icon: GitCompareArrows,
    title: 'Side-by-side compare',
    body: 'Compare 2 or 3 repositories across stars, forks, issues, contributors, and recent activity.',
  },
  {
    icon: ShieldCheck,
    title: 'Health score',
    body: 'A transparent, factor-based health score that weights activity, popularity, community, maintenance and docs.',
  },
  {
    icon: Sparkles,
    title: 'AI-style summary',
    body: 'A concise, auto-generated narrative that frames the repo at a glance for non-technical readers.',
  },
  {
    icon: Bookmark,
    title: 'Saved repositories',
    body: 'Bookmark interesting repos to your local browser storage — no account, no backend, fully private.',
  },
]

const POPULAR_REPOS = [
  { owner: 'facebook', repo: 'react', label: 'facebook/react' },
  { owner: 'vercel', repo: 'next.js', label: 'vercel/next.js' },
  { owner: 'microsoft', repo: 'vscode', label: 'microsoft/vscode' },
  { owner: 'torvalds', repo: 'linux', label: 'torvalds/linux' },
  { owner: 'tailwindlabs', repo: 'tailwindcss', label: 'tailwindlabs/tailwindcss' },
  { owner: 'facebook', repo: 'react-native', label: 'facebook/react-native' },
]

export function LandingView() {
  const selectRepo = useAppStore((s) => s.selectRepo)
  const selectUser = useAppStore((s) => s.selectUser)
  const setView = useAppStore((s) => s.setView)
  const addRecentSearch = useAppStore((s) => s.addRecentSearch)
  const recentSearches = useAppStore((s) => s.recentSearches)
  const clearRecentSearches = useAppStore((s) => s.clearRecentSearches)
  const [query, setQuery] = React.useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    const kind = classifyQuery(trimmed)
    if (kind === 'repo') {
      const parsed = parseRepoInput(trimmed)
      if (parsed) {
        addRecentSearch({ query: trimmed, type: 'repo', timestamp: Date.now() })
        selectRepo(parsed.owner, parsed.repo)
        return
      }
    }
    if (kind === 'user') {
      addRecentSearch({ query: trimmed, type: 'user', timestamp: Date.now() })
      selectUser(trimmed.replace(/^@/, ''))
      return
    }
    addRecentSearch({ query: trimmed, type: 'search', timestamp: Date.now() })
    setView('search')
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-16">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="hero-grid pointer-events-none absolute inset-0 -z-10" />
        <div className="glow absolute -top-32 left-1/2 -z-10 h-64 w-1/2 -translate-x-1/2" />
        <div className="flex flex-col items-center text-center">
          <Badge variant="outline" className="mb-4 gap-1">
            <Sparkles className="h-3 w-3" />
            GitHub repository analytics
          </Badge>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight md:text-6xl">
            Explore GitHub repositories <span className="brand-gradient">with clarity.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            Greposcope turns raw GitHub data into clear, fast, and shareable
            insights — contributors, commits, issues, languages, and a
            transparent health score, all in one developer-focused dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 w-full max-w-xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="facebook/react, github.com/owner/repo, or username…"
                className="h-12 rounded-lg pl-10 pr-32 text-base shadow-sm"
                autoFocus
              />
              <Button
                type="submit"
                className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2"
              >
                Analyze <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Quick examples */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="text-muted-foreground/70">Try:</span>
            {POPULAR_REPOS.map((r) => (
              <button
                key={r.label}
                onClick={() => {
                  setQuery(r.label)
                  selectRepo(r.owner, r.repo)
                }}
                className="rounded-full border bg-card px-2.5 py-1 font-mono text-[11px] hover:border-foreground/40 hover:bg-accent"
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="mt-16 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icon: Star, label: 'Insights per repo', value: '12+' },
          { icon: Activity, label: 'Live GitHub data', value: 'REST v3' },
          { icon: Users, label: 'Contributor analysis', value: 'Top 100' },
          { icon: Code2, label: 'Languages detected', value: '∞' },
        ].map((s) => (
          <Card key={s.label} className="card-hover">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-muted text-muted-foreground">
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </p>
                <p className="text-lg font-semibold tabular-nums">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Features */}
      <section className="mt-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Everything you need to scope a repository
          </h2>
          <p className="mt-3 text-muted-foreground">
            Built for developers, maintainers, and teams evaluating open-source
            dependencies. No login required — public GitHub data, transparent
            methodology, instant results.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_HIGHLIGHTS.map((f) => (
            <Card key={f.title} className="card-hover h-full">
              <CardContent className="p-5">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-foreground text-background">
                  <f.icon className="h-4 w-4" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent searches */}
      {recentSearches.length > 0 && (
        <section className="mt-16">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Recent searches</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearRecentSearches()
                toast.success('Recent searches cleared')
              }}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {recentSearches.map((r) => (
              <button
                key={`${r.query}-${r.timestamp}`}
                onClick={() => {
                  if (r.type === 'repo') {
                    const parsed = parseRepoInput(r.query)
                    if (parsed) {
                      selectRepo(parsed.owner, parsed.repo)
                      return
                    }
                  }
                  if (r.type === 'user') {
                    selectUser(r.query.replace(/^@/, ''))
                    return
                  }
                  setView('search')
                }}
                className="group inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs hover:border-foreground/40 hover:bg-accent"
              >
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {r.type}
                </Badge>
                <span className="font-mono">{r.query}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mt-20">
        <Card className="overflow-hidden border-foreground/10 bg-foreground text-background">
          <CardContent className="flex flex-col items-start gap-4 p-8 md:flex-row md:items-center md:justify-between md:p-12">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Ready to scope a repository?
              </h2>
              <p className="text-sm text-background/70 md:text-base">
                Paste a GitHub URL, an owner/repo, or a username to get started.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setView('search')}
              >
                <Search className="mr-2 h-4 w-4" />
                Advanced search
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
                onClick={() => selectRepo('facebook', 'react')}
              >
                <Zap className="mr-2 h-4 w-4" />
                Try with facebook/react
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
