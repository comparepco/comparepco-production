import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication - ComparePCO',
  description: 'Login and register for ComparePCO',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
} 