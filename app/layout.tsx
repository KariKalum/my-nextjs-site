import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import BetaNotice from '@/components/BetaNotice'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Café Directory - Find Laptop-Friendly Workspaces',
  description: 'Discover the best cafés for working with your laptop',
  icons: {
    icon: '/logo.svg', // Use logo as favicon to suppress 404
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
