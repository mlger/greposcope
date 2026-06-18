'use client'

import * as React from 'react'
import { Code2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { languagePercentages } from '@/lib/utils'
import type { GitHubLanguageMap } from '@/lib/types'
import { LanguagePieChart } from './charts'

export function LanguageBreakdown({
  languages,
}: {
  languages: GitHubLanguageMap
}) {
  const data = React.useMemo(() => languagePercentages(languages), [languages])
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="grid h-32 place-items-center text-sm text-muted-foreground">
          No language data available.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Code2 className="h-4 w-4 text-muted-foreground" />
          Language breakdown
        </CardTitle>
        <CardDescription>
          Byte-weighted distribution from the GitHub languages API.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <LanguagePieChart data={data} />
        <ul className="space-y-2">
          {data.map((l) => (
            <li key={l.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: l.color }}
                  />
                  {l.name}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {l.percent.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${l.percent}%`,
                    backgroundColor: l.color,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
