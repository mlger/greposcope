// Shared TypeScript types for GitHub entities used across RepoScope.

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  owner: GitHubUser
  description: string | null
  html_url: string
  homepage: string | null
  language: string | null
  languages_url: string
  stargazers_count: number
  watchers_count: number
  forks_count: number
  open_issues_count: number
  subscribers_count: number
  network_count: number
  size: number
  default_branch: string
  visibility: 'public' | 'private'
  fork: boolean
  archived: boolean
  disabled: boolean
  has_issues: boolean
  has_projects: boolean
  has_wiki: boolean
  has_pages: boolean
  has_discussions: boolean
  license: GitHubLicense | null
  topics: string[]
  created_at: string
  updated_at: string
  pushed_at: string
  // Approximate stargazer history (from /repos/{owner}/{repo}/stargazers with Accept: application/star+json)
  // We fetch a sample and bucket it ourselves.
}

export interface GitHubLicense {
  key: string
  name: string
  spdx_id: string
  url: string | null
}

export interface GitHubUser {
  login: string
  id: number
  node_id: string
  avatar_url: string
  html_url: string
  gravatar_id: string | null
  type: 'User' | 'Organization' | 'Bot'
  site_admin: boolean
  name?: string | null
  company?: string | null
  blog?: string | null
  location?: string | null
  email?: string | null
  bio?: string | null
  twitter_username?: string | null
  public_repos?: number
  public_gists?: number
  followers?: number
  following?: number
  created_at?: string
  updated_at?: string
}

export interface GitHubContributor {
  login: string
  id: number
  avatar_url: string
  html_url: string
  type: 'User' | 'Organization' | 'Bot'
  contributions: number
}

export interface GitHubCommit {
  sha: string
  commit: {
    author: { name: string; email: string; date: string } | null
    committer: { name: string; email: string; date: string }
    message: string
  }
  author: GitHubUser | null
  committer: GitHubUser | null
  html_url: string
}

export interface GitHubIssue {
  id: number
  number: number
  title: string
  state: 'open' | 'closed'
  state_reason: string | null
  comments: number
  created_at: string
  updated_at: string
  closed_at: string | null
  user: GitHubUser
  html_url: string
  pull_request?: unknown
  labels: GitHubLabel[]
}

export interface GitHubLabel {
  id: number
  name: string
  color: string
}

export interface GitHubLanguageMap {
  [language: string]: number // bytes
}

export interface GitHubWeeklyCommitActivity {
  total: number
  week: number // unix timestamp
  days: number[] // 7 entries, Sun..Sat
}

// App-level view identifiers used by the single-page router.
export type ViewId =
  | 'landing'
  | 'search'
  | 'trending'
  | 'dashboard'
  | 'profile'
  | 'compare'
  | 'saved'
  | 'settings'

export interface SavedRepo {
  id: number
  full_name: string
  name: string
  owner_login: string
  owner_avatar: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  html_url: string
  saved_at: number
}

export interface RecentSearch {
  query: string
  type: 'repo' | 'user' | 'org' | 'url'
  timestamp: number
}

export interface AppSettings {
  githubToken: string
  defaultView: ViewId
  enableAiSummary: boolean
  chartAnimations: boolean
}
