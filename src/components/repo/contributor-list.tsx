'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowUpRight, Crown, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatNumber } from '@/lib/utils'
import type { GitHubContributor } from '@/lib/types'
import { ContributorsBarChart } from './charts'

export function ContributorList({
  contributors,
  total,
}: {
  contributors: GitHubContributor[]
  total?: number
}) {
  if (contributors.length === 0) {
    return (
      <Card>
        <CardContent className="grid h-32 place-items-center text-sm text-muted-foreground">
          No contributor data available.
        </CardContent>
      </Card>
    )
  }

  const sum = total ?? contributors.reduce((a, c) => a + c.contributions, 0)
  const top = contributors[0]
  const topShare = sum > 0 ? (top.contributions / sum) * 100 : 0

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-muted-foreground" />
            Top contributors
          </CardTitle>
          <CardDescription>
            {formatNumber(contributors.length)} contributors in sample
            {sum > 0 && <> · {formatNumber(sum)} total commits</>}
            {topShare > 0 && (
              <> · top contributor owns {topShare.toFixed(1)}% of commits</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
            <ContributorsBarChart
              data={contributors.slice(0, 12).map((c) => ({
                login: c.login,
                contributions: c.contributions,
              }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contributor list</CardTitle>
          <CardDescription>With share of total commits.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[420px]">
            <ul className="divide-y">
              {contributors.map((c, i) => {
                const pct = sum > 0 ? (c.contributions / sum) * 100 : 0
                return (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40"
                  >
                    <span className="w-5 text-xs tabular-nums text-muted-foreground">
                      {i + 1}
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={c.avatar_url} alt={c.login} />
                      <AvatarFallback>{c.login.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <a
                          href={c.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-sm font-medium hover:underline"
                        >
                          @{c.login}
                        </a>
                        {i === 0 && (
                          <Badge variant="secondary" className="gap-1 text-[10px]">
                            <Crown className="h-3 w-3" /> Top
                          </Badge>
                        )}
                        {c.type !== 'User' && (
                          <Badge variant="outline" className="text-[10px]">
                            {c.type}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Progress value={pct} className="h-1.5 flex-1" />
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium tabular-nums">
                        {formatNumber(c.contributions)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">commits</p>
                    </div>
                    <a
                      href={c.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`Open ${c.login} on GitHub`}
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
