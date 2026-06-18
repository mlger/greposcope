'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Monitor,
  Key,
  Trash2,
  Eye,
  EyeOff,
  Check,
  ExternalLink,
  Info,
  Gauge,
  Sparkles,
  BarChart3,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { ViewId } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

export function SettingsView() {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const savedRepos = useAppStore((s) => s.savedRepos)
  const recentSearches = useAppStore((s) => s.recentSearches)
  const removeSavedRepo = useAppStore((s) => s.removeSavedRepo)
  const clearRecentSearches = useAppStore((s) => s.clearRecentSearches)
  const { theme, setTheme } = useTheme()

  const [tokenInput, setTokenInput] = React.useState(settings.githubToken)
  const [showToken, setShowToken] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  function saveToken() {
    updateSettings({ githubToken: tokenInput.trim() })
    toast.success(tokenInput.trim() ? 'Token saved locally' : 'Token removed')
  }

  function clearAllLocal() {
    savedRepos.forEach((r) => removeSavedRepo(r.id))
    clearRecentSearches()
    updateSettings({ githubToken: '' })
    setTokenInput('')
    toast.success('Cleared all local data')
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8 space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <SettingsIcon className="h-5 w-5 text-muted-foreground" />
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure theme, default landing view, API access, and analytical features. All settings are stored locally in your browser.
        </p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Choose how RepoScope looks on this device.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Theme</Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'system', label: 'System', icon: Monitor },
              ].map((opt) => {
                const active = mounted && theme === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`flex items-center justify-center gap-2 rounded-md border p-3 text-sm transition-colors ${
                      active ? 'border-foreground bg-accent' : 'hover:bg-accent'
                    }`}
                  >
                    <opt.icon className="h-4 w-4" />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4 text-muted-foreground" />
            GitHub API access
          </CardTitle>
          <CardDescription>
            Optional. Without a token, requests are limited to 60/hour per IP. A personal access token raises this to 5,000/hour.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="token" className="text-xs uppercase tracking-wide text-muted-foreground">
              Personal access token (classic or fine-grained)
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="token"
                  type={showToken ? 'text' : 'password'}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="ghp_…"
                  className="pr-10 font-mono"
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                  onClick={() => setShowToken((v) => !v)}
                  aria-label={showToken ? 'Hide token' : 'Show token'}
                >
                  {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <Button onClick={saveToken}>
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The token is stored only in this browser's local storage and is sent directly to api.github.com. It never leaves your device.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2.5 text-xs">
            <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span>
              Create a token at{' '}
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 font-medium hover:underline"
              >
                github.com/settings/tokens
                <ExternalLink className="h-3 w-3" />
              </a>
              . Public repo read access is sufficient for RepoScope.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={settings.githubToken ? 'default' : 'outline'} className="gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${settings.githubToken ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
              {settings.githubToken ? 'Token configured' : 'No token (60 req/hr)'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Defaults & features</CardTitle>
          <CardDescription>Behavior and analytical feature toggles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                Default landing view
              </Label>
              <p className="text-xs text-muted-foreground">Which view RepoScope opens to.</p>
            </div>
            <Select
              value={settings.defaultView}
              onValueChange={(v) => updateSettings({ defaultView: v as ViewId })}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="landing">Landing</SelectItem>
                <SelectItem value="search">Search</SelectItem>
                <SelectItem value="dashboard">Dashboard</SelectItem>
                <SelectItem value="profile">Profile</SelectItem>
                <SelectItem value="compare">Compare</SelectItem>
                <SelectItem value="saved">Saved</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                AI-style repository summary
              </Label>
              <p className="text-xs text-muted-foreground">Show the auto-generated narrative on the dashboard.</p>
            </div>
            <Switch
              checked={settings.enableAiSummary}
              onCheckedChange={(v) => updateSettings({ enableAiSummary: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                Chart animations
              </Label>
              <p className="text-xs text-muted-foreground">Animate chart transitions on load.</p>
            </div>
            <Switch
              checked={settings.chartAnimations}
              onCheckedChange={(v) => updateSettings({ chartAnimations: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Local data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Local data</CardTitle>
          <CardDescription>Manage data stored on this device.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Saved repositories</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{savedRepos.length}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Recent searches</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{recentSearches.length}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full text-destructive" onClick={clearAllLocal}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear all local data
          </Button>
          <p className="text-xs text-muted-foreground">
            This removes all saved repositories, recent searches, and your stored API token. This cannot be undone.
          </p>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About RepoScope</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            RepoScope is an open analytics dashboard for public GitHub repositories. It uses the
            GitHub REST API (v3), renders charts with Recharts, and stores user preferences
            locally via the browser's localStorage API.
          </p>
          <p>
            Built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
