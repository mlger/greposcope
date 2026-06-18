'use client'

import * as React from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatNumber } from '@/lib/utils'
import type { GitHubRepo } from '@/lib/types'

interface SummaryInput {
  repo: GitHubRepo
  languagePct: { name: string; percent: number }[]
  topContributors: { login: string; contributions: number }[]
  recentCommitCount: number
  openIssues: number
  closedIssues: number
  daysSincePush: number
}

/**
 * Deterministic "AI-style" summary built from observable signals.
 * We compose a concise narrative paragraph from rule-based templates
 * so the result is always grounded in the data and never hallucinates.
 */
function composeSummary(input: SummaryInput): string[] {
  const { repo, languagePct, topContributors, recentCommitCount, openIssues, closedIssues, daysSincePush } = input
  const parts: string[] = []

  // Opening framing
  const ownerType = repo.owner.type === 'Organization' ? 'organization' : 'developer'
  parts.push(
    `${repo.full_name} is a ${repo.visibility} ${repo.language || 'multi-language'} repository maintained by ${repo.owner.login} (${ownerType}). ${
      repo.description
        ? `Its stated purpose: "${truncate(repo.description, 140)}"`
        : 'It does not currently publish a description.'
    }`,
  )

  // Popularity
  parts.push(
    `It has accumulated ${formatNumber(repo.stargazers_count)} stars, ${formatNumber(repo.forks_count)} forks, and ${formatNumber(repo.subscribers_count)} subscribers, placing it in the ${
      repo.stargazers_count > 10_000 ? 'highly popular' : repo.stargazers_count > 1000 ? 'popular' : repo.stargazers_count > 100 ? 'moderately popular' : 'early-stage'
    } tier of public repositories.`,
  )

  // Languages
  if (languagePct.length > 0) {
    const top = languagePct.slice(0, 3)
    const langs = top.map((l) => `${l.name} (${l.percent.toFixed(0)}%)`).join(', ')
    parts.push(
      `The codebase is composed primarily of ${langs}${languagePct.length > 3 ? `, plus ${languagePct.length - 3} other languages` : ''}.`,
    )
  }

  // Activity
  const activityLabel =
    daysSincePush < 7 ? 'actively maintained (push within the last week)'
    : daysSincePush < 30 ? 'maintained (push within the last month)'
    : daysSincePush < 180 ? 'moderately active (push within the last 6 months)'
    : daysSincePush < 365 ? 'in low-activity mode (push within the last year)'
    : 'apparently dormant (no push in over a year)'
  parts.push(
    `Activity signal: ${activityLabel}. ${recentCommitCount > 0 ? `An estimated ${formatNumber(recentCommitCount)} commits appear in the most recent sample window.` : 'No recent commit sample was available.'}`,
  )

  // Contributors
  if (topContributors.length > 0) {
    const top = topContributors[0]
    const diverse = topContributors.length
    parts.push(
      `${formatNumber(diverse)} contributors appear in the contributor sample, led by @${top.login} with ${formatNumber(top.contributions)} commits${
        diverse > 1 ? `, suggesting ${diverse > 10 ? 'a healthy' : 'a small'} community of contributors` : ', suggesting solo maintenance'
      }.`,
    )
  }

  // Issues
  const totalIssues = openIssues + closedIssues
  if (totalIssues > 0) {
    const closedPct = (closedIssues / totalIssues) * 100
    parts.push(
      `Issue tracker shows ${formatNumber(openIssues)} open and ${formatNumber(closedIssues)} closed issues (~${closedPct.toFixed(0)}% closed), ${closedPct > 80 ? 'indicating responsive triage' : closedPct > 50 ? 'with moderate throughput' : 'with significant backlog'}.`,
    )
  }

  // License
  if (repo.license?.spdx_id && repo.license.spdx_id !== 'NOASSERTION') {
    parts.push(`Licensed under ${repo.license.name} (${repo.license.spdx_id}).`)
  } else {
    parts.push(`License: ${repo.license?.name ?? 'None detected'} — verify before adoption.`)
  }

  return parts
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`
}

export function AiSummaryCard({ input }: { input: SummaryInput }) {
  const [paragraphs, setParagraphs] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(true)

  const generate = React.useCallback(() => {
    setLoading(true)
    // Simulate brief "thinking" delay for UX, then reveal.
    setTimeout(() => {
      setParagraphs(composeSummary(input))
      setLoading(false)
    }, 350)
  }, [input])

  React.useEffect(() => {
    generate()
  }, [generate])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              AI-style repository summary
            </CardTitle>
            <CardDescription>
              Auto-generated narrative grounded in live GitHub signals.
            </CardDescription>
          </div>
          <Button size="sm" variant="ghost" onClick={generate} disabled={loading}>
            <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', loading && 'animate-spin')} />
            Regenerate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className={cn('h-3', i === 0 ? 'w-11/12' : i === 1 ? 'w-10/12' : i === 2 ? 'w-9/12' : 'w-8/12')} />
            ))}
          </div>
        ) : (
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
