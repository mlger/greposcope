import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Compact number formatting: 1234 -> 1.2k, 1234567 -> 1.2M. */
export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '0'
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}

/** Human-readable relative time: "3 days ago", "in 2 hours". */
export function formatRelativeTime(date: string | number | Date): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  const diffMs = d.getTime() - Date.now()
  const diffSec = Math.round(diffMs / 1000)
  const absSec = Math.abs(diffSec)

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (absSec < 60) return rtf.format(diffSec, 'second')
  const diffMin = Math.round(diffSec / 60)
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute')
  const diffHour = Math.round(diffMin / 60)
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour')
  const diffDay = Math.round(diffHour / 24)
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day')
  const diffMonth = Math.round(diffDay / 30)
  if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, 'month')
  const diffYear = Math.round(diffMonth / 12)
  return rtf.format(diffYear, 'year')
}

/** "Jan 5, 2024" style short date. */
export function formatDate(date: string | number | Date): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** "Jan 5, 2024, 14:30" style short datetime. */
export function formatDateTime(date: string | number | Date): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Repo health score (0-100) computed from common signals.
 * Weighting is heuristic — designed to be transparent, not perfect.
 */
export interface HealthBreakdown {
  score: number
  label: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical'
  color: string
  factors: { label: string; score: number; weight: number; note: string }[]
}

export function calculateHealthScore(input: {
  stars: number
  forks: number
  openIssues: number
  updatedAt: string
  pushedAt: string
  hasIssues: boolean
  hasLicense: boolean
  hasDescription: boolean
  hasPages: boolean
  archived: boolean
  disabled: boolean
}): HealthBreakdown {
  if (input.archived || input.disabled) {
    return {
      score: 0,
      label: 'Critical',
      color: 'text-muted-foreground',
      factors: [
        {
          label: input.archived ? 'Archived' : 'Disabled',
          score: 0,
          weight: 1,
          note: 'This repository is no longer active.',
        },
      ],
    }
  }

  const now = Date.now()
  const pushedMs = new Date(input.pushedAt).getTime()
  const updatedMs = new Date(input.updatedAt).getTime()
  const daysSincePush = Math.max(0, (now - pushedMs) / (1000 * 60 * 60 * 24))
  const daysSinceUpdate = Math.max(0, (now - updatedMs) / (1000 * 60 * 60 * 24))

  const factors: HealthBreakdown['factors'] = []

  // Activity (35 pts) — recent push counts most
  let activity = 0
  if (daysSincePush < 7) activity = 35
  else if (daysSincePush < 30) activity = 28
  else if (daysSincePush < 90) activity = 20
  else if (daysSincePush < 180) activity = 12
  else if (daysSincePush < 365) activity = 6
  else activity = 0
  factors.push({
    label: 'Activity',
    score: activity,
    weight: 35,
    note: `Last push ${formatRelativeTime(pushedMs)}.`,
  })

  // Popularity (25 pts) — log-scaled stars
  const popularity = Math.min(25, Math.round(Math.log10(Math.max(1, input.stars)) * 8))
  factors.push({
    label: 'Popularity',
    score: popularity,
    weight: 25,
    note: `${formatNumber(input.stars)} stars.`,
  })

  // Community (15 pts) — forks as proxy
  const community = Math.min(15, Math.round(Math.log10(Math.max(1, input.forks)) * 5))
  factors.push({
    label: 'Community',
    score: community,
    weight: 15,
    note: `${formatNumber(input.forks)} forks.`,
  })

  // Maintenance (15 pts) — issue backlog relative to popularity
  const issueRatio = input.stars > 0 ? input.openIssues / input.stars : input.openIssues / 10
  let maintenance = 15
  if (issueRatio > 0.5) maintenance = 3
  else if (issueRatio > 0.2) maintenance = 7
  else if (issueRatio > 0.05) maintenance = 11
  factors.push({
    label: 'Maintenance',
    score: maintenance,
    weight: 15,
    note: `${formatNumber(input.openIssues)} open issues.`,
  })

  // Documentation (10 pts) — description + license + pages
  let docs = 0
  if (input.hasDescription) docs += 4
  if (input.hasLicense) docs += 4
  if (input.hasPages) docs += 2
  factors.push({
    label: 'Documentation',
    score: docs,
    weight: 10,
    note: `${input.hasDescription ? 'Has description. ' : ''}${input.hasLicense ? 'Has license. ' : ''}${input.hasPages ? 'Has pages.' : ''}`.trim() || 'No docs signals.',
  })

  const score = Math.max(0, Math.min(100, Math.round(activity + popularity + community + maintenance + docs)))
  let label: HealthBreakdown['label'] = 'Critical'
  let color = 'text-red-500'
  if (score >= 80) {
    label = 'Excellent'
    color = 'text-emerald-500'
  } else if (score >= 60) {
    label = 'Good'
    color = 'text-lime-500'
  } else if (score >= 40) {
    label = 'Fair'
    color = 'text-amber-500'
  } else if (score >= 20) {
    label = 'Poor'
    color = 'text-orange-500'
  }
  return { score, label, color, factors }
}

