'use client'

import * as React from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import {
  Github,
  Search,
  TrendingUp,
  LayoutDashboard,
  User,
  GitCompareArrows,
  Bookmark,
  Settings,
  Home,
  Menu,
  Sun,
  Moon,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { ViewId } from '@/lib/types'
import { parseRepoInput, classifyQuery } from '@/lib/github'

interface NavItem {
  id: ViewId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { id: 'landing', label: 'Home', icon: Home },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'profile', label: 'User Profile', icon: User },
  { id: 'compare', label: 'Compare', icon: GitCompareArrows },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'settings', label: 'Settings', icon: Settings },
]

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-8 w-8 place-items-center rounded-md bg-foreground text-background">
        <Star className="h-4 w-4 fill-current" />
      </div>
      {!compact && (
        <span className="text-base font-semibold tracking-tight brand-gradient">
          RepoScope
        </span>
      )}
    </div>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="h-9 w-9" />
  const isDark = theme === 'dark'
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}

function GlobalSearch() {
  const searchQuery = useAppStore((s) => s.searchQuery)
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)
  const setView = useAppStore((s) => s.setView)
  const selectRepo = useAppStore((s) => s.selectRepo)
  const selectUser = useAppStore((s) => s.selectUser)
  const addRecentSearch = useAppStore((s) => s.addRecentSearch)
  const settings = useAppStore((s) => s.settings)

  const [value, setValue] = React.useState(searchQuery)

  React.useEffect(() => {
    setValue(searchQuery)
  }, [searchQuery])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    setSearchQuery(trimmed)
    // Quick path: if it parses as a repo identifier, jump straight to dashboard
    const kind = classifyQuery(trimmed)
    if (kind === 'repo') {
      const parsed = parseRepoInput(trimmed)
      if (parsed) {
        addRecentSearch({
          query: trimmed,
          type: 'repo',
          timestamp: Date.now(),
        })
        selectRepo(parsed.owner, parsed.repo)
        return
      }
    }
    if (kind === 'user') {
      addRecentSearch({
        query: trimmed,
        type: 'user',
        timestamp: Date.now(),
      })
      selectUser(trimmed.replace(/^@/, ''))
      return
    }
    // Otherwise go to search view with the query
    addRecentSearch({
      query: trimmed,
      type: 'search',
      timestamp: Date.now(),
    })
    setView('search')
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search: facebook/react, github.com/owner/repo, or username…"
        className="pl-9 pr-4 h-9 w-full"
        aria-label="Global search"
      />
    </form>
  )
}

function NavList({
  currentView,
  onNavigate,
}: {
  currentView: ViewId
  onNavigate?: () => void
}) {
  const setView = useAppStore((s) => s.setView)
  return (
    <nav className="flex flex-col gap-1 px-3 py-2">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const active = currentView === item.id
        return (
          <button
            key={item.id}
            onClick={() => {
              setView(item.id)
              onNavigate?.()
            }}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              active
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground',
            )}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

function SavedBadge() {
  const count = useAppStore((s) => s.savedRepos.length)
  if (count === 0) return null
  return (
    <span className="ml-auto rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
      {count}
    </span>
  )
}

function CompareBadge() {
  const count = useAppStore((s) => s.compareList.length)
  if (count === 0) return null
  return (
    <span className="ml-auto rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
      {count}
    </span>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const currentView = useAppStore((s) => s.currentView)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <BrandMark />
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin">
          <NavList currentView={currentView} />
          <div className="px-3 pb-3 pt-2">
            <div className="rounded-md border bg-background/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">About RepoScope</p>
              <p className="mt-1 leading-relaxed">
                Analytics for any public GitHub repository. Add a personal
                access token in Settings to raise rate limits.
              </p>
            </div>
          </div>
        </div>
        <div className="border-t p-3">
          <a
            href="https://docs.github.com/rest"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Github className="h-3.5 w-3.5" />
            Powered by GitHub REST API
          </a>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur md:px-6">
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <div className="md:hidden">
              <BrandMark compact />
            </div>
            <div className="hidden md:block w-72">
              <GlobalSearch />
            </div>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => useAppStore.getState().setView('search')}
            >
              <Search className="mr-2 h-4 w-4" />
              Advanced search
            </Button>
            <ThemeToggle />
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex"
            >
              <Button variant="ghost" size="icon" aria-label="GitHub">
                <Github className="h-4 w-4" />
              </Button>
            </a>
          </header>

          {/* Mobile search row */}
          <div className="border-b bg-background/80 px-3 py-2 md:hidden">
            <GlobalSearch />
          </div>

          <main className="flex-1 overflow-x-hidden">{children}</main>

          <footer className="mt-auto border-t bg-background px-4 py-3 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                RepoScope · Built with Next.js, Tailwind, Recharts · Data from
                GitHub REST API
              </span>
              <span>
                Unauthenticated requests are limited to 60/hr. Add a token in
                Settings for 5,000/hr.
              </span>
            </div>
          </footer>
        </div>

        <SheetContent side="left" className="w-72 p-0">
          <div className="flex h-14 items-center border-b px-4">
            <BrandMark />
          </div>
          <NavList
            currentView={currentView}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

export { NAV_ITEMS, BrandMark, ThemeToggle, GlobalSearch }
