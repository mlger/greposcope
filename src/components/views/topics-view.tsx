'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Hash, Search, Tag } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { searchRepos } from '@/lib/github'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  RepoCard,
  RepoCardSkeleton,
  EmptyState,
  ErrorState,
  SectionHeading,
} from '@/components/repo/common'

const POPULAR_TOPICS = [
  'machine-learning',
  'cli',
  'web-framework',
  'game-engine',
  'database',
  'security',
  'devtools',
  'mobile',
  'api',
  'blockchain',
] as const

export function TopicsView() {
  const settings = useAppStore((s) => s.settings)
  const [selectedTopic, setSelectedTopic] = React.useState<string>('')
  const [inputValue, setInputValue] = React.useState('')

  const token = settings.githubToken || undefined

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['topics', selectedTopic, !!settings.githubToken],
    queryFn: () =>
      searchRepos({
        q: `topic:${selectedTopic} stars:>50`,
        sort: 'stars',
        order: 'desc',
        perPage: 30,
        token,
      }),
    enabled: !!selectedTopic,
    staleTime: 5 * 60_000,
    retry: false,
  })

  function handleTopicSelect(topic: string) {
    const normalized = topic.trim().toLowerCase().replace(/\s+/g, '-')
    if (!normalized) return
    setSelectedTopic(normalized)
    setInputValue('')
  }

  function handleInputSubmit(e: React.FormEvent) {
    e.preventDefault()
    handleTopicSelect(inputValue)
  }

  const items = data?.items ?? []

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
      <SectionHeading
        title="Topic Explorer"
        description="Browse GitHub repositories by topic tag. Select a popular topic or enter your own."
      />

      {/* Popular topic chips */}
      <div className="mt-5 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Popular topics
        </p>
        <div className="flex flex-wrap gap-2">
          {POPULAR_TOPICS.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => handleTopicSelect(topic)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                selectedTopic === topic
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-background text-muted-foreground hover:border-foreground/50 hover:text-foreground',
              )}
            >
              <Hash className="h-3 w-3" />
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Custom topic input */}
      <form onSubmit={handleInputSubmit} className="mt-4 flex gap-2">
        <div className="relative max-w-xs flex-1">
          <Hash className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Custom topic, e.g. react-hooks"
            className="h-9 pl-8 text-sm"
            aria-label="Custom topic"
          />
        </div>
        <Button type="submit" size="sm" disabled={!inputValue.trim()}>
          <Search className="mr-1.5 h-3.5 w-3.5" />
          Explore
        </Button>
      </form>

      {/* Active topic indicator */}
      {selectedTopic && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Showing results for</span>
          <Badge variant="secondary" className="gap-1 text-xs">
            <Hash className="h-3 w-3" />
            {selectedTopic}
          </Badge>
          <button
            type="button"
            className="text-xs text-muted-foreground underline hover:text-foreground"
            onClick={() => setSelectedTopic('')}
          >
            Clear
          </button>
        </div>
      )}

      {/* Results */}
      <div className="mt-6">
        {!selectedTopic && (
          <EmptyState
            title="Select a topic to explore"
            message="Choose one of the popular topics above, or type your own to discover repositories."
            icon={Tag}
          />
        )}

        {selectedTopic && isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <RepoCardSkeleton key={i} />
            ))}
          </div>
        )}

        {selectedTopic && isError && error instanceof Error && (
          <ErrorState
            message={error.message}
            onRetry={() => refetch()}
            hint={
              /rate limit/i.test(error.message) ? (
                <span>
                  Add a{' '}
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

        {selectedTopic && !isLoading && !isError && items.length === 0 && (
          <EmptyState
            title="No repositories found"
            message={`No repositories tagged with "${selectedTopic}" have more than 50 stars. Try a different topic.`}
            icon={Hash}
          />
        )}

        {selectedTopic && !isLoading && !isError && items.length > 0 && (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              Showing{' '}
              <span className="font-medium text-foreground">{items.length}</span>{' '}
              repositories tagged{' '}
              <span className="font-medium text-foreground">#{selectedTopic}</span>
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