/** Well-known language colors (subset; falls back to a generated color). */
const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Scala: '#c22d40',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Elixir: '#6e4a7e',
  Clojure: '#db5855',
  Haskell: '#5e5086',
  Lua: '#000080',
  Perl: '#0298c3',
  R: '#198CE7',
  Julia: '#a270ba',
  'Jupyter Notebook': '#DA5B0B',
  Dockerfile: '#384d54',
  Makefile: '#427819',
  Assembly: '#6E4C13',
  'Objective-C': '#438eff',
  PowerShell: '#012456',
  Vim: '#199f4b',
}

export function getLanguageColor(language: string): string {
  if (LANGUAGE_COLORS[language]) return LANGUAGE_COLORS[language]
  // Deterministic hash → HSL color
  let hash = 0
  for (let i = 0; i < language.length; i++) {
    hash = (hash << 5) - hash + language.charCodeAt(i)
    hash |= 0
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 65% 55%)`
}

/** Convert bytes map into sorted percentage entries. */
export function languagePercentages(
  languages: Record<string, number>,
): { name: string; value: number; percent: number; color: string }[] {
  const total = Object.values(languages).reduce((a, b) => a + b, 0)
  if (total === 0) return []
  return Object.entries(languages)
    .map(([name, value]) => ({
      name,
      value,
      percent: (value / total) * 100,
      color: getLanguageColor(name),
    }))
    .sort((a, b) => b.value - a.value)
}

/** Activity level bucketing based on commit count over the last 30 days. */
export function activityLevelLabel(commitCount: number): {
  label: 'Very High' | 'High' | 'Moderate' | 'Low' | 'Minimal'
  color: string
} {
  if (commitCount >= 200) return { label: 'Very High', color: 'text-emerald-500' }
  if (commitCount >= 75) return { label: 'High', color: 'text-lime-500' }
  if (commitCount >= 25) return { label: 'Moderate', color: 'text-amber-500' }
  if (commitCount >= 5) return { label: 'Low', color: 'text-orange-500' }
  return { label: 'Minimal', color: 'text-muted-foreground' }
}

/** Build a shareable URL for a repository dashboard view. */
export function buildShareLink(owner: string, repo: string): string {
  if (typeof window === 'undefined') return `https://reposcope.app/?repo=${owner}/${repo}`
  const url = new URL(window.location.href)
  url.hash = `#/dashboard/${owner}/${repo}`
  return url.toString()
}

/** Parse a hash route like #/dashboard/owner/repo into structured data. */
export function parseHashRoute(): { view: string; owner?: string; repo?: string; login?: string } | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash.replace(/^#\/?/, '')
  if (!hash) return null
  const [view, a, b] = hash.split('/')
  if (view === 'dashboard' && a && b) return { view, owner: a, repo: b }
  if (view === 'profile' && a) return { view, login: a }
  return { view }
}
