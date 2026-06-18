'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  SlidersHorizontal,
  Star,
  GitFork,
  Calendar,
  Loader2,
  ArrowDownWideNarrow,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import {
  searchRepos,
  getUserRepos,
  getOrgRepos,
  parseRepoInput,
  type SearchReposParams,
} from '@/lib/github'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  RepoCard,
  RepoCardSkeleton,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeading,
} from '@/components/repo/common'
import type { GitHubRepo } from '@/lib/types'

type Mode = 'search' | 'user' | 'org'

export function SearchView() {
  const searchQuery = useAppStore((s) => s.searchQuery)
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)
  const selectRepo = useAppStore((s) => s.selectRepo)
  const selectUser = useAppStore((s) => s.selectUser)
  const addRecentSearch = useAppStore((s) => s.addRecentSearch)
  const settings = useAppStore((s) => s.settings)

  const [input, setInput] = React.useState(searchQuery)
  const [mode, setMode] = React.useState<Mode>('search')
  const [sort, setSort] = React.useState<NonNullable<SearchReposParams['sort']>>('stars')
  const [order, setOrder] = React.useState<'asc' | 'desc'>('desc')
  const [language, setLanguage] = React.useState<string>('')

  React.useEffect(() => {
    setInput(searchQuery)
  }, [searchQuery])

  // Auto-classify when input changes - if it parses as owner/repo, jump to dashboard.
  React.useEffect(() => {
    if (!input) return
    const parsed = parseRepoInput(input)
    if (parsed && input.includes('/')) {
      // Don't auto-navigate; let user click. Just set the mode hint.
      setMode('search')
    }
  }, [input])

  const effectiveQuery = input.trim()

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['search', effectiveQuery, mode, sort, order, language],
    queryFn: async () => {
      if (!effectiveQuery) return { items: [] as GitHubRepo[], total: 0, kind: mode }
      const token = settings.githubToken || undefined

      // Quick path: input parses as owner/repo → fetch that single repo (via search by full_name)
      const parsed = parseRepoInput(effectiveQuery)
      if (parsed && !effectiveQuery.includes(' ') && mode === 'search') {
        const r = await searchRepos({
          q: `repo:${parsed.owner}/${parsed.repo}`,
          token,
          perPage: 1,
        })
        return { items: r.items, total: r.total_count, kind: 'direct' as const }
      }

      if (mode === 'user') {
        const repos = await getUserRepos(
          effectiveQuery.replace(/^@/, ''),
          token,
          sort === 'stars' ? 'stars' : sort === 'forks' ? 'forks' : 'updated',
          100,
        )
        return { items: repos, total: repos.length, kind: 'user' as const }
      }
      if (mode === 'org') {
        const repos = await getOrgRepos(
          effectiveQuery.replace(/^@/, ''),
          token,
          sort === 'stars' ? 'stars' : sort === 'forks' ? 'forks' : 'updated',
          100,
        )
        return { items: repos, total: repos.length, kind: 'org' as const }
      }

      // Default search mode
      let q = effectiveQuery
      if (language) q = `${q} language:${language}`
      const r = await searchRepos({
        q,
        sort,
        order,
        perPage: 30,
        token,
      })
      return { items: r.items, total: r.total_count, kind: 'search' as const }
    },
    enabled: !!effectiveQuery,
    staleTime: 60_000,
    retry: false,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    setSearchQuery(trimmed)
    addRecentSearch({
      query: trimmed,
      type: mode === 'search' ? 'search' : 'user',
      timestamp: Date.now(),
    })
    refetch()
  }

  const items = data?.items ?? []

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
      <SectionHeading
        title="Repository search"
        description="Search by keywords, fetch a user's repositories, or list an organization's repos. Inputs like owner/repo or full GitHub URLs also work."
      />

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. react state management, facebook/react, vercel, @torvalds"
            className="h-11 pl-9 text-base"
            autoFocus
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode */}
          <div className="flex items-center gap-1 rounded-md border p-0.5">
            {(['search', 'user', 'org'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  mode === m
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                {m === 'search' ? 'Keywords' : m}
              </button>
            ))}
          </div>

          {mode === 'search' && (
            <>
              <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                <SelectTrigger className="h-8 w-[120px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stars">Sort: Stars</SelectItem>
                  <SelectItem value="forks">Sort: Forks</SelectItem>
                  <SelectItem value="updated">Sort: Updated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={order} onValueChange={(v) => setOrder(v as 'asc' | 'desc')}>
                <SelectTrigger className="h-8 w-[120px] text-xs">
                  <ArrowDownWideNarrow className="mr-1.5 h-3 w-3" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={language || 'any'} onValueChange={(v) => setLanguage(v === 'any' ? '' : v)}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any language</SelectItem>
                  <SelectItem value="TypeScript">TypeScript</SelectItem>
                  <SelectItem value="JavaScript">JavaScript</SelectItem>
                  <SelectItem value="Python">Python</SelectItem>
                  <SelectItem value="Go">Go</SelectItem>
                  <SelectItem value="Rust">Rust</SelectItem>
                  <SelectItem value="Java">Java</SelectItem>
                  <SelectItem value="C++">C++</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="Ruby">Ruby</SelectItem>
                  <SelectItem value="Swift">Swift</SelectItem>
                  <SelectItem value="Kotlin">Kotlin</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          <Button type="submit" disabled={!input.trim() || isFetching}>
            {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Search
          </Button>

          {mode === 'user' && input.trim() && (
            <Button
              type="button"
              variant="outline"
              onClick={() => selectUser(input.trim().replace(/^@/, ''))}
            >
              View profile instead
            </Button>
          )}
        </div>
      </form>

      {/* Results */}
      <div className="mt-8">
        {!effectiveQuery && (
          <EmptyState
            title="Start your search"
            message="Type a keyword, paste a GitHub URL, or enter a username/org to explore repositories."
            icon={SlidersHorizontal}
          />
        )}

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <RepoCardSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && error instanceof Error && (
          <ErrorState
            message={error.message}
            onRetry={() => refetch()}
            hint={
              /rate limit/i.test(error.message) ? (
                <span>
                  Tip: Add a{' '}
                  <button
                    className="underline"
                    onClick={() => useAppStore.getState().setView('settings')}
                  >
                    personal access token
                  </button>{' '}
                  in Settings to raise your limit to 5,000 req/hour.
                </span>
              ) : null
            }
          />
        )}

        {!isLoading && !isError && effectiveQuery && items.length === 0 && (
          <EmptyState
            title="No repositories found"
            message="Try different keywords, switch the search mode, or check the spelling."
          />
        )}

        {!isLoading && !isError && items.length > 0 && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{items.length}</span> repositories
                {data?.total !== undefined && data.total > items.length && (
                  <> of <span className="font-medium text-foreground">{data.total.toLocaleString()}</span> total</>
                )}
                {data?.kind && (
                  <Badge variant="outline" className="ml-2 text-[10px] uppercase">
                    {data.kind}
                  </Badge>
                )}
              </p>
              {(sort === 'stars' || sort === 'forks') && (
                <span className="hidden items-center gap-1 text-xs text-muted-foreground md:inline-flex">
                  <ArrowDownWideNarrow className="h-3 w-3" />
                  Sorted by {sort}
                </span>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((repo) => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
