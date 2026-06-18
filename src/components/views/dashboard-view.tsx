'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Star,
  GitFork,
  Eye,
  CircleDot,
  Scale,
  Calendar,
  Lock,
  Globe,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  Share2,
  Download,
  Copy,
  GitCompareArrows,
  ExternalLink,
  Code2,
  Users,
  Activity,
  FileText,
  GitPullRequest,
  RefreshCw,
  Layers,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import {
  getRepo,
  getRepoLanguages,
  getRepoContributors,
  getRepoIssues,
  getRepoCommits,
  getRepoCommitActivity,
  getStargazerSample,
  GitHubError,
} from '@/lib/github'
import {
  cn,
  formatNumber,
  formatRelativeTime,
  formatDate,
  calculateHealthScore,
  languagePercentages,
  activityLevelLabel,
  buildShareLink,
} from '@/lib/utils'
import type { GitHubRepo, SavedRepo } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  StatCard,
  RepoCardSkeleton,
  ErrorState,
  LoadingState,
  CopyButton,
} from '@/components/repo/common'
import { StarsAreaChart, IssuesBarChart, CommitActivityChart, CommitHeatstrip } from '@/components/repo/charts'
import { HealthScoreCard } from '@/components/repo/health-score'
import { AiSummaryCard } from '@/components/repo/ai-summary'
import { ContributorList } from '@/components/repo/contributor-list'
import { LanguageBreakdown } from '@/components/repo/language-breakdown'

export function DashboardView() {
  const selectedRepo = useAppStore((s) => s.selectedRepo)
  const selectUser = useAppStore((s) => s.selectUser)
  const settings = useAppStore((s) => s.settings)

  if (!selectedRepo) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <ErrorState
          title="No repository selected"
          message="Search for a repository from the Search page or paste a GitHub URL in the search bar above."
        />
      </div>
    )
  }

  return <Dashboard key={`${selectedRepo.owner}/${selectedRepo.repo}`} owner={selectedRepo.owner} repo={selectedRepo.repo} token={settings.githubToken} />
}

