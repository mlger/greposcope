'use client'

import * as React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatNumber, formatRelativeTime } from '@/lib/utils'

const GRID_STROKE = 'var(--border)'
const AXIS_STROKE = 'var(--muted-foreground)'

function useChartColors() {
  const { resolvedTheme } = useTheme()
  return {
    grid: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    axis: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
  }
}

// ---------- Tooltip ----------

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; color?: string; payload?: any }>
  label?: string | number
}

function ChartTooltip({ active, payload, label, formatter }: TooltipProps & { formatter?: (v: number) => string }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      {label !== undefined && label !== '' && (
        <p className="mb-1 font-medium text-foreground">{String(label)}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium tabular-nums text-foreground">
              {formatter ? formatter(entry.value ?? 0) : formatNumber(entry.value ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- StarsAreaChart ----------

interface StarsPoint {
  date: string
  stars: number
  cumulative: number
}

export function StarsAreaChart({ data }: { data: StarsPoint[] }) {
  const colors = useChartColors()
  if (data.length === 0) {
    return (
      <EmptyChart label="No stargazer history available" />
    )
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="starsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.6} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          stroke={colors.axis}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          minTickGap={32}
        />
        <YAxis
          stroke={colors.axis}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) => formatNumber(v as number)}
        />
        <Tooltip
          content={<ChartTooltip formatter={(v) => `${formatNumber(v)} stars`} />}
        />
        <Area
          type="monotone"
          dataKey="cumulative"
          name="Stars"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#starsGrad)"
          isAnimationActive
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ---------- IssuesBarChart ----------

export function IssuesBarChart({ data }: { data: { name: string; open: number; closed: number }[] }) {
  const colors = useChartColors()
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          stroke={colors.axis}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={colors.axis}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={36}
          tickFormatter={(v) => formatNumber(v as number)}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          iconType="circle"
          iconSize={8}
        />
        <Bar dataKey="open" name="Open" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="closed" name="Closed" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ---------- CommitActivityChart ----------

interface CommitPoint {
  date: string
  commits: number
}

export function CommitActivityChart({ data }: { data: CommitPoint[] }) {
  const colors = useChartColors()
  if (data.length === 0) {
    return <EmptyChart label="No commit activity stats available (GitHub may still be computing them)" />
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="commitGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.6} />
            <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          stroke={colors.axis}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          minTickGap={32}
        />
        <YAxis
          stroke={colors.axis}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={36}
          tickFormatter={(v) => formatNumber(v as number)}
        />
        <Tooltip content={<ChartTooltip formatter={(v) => `${formatNumber(v)} commits`} />} />
        <Area
          type="monotone"
          dataKey="commits"
          name="Commits"
          stroke="var(--chart-3)"
          strokeWidth={2}
          fill="url(#commitGrad)"
          isAnimationActive
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ---------- LanguagePieChart ----------

export function LanguagePieChart({
  data,
}: {
  data: { name: string; value: number; percent: number; color: string }[]
}) {
  if (data.length === 0) {
    return <EmptyChart label="No language data" />
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={1}
          stroke="var(--background)"
          strokeWidth={2}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          content={
            <ChartTooltip
              formatter={(v) => `${formatNumber(v)} bytes`}
            />
          }
        />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, maxWidth: 160 }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ---------- ContributorsBarChart ----------

export function ContributorsBarChart({
  data,
}: {
  data: { login: string; contributions: number }[]
}) {
  const colors = useChartColors()
  if (data.length === 0) {
    return <EmptyChart label="No contributor data" />
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(240, data.length * 32)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 24, left: 0, bottom: 0 }}
      >
        <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          stroke={colors.axis}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatNumber(v as number)}
        />
        <YAxis
          type="category"
          dataKey="login"
          stroke={colors.axis}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={110}
        />
        <Tooltip content={<ChartTooltip formatter={(v) => `${formatNumber(v)} commits`} />} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
        <Bar
          dataKey="contributions"
          name="Contributions"
          fill="var(--chart-2)"
          radius={[0, 4, 4, 0]}
          isAnimationActive
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ---------- ActivityHeatstrip (recent commits by day) ----------

export function CommitHeatstrip({ data }: { data: { date: string; commits: number }[] }) {
  if (data.length === 0) {
    return <EmptyChart label="No recent commit activity" />
  }
  const max = Math.max(1, ...data.map((d) => d.commits))
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-[3px]">
        {data.map((d, i) => {
          const intensity = d.commits / max
          const bg =
            d.commits === 0
              ? 'var(--muted)'
              : `color-mix(in oklab, var(--chart-2) ${Math.max(20, intensity * 100)}%, var(--muted))`
          return (
            <div
              key={i}
              title={`${d.date}: ${d.commits} commits`}
              className="h-3.5 w-3.5 rounded-[3px]"
              style={{ backgroundColor: bg }}
            />
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Last {data.length} days · {formatNumber(data.reduce((a, b) => a + b.commits, 0))} commits
      </p>
    </div>
  )
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="grid h-[240px] place-items-center text-sm text-muted-foreground">
      {label}
    </div>
  )
}

// ---------- Tiny sparkline used in cards ----------

export function Sparkline({
  data,
  color = 'var(--chart-1)',
  height = 36,
}: {
  data: number[]
  color?: string
  height?: number
}) {
  if (data.length === 0) return null
  const chartData = data.map((v, i) => ({ i, v }))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
