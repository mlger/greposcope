'use client'

import * as React from 'react'
import { useQueries } from '@tanstack/react-query'
import {
  GitCompareArrows,
  X,
  Plus,
  Trophy,
  Star,
  GitFork,
  CircleDot,
  Users,
  Calendar,
  Activity,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { getRepo, getRepoContributors, GitHubError } from '@/lib/github'
import {
  cn,
  formatNumber,
  formatRelativeTime,
  formatDate,
  activityLevelLabel,
} from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { parseRepoInput } from '@/lib/github'
import { toast } from 'sonner'
import { ErrorState, EmptyState, LoadingState, RepoCardSkeleton, SectionHeading } from '@/components/repo/common'
import type { GitHubRepo } from '@/lib/types'

type QueryLike = {
  isLoading: boolean
  isError: boolean
  error: unknown
  data?: { repo: GitHubRepo; contributorsCount: number | null } | undefined
  refetch: () => void
}

export function CompareView() {
  const compareList = useAppStore((s) => s.compareList)
  const removeFromCompare = useAppStore((s) => s.removeFromCompare)
  const clearCompare = useAppStore((s) => s.clearCompare)
  const addToCompare = useAppStore((s) => s.addToCompare)
  const settings = useAppStore((s) => s.settings)

  const [input, setInput] = React.useState('')

  const queries = useQueries({
    queries: compareList.map((entry) => ({
      queryKey: ['compare-repo', entry.full_name, !!settings.githubToken],
      queryFn: async () => {
        const repo = await getRepo(entry.owner, entry.repo, settings.githubToken || undefined)
        let contributorsCount: number | null = null
        try {
          const contributors = await getRepoContributors(entry.owner, entry.repo, settings.githubToken || undefined, 100)
          contributorsCount = contributors.length
        } catch {
          // ignore — contributors are optional
        }
        return { repo, contributorsCount }
      },
      staleTime: 5 * 60_000,
      retry: false,
    })),
  }) as QueryLike[]

  function handleAdd() {
    const parsed = parseRepoInput(input)
    if (!parsed) {
      toast.error('Enter owner/repo or a GitHub URL')
      return
    }
    const fullName = `${parsed.owner}/${parsed.repo}`
    if (compareList.some((c) => c.full_name === fullName)) {
      toast.error('Already in comparison')
      return
    }
    if (compareList.length >= 3) {
      toast.error('Compare list is full (max 3)')
      return
    }
    addToCompare({ owner: parsed.owner, repo: parsed.repo, full_name: fullName })
    setInput('')
  }

  const loaded: { repo: GitHubRepo; contributorsCount: number | null }[] = []
  const loadingCount = queries.filter((q) => q.isLoading).length
  const errorCount = queries.filter((q) => q.isError).length

  for (const q of queries) {
    if (q.data) loaded.push(q.data)
  }

  // Compute "winner" per metric — only counts among successfully loaded repos
  const winner = (key: 'stars' | 'forks' | 'issues' | 'contributors' | 'pushedAt') => {
    if (loaded.length < 2) return null
    let best: { full_name: string; value: number } | null = null
    for (const item of loaded) {
      const value =
        key === 'stars' ? item.repo.stargazers_count
        : key === 'forks' ? item.repo.forks_count
        : key === 'issues' ? -item.repo.open_issues_count
        : key === 'contributors' ? item.contributorsCount ?? 0
        : -new Date(item.repo.pushed_at).getTime()
      if (!best || value > best.value) {
        best = { full_name: item.repo.full_name, value }
      }
    }
    return best?.full_name ?? null
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 space-y-6">
      <SectionHeading
        title="Compare repositories"
        description="Add up to 3 repositories to compare side by side across popularity, activity, and community signals."
        action={
          compareList.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => clearCompare()}>
              <X className="mr-1.5 h-3.5 w-3.5" />
              Clear all
            </Button>
          ) : null
        }
      />

      {/* Add input */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a repo: owner/repo, or paste a GitHub URL"
          className="h-10 max-w-md"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
        />
        <Button onClick={handleAdd} disabled={compareList.length >= 3 || !input.trim()}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add to compare
        </Button>
        <span className="text-xs text-muted-foreground">
          {compareList.length}/3 selected
        </span>
      </div>

      {/* Rate limit / network error banner */}
      {errorCount > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-foreground/90">
                {errorCount} {errorCount === 1 ? 'repo failed' : 'repos failed'} to load.
                {queries.some((q) => q.isError && q.error instanceof GitHubError && /rate limit/i.test(q.error.message))
                  ? ' GitHub rate limit reached — add a personal access token in Settings to raise it to 5,000 req/hour.'
                  : ' Check the repository name or try again.'}
              </span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => queries.forEach((q) => q.refetch())}>
                Retry all
              </Button>
              <Button size="sm" variant="ghost" onClick={() => useAppStore.getState().setView('settings')}>
                Open Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison table */}
      {compareList.length === 0 ? (
        <EmptyState
          title="No repositories in comparison"
          message="Add 2 or 3 repositories above to start comparing them."
          icon={GitCompareArrows}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="w-44 text-left align-top text-xs uppercase tracking-wide text-muted-foreground">
                  Metric
                </th>
                {compareList.map((entry, idx) => {
                  const q = queries[idx]
                  const repo = q?.data?.repo
                  const failed = q?.isError
                  return (
                    <th key={entry.full_name} className="min-w-[220px] p-3 text-left align-top">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {repo ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7 rounded-md">
                                <AvatarImage src={repo.owner.avatar_url} alt={repo.owner.login} />
                                <AvatarFallback>{repo.owner.login.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">{repo.name}</p>
                                <p className="truncate text-xs text-muted-foreground">{repo.owner.login}</p>
                              </div>
                            </div>
                          ) : failed ? (
                            <div className="space-y-1">
                              <p className="truncate text-sm font-semibold">{entry.repo}</p>
                              <p className="truncate text-xs text-muted-foreground">{entry.owner}</p>
                              <Badge variant="outline" className="gap-1 text-[10px] text-amber-500">
                                <AlertCircle className="h-3 w-3" /> Failed
                              </Badge>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => removeFromCompare(entry.full_name)}
                          aria-label={`Remove ${entry.full_name}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              <CompareRow label="Description" icon={Activity}>
                {queries.map((q, i) => {
                  const repo = q?.data?.repo
                  return (
                    <CompareCell key={i}>
                      <CellValue
                        loading={q?.isLoading}
                        failed={q?.isError}
                        value={repo ? (repo.description || '—') : null}
                        skeletonClass="h-4 w-full"
                        as="text"
                      />
                    </CompareCell>
                  )
                })}
              </CompareRow>

              <CompareRow label="Stars" icon={Star} winner={winner('stars')}>
                {queries.map((q, i) => (
                  <CompareCell key={i} winner={winner('stars') === q?.data?.repo.full_name}>
                    <CellValue
                      loading={q?.isLoading}
                      failed={q?.isError}
                      value={q?.data ? formatNumber(q.data.repo.stargazers_count) : null}
                      skeletonClass="h-4 w-12"
                    />
                  </CompareCell>
                ))}
              </CompareRow>

              <CompareRow label="Forks" icon={GitFork} winner={winner('forks')}>
                {queries.map((q, i) => (
                  <CompareCell key={i} winner={winner('forks') === q?.data?.repo.full_name}>
                    <CellValue
                      loading={q?.isLoading}
                      failed={q?.isError}
                      value={q?.data ? formatNumber(q.data.repo.forks_count) : null}
                      skeletonClass="h-4 w-12"
                    />
                  </CompareCell>
                ))}
              </CompareRow>

              <CompareRow label="Open issues" icon={CircleDot} winner={winner('issues')}>
                {queries.map((q, i) => (
                  <CompareCell key={i} winner={winner('issues') === q?.data?.repo.full_name}>
                    <CellValue
                      loading={q?.isLoading}
                      failed={q?.isError}
                      value={q?.data ? formatNumber(q.data.repo.open_issues_count) : null}
                      skeletonClass="h-4 w-12"
                    />
                  </CompareCell>
                ))}
              </CompareRow>

              <CompareRow label="Contributors" icon={Users} winner={winner('contributors')}>
                {queries.map((q, i) => (
                  <CompareCell key={i} winner={winner('contributors') === q?.data?.repo.full_name}>
                    <CellValue
                      loading={q?.isLoading}
                      failed={q?.isError}
                      value={q?.data ? (q.data.contributorsCount !== null ? formatNumber(q.data.contributorsCount) : '—') : null}
                      skeletonClass="h-4 w-12"
                    />
                  </CompareCell>
                ))}
              </CompareRow>

              <CompareRow label="Main language" icon={Activity}>
                {queries.map((q, i) => {
                  const repo = q?.data?.repo
                  return (
                    <CompareCell key={i}>
                      <CellValue
                        loading={q?.isLoading}
                        failed={q?.isError}
                        value={repo ? <Badge variant="secondary" className="text-[10px]">{repo.language || '—'}</Badge> : null}
                        skeletonClass="h-4 w-16"
                      />
                    </CompareCell>
                  )
                })}
              </CompareRow>

              <CompareRow label="License" icon={Trophy}>
                {queries.map((q, i) => {
                  const repo = q?.data?.repo
                  return (
                    <CompareCell key={i}>
                      <CellValue
                        loading={q?.isLoading}
                        failed={q?.isError}
                        value={repo ? (repo.license?.spdx_id && repo.license.spdx_id !== 'NOASSERTION' ? repo.license.spdx_id : 'None') : null}
                        skeletonClass="h-4 w-16"
                        as="text"
                      />
                    </CompareCell>
                  )
                })}
              </CompareRow>

              <CompareRow label="Last updated" icon={Calendar}>
                {queries.map((q, i) => {
                  const repo = q?.data?.repo
                  return (
                    <CompareCell key={i}>
                      <CellValue
                        loading={q?.isLoading}
                        failed={q?.isError}
                        value={repo ? (
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(repo.updated_at)}
                            <span className="block text-[10px]">{formatDate(repo.updated_at)}</span>
                          </span>
                        ) : null}
                        skeletonClass="h-4 w-20"
                      />
                    </CompareCell>
                  )
                })}
              </CompareRow>

              <CompareRow label="Activity level" icon={Activity}>
                {queries.map((q, i) => {
                  const repo = q?.data?.repo
                  if (!repo && q?.isLoading) {
                    return (
                      <CompareCell key={i}>
                        <Skeleton className="h-4 w-16" />
                      </CompareCell>
                    )
                  }
                  if (!repo) {
                    return <CompareCell key={i}><span className="text-xs text-muted-foreground">—</span></CompareCell>
                  }
                  const days = Math.max(0, (Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24))
                  const level = activityLevelLabel(days < 7 ? 100 : days < 30 ? 50 : days < 90 ? 25 : 5)
                  return (
                    <CompareCell key={i}>
                      <Badge variant="outline" className={cn('text-[10px]', level.color)}>
                        {level.label}
                      </Badge>
                    </CompareCell>
                  )
                })}
              </CompareRow>

              <CompareRow label="GitHub link" icon={ArrowUpRight}>
                {queries.map((q, i) => {
                  const repo = q?.data?.repo
                  return (
                    <CompareCell key={i}>
                      {repo ? (
                        <a href={repo.html_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs hover:underline">
                          Open <ArrowUpRight className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </CompareCell>
                  )
                })}
              </CompareRow>
            </tbody>
          </table>
        </div>
      )}

      {loadingCount > 0 && (
        <div className="text-xs text-muted-foreground">
          Loading {loadingCount} repos…
        </div>
      )}
    </div>
  )
}

function CellValue({
  loading,
  failed,
  value,
  skeletonClass,
  as = 'default',
}: {
  loading?: boolean
  failed?: boolean
  value: React.ReactNode
  skeletonClass: string
  as?: 'default' | 'text'
}) {
  if (loading) return <Skeleton className={skeletonClass} />
  if (failed || value === null || value === undefined) {
    return <span className="text-xs text-muted-foreground">—</span>
  }
  if (as === 'text') return <span className="text-xs text-muted-foreground">{value}</span>
  return <>{value}</>
}

function CompareRow({
  label,
  icon: Icon,
  winner,
  children,
}: {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  winner?: string | null
  children: React.ReactNode
}) {
  return (
    <tr className="border-t">
      <td className="py-3 pr-4 align-top">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {Icon && <Icon className="h-3 w-3" />}
          {label}
        </div>
      </td>
      {children}
    </tr>
  )
}

function CompareCell({
  children,
  winner,
}: {
  children: React.ReactNode
  winner?: boolean
}) {
  return (
    <td className="p-3 align-top">
      <div className={cn('flex items-center gap-1.5', winner && 'font-semibold text-foreground')}>
        {winner && <Trophy className="h-3 w-3 text-amber-500" />}
        {children}
      </div>
    </td>
  )
}
