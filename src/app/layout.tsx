import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import PublicNavWrapper from '@/components/layout/PublicNavWrapper'
import { Toaster } from '@/components/ui/toaster'
import ConditionalLiveChatWidget from '@/components/shared/ConditionalLiveChatWidget'
import { ThemeProvider } from 'next-themes'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ComparePCO - Find the Best PCO Cars',
  description: 'Compare and book PCO cars from verified partners. Electric, hybrid, and petrol vehicles available.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <PublicNavWrapper>
              <main className="min-h-screen flex flex-col">
                <div className="flex-1">
                  {children}
                </div>
              </main>
            </PublicNavWrapper>
            <ConditionalLiveChatWidget />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
} 