function Dashboard({
  owner,
  repo,
  token,
}: {
  owner: string
  repo: string
  token: string
}) {
  // Parallel data fetching
  const repoQuery = useQuery({
    queryKey: ['repo', owner, repo, !!token],
    queryFn: () => getRepo(owner, repo, token || undefined),
    staleTime: 60_000,
    retry: false,
  })

  const languagesQuery = useQuery({
    queryKey: ['repo-languages', owner, repo, !!token],
    queryFn: () => getRepoLanguages(owner, repo, token || undefined),
    staleTime: 5 * 60_000,
    retry: false,
  })

  const contributorsQuery = useQuery({
    queryKey: ['repo-contributors', owner, repo, !!token],
    queryFn: () => getRepoContributors(owner, repo, token || undefined, 100),
    staleTime: 5 * 60_000,
    retry: false,
  })

  const issuesOpenQuery = useQuery({
    queryKey: ['repo-issues-open', owner, repo, !!token],
    queryFn: () => getRepoIssues(owner, repo, 'open', token || undefined, 100),
    staleTime: 60_000,
    retry: false,
  })
  const issuesClosedQuery = useQuery({
    queryKey: ['repo-issues-closed', owner, repo, !!token],
    queryFn: () => getRepoIssues(owner, repo, 'closed', token || undefined, 100),
    staleTime: 60_000,
    retry: false,
  })

  const commitsQuery = useQuery({
    queryKey: ['repo-commits', owner, repo, !!token],
    queryFn: () => getRepoCommits(owner, repo, token || undefined, 100),
    staleTime: 60_000,
    retry: false,
  })

  const activityQuery = useQuery({
    queryKey: ['repo-activity', owner, repo, !!token],
    queryFn: () => getRepoCommitActivity(owner, repo, token || undefined),
    staleTime: 5 * 60_000,
    retry: false,
  })

  const starsQuery = useQuery({
    queryKey: ['repo-stars', owner, repo, !!token],
    queryFn: () => getStargazerSample(owner, repo, token || undefined, 100),
    staleTime: 5 * 60_000,
    retry: false,
  })

  const aiInput = React.useMemo(() => {
    const repoData = repoQuery.data
    if (!repoData) return null
    return {
      repo: repoData,
      languagePct: languagesQuery.data ? languagePercentages(languagesQuery.data) : [],
      topContributors:
        contributorsQuery.data?.slice(0, 5).map((c) => ({
          login: c.login,
          contributions: c.contributions,
        })) ?? [],
      recentCommitCount:
        activityQuery.data?.slice(-4).reduce((a, w) => a + w.total, 0) ?? 0,
      openIssues: issuesOpenQuery.data?.length ?? repoData.open_issues_count,
      closedIssues: issuesClosedQuery.data?.length ?? 0,
      daysSincePush: Math.max(
        0,
        (Date.now() - new Date(repoData.pushed_at).getTime()) / (1000 * 60 * 60 * 24),
      ),
    }
  }, [
    repoQuery.data,
    languagesQuery.data,
    contributorsQuery.data,
    activityQuery.data,
    issuesOpenQuery.data,
    issuesClosedQuery.data,
  ])

  function refetchAll() {
    repoQuery.refetch()
    languagesQuery.refetch()
    contributorsQuery.refetch()
    issuesOpenQuery.refetch()
    issuesClosedQuery.refetch()
    commitsQuery.refetch()
    activityQuery.refetch()
    starsQuery.refetch()
    toast.success('Refreshing data…')
  }

  if (repoQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <DashboardSkeleton />
      </div>
    )
  }

  if (repoQuery.isError || !repoQuery.data) {
    const err = repoQuery.error
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <ErrorState
          title="Couldn't load repository"
          message={err instanceof GitHubError ? err.message : err?.message || 'Unknown error'}
          onRetry={() => repoQuery.refetch()}
          hint={
            err instanceof GitHubError && /rate limit/i.test(err.message) ? (
              <span>
                Add a{' '}
                <button
                  className="underline"
                  onClick={() => useAppStore.getState().setView('settings')}
                >
                  personal access token
                </button>{' '}
                in Settings to raise the limit.
              </span>
            ) : null
          }
        />
      </div>
    )
  }

  const r = repoQuery.data

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
      {/* Header */}
      <DashboardHeader repo={r} onRefresh={refetchAll} isFetching={repoQuery.isFetching} />
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Loaded from GitHub REST API</span>
        <span>·</span>
        <button onClick={refetchAll} className="underline hover:text-foreground">
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Stars"
          value={formatNumber(r.stargazers_count)}
          icon={Star}
          hint={r.stargazers_count > 10_000 ? 'Highly starred' : undefined}
        />
        <StatCard
          label="Forks"
          value={formatNumber(r.forks_count)}
          icon={GitFork}
        />
        <StatCard
          label="Watchers"
          value={formatNumber(r.subscribers_count)}
          icon={Eye}
          hint={`${formatNumber(r.watchers_count)} including non-subscribed`}
        />
        <StatCard
          label="Open issues"
          value={formatNumber(r.open_issues_count)}
          icon={CircleDot}
        />
        <StatCard
          label="License"
          value={r.license?.spdx_id && r.license.spdx_id !== 'NOASSERTION' ? r.license.spdx_id : 'None'}
          icon={Scale}
        />
        <StatCard
          label="Language"
          value={r.language || 'Mixed'}
          icon={Code2}
        />
      </div>

      {/* Secondary cards */}
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Created"
          value={formatDate(r.created_at)}
          icon={Calendar}
          hint={formatRelativeTime(r.created_at)}
        />
        <StatCard
          label="Last updated"
          value={formatDate(r.updated_at)}
          icon={Calendar}
          hint={formatRelativeTime(r.updated_at)}
        />
        <StatCard
          label="Last push"
          value={formatDate(r.pushed_at)}
          icon={Activity}
          hint={formatRelativeTime(r.pushed_at)}
        />
        <StatCard
          label="Visibility"
          value={
            <span className="flex items-center gap-1.5 capitalize">
              {r.visibility === 'public' ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {r.visibility}
            </span>
          }
          icon={r.visibility === 'public' ? Globe : Lock}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="mt-8">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="contributors">Contributors</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="commits">Commits</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <HealthScoreCard
              health={calculateHealthScore({
                stars: r.stargazers_count,
                forks: r.forks_count,
                openIssues: r.open_issues_count,
                updatedAt: r.updated_at,
                pushedAt: r.pushed_at,
                hasIssues: r.has_issues,
                hasLicense: !!r.license,
                hasDescription: !!r.description,
                hasPages: r.has_pages,
                archived: r.archived,
                disabled: r.disabled,
              })}
            />
            {aiInput && <AiSummaryCard input={aiInput} />}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Repository metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2">
                {r.homepage && (
                  <MetaItem label="Homepage" value={
                    <a href={r.homepage} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm hover:underline">
                      {r.homepage} <ExternalLink className="h-3 w-3" />
                    </a>
                  } />
                )}
                <MetaItem label="Default branch" value={<code className="text-xs">{r.default_branch}</code>} />
                <MetaItem label="Topics" value={
                  r.topics.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {r.topics.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  ) : <span className="text-xs text-muted-foreground">No topics</span>
                } />
                <MetaItem label="Size" value={<span className="text-xs">{formatNumber(r.size)} KB</span>} />
                <MetaItem label="Has" value={
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {r.has_issues && <Badge variant="outline">Issues</Badge>}
                    {r.has_projects && <Badge variant="outline">Projects</Badge>}
                    {r.has_wiki && <Badge variant="outline">Wiki</Badge>}
                    {r.has_pages && <Badge variant="outline">Pages</Badge>}
                    {r.has_discussions && <Badge variant="outline">Discussions</Badge>}
                  </div>
                } />
                <MetaItem label="Network" value={<span className="text-xs">{formatNumber(r.network_count)} repos</span>} />
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics tab */}
        <TabsContent value="analytics" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Stars over time</CardTitle>
                <CardDescription>
                  Sample of {starsQuery.data?.length ?? 0} most recent stargazer events
                  {token ? '' : ' (token recommended for full history)'}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {starsQuery.isLoading ? (
                  <Skeleton className="h-[280px] w-full" />
                ) : (
                  <StarsAreaChart data={buildStarsData(starsQuery.data ?? [], r.stargazers_count)} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Issue status</CardTitle>
                <CardDescription>
                  Open vs closed issues (sampled up to 100 each).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(issuesOpenQuery.isLoading || issuesClosedQuery.isLoading) ? (
                  <Skeleton className="h-[240px] w-full" />
                ) : (
                  <IssuesBarChart
                    data={[
                      {
                        name: 'Issues',
                        open: issuesOpenQuery.data?.length ?? r.open_issues_count,
                        closed: issuesClosedQuery.data?.length ?? 0,
                      },
                    ]}
                  />
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Commit activity (weekly)</CardTitle>
                <CardDescription>
                  GitHub's precomputed weekly commit totals for the last year.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activityQuery.isLoading ? (
                  <Skeleton className="h-[240px] w-full" />
                ) : activityQuery.isError ? (
                  <div className="grid h-[240px] place-items-center text-sm text-muted-foreground">
                    {activityQuery.error instanceof GitHubError && activityQuery.error.status === 202
                      ? 'GitHub is computing statistics for this repository. Try refreshing in a moment.'
                      : 'Could not load commit activity.'}
                  </div>
                ) : (
                  <CommitActivityChart data={buildActivityData(activityQuery.data ?? [])} />
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Recent commit heatstrip</CardTitle>
                <CardDescription>
                  Per-day distribution from the latest commit sample
                  ({commitsQuery.data?.length ?? 0} commits loaded).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {commitsQuery.isLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <CommitHeatstrip data={buildCommitHeatstripData(commitsQuery.data ?? [])} />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contributors tab */}
        <TabsContent value="contributors" className="mt-4">
          {contributorsQuery.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : contributorsQuery.isError ? (
            <ErrorState
              message={contributorsQuery.error instanceof GitHubError ? contributorsQuery.error.message : 'Failed to load contributors'}
              onRetry={() => contributorsQuery.refetch()}
            />
          ) : (
            <ContributorList contributors={contributorsQuery.data ?? []} />
          )}
        </TabsContent>

        {/* Languages tab */}
        <TabsContent value="languages" className="mt-4">
          {languagesQuery.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : languagesQuery.isError ? (
            <ErrorState
              message={languagesQuery.error instanceof GitHubError ? languagesQuery.error.message : 'Failed to load languages'}
              onRetry={() => languagesQuery.refetch()}
            />
          ) : (
            <LanguageBreakdown languages={languagesQuery.data ?? {}} />
          )}
        </TabsContent>

        {/* Issues tab */}
        <TabsContent value="issues" className="mt-4">
          <IssuesTable
            open={issuesOpenQuery.data ?? []}
            closed={issuesClosedQuery.data ?? []}
            loading={issuesOpenQuery.isLoading || issuesClosedQuery.isLoading}
          />
        </TabsContent>

        {/* Commits tab */}
        <TabsContent value="commits" className="mt-4">
          <CommitsTable commits={commitsQuery.data ?? []} loading={commitsQuery.isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DashboardHeader({
  repo,
  onRefresh,
  isFetching,
}: {
  repo: GitHubRepo
  onRefresh: () => void
  isFetching: boolean
}) {
  const isSaved = useAppStore((s) => s.isSaved(repo.id))
  const addSavedRepo = useAppStore((s) => s.addSavedRepo)
  const removeSavedRepo = useAppStore((s) => s.removeSavedRepo)
  const addToCompare = useAppStore((s) => s.addToCompare)
  const compareList = useAppStore((s) => s.compareList)
  const selectUser = useAppStore((s) => s.selectUser)
  const inCompare = compareList.some((c) => c.full_name === repo.full_name)

  function handleSave() {
    if (isSaved) {
      removeSavedRepo(repo.id)
      toast.success('Removed from saved')
    } else {
      const saved: SavedRepo = {
        id: repo.id,
        full_name: repo.full_name,
        name: repo.name,
        owner_login: repo.owner.login,
        owner_avatar: repo.owner.avatar_url,
        description: repo.description,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        open_issues_count: repo.open_issues_count,
        html_url: repo.html_url,
        saved_at: Date.now(),
      }
      addSavedRepo(saved)
      toast.success('Saved')
    }
  }

  function handleShare() {
    const url = buildShareLink(repo.owner.login, repo.name)
    navigator.clipboard.writeText(url).then(
      () => toast.success('Shareable link copied'),
      () => toast.error('Failed to copy link'),
    )
  }

  function handleExport() {
    const report = {
      repository: {
        name: repo.full_name,
        url: repo.html_url,
        description: repo.description,
        visibility: repo.visibility,
        license: repo.license?.name ?? null,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        watchers: repo.watchers_count,
        subscribers: repo.subscribers_count,
        openIssues: repo.open_issues_count,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        pushedAt: repo.pushed_at,
        topics: repo.topics,
      },
      exportedAt: new Date().toISOString(),
      source: 'RepoScope',
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reposcope-${repo.owner.login}-${repo.name}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Report exported')
  }

  function handleCopyStats() {
    const stats = [
      `${repo.full_name}`,
      `★ ${repo.stargazers_count} stars`,
      `⑂ ${repo.forks_count} forks`,
      `👁 ${repo.subscribers_count} watchers`,
      `○ ${repo.open_issues_count} open issues`,
      `Language: ${repo.language ?? 'mixed'}`,
      `License: ${repo.license?.spdx_id ?? 'none'}`,
      `Updated: ${formatRelativeTime(repo.updated_at)}`,
      `${repo.html_url}`,
    ].join('\n')
    navigator.clipboard.writeText(stats).then(
      () => toast.success('Stats copied to clipboard'),
      () => toast.error('Failed to copy'),
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 rounded-md">
            <AvatarImage src={repo.owner.avatar_url} alt={repo.owner.login} />
            <AvatarFallback>{repo.owner.login.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <button
                className="text-sm text-muted-foreground hover:underline"
                onClick={() => selectUser(repo.owner.login)}
              >
                {repo.owner.login}
              </button>
              <span className="text-muted-foreground">/</span>
              <h1 className="truncate text-xl font-semibold tracking-tight md:text-2xl">
                {repo.name}
              </h1>
              {repo.visibility === 'public' ? (
                <Badge variant="outline" className="text-[10px]">Public</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">Private</Badge>
              )}
              {repo.fork && <Badge variant="secondary" className="text-[10px]">Fork</Badge>}
              {repo.archived && <Badge variant="destructive" className="text-[10px]">Archived</Badge>}
            </div>
            {repo.description && (
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{repo.description}</p>
            )}
            {repo.topics.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {repo.topics.slice(0, 8).map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <Button size="sm" variant="outline" onClick={onRefresh} disabled={isFetching}>
            <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', isFetching && 'animate-spin')} />
            Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={handleSave}>
            {isSaved ? <BookmarkCheck className="mr-1.5 h-3.5 w-3.5" /> : <Bookmark className="mr-1.5 h-3.5 w-3.5" />}
            {isSaved ? 'Saved' : 'Save'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (inCompare) return
              if (compareList.length >= 3) {
                toast.error('Compare list is full (max 3)')
                return
              }
              addToCompare({
                owner: repo.owner.login,
                repo: repo.name,
                full_name: repo.full_name,
              })
              toast.success('Added to comparison')
            }}
            disabled={inCompare}
          >
            <GitCompareArrows className="mr-1.5 h-3.5 w-3.5" />
            Compare
          </Button>
          <Button size="sm" variant="outline" onClick={handleShare}>
            <Share2 className="mr-1.5 h-3.5 w-3.5" />
            Share
          </Button>
          <Button size="sm" variant="outline" onClick={handleCopyStats}>
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copy stats
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
          <a href={repo.html_url} target="_blank" rel="noreferrer">
            <Button size="sm">
              <ArrowUpRight className="mr-1.5 h-3.5 w-3.5" />
              GitHub
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function IssuesTable({
  open,
  closed,
  loading,
}: {
  open: any[]
  closed: any[]
  loading: boolean
}) {
  const [tab, setTab] = React.useState<'open' | 'closed'>('open')
  if (loading) return <Skeleton className="h-64 w-full" />
  const list = tab === 'open' ? open : closed
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Issues</CardTitle>
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'open' | 'closed')}>
            <TabsList>
              <TabsTrigger value="open">
                Open ({open.length})
              </TabsTrigger>
              <TabsTrigger value="closed">
                Closed ({closed.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[420px] overflow-y-auto scroll-thin">
          {list.length === 0 ? (
            <div className="grid h-32 place-items-center text-sm text-muted-foreground">
              No {tab} issues in sample.
            </div>
          ) : (
            <ul className="divide-y">
              {list.map((issue) => (
                <li key={issue.id} className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <CircleDot
                      className={cn(
                        'mt-0.5 h-3.5 w-3.5 shrink-0',
                        issue.state === 'open' ? 'text-amber-500' : 'text-emerald-500',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <a
                        href={issue.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium hover:underline"
                      >
                        {issue.title}
                      </a>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        #{issue.number} opened {formatRelativeTime(issue.created_at)} by @{issue.user.login}
                        {issue.comments > 0 && <> · {issue.comments} comments</>}
                      </p>
                      {issue.labels?.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {issue.labels.slice(0, 5).map((l: any) => (
                            <Badge
                              key={l.id}
                              variant="outline"
                              className="text-[10px]"
                              style={{
                                borderColor: `#${l.color}`,
                                color: `#${l.color}`,
                              }}
                            >
                              {l.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function CommitsTable({
  commits,
  loading,
}: {
  commits: any[]
  loading: boolean
}) {
  if (loading) return <Skeleton className="h-64 w-full" />
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent commits</CardTitle>
        <CardDescription>{commits.length} commits in sample.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[420px] overflow-y-auto scroll-thin">
          <ul className="divide-y">
            {commits.map((c) => (
              <li key={c.sha} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {c.sha.slice(0, 7)}
                  </code>
                  <div className="min-w-0 flex-1">
                    <a
                      href={c.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium hover:underline"
                    >
                      {c.commit.message.split('\n')[0]}
                    </a>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      by {c.commit.author?.name ?? 'Unknown'} · {c.commit.author?.date ? formatRelativeTime(c.commit.author.date) : ''}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-8 w-full max-w-md" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

// ---------- Data transforms ----------

function buildStarsData(
  events: { starred_at: string }[],
  totalStars: number,
): { date: string; stars: number; cumulative: number }[] {
  if (events.length === 0) return []
  const sorted = [...events].sort(
    (a, b) => new Date(a.starred_at).getTime() - new Date(b.starred_at).getTime(),
  )
  const firstTime = new Date(sorted[0].starred_at).getTime()
  const lastTime = new Date(sorted[sorted.length - 1].starred_at).getTime()
  const spansMultipleYears = lastTime - firstTime > 365 * 24 * 60 * 60 * 1000
  const offset = totalStars - sorted.length // approximate starting star count
  let cumulative = Math.max(0, offset)
  return sorted.map((e) => {
    cumulative += 1
    return {
      date: new Date(e.starred_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        ...(spansMultipleYears && { year: '2-digit' }),
      }),
      stars: 1,
      cumulative,
    }
  })
}

function buildActivityData(
  weekly: { week: number; total: number }[],
): { date: string; commits: number }[] {
  return weekly.map((w) => ({
    date: new Date(w.week * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    commits: w.total,
  }))
}

function buildCommitHeatstripData(
  commits: { commit: { author: { date: string } | null } }[],
): { date: string; commits: number }[] {
  const byDay = new Map<string, number>()
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    byDay.set(d.toISOString().slice(0, 10), 0)
  }
  for (const c of commits) {
    const day = c.commit.author?.date.slice(0, 10)
    if (day && byDay.has(day)) byDay.set(day, (byDay.get(day) ?? 0) + 1)
  }
  return Array.from(byDay.entries()).map(([date, commits]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    commits,
  }))
}
