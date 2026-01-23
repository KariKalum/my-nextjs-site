import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Café Directory - Find Laptop-Friendly Workspaces',
  description: 'Discover the best cafés for working with your laptop',
  icons: {
    icon: '/logo.svg',
  },
}

/**
 * Root layout - required by Next.js
 * Locale redirects are handled by middleware
 * All actual pages are under app/[locale]/
 * Lang attribute is set dynamically by locale layout
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
