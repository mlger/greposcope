'use client'

import * as React from 'react'
import { Activity, TrendingUp, Users, Wrench, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn, type HealthBreakdown } from '@/lib/utils'

export function HealthScoreCard({ health }: { health: HealthBreakdown }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-muted-foreground" />
          Repository health score
        </CardTitle>
        <CardDescription>
          Transparent, factor-based score (0–100). Hover any factor for context.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-3">
          <span className={cn('text-5xl font-semibold tabular-nums', health.color)}>
            {health.score}
          </span>
          <div className="pb-1">
            <p className={cn('text-sm font-semibold', health.color)}>{health.label}</p>
            <p className="text-xs text-muted-foreground">out of 100</p>
          </div>
        </div>
        <Progress value={health.score} className="h-2" />
        <div className="grid gap-2 sm:grid-cols-2">
          {health.factors.map((f) => {
            const ratio = f.weight > 0 ? f.score / f.weight : 0
            const Icon =
              f.label === 'Activity'
                ? TrendingUp
                : f.label === 'Popularity'
                ? Users
                : f.label === 'Maintenance'
                ? Wrench
                : f.label === 'Documentation'
                ? FileText
                : Activity
            return (
              <div
                key={f.label}
                title={f.note}
                className="rounded-md border bg-background/50 p-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                    {f.label}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {f.score}/{f.weight}
                  </span>
                </div>
                <Progress value={ratio * 100} className="mt-1.5 h-1" />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
