// Central Zustand store for Greposcope app state: navigation, saved repos,
// recent searches, comparison list, and persistent settings.

'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  AppSettings,
  RecentSearch,
  SavedRepo,
  ViewId,
} from './types'

interface AppState {
  // Navigation
  currentView: ViewId
  selectedRepo: { owner: string; repo: string } | null
  selectedUser: string | null
  compareList: { owner: string; repo: string; full_name: string }[]

  // Ephemeral UI state
  searchQuery: string

  // Persisted
  savedRepos: SavedRepo[]
  recentSearches: RecentSearch[]
  settings: AppSettings
  theme: 'light' | 'dark' | 'system'

  // Actions
  setView: (view: ViewId) => void
  selectRepo: (owner: string, repo: string) => void
  selectUser: (login: string) => void
  setSearchQuery: (q: string) => void
  addSavedRepo: (repo: SavedRepo) => void
  removeSavedRepo: (id: number) => void
  isSaved: (id: number) => boolean
  addRecentSearch: (entry: RecentSearch) => void
  clearRecentSearches: () => void
  addToCompare: (entry: { owner: string; repo: string; full_name: string }) => void
  removeFromCompare: (full_name: string) => void
  clearCompare: () => void
  updateSettings: (patch: Partial<AppSettings>) => void
}

const DEFAULT_SETTINGS: AppSettings = {
  githubToken: '',
  defaultView: 'landing',
  enableAiSummary: true,
  chartAnimations: true,
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentView: 'landing',
      selectedRepo: null,
      selectedUser: null,
      compareList: [],
      searchQuery: '',
      savedRepos: [],
      recentSearches: [],
      settings: DEFAULT_SETTINGS,
      theme: 'system',

      setView: (view) => set({ currentView: view }),
      selectRepo: (owner, repo) =>
        set({ selectedRepo: { owner, repo }, currentView: 'dashboard' }),
      selectUser: (login) =>
        set({ selectedUser: login, currentView: 'profile' }),
      setSearchQuery: (q) => set({ searchQuery: q }),

      addSavedRepo: (repo) => {
        const exists = get().savedRepos.some((r) => r.id === repo.id)
        if (exists) return
        set({
          savedRepos: [{ ...repo, saved_at: Date.now() }, ...get().savedRepos],
        })
      },
      removeSavedRepo: (id) =>
        set({ savedRepos: get().savedRepos.filter((r) => r.id !== id) }),
      isSaved: (id) => get().savedRepos.some((r) => r.id === id),

      addRecentSearch: (entry) => {
        const filtered = get().recentSearches.filter(
          (r) => !(r.query === entry.query && r.type === entry.type),
        )
        set({
          recentSearches: [entry, ...filtered].slice(0, 12),
        })
      },
      clearRecentSearches: () => set({ recentSearches: [] }),

      addToCompare: (entry) => {
        const exists = get().compareList.some(
          (c) => c.full_name === entry.full_name,
        )
        if (exists) return
        if (get().compareList.length >= 3) return
        set({ compareList: [...get().compareList, entry] })
      },
      removeFromCompare: (full_name) =>
        set({
          compareList: get().compareList.filter(
            (c) => c.full_name !== full_name,
          ),
        }),
      clearCompare: () => set({ compareList: [] }),

      updateSettings: (patch) =>
        set({ settings: { ...get().settings, ...patch } }),
    }),
    {
      name: 'Greposcope-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        savedRepos: state.savedRepos,
        recentSearches: state.recentSearches,
        settings: state.settings,
      }),
    },
  ),
)
