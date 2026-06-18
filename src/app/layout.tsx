import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'GrepScope — Explore GitHub repositories with clarity',
  description:
    'GrepScope is a GitHub repository explorer and analytics dashboard. Search, inspect, and analyze repositories, contributors, commits, issues, and languages.',
  keywords: [
    'GitHub',
    'repository analytics',
    'contributors',
    'commit activity',
    'language breakdown',
    'repo comparison',
    'GrepScope',
  ],
  authors: [{ name: 'GrepScope' }],
  icons: { icon: '/logo.svg' },
  openGraph: {
    title: 'GrepScope',
    description: 'Explore GitHub repositories with clarity.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <SonnerToaster richColors closeButton position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
