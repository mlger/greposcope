'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  MapPin,
  Users,
  GitFork,
  Building2,
  Link as LinkIcon,
  Calendar,
  ArrowUpRight,
  Twitter,
  Mail,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { getUser, getUserRepos, GitHubError, getRepoLanguages } from '@/lib/github'
import { formatNumber, formatRelativeTime, formatDate, languagePercentages } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { StatCard, RepoCard, RepoCardSkeleton, ErrorState, EmptyState, SectionHeading } from '@/components/repo/common'
import { LanguageBreakdown } from '@/components/repo/language-breakdown'

export function ProfileView() {
  const selectedUser = useAppStore((s) => s.selectedUser)
  const settings = useAppStore((s) => s.settings)

  if (!selectedUser) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <ErrorState
          title="No user selected"
          message="Search for a GitHub user via the search bar above or from the Search page."
        />
      </div>
    )
  }

  return <Profile key={selectedUser} login={selectedUser} token={settings.githubToken} />
}

function Profile({ login, token }: { login: string; token: string }) {
  const userQuery = useQuery({
    queryKey: ['user', login, token],
    queryFn: () => getUser(login, token || undefined),
    staleTime: 5 * 60_000,
    retry: false,
  })
  const reposQuery = useQuery({
    queryKey: ['user-repos', login, token],
    queryFn: () => getUserRepos(login, token || undefined, 'updated', 100),
    staleTime: 5 * 60_000,
    retry: false,
  })

  // Aggregate languages across the user's top 30 repos
  const topRepos = React.useMemo(() => {
    if (!reposQuery.data) return []
    return [...reposQuery.data].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 30)
  }, [reposQuery.data])

  const languagesQuery = useQuery({
    queryKey: ['user-languages', login, topRepos.map((r) => r.full_name).join(','), token],
    queryFn: async () => {
      const map: Record<string, number> = {}
      await Promise.all(
        topRepos.slice(0, 12).map(async (r) => {
          try {
            const langs = await getRepoLanguages(r.owner.login, r.name, token || undefined)
            for (const [k, v] of Object.entries(langs)) {
              map[k] = (map[k] ?? 0) + v
            }
          } catch {
            // ignore individual failures (rate limits etc.)
          }
        }),
      )
      return map
    },
    enabled: topRepos.length > 0,
    staleTime: 5 * 60_000,
  })

  if (userQuery.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <ProfileSkeleton />
      </div>
    )
  }
  if (userQuery.isError || !userQuery.data) {
    const err = userQuery.error
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <ErrorState
          title="Couldn't load user"
          message={err instanceof GitHubError ? err.message : err?.message || 'Unknown error'}
          onRetry={() => userQuery.refetch()}
        />
      </div>
    )
  }

  const u = userQuery.data

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 space-y-6">
      {/* Header */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <Avatar className="h-20 w-20 rounded-lg md:h-24 md:w-24">
              <AvatarImage src={u.avatar_url} alt={u.login} />
              <AvatarFallback className="text-2xl">{u.login.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {u.name || u.login}
                </h1>
                <p className="text-sm text-muted-foreground">@{u.login}</p>
              </div>
              {u.bio && <p className="text-sm text-foreground/90">{u.bio}</p>}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {u.type && (
                  <Badge variant="outline" className="text-[10px]">{u.type}</Badge>
                )}
                {u.company && (
                  <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {u.company}</span>
                )}
                {u.location && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {u.location}</span>
                )}
                {u.blog && (
                  <a href={u.blog.startsWith('http') ? u.blog : `https://${u.blog}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
                    <LinkIcon className="h-3 w-3" /> {u.blog}
                  </a>
                )}
                {u.twitter_username && (
                  <a href={`https://twitter.com/${u.twitter_username}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
                    <Twitter className="h-3 w-3" /> @{u.twitter_username}
                  </a>
                )}
                {u.email && (
                  <a href={`mailto:${u.email}`} className="flex items-center gap-1 hover:underline">
                    <Mail className="h-3 w-3" /> {u.email}
                  </a>
                )}
                {u.created_at && (
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Joined {formatDate(u.created_at)}</span>
                )}
              </div>
              <div className="pt-2">
                <a href={u.html_url} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline">
                    View on GitHub <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Public repos" value={formatNumber(u.public_repos ?? 0)} icon={GitFork} />
        <StatCard label="Followers" value={formatNumber(u.followers ?? 0)} icon={Users} />
        <StatCard label="Following" value={formatNumber(u.following ?? 0)} icon={Users} />
        <StatCard
          label="Gists"
          value={formatNumber((u as any).public_gists ?? 0)}
          icon={ArrowUpRight}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Repositories list */}
        <div className="lg:col-span-2 space-y-3">
          <SectionHeading
            title="Top repositories"
            description="Sorted by stars."
          />
          {reposQuery.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <RepoCardSkeleton key={i} />
              ))}
            </div>
          ) : reposQuery.isError ? (
            <ErrorState
              message="Failed to load repositories."
              onRetry={() => reposQuery.refetch()}
            />
          ) : (reposQuery.data ?? []).length === 0 ? (
            <EmptyState title="No public repositories" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {topRepos.slice(0, 8).map((r) => (
                <RepoCard key={r.id} repo={r} variant="compact" />
              ))}
            </div>
          )}
        </div>

        {/* Languages */}
        <div className="space-y-3">
          <SectionHeading title="Most-used languages" description="Aggregated from top repos." />
          {languagesQuery.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : languagesQuery.data && Object.keys(languagesQuery.data).length > 0 ? (
            <LanguageBreakdown languages={languagesQuery.data} />
          ) : (
            <EmptyState title="No language data" message="Could not aggregate languages (possibly rate-limited)." />
          )}
        </div>
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Skeleton className="h-24 w-24 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  )
}
