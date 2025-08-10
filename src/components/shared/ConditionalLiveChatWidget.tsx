'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import LiveChatWidget from './LiveChatWidget'

/**
 * Renders the LiveChatWidget everywhere except on any /admin route.
 * Keeps chat support for public, driver, partner and other areas while
 * removing it from the admin interface.
 */
export default function ConditionalLiveChatWidget() {
  const pathname = usePathname()
  // Hide widget for any route beginning with /admin (including nested segments)
  if (pathname?.startsWith('/admin')) {
    return null
  }
  return <LiveChatWidget />
} 