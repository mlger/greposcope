'use client'

import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '@/components/app-shell'
import { useAppStore } from '@/lib/store'
import { LandingView } from '@/components/views/landing-view'
import { SearchView } from '@/components/views/search-view'
import { DashboardView } from '@/components/views/dashboard-view'
import { ProfileView } from '@/components/views/profile-view'
import { CompareView } from '@/components/views/compare-view'
import { SavedView } from '@/components/views/saved-view'
import { SettingsView } from '@/components/views/settings-view'
import { TrendingView } from '@/components/views/trending-view'
import { TopicsView } from '@/components/views/topics-view'

// Single shared QueryClient for the SPA. We keep retries off because GitHub
// rate-limit errors should surface to the user immediately rather than burn
// through quota retrying.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
  },
})

function CurrentView() {
  const view = useAppStore((s) => s.currentView)
  const appliedDefault = React.useRef(false)

  React.useEffect(() => {
    if (!appliedDefault.current) {
      appliedDefault.current = true
      const { settings, setView } = useAppStore.getState()
      if (settings.defaultView && settings.defaultView !== 'landing') {
        setView(settings.defaultView)
      }
    }
  }, [])

  // Lightweight cross-fade between views.
  return (
    <div key={view} className="animate-in fade-in-50 duration-150">
      {view === 'landing' && <LandingView />}
      {view === 'search' && <SearchView />}
      {view === 'trending' && <TrendingView />}
      {view === 'topics' && <TopicsView />}
      {view === 'dashboard' && <DashboardView />}
      {view === 'profile' && <ProfileView />}
      {view === 'compare' && <CompareView />}
      {view === 'saved' && <SavedView />}
      {view === 'settings' && <SettingsView />}
    </div>
  )
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <CurrentView />
      </AppShell>
    </QueryClientProvider>
  )
}
