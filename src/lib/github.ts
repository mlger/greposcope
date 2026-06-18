// GitHub REST API client with rate-limit handling, optional auth, and typed helpers.
// Docs: https://docs.github.com/rest

import type {
  GitHubCommit,
  GitHubContributor,
  GitHubIssue,
  GitHubLanguageMap,
  GitHubRepo,
  GitHubUser,
  GitHubWeeklyCommitActivity,
} from './types'

const API_ROOT = 'https://api.github.com'

export class GitHubError extends Error {
  status: number
  rateLimitRemaining: number | null
  rateLimitReset: number | null
  constructor(
    message: string,
    status: number,
    rateLimitRemaining: number | null = null,
    rateLimitReset: number | null = null,
  ) {
    super(message)
    this.name = 'GitHubError'
    this.status = status
    this.rateLimitRemaining = rateLimitRemaining
    this.rateLimitReset = rateLimitReset
  }
}

interface FetchOptions {
  token?: string
  // Custom Accept header (e.g. for star+json timestamps).
  accept?: string
  // Query params.
  params?: Record<string, string | number | undefined>
  // Optional Next.js revalidate (server-side only, ignored client-side).
  revalidate?: number
}

function buildUrl(path: string, params?: FetchOptions['params']): string {
  const url = new URL(
    path.startsWith('http') ? path : `${API_ROOT}${path.startsWith('/') ? path : `/${path}`}`,
  )
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
    }
  }
  return url.toString()
}

/**
 * Core fetch wrapper for the GitHub REST API.
 * Throws `GitHubError` for non-2xx responses with rate-limit metadata attached.
 */
