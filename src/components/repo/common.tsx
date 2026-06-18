'use client'

import * as React from 'react'
import Link from 'next/link'
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
  GitCompareArrows,
  Loader2,
  AlertTriangle,
  SearchX,
  WifiOff,
  Clock,
} from 'lucide-react'
import { cn, formatNumber, formatRelativeTime, formatDate } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import type { GitHubRepo, SavedRepo } from '@/lib/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

// ---------- StatCard ----------

interface StatCardProps {
  label: string
  value: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  hint?: React.ReactNode
  className?: string
}

export function StatCard({ label, value, icon: Icon, hint, className }: StatCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="text-2xl font-semibold tabular-nums">{value}</p>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </div>
          {Icon && (
            <div className="grid h-9 w-9 place-items-center rounded-md bg-muted text-muted-foreground">
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- RepoCard ----------

interface RepoCardProps {
  repo: GitHubRepo
  variant?: 'default' | 'compact'
  onClick?: () => void
}

export function RepoCard({ repo, variant = 'default', onClick }: RepoCardProps) {
  const selectRepo = useAppStore((s) => s.selectRepo)
  const isSaved = useAppStore((s) => s.isSaved(repo.id))
  const addSavedRepo = useAppStore((s) => s.addSavedRepo)
  const removeSavedRepo = useAppStore((s) => s.removeSavedRepo)
  const addToCompare = useAppStore((s) => s.addToCompare)
  const compareList = useAppStore((s) => s.compareList)
  const [langColor, setLangColor] = React.useState<string>('var(--muted-foreground)')

  React.useEffect(() => {
    let active = true
    if (repo.language) {
      import('@/lib/utils').then((m) => {
        if (active) setLangColor(m.getLanguageColor(repo.language!))
      })
    }
    return () => {
      active = false
    }
  }, [repo.language])

  const inCompare = compareList.some((c) => c.full_name === repo.full_name)
  const compareFull = compareList.length >= 3

  function handleSaveToggle() {
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
      toast.success('Saved to favorites')
    }
  }

  function handleCompare() {
    if (inCompare) return
    if (compareFull) {
      toast.error('Compare list is full (max 3)')
      return
    }
    addToCompare({
      owner: repo.owner.login,
      repo: repo.name,
      full_name: repo.full_name,
    })
    toast.success(`Added ${repo.full_name} to comparison`)
  }

  function handleClick() {
    if (onClick) {
      onClick()
    } else {
      selectRepo(repo.owner.login, repo.name)
    }
  }

  return (
    <Card
      className={cn(
        'card-hover group flex flex-col gap-0 overflow-hidden',
        variant === 'compact' && 'py-0',
      )}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={repo.owner.avatar_url} alt={repo.owner.login} />
                <AvatarFallback className="text-[10px]">
                  {repo.owner.login.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-xs text-muted-foreground">
                {repo.owner.login}
              </span>
            </div>
            <CardTitle className="mt-1 truncate text-base font-semibold">
              {repo.name}
            </CardTitle>
          </div>
          {repo.visibility === 'private' ? (
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {repo.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {repo.description}
          </p>
        ) : (
          <p className="text-sm italic text-muted-foreground">No description</p>
        )}
        {variant === 'default' && repo.topics && repo.topics.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {repo.topics.slice(0, 4).map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px]">
                {t}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {repo.language && (
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: langColor }}
              />
              {repo.language}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            {formatNumber(repo.stargazers_count)}
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="h-3 w-3" />
            {formatNumber(repo.forks_count)}
          </span>
          <span className="flex items-center gap-1">
            <CircleDot className="h-3 w-3" />
            {formatNumber(repo.open_issues_count)}
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 border-t bg-muted/30 py-2">
        <span className="text-[11px] text-muted-foreground">
          Updated {formatRelativeTime(repo.updated_at)}
        </span>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={handleSaveToggle}
            aria-label={isSaved ? 'Remove from saved' : 'Save repository'}
          >
            {isSaved ? (
              <BookmarkCheck className="h-3.5 w-3.5" />
            ) : (
              <Bookmark className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={handleCompare}
            disabled={!inCompare && compareFull}
            aria-label="Add to comparison"
          >
            <GitCompareArrows
              className={cn('h-3.5 w-3.5', inCompare && 'text-foreground')}
            />
          </Button>
          <a href={repo.html_url} target="_blank" rel="noreferrer">
            <Button size="sm" variant="ghost" className="h-7 px-2" aria-label="Open on GitHub">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>
      </CardFooter>
    </Card>
  )
}

// ---------- UserCard ----------

interface UserCardProps {
  user: {
    login: string
    avatar_url: string
    html_url: string
    type?: string
    name?: string | null
    bio?: string | null
    location?: string | null
    followers?: number
    following?: number
    public_repos?: number
  }
  onClick?: () => void
}

export function UserCard({ user, onClick }: UserCardProps) {
  const selectUser = useAppStore((s) => s.selectUser)
  function handleClick() {
    if (onClick) onClick()
    else selectUser(user.login)
  }
  return (
    <Card
      className="card-hover cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <CardContent className="flex items-center gap-3 p-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.avatar_url} alt={user.login} />
          <AvatarFallback>{user.login.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user.name || user.login}</p>
          <p className="truncate text-xs text-muted-foreground">@{user.login}</p>
          {user.bio && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{user.bio}</p>
          )}
        </div>
        {user.type && (
          <Badge variant="outline" className="text-[10px]">
            {user.type}
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

// ---------- States ----------

export function LoadingState({
  label = 'Loading…',
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground',
        className,
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function RepoCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-20" />
        <Skeleton className="mt-2 h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-3 w-24" />
      </CardFooter>
    </Card>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  hint,
}: {
  title?: string
  message: string
  onRetry?: () => void
  hint?: React.ReactNode
}) {
  const isRateLimit = /rate limit/i.test(message)
  const isNotFound = /not found/i.test(message)
  const isNetwork = /network/i.test(message)
  const Icon = isRateLimit ? Clock : isNotFound ? SearchX : isNetwork ? WifiOff : AlertTriangle
  return (
    <Card className="border-destructive/30">
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold">{title}</p>
          <p className="max-w-md text-sm text-muted-foreground">{message}</p>
        </div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function EmptyState({
  title,
  message,
  icon: Icon = SearchX,
  action,
}: {
  title: string
  message?: string
  icon?: React.ComponentType<{ className?: string }>
  action?: React.ReactNode
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold">{title}</p>
          {message && <p className="max-w-sm text-sm text-muted-foreground">{message}</p>}
        </div>
        {action}
      </CardContent>
    </Card>
  )
}

// ---------- Section heading ----------

export function SectionHeading({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

// ---------- CopyButton ----------

export function CopyButton({
  text,
  label = 'Copy',
  className,
}: {
  text: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = React.useState(false)
  return (
    <Button
      size="sm"
      variant="outline"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          toast.success('Copied to clipboard')
          setTimeout(() => setCopied(false), 1500)
        } catch {
          toast.error('Failed to copy')
        }
      }}
    >
      {copied ? 'Copied' : label}
    </Button>
  )
}
