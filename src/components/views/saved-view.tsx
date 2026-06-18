'use client'

import * as React from 'react'
import {
  Bookmark,
  Trash2,
  ArrowUpRight,
  Star,
  GitFork,
  CircleDot,
  ExternalLink,
  LayoutDashboard,
  Search,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { formatNumber, formatRelativeTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { EmptyState, SectionHeading } from '@/components/repo/common'
import { toast } from 'sonner'

export function SavedView() {
  const savedRepos = useAppStore((s) => s.savedRepos)
  const removeSavedRepo = useAppStore((s) => s.removeSavedRepo)
  const selectRepo = useAppStore((s) => s.selectRepo)
  const setView = useAppStore((s) => s.setView)
  const [confirmClear, setConfirmClear] = React.useState(false)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
      <SectionHeading
        title="Saved repositories"
        description="Bookmarked repositories stored locally in your browser. No account required — data persists across sessions on this device."
        action={
          savedRepos.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirmClear) {
                  savedRepos.forEach((r) => removeSavedRepo(r.id))
                  toast.success('Cleared all saved repositories')
                  setConfirmClear(false)
                } else {
                  setConfirmClear(true)
                  setTimeout(() => setConfirmClear(false), 4000)
                }
              }}
              className={confirmClear ? 'text-destructive' : ''}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              {confirmClear ? 'Click again to confirm' : 'Clear all'}
            </Button>
          ) : null
        }
      />

      {savedRepos.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No saved repositories yet"
            message="Click the bookmark icon on any repository card to save it here for quick access."
            icon={Bookmark}
            action={
              <Button onClick={() => setView('search')}>
                <Search className="mr-2 h-4 w-4" />
                Find repositories
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <p className="mt-3 text-sm text-muted-foreground">
            {savedRepos.length} saved {savedRepos.length === 1 ? 'repository' : 'repositories'}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {savedRepos.map((r) => (
              <Card key={r.id} className="card-hover flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-2">
                    <Avatar className="h-7 w-7 rounded-md">
                      <AvatarImage src={r.owner_avatar} alt={r.owner_login} />
                      <AvatarFallback>{r.owner_login.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-muted-foreground">{r.owner_login}</p>
                      <CardTitle className="truncate text-base font-semibold">{r.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  {r.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">No description</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {r.language && <Badge variant="outline" className="text-[10px]">{r.language}</Badge>}
                    <span className="flex items-center gap-1"><Star className="h-3 w-3" />{formatNumber(r.stargazers_count)}</span>
                    <span className="flex items-center gap-1"><GitFork className="h-3 w-3" />{formatNumber(r.forks_count)}</span>
                    <span className="flex items-center gap-1"><CircleDot className="h-3 w-3" />{formatNumber(r.open_issues_count)}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between gap-2 border-t bg-muted/30 py-2">
                  <span className="text-[11px] text-muted-foreground">
                    Saved {formatRelativeTime(r.saved_at)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => selectRepo(r.owner_login, r.name)}
                    >
                      <LayoutDashboard className="mr-1 h-3.5 w-3.5" />
                      Open
                    </Button>
                    <a href={r.html_url} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="ghost" className="h-7 px-2" aria-label="Open on GitHub">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-destructive"
                      onClick={() => {
                        removeSavedRepo(r.id)
                        toast.success('Removed from saved')
                      }}
                      aria-label="Remove from saved"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