export async function ghFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const url = buildUrl(path, options.params)
  const headers: Record<string, string> = {
    Accept: options.accept ?? 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  let res: Response
  try {
    res = await fetch(url, { headers })
  } catch (err) {
    throw new GitHubError(
      'Network error while contacting GitHub. Check your connection and try again.',
      0,
    )
  }

  const remaining = res.headers.get('X-RateLimit-Remaining')
  const reset = res.headers.get('X-RateLimit-Reset')

  if (!res.ok) {
    let message = `GitHub API request failed (${res.status})`
    try {
      const body = (await res.json()) as { message?: string }
      if (body?.message) message = body.message
    } catch {
      // ignore JSON parse errors
    }
    if (res.status === 403 && remaining === '0') {
      const resetMs = reset ? Number(reset) * 1000 : Date.now() + 60_000
      const mins = Math.max(1, Math.ceil((resetMs - Date.now()) / 60_000))
      throw new GitHubError(
        `GitHub API rate limit exceeded. Resets in ~${mins} minute(s). Add a personal access token in Settings to raise the limit to 5,000 req/hour.`,
        403,
        Number(remaining),
        Number(reset),
      )
    }
    if (res.status === 404) {
      throw new GitHubError(
        'Repository or user not found. Check the spelling and try again.',
        404,
        Number(remaining),
        Number(reset),
      )
    }
    throw new GitHubError(message, res.status, Number(remaining), Number(reset))
  }

  // Some endpoints (e.g. stargazers with star+json) return arrays or objects.
  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

// ---------- Repository ----------

export async function getRepo(
  owner: string,
  repo: string,
  token?: string,
): Promise<GitHubRepo> {
  return ghFetch<GitHubRepo>(`/repos/${owner}/${repo}`, { token })
}

export async function getRepoLanguages(
  owner: string,
  repo: string,
  token?: string,
): Promise<GitHubLanguageMap> {
  return ghFetch<GitHubLanguageMap>(`/repos/${owner}/${repo}/languages`, {
    token,
  })
}

export async function getRepoContributors(
  owner: string,
  repo: string,
  token?: string,
  limit = 100,
): Promise<GitHubContributor[]> {
  const data = await ghFetch<GitHubContributor[]>(
    `/repos/${owner}/${repo}/contributors`,
    { token, params: { per_page: limit } },
  )
  return data ?? []
}

export async function getRepoIssues(
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all',
  token?: string,
  perPage = 100,
): Promise<GitHubIssue[]> {
  const data = await ghFetch<GitHubIssue[]>(
    `/repos/${owner}/${repo}/issues`,
    { token, params: { state, per_page: perPage, sort: 'created', direction: 'desc' } },
  )
  // Filter out PRs (GitHub's /issues endpoint also returns PRs).
  return (data ?? []).filter((i) => !i.pull_request)
}

export async function getRepoCommits(
  owner: string,
  repo: string,
  token?: string,
  perPage = 100,
): Promise<GitHubCommit[]> {
  const data = await ghFetch<GitHubCommit[]>(
    `/repos/${owner}/${repo}/commits`,
    { token, params: { per_page: perPage } },
  )
  return data ?? []
}

export async function getRepoCommitActivity(
  owner: string,
  repo: string,
  token?: string,
): Promise<GitHubWeeklyCommitActivity[]> {
  const data = await ghFetch<GitHubWeeklyCommitActivity[]>(
    `/repos/${owner}/${repo}/stats/commit_activity`,
    { token },
  )
  // This endpoint can return 202 with an empty body while stats are computed.
  return data ?? []
}

export interface StarEvent {
  starred_at: string
  user: { login: string; id: number; avatar_url: string; html_url: string }
}

/**
 * Fetches a sample of stargazer timestamps. Without a token, this is limited
 * to the first page (60/hr global rate limit). Returns up to `perPage` events.
 */
export async function getStargazerSample(
  owner: string,
  repo: string,
  token?: string,
  perPage = 100,
): Promise<StarEvent[]> {
  try {
    const data = await ghFetch<StarEvent[]>(
      `/repos/${owner}/${repo}/stargazers`,
      { token, accept: 'application/vnd.github.star+json', params: { per_page: perPage } },
    )
    return data ?? []
  } catch (err) {
    // Some repos disable star history visibility; degrade gracefully.
    if (err instanceof GitHubError && err.status === 409) return []
    if (err instanceof GitHubError && err.status === 404) return []
    throw err
  }
}

// ---------- User / Org ----------

export async function getUser(login: string, token?: string): Promise<GitHubUser> {
  return ghFetch<GitHubUser>(`/users/${login}`, { token })
}

export async function getUserRepos(
  login: string,
  token?: string,
  sort: 'updated' | 'stars' | 'forks' = 'updated',
  perPage = 100,
): Promise<GitHubRepo[]> {
  const data = await ghFetch<GitHubRepo[]>(`/users/${login}/repos`, {
    token,
    params: { sort, per_page: perPage },
  })
  return data ?? []
}

export async function getOrgRepos(
  org: string,
  token?: string,
  sort: 'updated' | 'stars' | 'forks' = 'updated',
  perPage = 100,
): Promise<GitHubRepo[]> {
  const data = await ghFetch<GitHubRepo[]>(`/orgs/${org}/repos`, {
    token,
    params: { sort, per_page: perPage, type: 'public' },
  })
  return data ?? []
}

// ---------- Search ----------

export interface SearchReposParams {
  q: string
  sort?: 'stars' | 'forks' | 'updated'
  order?: 'asc' | 'desc'
  perPage?: number
  page?: number
  token?: string
}

export interface SearchReposResult {
  total_count: number
  incomplete_results: boolean
  items: GitHubRepo[]
}

export async function searchRepos(
  params: SearchReposParams,
): Promise<SearchReposResult> {
  const data = await ghFetch<SearchReposResult>(`/search/repositories`, {
    token: params.token,
    params: {
      q: params.q,
      sort: params.sort,
      order: params.order,
      per_page: params.perPage,
      page: params.page,
    },
  })
  return (
    data ?? {
      total_count: 0,
      incomplete_results: false,
      items: [],
    }
  )
}

export async function getTrendingRepos(opts: {
  language?: string
  since?: 'day' | 'week' | 'month'
  perPage?: number
  token?: string
}): Promise<SearchReposResult> {
  const { language, since = 'week', perPage = 30, token } = opts
  const daysBack = since === 'day' ? 1 : since === 'week' ? 7 : 30
  const date = new Date()
  date.setDate(date.getDate() - daysBack)
  const dateStr = date.toISOString().slice(0, 10)
  let q = `stars:>10 created:>${dateStr}`
  if (language) q += ` language:${language}`
  return searchRepos({ q, sort: 'stars', order: 'desc', perPage, token })
}

// ---------- Parsing helpers ----------

export interface ParsedRepoIdentifier {
  owner: string
  repo: string
}

/**
 * Parses many input shapes into an {owner, repo} identifier.
 * Accepts:
 *  - "owner/repo"
 *  - "https://github.com/owner/repo"
 *  - "https://github.com/owner/repo/anything/else"
 *  - "git@github.com:owner/repo.git"
 *  - "https://github.com/owner/repo.git"
 */
export function parseRepoInput(
  input: string,
): ParsedRepoIdentifier | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // SSH form: git@github.com:owner/repo.git
  const sshMatch = trimmed.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?(?:[?#].*)?$/i)
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] }
  }

  // URL form
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    if (url.hostname === 'github.com' || url.hostname === 'www.github.com') {
      const parts = url.pathname.split('/').filter(Boolean)
      if (parts.length >= 2) {
        return { owner: parts[0], repo: parts[1].replace(/\.git$/, '') }
      }
    }
  } catch {
    // not a URL, fall through
  }

  // owner/repo form
  const m = trimmed.match(/^([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}[A-Za-z0-9])?)\/([A-Za-z0-9._-]+)$/)
  if (m) return { owner: m[1], repo: m[2] }

  return null
}

/**
 * Classifies a raw query string into one of: repo-url, owner-repo, user, org-search.
 * Used by the global search bar to route to the correct view.
 */
export type SearchKind = 'repo' | 'user' | 'search'

export function classifyQuery(input: string): SearchKind {
  const trimmed = input.trim()
  if (!trimmed) return 'search'
  if (parseRepoInput(trimmed)) return 'repo'
  // Single token that's not a URL: treat as user/org search.
  if (/^https?:\/\//i.test(trimmed)) return 'search'
  if (trimmed.includes('/')) return 'repo'
  return 'user'
}
