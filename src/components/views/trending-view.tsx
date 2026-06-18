'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { getTrendingRepos } from '@/lib/github'
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
  SectionHeading,
} from '@/components/repo/common'

type Since = 'day' | 'week' | 'month'

const TIMEFRAMES: { value: Since; label: string }[] = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
]

const LANGUAGES = [
  'TypeScript',
  'JavaScript',
  'Python',
  'Go',
  'Rust',
  'Java',
  'C++',
  'C',
  'Ruby',
  'Swift',
  'Kotlin',
  'PHP',
  'Shell',
  'Dart',
  'HTML',
]

export function TrendingView() {
  const settings = useAppStore((s) => s.settings)

  const [since, setSince] = React.useState<Since>('week')
  const [language, setLanguage] = React.useState<string>('')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['trending', since, language],
    queryFn: () =>
      getTrendingRepos({
        since,
        language: language || undefined,
        perPage: 30,
        token: settings.githubToken || undefined,
      }),
    staleTime: 5 * 60_000,
    retry: false,
  })

  const items = data?.items ?? []

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
      <SectionHeading
        title="Trending repositories"
        description="The most starred GitHub repositories created in the selected timeframe."
      />

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-md border p-0.5">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              type="button"
              onClick={() => setSince(tf.value)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                since === tf.value
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        <Select value={language || 'any'} onValueChange={(v) => setLanguage(v === 'any' ? '' : v)}>
          <SelectTrigger className="h-8 w-[150px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any language</SelectItem>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-8">
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
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

        {!isLoading && !isError && items.length === 0 && (
          <EmptyState
            title="No repositories found"
            message="Try a wider timeframe or a different language filter."
            icon={TrendingUp}
          />
        )}

        {!isLoading && !isError && items.length > 0 && (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{items.length}</span> repositories
            </p>
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
